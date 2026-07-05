import { useState } from 'react';
import { useGaffer } from '../lib/store.js';

export default function HistoryPage() {
  const { history, addMatch, removeMatch } = useGaffer();
  const [opp, setOpp] = useState('');
  const [hs, setHs] = useState('');
  const [as, setAs] = useState('');

  function submit(e) {
    e.preventDefault();
    addMatch({ opp, homeScore: hs, awayScore: as });
    setOpp('');
    setHs('');
    setAs('');
  }

  return (
    <div className="screen">
      <div className="section-title">
        <h1 className="display" style={{ fontSize: 26 }}>History</h1>
      </div>

      <form className="match-add" onSubmit={submit}>
        <span className="eyebrow">Add a match</span>
        <div className="match-add-row">
          <input value={opp} onChange={(e) => setOpp(e.target.value)} placeholder="Opponent" maxLength={24} />
          <input className="score-in" value={hs} onChange={(e) => setHs(e.target.value)} placeholder="us" inputMode="numeric" />
          <span className="dash">–</span>
          <input className="score-in" value={as} onChange={(e) => setAs(e.target.value)} placeholder="them" inputMode="numeric" />
          <button className="btn btn-outline" type="submit" disabled={!opp.trim()}>Add</button>
        </div>
      </form>

      <span className="eyebrow">This season · {history.length}</span>
      {history.length === 0 && (
        <p style={{ color: 'var(--chalk-dim)' }}>
          No matches yet. Add one above, or finish a match (Save to match on a Half-Time Card) and it lands here.
        </p>
      )}
      {history.map((m, i) => (
        <div className="fixture" key={i}>
          <span className={`result ${m.result}`}>{m.result.toUpperCase()}</span>
          <span>
            <div style={{ fontWeight: 600 }}>vs {m.opp}</div>
            <div style={{ color: 'var(--chalk-dim)', fontSize: 13 }}>{m.date}{m.summary ? ` · ${m.summary}` : ''}</div>
          </span>
          <span className="data" style={{ fontSize: 20, fontWeight: 700 }}>{m.score}</span>
          <button className="squad-x" onClick={() => removeMatch(i)} aria-label={`remove match vs ${m.opp}`}>×</button>
        </div>
      ))}
    </div>
  );
}
