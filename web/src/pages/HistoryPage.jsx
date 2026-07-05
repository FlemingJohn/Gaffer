import { HISTORY } from '../data/sample.js';

export default function HistoryPage() {
  return (
    <div className="screen">
      <div className="section-title">
        <h1 className="display" style={{ fontSize: 26 }}>History</h1>
      </div>
      <span className="eyebrow">This season</span>
      {HISTORY.map((m, i) => (
        <div className="fixture" key={i}>
          <span className={`result ${m.result}`}>{m.result.toUpperCase()}</span>
          <span>
            <div style={{ fontWeight: 600 }}>vs {m.opp}</div>
            <div style={{ color: 'var(--chalk-dim)', fontSize: 13 }}>{m.date}</div>
          </span>
          <span className="data" style={{ fontSize: 20, fontWeight: 700 }}>{m.score}</span>
        </div>
      ))}
    </div>
  );
}
