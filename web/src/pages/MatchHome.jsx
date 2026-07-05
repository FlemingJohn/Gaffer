import { ScoreBar } from '../components/common.jsx';
import { TEAM, MATCH } from '../data/sample.js';

export default function MatchHome({ onRecord }) {
  return (
    <div className="screen">
      <ScoreBar match={MATCH} />

      <div className="status-row">
        <span className="chip">
          <span className="dot" /> {TEAM.adapterActive ? 'Team adapter loaded' : 'Base model'}
        </span>
        <span className="chip"><span className="dot" /> 9 tactics · laws</span>
      </div>

      <div className="mic-wrap">
        <button className="mic" onClick={onRecord}>
          <span className="glyph">◉</span>
          Hold to speak
        </button>
        <p className="mic-caption">Tap and tell me what you're seeing on the pitch.</p>
      </div>
    </div>
  );
}
