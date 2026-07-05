import { useState } from 'react';
import { useGaffer } from '../lib/store.js';
import { FORMATION_KEYS, formationLabel } from '../data/formations.js';

export default function TeamPage() {
  const { team, addPlayer, removePlayer, setFormation, setTeamName } = useGaffer();
  const [name, setName] = useState('');
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  function submit(e) {
    e.preventDefault();
    addPlayer(name);
    setName('');
  }

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
      <label className="field">
        <span className="field-label">Team name</span>
        <input
          className="team-name-input"
          value={team.name}
          onChange={(e) => setTeamName(e.target.value)}
          maxLength={40}
        />
      </label>

      <div>
        <span className="eyebrow">Squad · {team.squad.length}</span>
        <div className="squad-list" style={{ marginTop: 8 }}>
          {team.squad.map((p, i) => (
            <span className="squad-chip" key={p}>
              <span className="squad-num data">{i + 1}</span>
              {p}
              <button className="squad-x" onClick={() => removePlayer(p)} aria-label={`remove ${p}`}>×</button>
            </span>
          ))}
        </div>
        <form className="squad-add" onSubmit={submit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a player…"
            maxLength={24}
          />
          <button className="btn btn-outline" type="submit" disabled={!name.trim()}>Add</button>
        </form>
        <p className="squad-hint">Order = position (1 GK, then back line, midfield, forwards). This is how the board places names.</p>
      </div>

      <div>
        <span className="eyebrow">Usual shape</span>
        <div className="formation-tabs">
          {FORMATION_KEYS.map((k) => (
            <button key={k} className={`ftab ${k === team.formation ? 'on' : ''}`} onClick={() => setFormation(k)}>
              {formationLabel(k)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="eyebrow">Season memory · {team.seasonNotes} notes</span>
        <div className="meter" style={{ marginTop: 8 }}>
          <i style={{ width: `${Math.min(team.seasonNotes * 7, 100)}%` }} />
        </div>
      </div>

      <button className="btn btn-primary train-cta" onClick={train} disabled={training}>
        {training ? `Training… ${progress}%` : 'Train Gaffer on your season'}
        <span className="sub">{training ? 'on-device · nothing leaves the phone' : '~30 min · on-device'}</span>
      </button>
    </div>
  );
}
