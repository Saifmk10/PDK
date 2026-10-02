// Standalone diagnostic: sends the same BidiGenerateContentSetup payload as geminiLiveSession.ts
// outside of React Native, to isolate app/environment issues from account/model issues.
// Usage: node scripts/test-gemini-live.mjs YOUR_API_KEY

const apiKey = process.argv[2];
if (!apiKey) {
  console.error('Usage: node scripts/test-gemini-live.mjs YOUR_API_KEY');
  process.exit(1);
}

const model = 'gemini-3.8-live';
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`;

const socket = new WebSocket(url);

const timeout = setTimeout(() => {
  console.error('Timed out waiting for setupComplete.');
  socket.close();
  process.exit(1);
}, 15_000);

socket.onopen = () => {
  console.log('Socket opened, sending setup message...');
  socket.send(JSON.stringify({
    setup: {
      model: `models/${model}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
      },
      systemInstruction: { parts: [{ text: 'You are a helpful assistant.' }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  }));
};

socket.onmessage = (event) => {
  void resolveText(event.data).then((text) => {
    console.log('Message received:', text);
    if (text.includes('setupComplete')) {
      console.log('SUCCESS: setupComplete received.');
      clearTimeout(timeout);
      socket.close();
      process.exit(0);
    }
  });
};

async function resolveText(data) {
  if (typeof data === 'string') return data;
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  return String(data);
}

socket.onerror = (event) => {
  console.error('Socket error:', event.message ?? event);
};

socket.onclose = (event) => {
  clearTimeout(timeout);
  console.log(`Socket closed. code=${event.code} reason="${event.reason}" wasClean=${event.wasClean}`);
  process.exit(event.code === 1000 && event.wasClean ? 0 : 1);
};
