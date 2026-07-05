import { useState } from 'react';
import HalfTimeCard from '../components/HalfTimeCard.jsx';
import TacticsBoard from '../components/TacticsBoard.jsx';
import { CARD } from '../data/sample.js';
import { FORMATION_KEYS, formationLabel } from '../data/formations.js';

// Illustrative squad mapping for the diamond (role#index → name).
const DIAMOND_NAMES = {
  'LB#1': 'Tom', 'CB#2': 'Sam', 'CB#3': 'Daniel', 'RB#4': 'Kai',
  'DM#5': 'Marcus', 'CM#6': 'Aisha', 'AM#8': 'Leo', 'ST#9': 'Ben',
};

export default function CardPage({ onBack }) {
  const [formation, setFormation] = useState('4-4-2-diamond');
  const isDiamond = formation === '4-4-2-diamond';

  return (
    <div className="screen">
      <div className="section-title">
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }} onClick={onBack}>◀ Back</button>
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }}>🔊 Read aloud</button>
      </div>

      <HalfTimeCard card={CARD} />

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
        <TacticsBoard
          formation={formation}
          title={formationLabel(formation)}
          names={isDiamond ? DIAMOND_NAMES : {}}
          arrows={isDiamond ? [{ from: 8, to: 5 }] : []}
        />
      </div>

      <div className="btn-row">
        <button className="btn btn-outline" onClick={onBack}>↺ Re-ask</button>
        <button className="btn btn-primary" onClick={onBack}>✓ Done</button>
      </div>
    </div>
  );
}
