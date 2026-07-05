// Sample data mirroring exactly what the engine produces, so the UI is a true
// skin over the real pipeline. Swap these for /api calls once the bridge is wired.

// Seed values used only on first run; after that the live state lives in
// localStorage (see lib/store.js). `squad` is ORDERED to the formation
// positions (index 0 = GK, 1 = LB, …), which is how the board places names.
export const SEED_TEAM = {
  name: 'Riverside U13',
  formation: '4-4-2-diamond',
  squad: ['Jack', 'Tom', 'Sam', 'Daniel', 'Kai', 'Marcus', 'Aisha', 'Ollie', 'Leo', 'Ben', 'Charlie'],
  seasonNotes: 12,
  lastTrained: '3 days ago',
  adapterActive: true,
};

export const SEED_MATCH = {
  home: 'Riverside',
  away: 'Oakwood',
  homeScore: 0,
  awayScore: 0,
  phase: '1st half',
};

// The exact shape of domain/schema.js HalftimeCard.
export const CARD = {
  summary: 'A goal down and overloaded on our left flank.',
  formation: '4-4-2-diamond',
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

// No seed history — it fills with the coach's real matches (saved from a card,
// or added manually on the History page).
