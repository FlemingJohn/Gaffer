/**
 * Generate a "4-4-2 diamond" tactics board with SDXL (offloaded to fit 2 GB).
 * Two seeds for options. Writes to data/cache.
 *
 *   node scripts/test-diffusion.js
 */

import fs from 'node:fs';
import { initEngine, getSdk, loadNamedModel, resolvePath, shutdown } from '../src/core/engine.js';
import { createLogger } from '../src/core/logger.js';

const log = createLogger('diffusion');

const PROMPT =
  'top-down view of a football tactics board, 4-4-2 diamond formation, eleven white circular player markers, ' +
  'a goalkeeper, a flat back four, a diamond-shaped midfield of four, and two strikers, ' +
  'dark green pitch with crisp white lines, centre circle, flat minimal diagram, high contrast';
const NEG = 'photo, 3d, perspective, crowd, stadium, text paragraphs, watermark, blurry, duplicate pitches, players running, jerseys';

async function gen(sdk, modelId, tag, seed) {
  log.step(`[${tag}] generating (seed ${seed}) …`);
  const run = sdk.diffusion({
    modelId, prompt: PROMPT, negative_prompt: NEG,
    width: 512, height: 512, steps: 28, cfg_scale: 8, seed,
  });
  for await (const ev of run.progressStream) {
    if (ev.step % 7 === 0 || ev.step === ev.totalSteps) log.debug(`[${tag}] ${ev.step}/${ev.totalSteps}`);
  }
  const buffers = await run.outputs;
  const out = resolvePath(`data/cache/${tag}.png`);
  fs.writeFileSync(out, buffers[0]);
  log.ok(`[${tag}] wrote ${out} (${(buffers[0].length / 1024).toFixed(0)} KB)`);
}

async function main() {
  await initEngine();
  const sdk = getSdk();
  fs.mkdirSync(resolvePath('data/cache'), { recursive: true });

  const sdxl = await loadNamedModel(
    {
      constant: 'SDXL_BASE_1_0_3B_Q4_0',
      modelConfig: { offload_to_cpu: true, vae_on_cpu: true, clip_on_cpu: true, vae_tiling: true },
    },
    { label: 'sdxl' },
  );

  await gen(sdk, sdxl, '442-diamond-a', 42);
  await gen(sdk, sdxl, '442-diamond-b', 7);
}

main()
  .catch((e) => {
    log.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
