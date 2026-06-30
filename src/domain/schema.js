/**
 * Domain schemas for Gaffer's structured artifacts.
 *
 * These Zod schemas are the contract between the LLM and the rest of the app:
 * the model is asked to emit JSON matching them, and we `safeParse` before
 * trusting anything. This is the documented path to structured output on QVAC
 * (constrained-grammar / JSON mode is not exposed by the SDK), so validation
 * happens here rather than in the model.
 */

import { z } from 'zod';

/** A pitch zone, in the coach's own frame of reference. */
export const Zone = z.enum(['left', 'centre-left', 'centre', 'centre-right', 'right', 'overall']);

/** Tactical phase the signal relates to. */
export const Phase = z.enum(['in-possession', 'out-of-possession', 'transition', 'set-piece']);

/**
 * A single tactical signal extracted from a coach's spoken observation.
 * Many of these are distilled from one rambling touchline mutter.
 */
// NB: every field uses `.catch()` so a single odd value the small on-device
// model emits (e.g. zone "right-back" instead of "right") degrades to a sane
// default instead of throwing out the entire signal — and with it the others.
export const TacticalSignal = z.object({
  /** Short machine-ish tag, e.g. "overload", "high-line", "second-balls-lost". */
  pattern: z.string().min(2).catch('unknown'),
  zone: Zone.catch('overall'),
  phase: Phase.catch('out-of-possession'),
  /** 1 (minor) … 5 (match-losing). */
  severity: z.coerce.number().int().min(1).max(5).catch(3),
  /** The coach's own words that triggered this signal. */
  evidence: z.string().catch(''),
  /** Player(s) named, if any — drives personalisation over the season. */
  players: z.array(z.string()).catch([]),
});

export const SignalList = z.object({
  signals: z.array(TacticalSignal).default([]),
});

/** One concrete adjustment the coach can make at the break. */
export const Adjustment = z.object({
  action: z.string().min(3),
  rationale: z.string().min(3).catch(''),
  /** Players this instruction is aimed at, if specific. */
  players: z.array(z.string()).catch([]),
});

/** A training-ground drill that addresses the root cause next session. */
export const Drill = z.object({
  name: z.string().min(2),
  focus: z.string().min(2),
  description: z.string().min(3),
});

/**
 * The Halftime Card — Gaffer's headline artifact. One screen, glanceable in the
 * 15-minute break, in coach language (never xG charts).
 */
export const HalftimeCard = z.object({
  /** One-line read of the game state. */
  summary: z.string().min(3),
  /** Problems, most urgent first (render trims to the top few). */
  problems: z.array(z.object({
    issue: z.string().min(3),
    evidence: z.string().catch(''),
  })).catch([]),
  /** Adjustments, most impactful first (render trims to the top few). */
  adjustments: z.array(Adjustment).catch([]),
  /** One drill for next training. */
  drill: Drill.optional(),
  /** Sources cited from the RAG corpus (titles). */
  grounding: z.array(z.string()).catch([]),
  /** Model self-rated confidence 1–5; low values prompt "gather more info". */
  confidence: z.coerce.number().int().min(1).max(5).catch(3),
});

/** @typedef {z.infer<typeof TacticalSignal>} TacticalSignalT */
/** @typedef {z.infer<typeof HalftimeCard>} HalftimeCardT */
