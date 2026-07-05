// Flatten a Half-Time Card into a single spoken string for TTS read-back.
export function cardToSpeech(card) {
  const parts = [card.summary];
  if (card.adjustments?.length) {
    parts.push('Here are the changes.');
    card.adjustments.slice(0, 3).forEach((a, i) => parts.push(`${i + 1}. ${a.action}.`));
  }
  if (card.drill) parts.push(`For next training, work on ${card.drill.name}.`);
  return parts.join(' ');
}
