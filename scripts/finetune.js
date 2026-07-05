/**
 * Train the team adapter — Gaffer's differentiator.
 *
 * Loads the base LLM, fine-tunes a LoRA adapter on the season dataset
 * (data/training/team-season.jsonl), and writes a `.gguf` adapter to
 * data/adapters. Afterwards, run the engine with `--adapter` to get advice that
 * references THIS team's players and recurring patterns.
 *
 *   npm run finetune        (add to package.json scripts) or:
 *   node scripts/finetune.js
 */

import { initEngine, loadNamedModel, shutdown } from '../src/core/engine.js';
import { MODELS, FINETUNE } from '../src/config/models.js';
import { runFinetune } from '../src/capabilities/finetune.js';
import { createLogger } from '../src/core/logger.js';

const log = createLogger('finetune');

async function main() {
  await initEngine();
  const modelId = await loadNamedModel(MODELS.llm, { label: 'base-llm' });

  log.info('──────── ON-DEVICE FINE-TUNE (LoRA) ────────');
  log.step(`base=${MODELS.llm.constant} · dataset=${FINETUNE.datasetFile} · ${FINETUNE.numberOfEpochs} epochs`);
  let lastEpoch = -1;
  const { status, adapterPath } = await runFinetune({
    modelId,
    onTick: (t) => {
      if (t.is_train && t.current_epoch !== lastEpoch) {
        lastEpoch = t.current_epoch;
        log.step(`epoch ${t.current_epoch + 1}/${FINETUNE.numberOfEpochs}`);
      }
      if (t.loss != null && t.global_steps % 5 === 0) {
        const eta = Math.round((t.eta_ms || 0) / 1000);
        log.info(`   ${t.is_train ? 'train' : 'val'} step ${t.global_steps} · loss ${t.loss.toFixed(4)}${t.accuracy != null ? ` · acc ${(t.accuracy * 100).toFixed(0)}%` : ''} · eta ${eta}s`);
      }
    },
  });
  log.info('──────── FINE-TUNE COMPLETE ────────');

  log.ok(`done (status: ${status})`);
  if (adapterPath) log.ok(`Run: node src/index.js --adapter --demo`);
}

main()
  .catch((e) => {
    log.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
