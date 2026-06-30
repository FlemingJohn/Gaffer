/**
 * Rendering + safe-parsing helpers for the Halftime Card.
 *
 * The LLM returns a JSON string; we extract, parse, and validate it against the
 * Zod schema, then render a clean terminal view. Keeping this pure (string in,
 * string out) makes it trivial to swap for a real UI later.
 */

import { HalftimeCard, SignalList } from './schema.js';

/**
 * Pull the first balanced JSON object out of a model response that may be
 * wrapped in prose or markdown fences.
 * @param {string} text
 * @returns {unknown}
 */
export function extractJson(text) {
  if (!text) throw new Error('empty model response');
  // Strip markdown fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  if (start === -1) throw new Error('no JSON object found in model response');

  // Walk braces to find the matching close, ignoring braces inside strings.
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1));
    }
  }
  throw new Error('unterminated JSON object in model response');
}

/** Parse + validate a signal-extraction response. */
export function parseSignals(modelText) {
  return SignalList.parse(extractJson(modelText)).signals;
}

/** Parse + validate a Halftime Card response. */
export function parseHalftimeCard(modelText) {
  return HalftimeCard.parse(extractJson(modelText));
}

const SEV = ['', '·', '··', '!!', '!!!', '⚠ '];

/**
 * Render a Halftime Card as a clean, glanceable terminal block.
 * @param {import('./schema.js').HalftimeCardT} card
 * @returns {string}
 */
export function renderHalftimeCard(card) {
  const L = [];
  L.push('');
  L.push('┌─ HALF-TIME CARD ' + '─'.repeat(42));
  L.push(`│ ${card.summary}`);
  L.push('│');
  if (card.problems.length) {
    L.push('│ WHAT\'S HURTING US');
    for (const p of card.problems.slice(0, 3)) {
      L.push(`│   • ${p.issue}`);
      if (p.evidence) L.push(`│       (${p.evidence})`);
    }
    L.push('│');
  }
  if (card.adjustments.length) {
    L.push('│ CHANGES TO MAKE NOW');
    card.adjustments.slice(0, 3).forEach((a, i) => {
      const who = a.players.length ? ` [${a.players.join(', ')}]` : '';
      L.push(`│   ${i + 1}. ${a.action}${who}`);
      L.push(`│      → ${a.rationale}`);
    });
    L.push('│');
  }
  if (card.drill) {
    L.push('│ NEXT TRAINING — DRILL');
    L.push(`│   ${card.drill.name} (focus: ${card.drill.focus})`);
    L.push(`│   ${card.drill.description}`);
    L.push('│');
  }
  if (card.grounding.length) {
    L.push(`│ Grounded in: ${card.grounding.join(' · ')}`);
  }
  L.push(`│ Confidence: ${SEV[card.confidence] || ''}${card.confidence}/5`);
  L.push('└' + '─'.repeat(58));
  L.push('');
  return L.join('\n');
}

/** Flatten a card to a single spoken string for TTS readback. */
export function cardToSpeech(card) {
  const parts = [card.summary];
  if (card.adjustments.length) {
    parts.push('Here are the changes.');
    card.adjustments.forEach((a, i) => parts.push(`${i + 1}. ${a.action}. ${a.rationale}.`));
  }
  if (card.drill) parts.push(`For next training, work on ${card.drill.name}: ${card.drill.description}.`);
  return parts.join(' ');
}
