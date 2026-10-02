# Personal Development Kit

An Android-first personal dashboard for finance and health records. Finance and health entries persist in the device's SQLite database. Live voice input, multilingual language detection, conversation, and generated speech use Gemini Live directly over a WebSocket; the app does not use Android speech recognition or Android text-to-speech. No sign-in, cloud storage, or Fitbit connection is included.

## Requirements

- Node.js 22 or later and npm.
- Android Studio with an Android SDK and an emulator, or a USB-debugging-enabled Android device.
- A configured `ANDROID_HOME` environment variable and Android platform tools on `PATH` for native builds.
- Internet access for Gemini Live audio conversations.
- A Google AI Studio API key entered in assistant settings. The key is stored using Android SecureStore. Rotate the key attached in chat before using it.

## Run on Android

```powershell
cd android-app
npm install
npm run android
```

The first native build generates the Android project and may take several minutes. To start Metro separately after installing a development build, run `npm start` and open the app on the emulator/device. Expo Go is not supported because live audio capture and PCM playback use native modules.

## Optional Gemini Conversation

The assistant streams raw 16 kHz microphone PCM directly to the Gemini Live API and plays Gemini's native 24 kHz audio response. Gemini handles speech recognition, language detection and switching, conversation, and speech generation in one live session. The API key is entered in the masked field and stored by Android SecureStore; no local server, `.env` key, or USB reverse port is needed. This is intended for personal testing: client-side API credentials can be extracted from a compromised device. Apply API restrictions and quotas to the key. Audio is sent to Google; finance and health records are not sent.

To build a local Android release artifact, run:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```

The release APK is written under `android\app\build\outputs\apk\release\`. Keep signing configuration private and out of source control when producing a distributable app.

## Included

- Overview dashboard with monthly income, spending, recent transactions, and health signals.
- Finance ledger with income/expense, category, date, note, and full create/edit/delete actions.
- Health log for steps, sleep, water, workout minutes, and weight, with a seven-day step trend.
- Persistent on-device SQLite storage.
- Voice navigation and multilingual conversation use the Gemini Live audio session. Gemini's live input transcription is used for navigation commands.
- Adapter boundaries for future Fitbit and finance API integrations; no live integration is claimed.

Amounts are currently presented in USD. The stored transaction values are numeric and can be connected to a currency preference later.