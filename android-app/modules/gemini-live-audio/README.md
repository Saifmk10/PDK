# Gemini Live Audio Output

This local Expo module streams Gemini Live's 24 kHz mono PCM audio to Android `AudioTrack` and captures 16 kHz microphone PCM through Android's voice-communication source with acoustic echo cancellation when available. It exposes playback controls and microphone-buffer events to the TypeScript session manager. No speech recognition or text-to-speech is performed in this module.

`expo-module.config.json` registers the Kotlin module with Expo autolinking. The `src/` wrapper declares the typed JavaScript API; Android PCM playback is implemented under `android/src/main/java/`.
