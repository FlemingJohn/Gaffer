/**
 * Pre-download all models the engine needs, so the demo can run fully offline.
 *
 * The first `loadModel` for each constant pulls weights (gigabytes) from the
 * QVAC registry; we load then immediately unload (keeping the cache) to warm
 * the on-disk store. Run this once on a good connection before going offline.
 *
 *   npm run precache
 */

import { initEngine, loadNamedModel, unload, shutdown } from '../src/core/engine.js';
import { MODELS } from '../src/config/models.js';
import { createLogger } from '../src/core/logger.js';

const log = createLogger('precache');

// ASR additionally needs its VAD model for streaming; pull it too.
const TARGETS = [MODELS.embed, MODELS.llm, MODELS.asr, MODELS.tts];

async function main() {
  await initEngine();
  for (const spec of TARGETS) {
    log.step(`caching ${spec.constant} …`);
    const id = await loadNamedModel(spec, { label: spec.constant });
    await unload(id);
    log.ok(`cached ${spec.constant}`);
  }
  log.ok('all models cached — you can now run offline');
}

main()
  .catch((e) => {
    log.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
