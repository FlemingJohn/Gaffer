/**
 * Minimal 16-bit PCM mono WAV writer.
 *
 * QVAC's textToSpeech() returns Int16 PCM samples (Int16Array or number[]);
 * this wraps them in a canonical 44-byte WAV header so the card can be saved
 * and played by any media player without pulling in an audio library.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Build a 44-byte WAV header for `dataLength` bytes of 16-bit mono PCM. */
export function createWavHeader(dataLength, sampleRate) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2; // mono, 16-bit
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // audio format = PCM
  header.writeUInt16LE(1, 22); // channels = mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

/** Convert Int16 samples (Int16Array | number[]) to a little-endian byte Buffer. */
export function int16ToBuffer(samples) {
  const buf = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    // clamp to int16 range to be safe
    let s = samples[i] | 0;
    if (s > 32767) s = 32767;
    else if (s < -32768) s = -32768;
    buf.writeInt16LE(s, i * 2);
  }
  return buf;
}

/** Write Int16 PCM samples to a .wav file, creating parent dirs. */
export function writeWav(samples, sampleRate, outPath) {
  const data = int16ToBuffer(samples);
  const wav = Buffer.concat([createWavHeader(data.length, sampleRate), data]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, wav);
  return outPath;
}
