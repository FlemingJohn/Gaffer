// Small shared presentational pieces used across pages.

export function TopBar({ theme, onToggleTheme, right }) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="mark">⚽ GAFFER</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {right ?? (
          <span className="offline">
            <span className="dot" /> offline
          </span>
        )}
        <button className="floodswitch" onClick={onToggleTheme}>
          {theme === 'floodlit' ? '☾ Floodlit' : '☀ Daylight'}
        </button>
      </div>
    </div>
  );
}

export function ScoreBar({ match }) {
  const [h, a] = match.score.split('–');
  return (
    <div className="scorebar">
      <div className="team home">{match.home}</div>
      <div className="score data">{h}–{a}</div>
      <div className="team away">{match.away}</div>
      <div className="phase">{match.phase}</div>
    </div>
  );
}

// severity 1-3 => yellow card, 4-5 => red card
export function severityClass(sev) {
  return sev >= 4 ? 'sev-high' : 'sev-low';
}

export function SignalChip({ signal }) {
  return (
    <span className={`chip ${severityClass(signal.severity)}`}>
      <span className="dot" />
      {signal.pattern} · {signal.zone}
    </span>
  );
}

export function PlayerToken({ name }) {
  return <span className="ptoken">{name}</span>;
}

export function ConfidenceMeter({ value }) {
  return (
    <span className="pips" aria-label={`confidence ${value} of 5`}>
      {'●'.repeat(value)}
      {'○'.repeat(5 - value)}
    </span>
  );
}

export function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'match', ic: '⌂', label: 'Match' },
    { id: 'history', ic: '◷', label: 'History' },
    { id: 'team', ic: '⚙', label: 'Team' },
  ];
  return (
    <nav className="nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'active' : ''}
          onClick={() => onChange(t.id)}
        >
          <span className="ic">{t.ic}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
