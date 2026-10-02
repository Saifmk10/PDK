// Typed JavaScript wrapper for closing the transparent voice-overlay Android activity.
import { NativeModule, requireNativeModule } from 'expo';

declare class VoiceOverlayModule extends NativeModule {
  close(): void;
}

export const VoiceOverlay = requireNativeModule<VoiceOverlayModule>('VoiceOverlay');
