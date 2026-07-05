import HalfTimeCard from '../components/HalfTimeCard.jsx';
import { CARD } from '../data/sample.js';

export default function CardPage({ onBack }) {
  return (
    <div className="screen">
      <div className="section-title">
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }} onClick={onBack}>◀ Back</button>
        <button className="btn btn-ghost" style={{ padding: '6px 4px' }}>🔊 Read aloud</button>
      </div>

      <HalfTimeCard card={CARD} />

      <div className="btn-row">
        <button className="btn btn-outline" onClick={onBack}>↺ Re-ask</button>
        <button className="btn btn-primary" onClick={onBack}>✓ Done</button>
      </div>
    </div>
  );
}
