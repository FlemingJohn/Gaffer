// Small shared presentational pieces used across pages.
import { IconBall, IconMatch, IconHistory, IconTeam } from './icons.jsx';

export function TopBar({ theme, onToggleTheme, right }) {
  return (
    <div className="topbar">
      <div className="brand">
        <IconBall width={22} height={22} />
        <span className="mark">GAFFER</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {right ?? (
          <span className="offline">
            <span className="dot" /> offline
          </span>
        )}
        <button className="floodswitch" onClick={onToggleTheme}>
          {theme === 'floodlit' ? 'Floodlit' : 'Daylight'}
        </button>
      </div>
    </div>
  );
}

export function ScoreBar({ home, match }) {
  return (
    <div className="scorebar">
      <div className="team home">{home}</div>
      <div className="score data">{match.homeScore}–{match.awayScore}</div>
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
    { id: 'match', Icon: IconMatch, label: 'Match' },
    { id: 'history', Icon: IconHistory, label: 'History' },
    { id: 'team', Icon: IconTeam, label: 'Team' },
  ];
  return (
    <nav className="nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'active' : ''}
          onClick={() => onChange(t.id)}
        >
          <span className="ic"><t.Icon /></span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
