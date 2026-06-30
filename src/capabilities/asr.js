/**
 * Speech-to-text capability — wrapper over QVAC `transcribe()` (file) and
 * `transcribeStream()` (live mic).
 *
 * File path is verified: transcribe({ modelId, audioChunk: filePath, metadata }).
 * With metadata:true it returns segment objects { startMs, endMs, text, ... }.
 *
 * Live mic requires `ffmpeg` on PATH plus a microphone source; it is provided
 * here for the demo but is optional — the engine works fine with text input or
 * a pre-recorded WAV, which keeps the headless build dependency-free.
 */

import { getSdk } from '../core/engine.js';

/**
 * Transcribe an audio file (e.g. a recorded touchline observation).
 * @param {object} args
 * @param {string} args.modelId
 * @param {string} args.filePath - path to a WAV file
 * @returns {Promise<string>} full transcript
 */
export async function transcribeFile({ modelId, filePath }) {
  const sdk = getSdk();
  const segments = await sdk.transcribe({ modelId, audioChunk: filePath, metadata: true });
  return segments.map((s) => s.text).join('').trim();
}

/**
 * Open a live mic transcription session (optional / demo only).
 * Yields transcript strings on each detected pause.
 *
 * NOTE: requires ffmpeg + a mic capture pipe. We don't bundle a mic helper in
 * the headless engine; pass your own readable PCM (f32le @ 16kHz) source to
 * `session.write(chunk)`. Returns the raw SDK session so callers control IO.
 * @param {string} modelId
 */
export async function openMicSession(modelId) {
  const sdk = getSdk();
  return sdk.transcribeStream({ modelId });
}
