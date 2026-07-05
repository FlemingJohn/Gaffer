/**
 * Bridge server — lets the browser UI reach the QVAC engine (which only runs in
 * Node). Thin HTTP wrapper over the existing pipeline + capabilities. Models are
 * loaded lazily on first use so startup is instant.
 *
 *   npm run server      (then the Vite dev server proxies /api here)
 *
 * Endpoints:
 *   GET  /api/health              -> which models are loaded, adapter status
 *   POST /api/session {observation} -> { signals, grounding, card }
 *   POST /api/tts     {text}        -> audio/wav (spoken card)
 *   POST /api/transcribe (audio/wav raw) -> { transcript }
 */

import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initEngine, loadNamedModel, resolvePath, shutdown } from './core/engine.js';
import { MODELS, PATHS } from './config/models.js';
import { VectorStore } from './rag/store.js';
import { Retriever } from './rag/retriever.js';
import { createEmbedder } from './capabilities/embed.js';
import { transcribeFile } from './capabilities/asr.js';
import { speakToFile } from './capabilities/tts.js';
import { runMatchSession } from './pipeline/matchSession.js';
import { findAdapter } from './capabilities/finetune.js';
import { createLogger } from './core/logger.js';

const log = createLogger('server');
const PORT = process.env.GAFFER_PORT || 8787;

const state = { embed: null, llm: null, asr: null, tts: null, retriever: null, adapter: false };

// QVAC runs a single Bare worker; if two requests trigger loadModel at once the
// worker inits race and time out. Serialize ALL model loads behind one chain,
// and cache each load as a promise so concurrent callers await the same one.
let chain = Promise.resolve();
const loading = {};
function serial(fn) {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}
function getModel(key, spec, extraConfig) {
  if (state[key]) return Promise.resolve(state[key]);
  if (loading[key]) return loading[key];
  loading[key] = serial(async () => {
    const id = await loadNamedModel(spec, { label: key, extraConfig });
    state[key] = id;
    return id;
  });
  return loading[key];
}

/** Lazily load the models + RAG index needed to answer a session. */
async function ensureSession() {
  await getModel('embed', MODELS.embed);
  if (!state.retriever) {
    const idx = resolvePath(PATHS.ragIndex);
    if (!fs.existsSync(idx)) throw new Error('RAG index missing — run `npm run ingest` first.');
    const store = VectorStore.fromJSON(JSON.parse(fs.readFileSync(idx, 'utf8')));
    state.retriever = new Retriever(createEmbedder(state.embed), store);
  }
  if (!state.llm) {
    const adapterPath = findAdapter();
    state.adapter = Boolean(adapterPath);
    await getModel('llm', MODELS.llm, adapterPath ? { lora: adapterPath } : undefined);
  }
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    models: { embed: !!state.embed, llm: !!state.llm, asr: !!state.asr, tts: !!state.tts },
    adapter: state.adapter,
  });
});

app.post('/api/session', async (req, res) => {
  try {
    const observation = String(req.body?.observation || '').trim();
    if (!observation) return res.status(400).json({ error: 'observation required' });
    await ensureSession();
    const result = await runMatchSession({ observation, llmModelId: state.llm, retriever: state.retriever });
    res.json({ ...result, adapter: state.adapter });
  } catch (e) {
    log.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'text required' });
    await getModel('tts', MODELS.tts);
    const out = path.join(os.tmpdir(), `gaffer-tts-${process.pid}-${Date.now()}.wav`);
    await speakToFile({ modelId: state.tts, text, outPath: out, sampleRate: MODELS.tts.sampleRate });
    res.setHeader('Content-Type', 'audio/wav');
    const stream = fs.createReadStream(out);
    stream.pipe(res);
    stream.on('close', () => fs.unlink(out, () => {}));
  } catch (e) {
    log.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post(
  '/api/transcribe',
  express.raw({ type: ['audio/wav', 'application/octet-stream'], limit: '25mb' }),
  async (req, res) => {
    try {
      if (!req.body || !req.body.length) return res.status(400).json({ error: 'audio body required' });
      await getModel('asr', MODELS.asr);
      const tmp = path.join(os.tmpdir(), `gaffer-asr-${process.pid}-${Date.now()}.wav`);
      fs.writeFileSync(tmp, req.body);
      const transcript = await transcribeFile({ modelId: state.asr, filePath: tmp });
      fs.unlink(tmp, () => {});
      res.json({ transcript });
    } catch (e) {
      log.error(e.message);
      res.status(500).json({ error: e.message });
    }
  },
);

async function main() {
  await initEngine();
  const server = app.listen(PORT, () => log.ok(`bridge listening on http://localhost:${PORT}`));
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      log.error(`Port ${PORT} is already in use — another "npm run server" is likely running. Stop it first (only one bridge should run).`);
      process.exit(1);
    }
    throw e;
  });
  // Warm the Bare worker once (via a single sequential load) so the first real
  // request doesn't pay the cold-start timeout and concurrent loads don't race.
  try {
    await getModel('embed', MODELS.embed);
    log.ok('worker warm (embed loaded)');
  } catch (e) {
    log.warn(`warmup failed (will retry on demand): ${e.message}`);
  }
}

main().catch((e) => {
  log.error(e.stack || e.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});
