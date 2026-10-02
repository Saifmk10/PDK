// Root component for the transparent widget-launched overlay activity (no dashboard, just the assistant).
import { StyleSheet, View } from 'react-native';
import { VoiceAssistantButton } from './src/components/VoiceAssistantButton';
import { VoiceOverlay } from './modules/voice-overlay/src';

export default function VoiceOverlayApp() {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <VoiceAssistantButton autoStart onClose={() => VoiceOverlay.close()} onNavigate={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
});
