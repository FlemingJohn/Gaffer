import { useMemo, useState } from 'react';
import HalfTimeCard from '../components/HalfTimeCard.jsx';
import TacticsBoard from '../components/TacticsBoard.jsx';
import { CARD } from '../data/sample.js';
import { FORMATION_KEYS, formationLabel } from '../data/formations.js';
import { IconSpeaker, IconRedo, IconCheck } from '../components/icons.jsx';
import { deriveBoard } from '../lib/board.js';
import { useGaffer } from '../lib/store.js';

export default function CardPage({ onBack, card = CARD, speak }) {
  const { team, saveMatch } = useGaffer();
  // The AI picks a formation on the card; default the board to it (fall back to
  // the team's usual shape). The tabs let you override what's rendered.
  const suggested = card.formation || team.formation;
  const [formation, setFormation] = useState(suggested);
  const board = useMemo(() => deriveBoard(card, team, formation), [card, team, formation]);
  const showTeam = formation === team.formation; // player names fit only the real shape

  return (
    <div className="screen">
      <div className="section-title">
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }} onClick={onBack}>Back</button>
        <button className="btn btn-ghost icon-btn" style={{ padding: '6px 4px' }} onClick={() => speak?.(card)}>
          <IconSpeaker /> Read aloud
        </button>
      </div>

      {/* Two panes on desktop: the card on the left, the tactics board on the right. */}
      <div className="card-panes">
        <HalfTimeCard card={card} />

        <div className="card">
          <div className="section-title">
            <span className="eyebrow">Shape &amp; movement</span>
            {card.formation && (
              <span className="suggest">Gaffer's pick · {formationLabel(card.formation)}</span>
            )}
          </div>
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
                <span key={i} className="ptoken">{a.label}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-outline icon-btn" onClick={onBack}><IconRedo /> Re-ask</button>
        <button className="btn btn-primary icon-btn" onClick={() => { saveMatch(card); onBack(); }}><IconCheck /> Save to match</button>
      </div>
    </div>
  );
}
