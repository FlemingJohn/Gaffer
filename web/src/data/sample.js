// Sample data mirroring exactly what the engine produces, so the UI is a true
// skin over the real pipeline. Swap these for /api calls once the bridge is wired.

// First-run defaults — intentionally EMPTY (no mock team/players). The coach
// enters their team name in onboarding and adds their own squad on the Team
// page. `squad` is ORDERED to the formation positions (0 = GK, 1 = LB, …),
// which is how the board places names.
export const SEED_TEAM = {
  name: '',
  formation: '4-4-2-diamond',
  squad: [],
  seasonNotes: 0,
  lastTrained: 'never',
  adapterActive: false,
};

// Home team name comes from the team profile; opponent + score are entered by
// the coach. Starts blank / 0–0 — no mock result.
export const SEED_MATCH = {
  away: '',
  homeScore: 0,
  awayScore: 0,
  phase: '1st half',
};

// No mock card / signals / history — the Half-Time Card comes from the live
// engine, and history fills with the coach's real matches.
