// Derive a tactics board from a Half-Time Card + the team's known shape:
// auto-pick the formation, label players by name, and turn each adjustment into
// a movement arrow. Deterministic, offline — no model call.

import { FORMATIONS } from '../data/formations.js';

const clamp = (v) => Math.max(0.05, Math.min(0.95, v));

// Map a position keyword in the advice → the role(s) to target (first that
// exists in the current formation). Lets arrows work when the card names a
// position ("drop the back line") rather than a player.
const ROLE_MAP = [
  [/\b(left.?back|lb)\b/, ['LB']],
  [/\b(right.?back|rb)\b/, ['RB']],
  [/\b(cent(er|re).?back|cb|back line|back four|defen[cs]e)\b/, ['CB']],
  [/\b(defensive mid|holding|screen|dm)\b/, ['DM', 'CM']],
  [/\b(attacking mid|number ten|am)\b/, ['AM', 'CM']],
  [/\b(wing|winger|lw|rw|wide)\b/, ['LW', 'RW', 'CM']],
  [/\b(strik|forward|st|up top)\b/, ['ST']],
  [/\b(midfield|midfielder|cm)\b/, ['CM', 'DM', 'AM']],
  [/\b(keeper|goalkeeper|gk)\b/, ['GK']],
];

function findRoleIndex(text, positions) {
  const t = text.toLowerCase();
  for (const [re, roles] of ROLE_MAP) {
    if (re.test(t)) {
      for (const role of roles) {
        const i = positions.findIndex((p) => p.role === role);
        if (i >= 0) return { i, label: role };
      }
    }
  }
  return null;
}

const BACK = new Set(['drop', 'deeper', 'sit', 'tuck', 'screen', 'recover']);
const FWD = new Set(['push', 'higher', 'step', 'join', 'advance', 'overlap', 'forward', 'press']);

// Vertical intent comes from the FIRST directional verb in the action (the
// imperative), so a stray "the drop" in the rationale can't flip it.
function verticalFrom(action) {
  for (const w of action.toLowerCase().split(/\W+/)) {
    if (BACK.has(w)) return -0.16;
    if (FWD.has(w)) return 0.16;
  }
  return 0;
}

// Infer ONE dominant movement. Opponent references ("their right winger") are
// stripped before reading left/right so they don't hijack the arrow.
function directionFor(action, base) {
  const a = action.toLowerCase();
  const ours = a.replace(/\b(their|them|they|opposition|opponent)\b[^.,;]*/g, ' ');

  let dy = verticalFrom(action);

  let dx = 0;
  if (/\b(switch|across|far side|other side)\b/.test(a)) dx = base.x < 0.5 ? 0.2 : -0.2;
  else if (/\bleft\b|double up|overload/.test(ours)) dx = -0.16;
  else if (/\bright\b/.test(ours)) dx = 0.16;

  if (dx === 0 && dy === 0) dy = 0.1; // generic nudge forward
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

  const names = {};
  for (const [name, idx] of Object.entries(roster)) {
    const p = positions[idx];
    if (p) names[`${p.role}#${idx}`] = name;
  }

  const arrows = [];
  for (const adj of card?.adjustments || []) {
    const text = `${adj.action} ${adj.rationale || ''}`;
    // Prefer a named player we know; otherwise fall back to a position keyword.
    const player = (adj.players || []).find((p) => roster[p] != null);
    let idx;
    let label;
    if (player != null) {
      idx = roster[player];
      label = player;
    } else {
      const hit = findRoleIndex(text, positions);
      if (hit) {
        idx = hit.i;
        label = hit.label;
      }
    }
    if (idx == null) continue;
    const base = positions[idx];
    const { dx, dy } = directionFor(adj.action || text, base);
    arrows.push({ from: idx, to: { x: clamp(base.x + dx), y: clamp(base.y + dy) }, label });
  }

  return { formation, names, arrows };
}
