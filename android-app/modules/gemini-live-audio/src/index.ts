// Typed JavaScript wrapper for the native Android PCM streaming output.
import { NativeModule, requireNativeModule } from 'expo';

declare class GeminiLiveAudioModule extends NativeModule {
  start(sampleRate: number): Promise<void>;
  writeBase64(encodedPcm: string): Promise<void>;
  flush(): void;
  stop(): void;
}

export const GeminiLiveAudio = requireNativeModule<GeminiLiveAudioModule>('GeminiLiveAudio');
