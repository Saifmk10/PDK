package expo.modules.gemineliveaudio

import android.media.AudioAttributes
import android.media.AudioRecord
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.util.Base64
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.max
import java.nio.ByteBuffer

class GeminiLiveAudioModule : Module() {
  private var audioTrack: AudioTrack? = null
  private var audioRecord: AudioRecord? = null
  private var microphoneJob: Job? = null
  private var echoCanceler: AcousticEchoCanceler? = null
  private val microphoneScope = CoroutineScope(Dispatchers.IO)

  override fun definition() = ModuleDefinition {
    Name("GeminiLiveAudio")
    Events("onMicrophoneBuffer")

    OnDestroy {
      stopMicrophone()
      stopTrack()
    }

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

    AsyncFunction("startMicrophone") { sampleRate: Int ->
      startMicrophone(sampleRate)
    }

    Function("stopMicrophone") {
      stopMicrophone()
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

  private fun startMicrophone(sampleRate: Int) {
    stopMicrophone()
    val channelConfig = AudioFormat.CHANNEL_IN_MONO
    val encoding = AudioFormat.ENCODING_PCM_16BIT
    val minimumBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, encoding)
    if (minimumBufferSize <= 0) throw IllegalStateException("Android could not configure microphone capture.")

    val readSize = sampleRate * 2 / 10
    val recorder = AudioRecord.Builder()
      .setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(encoding)
          .setSampleRate(sampleRate)
          .setChannelMask(channelConfig)
          .build(),
      )
      .setBufferSizeInBytes(max(minimumBufferSize, readSize * 2))
      .build()
    if (recorder.state != AudioRecord.STATE_INITIALIZED) {
      recorder.release()
      throw IllegalStateException("Android could not initialize voice microphone capture.")
    }

    audioRecord = recorder
    try {
      if (AcousticEchoCanceler.isAvailable()) {
        echoCanceler = AcousticEchoCanceler.create(recorder.audioSessionId)?.apply { enabled = true }
      }
      recorder.startRecording()
    } catch (error: Throwable) {
      stopMicrophone()
      throw error
    }

    microphoneJob = microphoneScope.launch {
      val bytes = ByteArray(readSize)
      while (isActive && audioRecord === recorder) {
        val bytesRead = recorder.read(bytes, 0, bytes.size, AudioRecord.READ_BLOCKING)
        if (bytesRead > 0) {
          val pcm = ByteBuffer.allocateDirect(bytesRead).apply {
            put(bytes, 0, bytesRead)
            flip()
          }
          val payload = NativeArrayBuffer(pcm)
          appContext.mainQueue.launch {
            if (audioRecord === recorder) {
              sendEvent("onMicrophoneBuffer", mapOf("data" to payload, "sampleRate" to sampleRate))
            }
          }
        }
      }
    }
  }

  private fun stopMicrophone() {
    microphoneJob?.cancel()
    microphoneJob = null
    echoCanceler?.release()
    echoCanceler = null
    audioRecord?.let { recorder ->
      try {
        if (recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING) recorder.stop()
      } finally {
        recorder.release()
      }
    }
    audioRecord = null
  }
}
