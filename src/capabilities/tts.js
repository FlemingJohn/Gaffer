/**
 * Text-to-speech capability — wrapper over QVAC `textToSpeech()` (Supertonic).
 *
 * Verified: textToSpeech({ modelId, text, inputType:'text', stream:false })
 * returns a result whose `.buffer` resolves to Int16 PCM samples. Supertonic
 * runs at 44100 Hz. We write a WAV file rather than play it, so the headless
 * engine needs no audio-playback binary (ffplay/aplay).
 */

import { getSdk } from '../core/engine.js';
import { writeWav } from '../utils/wav.js';
import { resolvePath } from '../core/engine.js';

/**
 * Synthesize text to a .wav file.
 * @param {object} args
 * @param {string} args.modelId
 * @param {string} args.text
 * @param {string} args.outPath - destination .wav (project-relative ok)
 * @param {number} [args.sampleRate=44100]
 * @returns {Promise<string>} absolute path to the written WAV
 */
export async function speakToFile({ modelId, text, outPath, sampleRate = 44100 }) {
  const sdk = getSdk();
  const result = sdk.textToSpeech({ modelId, text, inputType: 'text', stream: false });
  const samples = await result.buffer;
  return writeWav(samples, sampleRate, resolvePath(outPath));
}
