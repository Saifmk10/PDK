package expo.modules.gemineliveaudio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.max

class GeminiLiveAudioModule : Module() {
  private var audioTrack: AudioTrack? = null

  override fun definition() = ModuleDefinition {
    Name("GeminiLiveAudio")

    AsyncFunction("start") { sampleRate: Int ->
      stopTrack()
      val minimumBufferSize = AudioTrack.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_OUT_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
      )
      if (minimumBufferSize <= 0) throw IllegalStateException("Android could not configure PCM audio output.")
      val track = AudioTrack.Builder()
        .setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        )
        .setAudioFormat(
          AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(sampleRate)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build(),
        )
        .setBufferSizeInBytes(max(minimumBufferSize, sampleRate / 2))
        .setTransferMode(AudioTrack.MODE_STREAM)
        .build()
      track.play()
      audioTrack = track
    }

    AsyncFunction("writeBase64") { encodedPcm: String ->
      val track = audioTrack ?: return@AsyncFunction
      val pcmBytes = Base64.decode(encodedPcm, Base64.DEFAULT)
      var offset = 0
      while (offset < pcmBytes.size) {
        val written = track.write(pcmBytes, offset, pcmBytes.size - offset, AudioTrack.WRITE_BLOCKING)
        if (written < 0) throw IllegalStateException("Android PCM playback failed ($written).")
        offset += written
      }
    }

    Function("flush") {
      audioTrack?.let { track ->
        if (track.playState == AudioTrack.PLAYSTATE_PLAYING) track.pause()
        track.flush()
        track.play()
      }
    }

    Function("stop") {
      stopTrack()
    }
  }

  private fun stopTrack() {
    audioTrack?.let { track ->
      try {
        track.pause()
        track.flush()
      } finally {
        track.release()
      }
    }
    audioTrack = null
  }
}
