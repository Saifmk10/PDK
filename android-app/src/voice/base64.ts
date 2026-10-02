// Encode/decode the small PCM chunks exchanged with Gemini Live's JSON WebSocket protocol.
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const decodeTable = new Uint8Array(128);
for (let index = 0; index < alphabet.length; index += 1) decodeTable[alphabet.charCodeAt(index)] = index;

export function encodeBase64(bytes: Uint8Array): string {
  let encoded = '';
  for (let offset = 0; offset < bytes.length; offset += 3) {
    const first = bytes[offset];
    const hasSecond = offset + 1 < bytes.length;
    const hasThird = offset + 2 < bytes.length;
    const second = hasSecond ? bytes[offset + 1] : 0;
    const third = hasThird ? bytes[offset + 2] : 0;
    encoded += alphabet[first >> 2];
    encoded += alphabet[((first & 3) << 4) | (second >> 4)];
    encoded += hasSecond ? alphabet[((second & 15) << 2) | (third >> 6)] : '=';
    encoded += hasThird ? alphabet[third & 63] : '=';
  }
  return encoded;
}

export function decodeBase64(encoded: string): Uint8Array {
  const value = encoded.replace(/\s/g, '');
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array(Math.max(0, Math.floor(value.length * 3 / 4) - padding));
  let outputOffset = 0;
  for (let inputOffset = 0; inputOffset < value.length; inputOffset += 4) {
    const first = decodeTable[value.charCodeAt(inputOffset)] ?? 0;
    const second = decodeTable[value.charCodeAt(inputOffset + 1)] ?? 0;
    const third = value[inputOffset + 2] === '=' ? 0 : decodeTable[value.charCodeAt(inputOffset + 2)] ?? 0;
    const fourth = value[inputOffset + 3] === '=' ? 0 : decodeTable[value.charCodeAt(inputOffset + 3)] ?? 0;
    if (outputOffset < bytes.length) bytes[outputOffset++] = (first << 2) | (second >> 4);
    if (outputOffset < bytes.length) bytes[outputOffset++] = ((second & 15) << 4) | (third >> 2);
    if (outputOffset < bytes.length) bytes[outputOffset++] = ((third & 3) << 6) | fourth;
  }
  return bytes;
}
