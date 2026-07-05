import { useEffect, useState } from 'react';
import { SignalChip } from './common.jsx';
import { TRANSCRIPT, SIGNALS } from '../data/sample.js';

// The listening overlay: mimics ASR streaming — transcript types in, then
// signals appear, then it hands off to the card. Purely front-end simulation
// here; wired to the engine's transcribe/extract stream later.
export default function CaptureOverlay({ onDone, onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    let i = 0;
    const typer = setInterval(() => {
      i += 2;
      setTyped(TRANSCRIPT.slice(0, i));
      if (i >= TRANSCRIPT.length) clearInterval(typer);
    }, 45);
    return () => {
      clearInterval(clock);
      clearInterval(typer);
    };
  }, []);

  useEffect(() => {
    if (typed.length >= TRANSCRIPT.length) {
      const t = setInterval(() => setRevealed((r) => Math.min(r + 1, SIGNALS.length)), 500);
      return () => clearInterval(t);
    }
  }, [typed]);

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="overlay">
      <div className="topbar" style={{ borderBottom: '1px solid var(--line)', padding: '4px 0 14px' }}>
        <span className="brand"><span className="mark">⚽ GAFFER</span></span>
        <span className="offline" style={{ color: 'var(--red-card)', borderColor: 'var(--red-card)' }}>
          <span className="dot" style={{ background: 'var(--red-card)' }} /> REC <span className="data">{mmss}</span>
        </span>
      </div>

      <div className="wave" aria-hidden>
        {Array.from({ length: 13 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${(i % 6) * 0.1}s` }} />
        ))}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--chalk-dim)' }}>listening…</div>

      <p className="transcript">“{typed}<span style={{ opacity: 0.4 }}>▍</span>”</p>

      <div className="status-row" style={{ flexDirection: 'column' }}>
        {SIGNALS.slice(0, revealed).map((s) => (
          <SignalChip key={s.pattern} signal={s} />
        ))}
      </div>

      <div style={{ marginTop: 'auto' }} className="btn-row">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onDone}>■ Stop &amp; advise</button>
      </div>
    </div>
  );
}
