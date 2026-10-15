// The floating assistant combines Android speech recognition with a compact glass conversation panel.
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { colors, type } from '../theme/palette';
import { resolveVoiceCommand } from '../voice/commands';
import type { AppScreen } from '../voice/commands';
import { GeminiLiveSession } from '../voice/geminiLiveSession';
import { GeminiLiveAudio } from '../../modules/gemini-live-audio/src';
import type { MicrophoneBuffer } from '../../modules/gemini-live-audio/src';

type Props = { onNavigate: (screen: AppScreen) => void; onExpenseAdded: () => Promise<void>; autoStart?: boolean; compact?: boolean; onClose?: () => void };
type ApiTrace = { model?: string; finishReason?: string };

const geminiApiKeyStorageName = 'personal-development-kit.gemini-api-key';
const volumeUiIntervalMs = 50;

function localeLabel(locale: string) {
  return locale.replace(/-/g, ' · ');
}

export function VoiceAssistantButton({ onNavigate, onExpenseAdded, autoStart, compact = false, onClose }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = compact ? 60 : Math.min(windowWidth - 32, 410);
  const [expanded, setExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const [modelSpeaking, setModelSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [savingGeminiKey, setSavingGeminiKey] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('AUTO');
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [feedback, setFeedback] = useState('Tap the orb and tell me where to go.');
  const [spokenText, setSpokenText] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [apiTrace, setApiTrace] = useState<ApiTrace | null>(null);
  const [volume, setVolume] = useState(0);
  const expandedRef = useRef(false);
  const liveSession = useRef<GeminiLiveSession | null>(null);
  const liveConnecting = useRef(false);
  const microphoneAudioForwarding = useRef(false);
  const microphoneHandler = useRef<(buffer: MicrophoneBuffer) => void>(() => {});
  const lastVolumeUpdate = useRef(0);
  const expansion = useRef(new Animated.Value(0)).current;
  const thinkingDots = useRef([new Animated.Value(0.25), new Animated.Value(0.25), new Animated.Value(0.25)]).current;
  const thinkingLoops = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    const subscription = GeminiLiveAudio.addListener('onMicrophoneBuffer', (buffer) => microphoneHandler.current(buffer));
    return () => {
      subscription.remove();
      liveSession.current?.close();
      liveSession.current = null;
      GeminiLiveAudio.stopMicrophone();
    };
  }, []);

  // The orb and chat surface share one spring so the panel grows from the button naturally.
  useEffect(() => {
    Animated.spring(expansion, {
      toValue: expanded ? 1 : 0,
      damping: 20,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [expanded, expansion]);

  useEffect(() => {
    if (!thinking) {
      thinkingLoops.current.forEach((loop) => loop.stop());
      thinkingDots.forEach((dot) => dot.setValue(0.25));
      return;
    }
    thinkingLoops.current = thinkingDots.map((dot, index) => Animated.loop(
      Animated.sequence([
        Animated.delay(index * 130),
        Animated.timing(dot, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.25, duration: 360, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ));
    thinkingLoops.current.forEach((loop) => loop.start());
    return () => thinkingLoops.current.forEach((loop) => loop.stop());
  }, [thinking, thinkingDots]);

  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(geminiApiKeyStorageName)
      .then((apiKey) => {
        if (active) setHasGeminiKey(Boolean(apiKey));
      })
      .catch(() => {
        if (active) setFeedback('Secure key storage is unavailable on this device.');
      });
    return () => { active = false; };
  }, []);

  // The overlay activity launches with autoStart so the widget tap starts listening immediately.
  useEffect(() => {
    if (!autoStart) return;
    expandedRef.current = true;
    setExpanded(true);
    void startLiveConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function saveGeminiApiKey() {
    const apiKey = geminiKeyInput.trim();
    if (!apiKey) {
      setFeedback('Enter a Gemini API key first.');
      return;
    }
    setSavingGeminiKey(true);
    try {
      await SecureStore.setItemAsync(geminiApiKeyStorageName, apiKey);
      setGeminiKeyInput('');
      setHasGeminiKey(true);
      setFeedback('Gemini key saved securely on this phone.');
    } catch {
      setFeedback('Could not save the key securely on this device.');
    } finally {
      setSavingGeminiKey(false);
    }
  }

  async function removeGeminiApiKey() {
    try {
      await SecureStore.deleteItemAsync(geminiApiKeyStorageName);
      setHasGeminiKey(false);
      setGeminiKeyInput('');
      await stopLiveConversation();
      setListening(false);
      setModelSpeaking(false);
      setFeedback('Gemini key removed from this phone.');
    } catch {
      setFeedback('Could not remove the saved key.');
    }
  }

  async function stopLiveConversation() {
    microphoneAudioForwarding.current = false;
    liveSession.current?.close();
    liveSession.current = null;
    GeminiLiveAudio.stopMicrophone();
    setListening(false);
    setModelSpeaking(false);
    setThinking(false);
  }

  async function startLiveConversation() {
    if (liveSession.current || liveConnecting.current) return;
    liveConnecting.current = true;
    setThinking(true);
    setFeedback('Connecting to Gemini Live…');
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        const message = 'Microphone permission is required for Gemini Live audio.';
        setFeedback(message);
        setAssistantText(message);
        return;
      }
      const apiKey = await SecureStore.getItemAsync(geminiApiKeyStorageName);
      if (!apiKey) {
        const message = 'Add a Gemini API key in Live Voice Settings first.';
        setFeedback(message);
        setAssistantText(message);
        return;
      }
      const session = new GeminiLiveSession({
        onExpenseAdded,
        onReady: () => {
          setApiTrace({ model: 'gemini-3.8-live', finishReason: 'CONNECTED' });
          setThinking(false);
          setFeedback('Gemini Live · speak naturally in any supported language');
        },
        onInputTranscript: (text, languageCode, isFinal) => {
          setSpokenText(text);
          if (languageCode) setDetectedLanguage(localeLabel(languageCode).toUpperCase());
          if (isFinal) {
            setAssistantText('');
            const destination = resolveVoiceCommand(text, languageCode ?? 'en-US');
            if (destination) onNavigate(destination);
          }
        },
        onOutputTranscript: (text) => {
          setAssistantText((current) => `${current}${text}`);
          setThinking(false);
        },
        onAudioStart: () => {
          microphoneAudioForwarding.current = false;
          setListening(false);
          setModelSpeaking(true);
          setThinking(false);
        },
        onTurnComplete: () => {
          microphoneAudioForwarding.current = true;
          setListening(true);
          setModelSpeaking(false);
          setThinking(false);
        },
        onInterrupted: () => {
          microphoneAudioForwarding.current = true;
          setListening(true);
          setModelSpeaking(false);
          setThinking(false);
          setFeedback('Listening · speak now');
        },
        onError: (message) => {
          setFeedback(message);
          setAssistantText(message);
          setThinking(false);
          void stopLiveConversation();
        },
      });
      liveSession.current = session;
      setApiTrace({ model: 'gemini-3.8-live', finishReason: 'CONNECTING' });
      setTranscriptVisible(false);
      await session.connect(apiKey);
      await GeminiLiveAudio.startMicrophone(16_000);
      microphoneAudioForwarding.current = true;
      setListening(true);
      setThinking(false);
      setFeedback('Gemini Live · speak naturally in any supported language');
      setSpokenText('');
      setAssistantText('');
    } catch (error) {
      await stopLiveConversation();
      const message = error instanceof Error
        ? error.message
        : 'Could not start Gemini Live. Check the API key, Live model access, and internet connection.';
      setFeedback(message);
      setAssistantText(message);
    } finally {
      liveConnecting.current = false;
    }
  }

  // Forward echo-cancelled microphone PCM directly to the Live WebSocket.
  microphoneHandler.current = (buffer) => {
    if (!microphoneAudioForwarding.current) return;
    const session = liveSession.current;
    if (!session) return;
    const samples = new Int16Array(buffer.data);
    let energy = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index] / 32768;
      energy += sample * sample;
    }
    const now = Date.now();
    if (now - lastVolumeUpdate.current >= volumeUiIntervalMs) {
      lastVolumeUpdate.current = now;
      setVolume(Math.min(1, Math.sqrt(energy / Math.max(1, samples.length)) * 8));
    }
    session.sendMicrophoneAudio(buffer.data, buffer.sampleRate);
  };

  function interruptGemini() {
    const session = liveSession.current;
    if (!modelSpeaking || !session) return;
    session.interruptPlayback();
    microphoneAudioForwarding.current = true;
    setModelSpeaking(false);
    setListening(true);
    setFeedback('Listening · speak now');
  }

  async function handleOrbPress() {
    if (liveConnecting.current) return;
    if (!expanded) {
      expandedRef.current = true;
      setExpanded(true);
      void startLiveConversation();
      return;
    }
    if (liveSession.current) {
      void stopLiveConversation();
      return;
    }
    void startLiveConversation();
  }

  const animatedWidth = expansion.interpolate({ inputRange: [0, 1], outputRange: [60, panelWidth] });
  const animatedHeight = expansion.interpolate({ inputRange: [0, 1], outputRange: [60, compact ? 60 : 294] });
  const animatedRadius = expansion.interpolate({ inputRange: [0, 1], outputRange: [30, compact ? 30 : 19] });
  const detailsOpacity = expansion.interpolate({ inputRange: [0.35, 0.9], outputRange: [0, 1], extrapolate: 'clamp' });
  const orbWaveBars = [0.25, 0.52, 0.82, 1, 0.72, 0.42, 0.2];
  const waveBars = [0.18, 0.32, 0.56, 0.82, 0.47, 0.7, 1, 0.58, 0.34, 0.76, 0.5, 0.91, 0.42, 0.67, 0.3, 0.54, 0.22];

  return (
    <View pointerEvents="box-none" style={[styles.anchor, compact && styles.compactAnchor]}>
      <Animated.View
        style={[
          styles.panel,
          {
            width: animatedWidth,
            height: animatedHeight,
            borderRadius: animatedRadius,
            maxWidth: panelWidth,
          },
        ]}
      >
        <BlurView intensity={82} tint="light" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.glassTint} />
        <View style={styles.panelContent}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={modelSpeaking ? 'Press to interrupt Gemini and speak' : listening ? 'Stop Gemini Live conversation' : 'Start Gemini Live conversation'}
              onPress={() => { if (modelSpeaking) interruptGemini(); else void handleOrbPress(); }}
              style={[styles.orb, listening && styles.orbListening]}
            >
              <View style={styles.orbInner}>
                {listening || modelSpeaking ? (
                  <View style={styles.wave}>
                    {orbWaveBars.map((height, index) => (
                      <WaveBar key={index} height={height} index={index} volume={volume} active={listening || modelSpeaking} compact />
                    ))}
                  </View>
                ) : (
                  <View style={styles.orbGlyph}>
                    <View style={styles.glyphStem} />
                    <View style={styles.glyphArc} />
                    <View style={styles.glyphBase} />
                  </View>
                )}
              </View>
            </Pressable>
            {!compact ? <Animated.View style={[styles.statusBlock, { opacity: detailsOpacity }]} pointerEvents={expanded ? 'auto' : 'none'}>
              <Text style={styles.kicker}>{thinking ? 'CONNECTING' : modelSpeaking ? 'GEMINI SPEAKING' : listening ? 'GEMINI LIVE · LISTENING' : 'PERSONAL ASSISTANT'}</Text>
              <Text numberOfLines={1} style={styles.statusText}>{thinking ? 'Opening live audio' : modelSpeaking ? 'Press to interrupt and speak' : listening ? 'Speak naturally' : 'Your day, in your words'}</Text>
            </Animated.View> : null}
            {!compact ? <Animated.View style={{ opacity: detailsOpacity }} pointerEvents={expanded ? 'auto' : 'none'}>
              <Pressable accessibilityLabel="Close assistant" onPress={() => { expandedRef.current = false; void stopLiveConversation(); setExpanded(false); onClose?.(); }} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </Animated.View> : null}
          </View>
          {!compact ? <Animated.View style={[styles.conversation, { opacity: detailsOpacity }]} pointerEvents={expanded ? 'auto' : 'none'}>
            {transcriptVisible ? (
              <ScrollView nestedScrollEnabled contentContainerStyle={styles.chatStack} showsVerticalScrollIndicator={false}>
                {spokenText ? <View style={styles.userBubble}><Text style={styles.userText}>{spokenText}</Text></View> : null}
                {assistantText ? (
                  <View style={styles.replyRow}>
                    <View style={styles.assistantAvatar}><Text style={styles.avatarMark}>G</Text></View>
                    <View style={styles.replyBubble}><Text style={styles.replyText}>{assistantText}</Text></View>
                  </View>
                ) : null}
                {!spokenText && !assistantText ? <Text style={styles.hint}>Transcript will appear here.</Text> : null}
                {apiTrace ? (
                  <Text style={styles.apiTrace}>
                    {`GEMINI LIVE · ${apiTrace.model ?? 'MODEL'} · ${apiTrace.finishReason ?? 'CONNECTED'}`}
                  </Text>
                ) : null}
              </ScrollView>
            ) : thinking ? (
              <View style={styles.thinkingRow}>
                <View style={styles.assistantAvatar}><Text style={styles.avatarMark}>G</Text></View>
                <View style={styles.thinkingBubble}>
                  <Text style={styles.thinkingLabel}>One moment</Text>
                  <View style={styles.dots}>
                    {thinkingDots.map((dot, index) => <Animated.View key={index} style={[styles.thinkingDot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0.25, 1], outputRange: [2, -3] }) }] }]} />)}
                  </View>
                </View>
              </View>
            ) : listening || modelSpeaking ? (
              <View style={styles.visualizer}>
                <View style={styles.largeWave}>
                  {waveBars.map((height, index) => (
                    <WaveBar key={index} height={height} index={index} volume={volume} active />
                  ))}
                </View>
                <Text style={styles.visualizerLabel}>{modelSpeaking ? 'GEMINI SPEAKING' : 'LISTENING · SPEAK NATURALLY'}</Text>
                {modelSpeaking ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Press to interrupt Gemini and speak"
                    onPress={interruptGemini}
                    style={styles.interruptButton}
                  >
                    <Text style={styles.interruptButtonText}>PRESS TO INTERRUPT</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text style={styles.hint}>Tap the orb and speak. Gemini listens and replies in audio.</Text>
            )}
          </Animated.View> : null}
          {!compact ? <Animated.View style={[styles.footer, { opacity: detailsOpacity }]} pointerEvents={expanded ? 'auto' : 'none'}>
            <Pressable onPress={() => setLanguagePickerOpen(true)} style={styles.languageButton}>
              <Text style={styles.languageLabel}>VOICE MODEL</Text>
              <Text numberOfLines={1} style={styles.languageValue}>{detectedLanguage}  ·  GEMINI LIVE</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={transcriptVisible ? 'Hide transcript' : 'Show transcript'}
              accessibilityState={{ selected: transcriptVisible }}
              onPress={() => setTranscriptVisible((visible) => !visible)}
              style={styles.transcriptButton}
            >
              <Text style={styles.transcriptButtonText}>{transcriptVisible ? 'HIDE TEXT' : 'TRANSCRIPT'}</Text>
            </Pressable>
          </Animated.View> : null}
        </View>
      </Animated.View>

      {!compact ? <Modal animationType="slide" onRequestClose={() => setLanguagePickerOpen(false)} transparent visible={languagePickerOpen}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityLabel="Close language picker" onPress={() => setLanguagePickerOpen(false)} style={styles.scrim} />
          <View style={styles.languageSheet}>
            <View style={styles.sheetHeading}>
              <View>
                  <Text style={styles.sheetEyebrow}>GEMINI LIVE AUDIO</Text>
                  <Text style={styles.sheetTitle}>Voice settings</Text>
              </View>
              <Pressable accessibilityLabel="Close" onPress={() => setLanguagePickerOpen(false)} style={styles.sheetClose}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <Text style={styles.sheetNote}>Raw microphone audio goes directly to Gemini Live. Gemini handles speech recognition, multilingual language switching, conversation, and generated voice in one session.</Text>
            <Text style={styles.modeHeading}>GEMINI API KEY</Text>
            <TextInput
              accessibilityLabel="Gemini API key"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setGeminiKeyInput}
              placeholder={hasGeminiKey ? 'Key saved securely on this phone' : 'Paste a rotated Gemini API key'}
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.keyInput}
              value={geminiKeyInput}
            />
            <View style={styles.keyActions}>
              <Pressable disabled={savingGeminiKey || !geminiKeyInput.trim()} onPress={() => void saveGeminiApiKey()} style={[styles.keySaveButton, (!geminiKeyInput.trim() || savingGeminiKey) && styles.keyButtonDisabled]}>
                <Text style={styles.keySaveText}>{savingGeminiKey ? 'SAVING…' : hasGeminiKey ? 'REPLACE KEY' : 'SAVE KEY'}</Text>
              </Pressable>
              {hasGeminiKey ? <Pressable onPress={() => void removeGeminiApiKey()} style={styles.keyRemoveButton}><Text style={styles.keyRemoveText}>REMOVE</Text></Pressable> : null}
            </View>
            <Text style={styles.modeDisclaimer}>The key is stored in Android encrypted app storage, not .env or the app bundle. Audio streams to Google. Use a restricted key and monitor Live API usage.</Text>
          </View>
        </View>
      </Modal> : null}
      <Text accessibilityLiveRegion="polite" style={styles.hiddenStatus}>{feedback}</Text>
    </View>
  );
}

function WaveBar({ height, index, volume, active, compact = false }: { height: number; index: number; volume: number; active: boolean; compact?: boolean }) {
  const motion = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!active) {
      motion.setValue(0.14);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(index * 45),
      Animated.timing(motion, { toValue: 1, duration: 180 + (index % 3) * 50, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(motion, { toValue: 0.28, duration: 240 + (index % 2) * 60, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, index, motion]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        {
          height: 4 + height * (compact ? 14 : 54) * (active ? Math.max(volume, 0.08) : 0.03),
          opacity: active ? 0.55 + Math.min(volume, 0.45) : 0.3,
          transform: [{ scaleY: motion }],
        },
        compact && styles.orbWaveBar,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: 16, bottom: 69, zIndex: 20, elevation: 20 },
  compactAnchor: { left: 0, bottom: 0 },
  panel: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(250,250,248,0.88)',
    shadowColor: '#101010',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.17,
    shadowRadius: 22,
    elevation: 14,
  },
  glassTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(252,252,249,0.58)' },
  panelContent: { flex: 1, padding: 8, justifyContent: 'space-between' },
  topRow: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 11 },
  orb: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  orbListening: { backgroundColor: colors.red, shadowColor: colors.red, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4 },
  orbInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  orbGlyph: { width: 20, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  glyphStem: { position: 'absolute', top: 1, width: 7, height: 13, borderRadius: 5, backgroundColor: colors.surface },
  glyphArc: { width: 16, height: 11, borderWidth: 1.5, borderTopWidth: 0, borderColor: colors.surface, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  glyphBase: { position: 'absolute', bottom: 0, height: 4, width: 1.5, backgroundColor: colors.surface },
  wave: { height: 22, flexDirection: 'row', alignItems: 'center', gap: 1.5 },
  waveBar: { width: 3, minHeight: 4, borderRadius: 2, backgroundColor: colors.red },
  orbWaveBar: { backgroundColor: colors.surface },
  statusBlock: { flex: 1, justifyContent: 'center', gap: 3 },
  kicker: { color: colors.red, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.8 },
  statusText: { color: colors.ink, fontFamily: type.medium, fontSize: 12 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.ink, fontSize: 24, lineHeight: 27 },
  conversation: { flex: 1, minHeight: 150, maxHeight: 175, paddingHorizontal: 6, paddingTop: 7, justifyContent: 'center' },
  hint: { color: colors.muted, fontFamily: type.regular, fontSize: 12, lineHeight: 17 },
  listeningRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red },
  listeningCopy: { color: colors.muted, fontFamily: type.regular, fontSize: 12 },
  visualizer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(16,16,16,0.1)' },
  largeWave: { height: 88, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  visualizerLabel: { color: colors.muted, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.6, textAlign: 'center' },
  interruptButton: { minHeight: 32, paddingHorizontal: 14, borderRadius: 6, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  interruptButtonText: { color: colors.surface, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.3 },
  chatStack: { gap: 7 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '88%', borderRadius: 13, borderBottomRightRadius: 4, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(20,20,20,0.91)' },
  userText: { color: colors.surface, fontFamily: type.regular, fontSize: 12, lineHeight: 16 },
  replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  assistantAvatar: { width: 23, height: 23, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  avatarMark: { color: colors.surface, fontFamily: type.mono, fontSize: 10 },
  replyBubble: { flexShrink: 1, borderRadius: 12, borderBottomLeftRadius: 4, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  replyText: { color: colors.ink, fontFamily: type.regular, fontSize: 11, lineHeight: 15 },
  apiTrace: { alignSelf: 'flex-end', color: colors.muted, fontFamily: type.mono, fontSize: 7, letterSpacing: 0.2, marginRight: 3 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingBubble: { minWidth: 102, minHeight: 39, borderRadius: 12, borderBottomLeftRadius: 4, backgroundColor: 'rgba(255,255,255,0.84)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, gap: 10 },
  thinkingLabel: { color: colors.muted, fontFamily: type.regular, fontSize: 11 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  thinkingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.red },
  footer: { minHeight: 38, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(16,16,16,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, gap: 8 },
  languageButton: { flexDirection: 'row', alignItems: 'center', gap: 7, maxWidth: '66%' },
  transcriptButton: { minHeight: 30, paddingHorizontal: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  transcriptButtonText: { color: colors.ink, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.3 },
  languageLabel: { color: colors.muted, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.4 },
  languageValue: { color: colors.ink, fontFamily: type.medium, fontSize: 10, maxWidth: 130 },
  secureLabel: { color: colors.muted, fontFamily: type.mono, fontSize: 7, letterSpacing: 0.4 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.42)' },
  languageSheet: { maxHeight: '82%', backgroundColor: colors.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28 },
  sheetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetEyebrow: { color: colors.red, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.7 },
  sheetTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 22, marginTop: 5 },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sheetNote: { color: colors.muted, fontFamily: type.regular, fontSize: 12, lineHeight: 18, marginBottom: 13 },
  modeHeading: { color: colors.muted, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.5, marginBottom: 7, marginTop: 4 },
  modeOptions: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  modeOption: { flex: 1, minHeight: 58, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.surface, paddingHorizontal: 10, justifyContent: 'center', gap: 4 },
  modeOptionSelected: { borderColor: colors.red, backgroundColor: '#FFF8F7' },
  modeTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 12 },
  modeTitleSelected: { color: colors.red },
  modeDescription: { color: colors.muted, fontFamily: type.regular, fontSize: 9 },
  modeDisclaimer: { color: colors.muted, fontFamily: type.regular, fontSize: 10, lineHeight: 14, marginBottom: 8 },
  keyInput: { minHeight: 46, borderRadius: 7, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.ink, fontFamily: type.regular, fontSize: 13, marginBottom: 7 },
  keyActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  keySaveButton: { minHeight: 34, paddingHorizontal: 12, borderRadius: 6, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  keyButtonDisabled: { opacity: 0.45 },
  keySaveText: { color: colors.surface, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.4 },
  keyRemoveButton: { minHeight: 34, paddingHorizontal: 10, justifyContent: 'center' },
  keyRemoveText: { color: colors.red, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.4 },
  localeRow: { minHeight: 57, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  autoRow: { marginBottom: 8 },
  localeDisabled: { opacity: 0.5 },
  localeSelected: { backgroundColor: '#E7E7E3', borderRadius: 7 },
  localeCopy: { flex: 1, gap: 4 },
  localeName: { color: colors.ink, fontFamily: type.medium, fontSize: 14 },
  localeNameSelected: { color: colors.red },
  localeStatus: { color: colors.muted, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.3 },
  checkmark: { color: colors.red, fontFamily: type.medium, fontSize: 16 },
  localeList: { flexGrow: 0, maxHeight: 180 },
  emptyLocales: { color: colors.muted, fontFamily: type.regular, fontSize: 13, lineHeight: 19, paddingVertical: 18 },
  hiddenStatus: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});