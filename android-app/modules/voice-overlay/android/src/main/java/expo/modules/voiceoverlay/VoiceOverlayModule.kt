package expo.modules.voiceoverlay

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Lets the transparent voice-overlay activity dismiss itself from JS without killing the app process.
class VoiceOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VoiceOverlay")

    Function("close") {
      appContext.currentActivity?.finish()
    }
  }
}
