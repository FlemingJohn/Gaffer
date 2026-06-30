/**
 * Match-session orchestration — the end-to-end Gaffer flow:
 *
 *   observation (text)
 *      -> extract tactical signals      (LLM, JSON)
 *      -> retrieve grounding            (RAG: embed query + cosine search)
 *      -> compose the Half-Time Card    (LLM, JSON, grounded)
 *      -> render + optional spoken read-back (TTS)
 *
 * Capabilities (LLM/TTS) are reached through the thin wrappers, and the
 * retriever is injected, so this orchestration stays free of direct SDK calls
 * and is easy to test with fakes.
 */

import { completeStructured } from '../capabilities/llm.js';
import { parseSignals, parseHalftimeCard } from '../domain/halftimeCard.js';
import {
  SIGNAL_EXTRACTION_SYSTEM,
  signalExtractionUser,
  halftimeCardSystem,
  halftimeCardUser,
  ragQueryFromSignals,
} from '../domain/prompts.js';
import { SIGNALS_JSON_SCHEMA, CARD_JSON_SCHEMA } from '../domain/jsonSchemas.js';
import { Retriever } from '../rag/retriever.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('session');

/**
 * @param {object} args
 * @param {string} args.observation - the coach's spoken/typed observation
 * @param {string} args.llmModelId
 * @param {Retriever} args.retriever
 * @param {number} [args.topK=3]
 * @returns {Promise<{ signals: object[], grounding: {title:string,text:string,score:number}[], card: import('../domain/schema.js').HalftimeCardT }>}
 */
export async function runMatchSession({ observation, llmModelId, retriever, topK = 3 }) {
  // 1) Distil the rambling observation into structured tactical signals.
  log.step('extracting tactical signals …');
  const signalsRaw = await completeStructured({
    modelId: llmModelId,
    system: SIGNAL_EXTRACTION_SYSTEM,
    user: signalExtractionUser(observation),
    jsonSchema: SIGNALS_JSON_SCHEMA,
  });
  const signals = safe(() => parseSignals(signalsRaw), []);
  log.ok(`${signals.length} signal(s): ${signals.map((s) => s.pattern).join(', ') || '—'}`);

  // 2) Retrieve grounding from the tactical knowledge base.
  log.step('retrieving grounding …');
  const query = ragQueryFromSignals(signals);
  const grounding = await retriever.retrieve(query, topK);
  log.ok(`${grounding.length} snippet(s): ${grounding.map((g) => g.title).join(' · ') || '—'}`);

  // 3) Compose the grounded Half-Time Card.
  log.step('composing Half-Time Card …');
  const context = Retriever.toContext(grounding);
  const cardRaw = await completeStructured({
    modelId: llmModelId,
    system: halftimeCardSystem(context),
    user: halftimeCardUser(signals),
    jsonSchema: CARD_JSON_SCHEMA,
  });
  const card = parseHalftimeCard(cardRaw);
  // Trust the retriever, not the model's self-report, for what grounded the card.
  card.grounding = grounding.map((g) => g.title);

  return { signals, grounding, card };
}

/** Run a thunk, returning a fallback if it throws (used for lenient JSON parse). */
function safe(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    log.warn(`parse fallback: ${e.message}`);
    return fallback;
  }
}
