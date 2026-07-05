import { useMemo, useState } from 'react';
import HalfTimeCard from '../components/HalfTimeCard.jsx';
import TacticsBoard from '../components/TacticsBoard.jsx';
import { CARD, TEAM } from '../data/sample.js';
import { FORMATION_KEYS, formationLabel } from '../data/formations.js';
import { deriveBoard } from '../lib/board.js';

export default function CardPage({ onBack, card = CARD, speak }) {
  // Board is derived from the card + the team's shape: formation, names, arrows.
  const board = useMemo(() => deriveBoard(card, TEAM), [card]);
  const [formation, setFormation] = useState(board.formation);
  const showTeam = formation === board.formation; // names/arrows only fit the real shape

  return (
    <div className="screen">
      <div className="section-title">
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }} onClick={onBack}>◀ Back</button>
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }} onClick={() => speak?.(card)}>🔊 Read aloud</button>
      </div>

      <HalfTimeCard card={card} />

      <div className="card">
        <span className="eyebrow">Shape &amp; movement</span>
        <div className="formation-tabs">
          {FORMATION_KEYS.map((k) => (
            <button
              key={k}
              className={`ftab ${k === formation ? 'on' : ''}`}
              onClick={() => setFormation(k)}
            >
              {formationLabel(k)}
            </button>
          ))}
        </div>
        <div className="tactics">
          <TacticsBoard
            formation={formation}
            title={formationLabel(formation)}
            names={showTeam ? board.names : {}}
            arrows={showTeam ? board.arrows : []}
          />
        </div>
        {showTeam && board.arrows.length > 0 && (
          <div className="board-key">
            {board.arrows.map((a, i) => (
              <span key={i} className="ptoken">→ {a.label}</span>
            ))}
          </div>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-outline" onClick={onBack}>↺ Re-ask</button>
        <button className="btn btn-primary" onClick={onBack}>✓ Done</button>
      </div>
    </div>
  );
}
