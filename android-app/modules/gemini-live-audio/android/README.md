# Android PCM Output

The `src/main/java/expo/modules/gemineliveaudio/` implementation wraps Android `AudioTrack` in streaming mode. It accepts Gemini Live's mono 16-bit PCM response chunks, flushes queued playback for barge-in, and releases the track when the voice session ends.