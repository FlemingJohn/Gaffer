import { useState } from 'react';
import { PlayerToken } from '../components/common.jsx';
import { TEAM } from '../data/sample.js';

export default function TeamPage() {
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  function train() {
    setTraining(true);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setTraining(false);
          return 100;
        }
        return p + 4;
      });
    }, 120);
  }

  return (
    <div className="screen">
      <div className="section-title">
        <h1 className="display" style={{ fontSize: 26 }}>{TEAM.name}</h1>
      </div>

      <div>
        <span className="eyebrow">Squad</span>
        <div className="squad" style={{ marginTop: 8 }}>
          {TEAM.squad.map((p) => (
            <PlayerToken key={p} name={p} />
          ))}
        </div>
      </div>

      <div>
        <span className="eyebrow">Season memory · {TEAM.seasonNotes} notes</span>
        <div className="meter" style={{ marginTop: 8 }}>
          <i style={{ width: `${Math.min(TEAM.seasonNotes * 7, 100)}%` }} />
        </div>
      </div>

      <button className="btn btn-primary train-cta" onClick={train} disabled={training}>
        {training ? `Training… ${progress}%` : 'Train Gaffer on your season'}
        <span className="sub">{training ? 'on-device · nothing leaves the phone' : '~30 min · on-device'}</span>
      </button>

      <div className="status-row">
        <span className="chip"><span className="dot" /> Last trained: {TEAM.lastTrained}</span>
        <span className="chip"><span className="dot" /> adapter active</span>
      </div>

      <div>
        <span className="eyebrow">Base vs your team</span>
        <div className="beforeafter" style={{ marginTop: 8 }}>
          <div>
            <div className="lbl">Before</div>
            <div>“Drop the <b>left-back</b> to double up.”</div>
          </div>
          <div className="after">
            <div className="lbl">After (learns your team)</div>
            <div>“Drop <b>Leo</b> to double up — cover for <b>Tom</b>.”</div>
          </div>
        </div>
      </div>
    </div>
  );
}
