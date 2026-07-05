// Derive a tactics board from a Half-Time Card + the team's known shape:
// auto-pick the formation, label players by name, and turn each adjustment into
// a movement arrow (direction inferred from the coaching verbs). Deterministic,
// offline — no model call.

import { FORMATIONS } from '../data/formations.js';

const clamp = (v) => Math.max(0.05, Math.min(0.95, v));

// Map coaching language -> a movement vector in normalized pitch space
// (x: left→right, y: own-goal→opponent-goal).
function directionFor(text, base) {
  const t = text.toLowerCase();
  let dx = 0;
  let dy = 0;
  if (/\b(drop|deeper|drop back|stay home|sit|screen|tuck)\b/.test(t)) dy -= 0.13;
  if (/\b(push|higher|step up|forward|press high|join)\b/.test(t)) dy += 0.13;
  if (/\b(double up|overload|left)\b/.test(t)) dx -= 0.12;
  if (/\bright\b/.test(t)) dx += 0.12;
  if (/\b(switch|across|far side|other side)\b/.test(t)) dx += base.x < 0.5 ? 0.22 : -0.22;
  if (/\boverlap\b/.test(t)) { dy += 0.12; dx += base.x < 0.5 ? -0.06 : 0.06; }
  if (dx === 0 && dy === 0) dy += 0.08; // generic nudge forward
  return { dx, dy };
}

/**
 * @param {object} card - HalftimeCard (summary/problems/adjustments/…)
 * @param {object} team - { formation, roster: { name: positionIndex } }
 * @returns {{ formation: string, names: Record<string,string>, arrows: Array }}
 */
export function deriveBoard(card, team) {
  const formation = team?.formation || '4-4-2-diamond';
  const positions = FORMATIONS[formation] || [];
  const roster = team?.roster || {};

  // label each occupied position with its player's name
  const names = {};
  for (const [name, idx] of Object.entries(roster)) {
    const p = positions[idx];
    if (p) names[`${p.role}#${idx}`] = name;
  }

  // one arrow per adjustment that names a known player
  const arrows = [];
  for (const adj of card?.adjustments || []) {
    const player = (adj.players || []).find((p) => roster[p] != null);
    if (player == null) continue;
    const idx = roster[player];
    const base = positions[idx];
    if (!base) continue;
    const { dx, dy } = directionFor(`${adj.action} ${adj.rationale || ''}`, base);
    arrows.push({ from: idx, to: { x: clamp(base.x + dx), y: clamp(base.y + dy) }, label: player });
  }

  return { formation, names, arrows };
}
