import { ScoreBar } from '../components/common.jsx';
import { IconMic } from '../components/icons.jsx';
import { useGaffer } from '../lib/store.js';

const PHASES = ['1st half', 'Half-time', '2nd half', 'Full-time'];

export default function MatchHome({ onRecord }) {
  const { team, match, setPhase, bumpScore } = useGaffer();

  return (
    <div className="screen">
      <ScoreBar match={match} />

      {/* the coach sets score + phase — the app doesn't guess them */}
      <div className="score-controls">
        <div className="stepper">
          <button onClick={() => bumpScore('home', -1)} aria-label="home minus">−</button>
          <span>{match.home}</span>
          <button onClick={() => bumpScore('home', 1)} aria-label="home plus">+</button>
        </div>
        <div className="stepper">
          <button onClick={() => bumpScore('away', -1)} aria-label="away minus">−</button>
          <span>{match.away}</span>
          <button onClick={() => bumpScore('away', 1)} aria-label="away plus">+</button>
        </div>
      </div>

      <div className="phase-tabs">
        {PHASES.map((p) => (
          <button key={p} className={`ftab ${p === match.phase ? 'on' : ''}`} onClick={() => setPhase(p)}>
            {p}
          </button>
        ))}
      </div>

      <div className="status-row">
        <span className="chip"><span className="dot" /> {team.adapterActive ? 'Team adapter loaded' : 'Base model'}</span>
        <span className="chip"><span className="dot" /> {team.squad.length} players</span>
      </div>

      <div className="mic-wrap">
        <button className="mic" onClick={onRecord}>
          <span className="glyph"><IconMic /></span>
          Hold to speak
        </button>
        <p className="mic-caption">Tap and tell me what you're seeing on the pitch.</p>
      </div>
    </div>
  );
}
