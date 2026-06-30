/**
 * Build the RAG index: parse the tactical corpus, embed each snippet on-device,
 * and persist the vector store to disk so the engine starts instantly offline.
 *
 *   npm run ingest
 */

import fs from 'node:fs';
import path from 'node:path';
import { initEngine, loadNamedModel, resolvePath, shutdown } from '../src/core/engine.js';
import { MODELS, PATHS } from '../src/config/models.js';
import { createEmbedder } from '../src/capabilities/embed.js';
import { Retriever } from '../src/rag/retriever.js';
import { loadMarkdownSnippets } from '../src/rag/corpus.js';
import { createLogger } from '../src/core/logger.js';

const log = createLogger('ingest');

async function main() {
  await initEngine();

  const snippets = loadMarkdownSnippets(PATHS.corpus);
  log.ok(`parsed ${snippets.length} snippet(s) from ${PATHS.corpus}`);

  const embedModelId = await loadNamedModel(MODELS.embed, { label: 'embed' });
  const retriever = new Retriever(createEmbedder(embedModelId));

  log.step('embedding corpus …');
  await retriever.ingest(snippets);

  const outPath = resolvePath(PATHS.ragIndex);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(retriever.store.toJSON()));
  log.ok(`RAG index written to ${PATHS.ragIndex} (${retriever.store.size} vectors)`);
}

main()
  .catch((e) => {
    log.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(shutdown);
