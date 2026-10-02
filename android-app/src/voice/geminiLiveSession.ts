// Owns one Gemini Live WebSocket session and gapless native PCM playback.
import { GeminiLiveAudio } from '../../modules/gemini-live-audio/src';
import { add_expense } from '../../app_fucntions/operations';
import { decodeBase64, encodeBase64 } from './base64';

const liveModel = 'gemini-3.8-live';
const outputSampleRate = 24_000;
const websocketEndpoint = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

type LiveCallbacks = {
  onReady: () => void;
  onInputTranscript: (text: string, languageCode: string | undefined, isFinal: boolean) => void;
  onOutputTranscript: (text: string) => void;
  onAudioStart: () => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onError: (message: string) => void;
};

type LiveServerMessage = {
  setupComplete?: object;
  error?: { message?: string; code?: number };
  toolCall?: {
    functionCalls?: Array<{
      id: string;
      name: string;
      args?: Record<string, unknown>;
    }>;
  };
  serverContent?: {
    interrupted?: boolean;
    turnComplete?: boolean;
    inputTranscription?: { text?: string; languageCode?: string };
    interimInputTranscription?: { text?: string; languageCode?: string };
    outputTranscription?: { text?: string; languageCode?: string };
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
  };
};

// Gemini Live delivers messages as binary WebSocket frames (Blob on web/Node, ArrayBuffer/string on RN).
async function decodeSocketMessage(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  return String(data);
}

export class GeminiLiveSession {
  private socket: WebSocket | null = null;
  private closed = false;

  constructor(private readonly callbacks: LiveCallbacks) {}

  connect(apiKey: string) {
    return new Promise<void>((resolve, reject) => {
      const socketUrl = `${websocketEndpoint}?key=${encodeURIComponent(apiKey)}`;
      const socket = new WebSocket(socketUrl);
      this.socket = socket;
      let didSettle = false;
      const timeout = setTimeout(() => {
        if (didSettle) return;
        didSettle = true;
        socket.close();
        reject(new Error('Gemini Live connection timed out. Check internet access and Live API access for this key.'));
      }, 20_000);

      socket.onopen = () => {
        socket.send(JSON.stringify({
          setup: {
            model: `models/${liveModel}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
            },
            systemInstruction: {
              parts: [{ text: "You are the spoken personal assistant in a personal development app. Converse naturally and warmly. Detect the language from the user's audio and respond in that language. Switch languages naturally whenever the user does. Keep replies concise. The app may navigate between Today, Finance, and Health when asked. When the user clearly asks to record an expense, use the add_expense function. Ask for any missing required details instead of inventing them. Do not claim an expense was saved unless the function succeeds. Do not claim to read or modify health records. Audio is sent continuously; respond to complete turns and allow the user to interrupt you." }],
            },
            tools: [{
              functionDeclarations: [{
                name: 'add_expense',
                description: 'Record an expense in the user\'s finance database. Call only when the user clearly asks to add or record an expense.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    expense_category: { type: 'STRING', description: 'Expense category, such as food, travel, or bills.' },
                    amount: { type: 'NUMBER', description: 'Expense amount as a positive number.' },
                    date: { type: 'STRING', description: 'Expense date in YYYY-MM-DD format.' },
                    description: { type: 'STRING', description: 'Short description of the expense.' },
                  },
                  required: ['expense_category', 'amount', 'date', 'description'],
                },
              }],
            }],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        }));
      };

      // Gemini Live sends messages as binary WebSocket frames (Blob/ArrayBuffer), not text.
      let messageChain = Promise.resolve();
      socket.onmessage = (event) => {
        messageChain = messageChain.then(() => decodeSocketMessage(event.data)).then(handleServerMessage);
      };

      const handleServerMessage = async (raw: string) => {
        try {
          const message = JSON.parse(raw) as LiveServerMessage;
          if (message.setupComplete) {
            if (!didSettle) {
              didSettle = true;
              clearTimeout(timeout);
              void GeminiLiveAudio.start(outputSampleRate).then(() => {
                this.callbacks.onReady();
                resolve();
              }).catch((error: unknown) => {
                const reason = error instanceof Error ? error.message : 'Android audio output could not start.';
                reject(new Error(reason));
                socket.close();
              });
            }
            return;
          }
          if (message.error) {
            const description = message.error.message ?? `Gemini Live error ${message.error.code ?? ''}`.trim();
            if (!didSettle) {
              didSettle = true;
              clearTimeout(timeout);
              reject(new Error(description));
            } else {
              this.callbacks.onError(description);
            }
            return;
          }

          if (message.toolCall?.functionCalls?.length) {
            await this.handleFunctionCalls(message.toolCall.functionCalls);
          }

          const serverContent = message.serverContent;
          if (!serverContent) return;
          if (serverContent.interrupted) {
            this.stopPlaybackQueue();
            this.callbacks.onInterrupted();
          }
          if (serverContent.interimInputTranscription?.text) {
            this.callbacks.onInputTranscript(
              serverContent.interimInputTranscription.text,
              serverContent.interimInputTranscription.languageCode,
              false,
            );
          }
          if (serverContent.inputTranscription?.text) {
            this.callbacks.onInputTranscript(
              serverContent.inputTranscription.text,
              serverContent.inputTranscription.languageCode,
              true,
            );
          }
          if (serverContent.outputTranscription?.text) {
            this.callbacks.onOutputTranscript(serverContent.outputTranscription.text);
          }
          for (const part of serverContent.modelTurn?.parts ?? []) {
            const inlineData = part.inlineData;
            if (inlineData?.data && inlineData.mimeType?.startsWith('audio/pcm')) {
              const rate = Number(inlineData.mimeType.match(/rate=(\d+)/)?.[1] ?? outputSampleRate);
              this.playPcmChunk(inlineData.data, rate);
            }
          }
          if (serverContent.turnComplete) this.callbacks.onTurnComplete();
        } catch {
          this.callbacks.onError('Could not decode a Gemini Live server message.');
        }
      };

      socket.onerror = () => {
        const error = new Error('Gemini Live WebSocket failed. Check the API key, Live model access, and network.');
        if (!didSettle) {
          didSettle = true;
          clearTimeout(timeout);
          reject(error);
        } else {
          this.callbacks.onError(error.message);
        }
      };

      socket.onclose = (event) => {
        clearTimeout(timeout);
        this.stopPlaybackQueue();
        const reasonSuffix = event.reason ? `: ${event.reason}` : ' (no reason sent by server — check that the API key has Live API access and billing enabled)';
        if (!this.closed && event.code !== 1000) {
          this.callbacks.onError(`Gemini Live disconnected (${event.code})${reasonSuffix}. Tap the orb to reconnect.`);
        }
        if (!didSettle) {
          didSettle = true;
          reject(new Error(`Gemini Live closed before setup completed (${event.code})${reasonSuffix}.`));
        }
      };
    });
  }

  sendMicrophoneAudio(data: ArrayBuffer, sampleRate: number) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({
      realtimeInput: {
        audio: {
          data: encodeBase64(new Uint8Array(data)),
          mimeType: `audio/pcm;rate=${sampleRate}`,
        },
      },
    }));
  }

  close() {
    this.closed = true;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    }
    this.socket?.close(1000, 'User ended voice session');
    this.socket = null;
    GeminiLiveAudio.stop();
  }

  private playPcmChunk(encodedAudio: string, _sampleRate: number) {
    const bytes = decodeBase64(encodedAudio);
    if (!bytes.length) return;
    this.callbacks.onAudioStart();
    void GeminiLiveAudio.writeBase64(encodedAudio).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'Android PCM playback failed.';
      this.callbacks.onError(reason);
    });
  }

  private stopPlaybackQueue() {
    GeminiLiveAudio.flush();
  }

  private async handleFunctionCalls(functionCalls: NonNullable<LiveServerMessage['toolCall']>['functionCalls']) {
    if (!functionCalls?.length) return;

    const functionResponses = [];
    for (const functionCall of functionCalls) {
      try {
        if (functionCall.name !== 'add_expense') {
          throw new Error(`Unsupported function: ${functionCall.name}`);
        }
        console.info('[Gemini Live] add_expense tool call received.');

        const args = functionCall.args ?? {};
        const expenseCategory = args.expense_category;
        const amount = args.amount;
        const date = args.date;
        const description = args.description;
        if (
          typeof expenseCategory !== 'string' || !expenseCategory.trim() ||
          typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 ||
          typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          typeof description !== 'string'
        ) {
          throw new Error('Expense details are invalid or incomplete.');
        }
        const parsedDate = new Date(`${date}T00:00:00Z`);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
          throw new Error('Expense date must be a valid date in YYYY-MM-DD format.');
        }

        const result = await add_expense(expenseCategory, amount, date, description);
        console.info('[Finance API] Expense request succeeded.');
        functionResponses.push({
          id: functionCall.id,
          name: functionCall.name,
          response: { result },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Expense could not be recorded.';
        console.error('[Finance API] Expense request failed:', message);
        functionResponses.push({
          id: functionCall.id,
          name: functionCall.name,
          response: { error: message },
        });
      }
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ toolResponse: { functionResponses } }));
    }
  }
}
