/**
 * Voice round-trip test: synthesize speech with Supertonic (TTS), then feed that
 * audio back through Whisper (ASR). If the transcript resembles the input, both
 * on-device voice models work. Also downloads them on first run.
 *
 *   node scripts/test-voice.js
 */

import { initEngine, loadNamedModel, resolvePath, shutdown } from '../src/core/engine.js';
import { MODELS, PATHS } from '../src/config/models.js';
import { speakToFile } from '../src/capabilities/tts.js';
import { transcribeFile } from '../src/capabilities/asr.js';
import { createLogger } from '../src/core/logger.js';

const log = createLogger('voice');
const TEXT = 'They keep getting at us down our left and we are losing every second ball in midfield.';

async function main() {
  await initEngine();

  const ttsId = await loadNamedModel(MODELS.tts, { label: 'tts' });
  log.step('synthesizing speech …');
  const wav = await speakToFile({ modelId: ttsId, text: TEXT, outPath: 'data/cache/voice-test.wav', sampleRate: MODELS.tts.sampleRate });
  log.ok(`wrote ${wav}`);

  const asrId = await loadNamedModel(MODELS.asr, { label: 'asr' });
  log.step('transcribing it back …');
  const heard = await transcribeFile({ modelId: asrId, filePath: wav });

  log.ok(`SAID:  "${TEXT}"`);
  log.ok(`HEARD: "${heard}"`);
}

main()
  .catch((e) => {
    log.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
