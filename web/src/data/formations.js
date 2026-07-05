// Formation definitions as DATA, so the tactics board is generated, not hand-drawn.
// Coordinates are normalized: x 0..1 left→right, y 0..1 own-goal→opponent-goal.
// `line` drives the node colour (gk / def / mid / fwd). `role` is the label.

export const FORMATIONS = {
  '4-4-2-diamond': [
    { role: 'GK', line: 'gk', x: 0.5, y: 0.05 },
    { role: 'LB', line: 'def', x: 0.15, y: 0.22 },
    { role: 'CB', line: 'def', x: 0.38, y: 0.17 },
    { role: 'CB', line: 'def', x: 0.62, y: 0.17 },
    { role: 'RB', line: 'def', x: 0.85, y: 0.22 },
    { role: 'DM', line: 'mid', x: 0.5, y: 0.38 },
    { role: 'CM', line: 'mid', x: 0.27, y: 0.52 },
    { role: 'CM', line: 'mid', x: 0.73, y: 0.52 },
    { role: 'AM', line: 'mid', x: 0.5, y: 0.66 },
    { role: 'ST', line: 'fwd', x: 0.38, y: 0.82 },
    { role: 'ST', line: 'fwd', x: 0.62, y: 0.82 },
  ],
  '4-3-3': [
    { role: 'GK', line: 'gk', x: 0.5, y: 0.05 },
    { role: 'LB', line: 'def', x: 0.15, y: 0.22 },
    { role: 'CB', line: 'def', x: 0.38, y: 0.17 },
    { role: 'CB', line: 'def', x: 0.62, y: 0.17 },
    { role: 'RB', line: 'def', x: 0.85, y: 0.22 },
    { role: 'CM', line: 'mid', x: 0.3, y: 0.44 },
    { role: 'CM', line: 'mid', x: 0.5, y: 0.38 },
    { role: 'CM', line: 'mid', x: 0.7, y: 0.44 },
    { role: 'LW', line: 'fwd', x: 0.2, y: 0.74 },
    { role: 'ST', line: 'fwd', x: 0.5, y: 0.82 },
    { role: 'RW', line: 'fwd', x: 0.8, y: 0.74 },
  ],
  '4-4-2': [
    { role: 'GK', line: 'gk', x: 0.5, y: 0.05 },
    { role: 'LB', line: 'def', x: 0.15, y: 0.22 },
    { role: 'CB', line: 'def', x: 0.38, y: 0.17 },
    { role: 'CB', line: 'def', x: 0.62, y: 0.17 },
    { role: 'RB', line: 'def', x: 0.85, y: 0.22 },
    { role: 'LM', line: 'mid', x: 0.15, y: 0.5 },
    { role: 'CM', line: 'mid', x: 0.38, y: 0.46 },
    { role: 'CM', line: 'mid', x: 0.62, y: 0.46 },
    { role: 'RM', line: 'mid', x: 0.85, y: 0.5 },
    { role: 'ST', line: 'fwd', x: 0.38, y: 0.82 },
    { role: 'ST', line: 'fwd', x: 0.62, y: 0.82 },
  ],
  '3-5-2': [
    { role: 'GK', line: 'gk', x: 0.5, y: 0.05 },
    { role: 'CB', line: 'def', x: 0.28, y: 0.18 },
    { role: 'CB', line: 'def', x: 0.5, y: 0.15 },
    { role: 'CB', line: 'def', x: 0.72, y: 0.18 },
    { role: 'LM', line: 'mid', x: 0.1, y: 0.5 },
    { role: 'CM', line: 'mid', x: 0.35, y: 0.46 },
    { role: 'CM', line: 'mid', x: 0.5, y: 0.54 },
    { role: 'CM', line: 'mid', x: 0.65, y: 0.46 },
    { role: 'RM', line: 'mid', x: 0.9, y: 0.5 },
    { role: 'ST', line: 'fwd', x: 0.38, y: 0.82 },
    { role: 'ST', line: 'fwd', x: 0.62, y: 0.82 },
  ],
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);

/** Pretty label, e.g. "4-4-2-diamond" -> "4-4-2 Diamond". */
export function formationLabel(key) {
  return key.endsWith('-diamond') ? key.replace('-diamond', ' Diamond') : key;
}
