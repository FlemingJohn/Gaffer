// Sample data mirroring exactly what the engine produces, so the UI is a true
// skin over the real pipeline. Swap these for /api calls once the bridge is wired.

export const TEAM = {
  name: 'Riverside U13',
  squad: ['Tom', 'Kai', 'Sam', 'Daniel', 'Marcus', 'Aisha', 'Leo', 'Ben'],
  seasonNotes: 12,
  lastTrained: '3 days ago',
  adapterActive: true,
};

export const MATCH = {
  home: 'Riverside',
  away: 'Oakwood',
  score: '0–1',
  phase: 'Half-time',
};

// The exact shape of domain/schema.js HalftimeCard.
export const CARD = {
  summary: 'A goal down and overloaded on our left flank.',
  problems: [
    { issue: 'Overload down our left', evidence: 'getting at us down our left', severity: 4 },
    { issue: 'Second balls lost in midfield', evidence: 'losing every second ball', severity: 3 },
  ],
  adjustments: [
    { action: 'Drop Leo to double up on their right winger', rationale: 'Make it 3-v-3 and stop the overlap', players: ['Leo'] },
    { action: 'Push Aisha higher to the contact point', rationale: 'Be first to the drop', players: ['Aisha', 'Marcus'] },
  ],
  drill: { name: 'Wide recovery', focus: 'doubling up', description: 'Leo and Tom defend a 3-v-2 on the wing' },
  grounding: ['Wide overload on one flank', 'Losing second balls in midfield'],
  confidence: 4,
};

export const SIGNALS = [
  { pattern: 'overload', zone: 'left', severity: 4 },
  { pattern: 'high-line', zone: 'right', severity: 4 },
  { pattern: 'second-balls-lost', zone: 'centre', severity: 3 },
];

export const TRANSCRIPT =
  'they keep getting at us down our left, right-back caught too high, losing every second ball…';

export const HISTORY = [
  { opp: 'Oakwood', score: '0–1', result: 'l', date: 'Today' },
  { opp: 'Hillside', score: '3–1', result: 'w', date: 'Sat' },
  { opp: 'Fairview', score: '2–2', result: 'd', date: 'Last wk' },
  { opp: 'Meadow Rvrs', score: '1–0', result: 'w', date: '2 wks' },
];
