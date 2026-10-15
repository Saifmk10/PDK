// Typed JavaScript wrapper for the native Android PCM streaming output.
import { NativeModule, requireNativeModule } from 'expo';

export type MicrophoneBuffer = { data: ArrayBuffer; sampleRate: number };

type GeminiLiveAudioEvents = {
  onMicrophoneBuffer(event: MicrophoneBuffer): void;
};

declare class GeminiLiveAudioModule extends NativeModule<GeminiLiveAudioEvents> {
  start(sampleRate: number): Promise<void>;
  writeBase64(encodedPcm: string): Promise<void>;
  flush(): void;
  stop(): void;
  startMicrophone(sampleRate: number): Promise<void>;
  stopMicrophone(): void;
}

export const GeminiLiveAudio = requireNativeModule<GeminiLiveAudioModule>('GeminiLiveAudio');
