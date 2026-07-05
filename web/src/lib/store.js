// On-device app state (team, match, history), persisted to localStorage.
// No server, no mock/seed match data — history starts empty and fills with the
// coach's real matches. Uses createElement (no JSX) so this stays a .js file.

import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { SEED_TEAM, SEED_MATCH } from '../data/sample.js';

const KEY = 'gaffer-state-v2';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && s.team && s.match ? s : null;
  } catch {
    return null;
  }
}

function freshMatch(prev) {
  return { home: prev?.home || 'Riverside', away: prev?.away || 'Opponent', homeScore: 0, awayScore: 0, phase: '1st half' };
}

function resultOf(homeScore, awayScore) {
  return homeScore > awayScore ? 'w' : homeScore < awayScore ? 'l' : 'd';
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => load() || { team: SEED_TEAM, match: SEED_MATCH, history: [] });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full / disabled — non-fatal */
    }
  }, [state]);

  const value = {
    team: state.team,
    match: state.match,
    history: state.history,

    setPhase: (phase) => setState((s) => ({ ...s, match: { ...s.match, phase } })),
    bumpScore: (side, delta) =>
      setState((s) => {
        const key = side === 'home' ? 'homeScore' : 'awayScore';
        return { ...s, match: { ...s.match, [key]: Math.max(0, (s.match[key] || 0) + delta) } };
      }),
    setOpponent: (away) => setState((s) => ({ ...s, match: { ...s.match, away } })),
    newMatch: () => setState((s) => ({ ...s, match: freshMatch(s.match) })),

    addPlayer: (name) =>
      setState((s) => {
        const n = (name || '').trim();
        if (!n || s.team.squad.includes(n)) return s;
        return { ...s, team: { ...s.team, squad: [...s.team.squad, n] } };
      }),
    removePlayer: (name) =>
      setState((s) => ({ ...s, team: { ...s.team, squad: s.team.squad.filter((p) => p !== name) } })),
    setFormation: (formation) => setState((s) => ({ ...s, team: { ...s.team, formation } })),

    // Save the current live match (+ the card that ended it) into history, reset match.
    saveMatch: (card) =>
      setState((s) => {
        const { homeScore = 0, awayScore = 0, away } = s.match;
        const entry = {
          opp: away,
          score: `${homeScore}–${awayScore}`,
          result: resultOf(homeScore, awayScore),
          date: 'Just now',
          summary: card?.summary || '',
        };
        return { ...s, match: freshMatch(s.match), history: [entry, ...s.history].slice(0, 40) };
      }),

    // Manually add a past match (opponent + scores) from the History page.
    addMatch: ({ opp, homeScore, awayScore }) =>
      setState((s) => {
        const h = Math.max(0, Number(homeScore) || 0);
        const a = Math.max(0, Number(awayScore) || 0);
        const entry = {
          opp: (opp || 'Opponent').trim(),
          score: `${h}–${a}`,
          result: resultOf(h, a),
          date: 'Added',
          summary: '',
        };
        return { ...s, history: [entry, ...s.history].slice(0, 40) };
      }),
    removeMatch: (index) => setState((s) => ({ ...s, history: s.history.filter((_, i) => i !== index) })),
  };

  return createElement(Ctx.Provider, { value }, children);
}

export const useGaffer = () => useContext(Ctx);
