// Root component for the transparent widget-launched overlay activity (no dashboard, just the assistant).
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { VoiceAssistantButton } from './src/components/VoiceAssistantButton';
import { VoiceOverlay } from './modules/voice-overlay/src';
import { get_entries } from './app_fucntions/operations';

export default function VoiceOverlayApp() {
  const { width } = useWindowDimensions();
  const compact = width < 300;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <VoiceAssistantButton autoStart compact={compact} onClose={() => VoiceOverlay.close()} onExpenseAdded={async () => { await get_entries(); }} onNavigate={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
});
