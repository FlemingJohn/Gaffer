/**
 * Gaffer CLI entry point (headless engine — no frontend).
 *
 * Usage:
 *   node src/index.js "they're overloading our left and we're a goal down"
 *   node src/index.js --demo                 # run the scripted demo observation
 *   node src/index.js --adapter "..."        # use the fine-tuned (team) adapter
 *   node src/index.js --voice clip.wav       # transcribe a WAV, then advise
 *   node src/index.js --speak "..."          # also synthesize a spoken card
 *
 * Pre-reqs: `npm run precache` (download models) and `npm run ingest` (build the
 * RAG index) should be run once before going offline.
 */

import fs from 'node:fs';
import { initEngine, loadNamedModel, resolvePath, shutdown } from './core/engine.js';
import { MODELS, PATHS } from './config/models.js';
import { VectorStore } from './rag/store.js';
import { Retriever } from './rag/retriever.js';
import { createEmbedder } from './capabilities/embed.js';
import { transcribeFile } from './capabilities/asr.js';
import { speakToFile } from './capabilities/tts.js';
import { runMatchSession } from './pipeline/matchSession.js';
import { renderHalftimeCard, cardToSpeech } from './domain/halftimeCard.js';
import { findAdapter } from './capabilities/finetune.js';
import { createLogger } from './core/logger.js';

const log = createLogger('gaffer');

const DEMO_OBSERVATION =
  "They keep getting at us down our left, our right-back's caught too high, " +
  "and we're losing every second ball in midfield. We're a goal down at the break.";

function parseArgs(argv) {
  const flags = { demo: false, adapter: false, speak: false, voice: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--demo') flags.demo = true;
    else if (a === '--adapter') flags.adapter = true;
    else if (a === '--speak') flags.speak = true;
    else if (a === '--voice') flags.voice = argv[++i];
    else positional.push(a);
  }
  flags.observation = positional.join(' ').trim();
  return flags;
}

/** Load the persisted RAG index into a Retriever (embedder bound to a model). */
function buildRetriever(embedModelId) {
  const idxPath = resolvePath(PATHS.ragIndex);
  if (!fs.existsSync(idxPath)) {
    throw new Error(
      `RAG index not found at ${PATHS.ragIndex}. Run "npm run ingest" first.`,
    );
  }
  const store = VectorStore.fromJSON(JSON.parse(fs.readFileSync(idxPath, 'utf8')));
  log.ok(`RAG index loaded (${store.size} snippets)`);
  return new Retriever(createEmbedder(embedModelId), store);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  await initEngine();

  // Embedding model (for RAG query) + LLM (optionally with the team adapter).
  const embedModelId = await loadNamedModel(MODELS.embed, { label: 'embed' });
  const retriever = buildRetriever(embedModelId);

  let extraConfig;
  if (flags.adapter) {
    const adapterPath = findAdapter();
    if (!adapterPath) throw new Error('No fine-tuned adapter found. Run "npm run finetune" first.');
    extraConfig = { lora: adapterPath };
    log.ok(`using team adapter: ${adapterPath}`);
  }
  const llmModelId = await loadNamedModel(MODELS.llm, { label: 'llm', extraConfig });

  // Resolve the observation: voice file > positional/demo text.
  let observation = flags.observation;
  if (flags.voice) {
    const asrModelId = await loadNamedModel(MODELS.asr, { label: 'asr' });
    log.step(`transcribing ${flags.voice} …`);
    observation = await transcribeFile({ modelId: asrModelId, filePath: resolvePath(flags.voice) });
    log.ok(`heard: "${observation}"`);
  }
  if (!observation) observation = DEMO_OBSERVATION;

  log.info(`\nObservation: "${observation}"`);

  // Run the end-to-end session.
  const { card } = await runMatchSession({ observation, llmModelId, retriever });

  // Output the artifact.
  process.stdout.write(renderHalftimeCard(card));

  // Optional spoken read-back.
  if (flags.speak) {
    const ttsModelId = await loadNamedModel(MODELS.tts, { label: 'tts' });
    const out = await speakToFile({
      modelId: ttsModelId,
      text: cardToSpeech(card),
      outPath: PATHS.ttsOut,
      sampleRate: MODELS.tts.sampleRate,
    });
    log.ok(`spoken card written to ${out}`);
  }
}

main()
  .catch((e) => {
    log.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
