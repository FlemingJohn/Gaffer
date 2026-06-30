/**
 * On-device fine-tuning capability — wrapper over QVAC `finetune()`.
 *
 * This is Gaffer's differentiator: it trains a LoRA `.gguf` adapter from the
 * team's season of observations, entirely on-device, and that adapter is then
 * hot-loaded into the LLM (modelConfig.lora) so advice references THIS team.
 *
 * Verified surface: finetune({ modelId, options }) -> handle with
 *   .progressStream  (async ticks: is_train, current_epoch, global_steps,
 *                      current_batch, total_batches, loss?, accuracy?, eta_ms)
 *   .result          (Promise -> FinetuneResult, has .status)
 * The trained adapter is written into options.outputParametersDir. The exact
 * filename isn't documented, so we locate the produced .gguf afterwards.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getSdk, resolvePath } from '../core/engine.js';
import { FINETUNE } from '../config/models.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('finetune');

/** Find the most recently written .gguf adapter in a directory tree. */
export function findAdapter(dir = FINETUNE.adapterOutDir) {
  const root = resolvePath(dir);
  if (!fs.existsSync(root)) return null;
  /** @type {{path:string, mtime:number}[]} */
  const found = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.gguf')) found.push({ path: full, mtime: fs.statSync(full).mtimeMs });
    }
  };
  walk(root);
  if (!found.length) return null;
  found.sort((a, b) => b.mtime - a.mtime);
  return found[0].path;
}

/**
 * Run a fine-tune over the configured season dataset.
 * @param {object} args
 * @param {string} args.modelId - a loaded base model id
 * @param {(tick:object)=>void} [args.onTick]
 * @returns {Promise<{ status: string, adapterPath: string|null }>}
 */
export async function runFinetune({ modelId, onTick }) {
  const sdk = getSdk();
  const outDir = resolvePath(FINETUNE.adapterOutDir);
  fs.mkdirSync(outDir, { recursive: true });

  const handle = sdk.finetune({
    modelId,
    options: {
      trainDatasetDir: resolvePath(FINETUNE.datasetFile),
      // Required by the SDK; "none" skips a holdout split (our season set is tiny).
      validation: { type: 'none' },
      numberOfEpochs: FINETUNE.numberOfEpochs,
      learningRate: FINETUNE.learningRate,
      lrMin: FINETUNE.lrMin,
      loraModules: FINETUNE.loraModules,
      assistantLossOnly: FINETUNE.assistantLossOnly,
      checkpointSaveSteps: FINETUNE.checkpointSaveSteps,
      checkpointSaveDir: resolvePath(FINETUNE.checkpointDir),
      outputParametersDir: outDir,
    },
  });

  for await (const tick of handle.progressStream) {
    if (onTick) onTick(tick);
    else {
      const phase = tick.is_train ? 'train' : 'val';
      const loss = tick.loss != null ? tick.loss.toFixed(4) : '—';
      log.debug(`[${phase}] epoch ${tick.current_epoch} step ${tick.global_steps} loss ${loss}`);
    }
  }

  const result = await handle.result;
  const adapterPath = findAdapter(outDir);
  log.ok(`fine-tune finished (status: ${result?.status ?? 'unknown'})`);
  if (adapterPath) log.ok(`adapter: ${adapterPath}`);
  else log.warn('no .gguf adapter found in output dir — check finetune output');
  return { status: result?.status ?? 'unknown', adapterPath };
}
