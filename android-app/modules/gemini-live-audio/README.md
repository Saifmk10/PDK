# Gemini Live Audio Output

This local Expo module streams Gemini Live's 24 kHz mono PCM audio to Android `AudioTrack`. It exposes `start`, `writeBase64`, `flush`, and `stop` to the TypeScript session manager. Microphone capture is provided separately by Expo Audio. No speech recognition or text-to-speech is performed in this module.

`expo-module.config.json` registers the Kotlin module with Expo autolinking. The `src/` wrapper declares the typed JavaScript API; Android PCM playback is implemented under `android/src/main/java/`.
