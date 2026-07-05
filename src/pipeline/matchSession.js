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
  log.info('──────── RAG PIPELINE ────────');
  log.info(`observation: "${observation}"`);

  // 1) Distil the rambling observation into structured tactical signals.
  log.step('[1/3] LLM signal extraction (Qwen3 + json_schema) …');
  const signalsRaw = await completeStructured({
    modelId: llmModelId,
    system: SIGNAL_EXTRACTION_SYSTEM,
    user: signalExtractionUser(observation),
    jsonSchema: SIGNALS_JSON_SCHEMA,
  });
  const signals = safe(() => parseSignals(signalsRaw), []);
  log.ok(`signals (${signals.length}):`);
  for (const s of signals) {
    log.info(`   • ${s.pattern}  [zone=${s.zone} phase=${s.phase} severity=${s.severity}]${s.players?.length ? ` players=${s.players.join(',')}` : ''}`);
  }

  // 2) Retrieve grounding from the tactical knowledge base (embed query + cosine).
  // Lead with the coach's own words (natural language embeds closer to the
  // corpus text) and append the structured signal tags as a keyword boost.
  const query = [observation, ragQueryFromSignals(signals)].filter(Boolean).join('. ');
  log.step(`[2/3] RAG retrieve — embed query + cosine over ${retriever.store.size} snippets`);
  log.info(`   query: "${query}"`);
  const grounding = await retriever.retrieve(query, topK);
  log.ok(`top ${grounding.length} by cosine similarity:`);
  for (const g of grounding) {
    log.info(`   ${g.score.toFixed(3)}  ${g.title}`);
  }

  // 3) Compose the grounded Half-Time Card.
  log.step('[3/3] LLM compose Half-Time Card (grounded, json_schema) …');
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
  log.ok(`card: formation=${card.formation || '—'} · ${card.adjustments?.length || 0} adjustment(s) · confidence ${card.confidence}/5`);
  log.info(`   summary: ${card.summary}`);
  log.info('──────── END PIPELINE ────────');

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
