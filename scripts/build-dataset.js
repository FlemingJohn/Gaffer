/**
 * Generate the team fine-tuning dataset in the *task* format: each example is
 * an observation -> Half-Time Card JSON that names Riverside U13 players. This
 * aligns training with what the pipeline actually asks the model to produce, so
 * the LoRA adapter imprints the squad into the structured card output (rather
 * than learning a free-form style the constrained card task then discards).
 *
 *   node scripts/build-dataset.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SYS =
  'You are Gaffer, assistant coach for Riverside U13. Our squad: Tom (left-back), ' +
  'Kai (right-back), Sam and Daniel (centre-backs), Marcus and Aisha (central midfield), ' +
  'Leo (right wing), Ben (striker). At half-time you produce a Half-Time Card as JSON and ' +
  'you ALWAYS name the specific Riverside players involved.';

/** [observation, halfTimeCard] */
const EX = [
  ['They keep getting at us down our left and we are a goal down.', {
    summary: 'A goal down and overloaded on our left flank.',
    problems: [{ issue: 'Overload down our left', evidence: 'getting at us down our left' }],
    adjustments: [
      { action: 'Drop Leo to double up on their right winger', rationale: 'Make it 3-v-3 and stop the overlap', players: ['Leo'] },
      { action: 'Marcus shuttles across to cover', rationale: 'Protect the space Tom leaves when he steps out', players: ['Marcus', 'Tom'] },
    ],
    drill: { name: 'Wide recovery', focus: 'doubling up', description: 'Leo and Tom defend a 3-v-2 on the wing' },
    grounding: ['Wide overload on one flank'], confidence: 4,
  }],
  ['Their striker keeps running in behind us.', {
    summary: 'Our line is too high and they are playing in behind.',
    problems: [{ issue: 'Defensive line caught too high', evidence: 'striker running in behind' }],
    adjustments: [
      { action: 'Drop Sam and Daniel five yards', rationale: 'Defend the space behind', players: ['Sam', 'Daniel'] },
      { action: 'Marcus presses the passer', rationale: 'So the through-ball is never clean', players: ['Marcus'] },
    ],
    drill: { name: 'Line drop', focus: 'covering depth', description: 'Back four drop and recover on a trigger' },
    grounding: ['Our defensive line caught too high'], confidence: 4,
  }],
  ['We are winning the tackles but losing every loose ball after.', {
    summary: 'We win first contact then lose the second ball.',
    problems: [{ issue: 'Second balls lost in midfield', evidence: 'losing every loose ball' }],
    adjustments: [
      { action: 'Push Aisha higher to the contact point', rationale: 'Be first to the drop', players: ['Aisha'] },
      { action: 'Marcus anticipates rather than ball-watches', rationale: 'Win the loose ball before the duel', players: ['Marcus'] },
    ],
    drill: { name: 'Second-ball reaction', focus: 'anticipation', description: 'Two midfielders react to a knockdown' },
    grounding: ['Losing second balls in midfield'], confidence: 3,
  }],
  ['We are two up with twenty to go, how do we see it out?', {
    summary: 'Protect the two-goal lead.',
    problems: [{ issue: 'Need to kill the game', evidence: 'two up with twenty to go' }],
    adjustments: [
      { action: 'Two banks of four, Tom and Kai stay home', rationale: 'Force them wide, no overlaps', players: ['Tom', 'Kai'] },
      { action: 'Ben presses to screen and waste time', rationale: 'Slow their build-up', players: ['Ben'] },
    ],
    drill: { name: 'Low block', focus: 'compactness', description: 'Defend two banks of four 25 yards out' },
    grounding: ['Setting up a low block'], confidence: 4,
  }],
  ['We conceded from another corner.', {
    summary: 'Set-piece marking broke down again.',
    problems: [{ issue: 'Lost a man at a corner', evidence: 'conceded from a corner' }],
    adjustments: [
      { action: 'Sam and Daniel take the two biggest threats man-to-man', rationale: 'Clear jobs at the near and far post', players: ['Sam', 'Daniel'] },
      { action: 'Confirm Tom holds his zone at the near post', rationale: 'He drifted off his man last time', players: ['Tom'] },
    ],
    drill: { name: 'Corner jobs', focus: 'set-piece marking', description: 'Rehearse man and zone assignments' },
    grounding: ['Restart discipline on set pieces'], confidence: 4,
  }],
  ['They have gone compact and we cannot break them down.', {
    summary: 'They are compact; the space is wide.',
    problems: [{ issue: 'Forcing it through the middle', evidence: 'cannot break them down' }],
    adjustments: [
      { action: 'Switch quickly to Leo on the right', rationale: 'Attack the space on the far side', players: ['Leo'] },
      { action: 'Tom overlaps once they shift across', rationale: 'Exploit the gap on the left', players: ['Tom'] },
    ],
    drill: { name: 'Switch of play', focus: 'width', description: 'Quick diagonal to a high, wide winger' },
    grounding: ['Switching the point of attack'], confidence: 3,
  }],
  ['We are tiring and getting pushed back.', {
    summary: 'Legs are going; simplify and rest on the ball.',
    problems: [{ issue: 'Fatigue, dropping line', evidence: 'getting pushed back' }],
    adjustments: [
      { action: 'Shorten passes and keep the ball to rest', rationale: 'Lower the tempo', players: ['Marcus', 'Aisha'] },
      { action: 'Fresh legs: bring Ben in to press high', rationale: 'High-energy role buys the most', players: ['Ben'] },
    ],
    drill: { name: 'Rest in possession', focus: 'game management', description: 'Keep-ball under light pressure' },
    grounding: ['Managing a tiring team late in the game'], confidence: 3,
  }],
  ['Their winger is getting in behind Kai on our right.', {
    summary: 'Kai is caught too high on the right.',
    problems: [{ issue: 'Right side exposed', evidence: 'getting in behind Kai' }],
    adjustments: [
      { action: 'Kai tucks in and stays home', rationale: 'Deny the ball in behind', players: ['Kai'] },
      { action: 'Aisha covers the right channel', rationale: 'Double up on their winger', players: ['Aisha'] },
    ],
    drill: { name: 'Full-back recovery', focus: 'staying home', description: 'Defend the wide channel 2-v-1' },
    grounding: ['Wide overload on one flank'], confidence: 3,
  }],
  ['Ben is isolated up top and we cannot keep the ball.', {
    summary: 'Ben has no support; we lose it too quickly.',
    problems: [{ issue: 'Striker isolated', evidence: 'Ben isolated up top' }],
    adjustments: [
      { action: 'Marcus and Aisha push up to support Ben', rationale: 'Give him a runner and a link', players: ['Marcus', 'Aisha', 'Ben'] },
      { action: 'Hit Ben earlier when he peels off the last man', rationale: 'Use his movement in behind', players: ['Ben'] },
    ],
    drill: { name: 'Support the striker', focus: 'link play', description: 'Midfield runners off a held-up ball' },
    grounding: ['Defending a high opposition line'], confidence: 3,
  }],
  ['Our pressing is all over the place and leaving gaps.', {
    summary: 'Pressing is uncoordinated and opening gaps.',
    problems: [{ issue: 'Pressing without a trigger', evidence: 'leaving gaps' }],
    adjustments: [
      { action: 'Press on the trigger: Ben and Leo lead it', rationale: 'Nearest man presses, others cut lanes', players: ['Ben', 'Leo'] },
      { action: 'Marcus and Aisha shift across together', rationale: 'No gaps behind the press', players: ['Marcus', 'Aisha'] },
    ],
    drill: { name: 'Pressing triggers', focus: 'coordinated press', description: 'Press on a backward pass or heavy touch' },
    grounding: ['Pressing triggers'], confidence: 3,
  }],
];

const lines = EX.map(([obs, card]) =>
  JSON.stringify({
    messages: [
      { role: 'system', content: SYS },
      { role: 'user', content: obs },
      { role: 'assistant', content: JSON.stringify(card) },
    ],
  }),
);

const out = path.join(ROOT, 'data', 'training', 'team-season.jsonl');
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`wrote ${lines.length} examples -> data/training/team-season.jsonl`);
