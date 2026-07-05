import { useEffect, useRef, useState } from 'react';
import { SignalChip } from './common.jsx';
import { IconBall, IconStop } from './icons.jsx';
import { startRecording } from '../lib/recorder.js';
import { transcribe, session } from '../lib/api.js';

// Real capture only — record → Whisper → session. If the engine bridge is
// offline it says so; it never fabricates a card. No mock data.
export default function CaptureOverlay({ online, onCancel, onDone }) {
  const [phase, setPhase] = useState(online ? 'recording' : 'offline'); // recording | transcribing | thinking | error | offline
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [signals, setSignals] = useState([]);
  const [err, setErr] = useState('');
  const recRef = useRef(null);

  useEffect(() => {
    if (!online) {
      setPhase('offline');
      return undefined;
    }
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    (async () => {
      try {
        recRef.current = await startRecording();
      } catch {
        setErr('Microphone blocked — allow mic access and try again.');
        setPhase('error');
      }
    })();
    return () => clearInterval(clock);
  }, [online]);

  async function handleStop() {
    if (!recRef.current) return;
    try {
      setPhase('transcribing');
      const wav = await recRef.current.stop();
      const text = await transcribe(wav);
      setTranscript(text);
      setPhase('thinking');
      const result = await session(text);
      setSignals(result.signals || []);
      onDone(result.card);
    } catch (e) {
      setErr(e.message || 'Something went wrong');
      setPhase('error');
    }
  }

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const busy = phase === 'transcribing' || phase === 'thinking';
  const status = {
    recording: 'listening…',
    transcribing: 'transcribing on-device…',
    thinking: 'reading the game…',
    error: 'that didn’t work',
    offline: 'engine offline',
  }[phase];

  return (
    <div className="overlay">
      <div className="topbar" style={{ borderBottom: '1px solid var(--line)', padding: '4px 0 14px' }}>
        <span className="brand"><IconBall width={20} height={20} /><span className="mark">GAFFER</span></span>
        {phase !== 'offline' && (
          <span className="offline" style={{ color: 'var(--red-card)', borderColor: 'var(--red-card)' }}>
            <span className="dot" style={{ background: 'var(--red-card)' }} /> REC <span className="data">{mmss}</span>
          </span>
        )}
      </div>

      {phase === 'offline' ? (
        <div style={{ margin: 'auto 0', textAlign: 'center', color: 'var(--chalk-dim)' }}>
          <p style={{ color: 'var(--chalk)', fontWeight: 600 }}>The coaching engine isn’t running.</p>
          <p>Start it on your machine to get real advice:</p>
          <p><code style={{ color: 'var(--volt)' }}>npm run server</code></p>
        </div>
      ) : (
        <>
          {phase === 'recording' && (
            <div className="wave" aria-hidden>
              {Array.from({ length: 13 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${(i % 6) * 0.1}s` }} />
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', color: 'var(--chalk-dim)' }}>{status}</div>
          {transcript && <p className="transcript">“{transcript}”</p>}
          <div className="status-row" style={{ flexDirection: 'column' }}>
            {signals.map((s, i) => (
              <SignalChip key={`${s.pattern}-${i}`} signal={s} />
            ))}
          </div>
          {err && <p style={{ color: 'var(--red-card)' }}>{err}</p>}
        </>
      )}

      <div style={{ marginTop: 'auto' }} className="btn-row">
        <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        {phase !== 'offline' && phase !== 'error' && (
          <button className="btn btn-primary icon-btn" onClick={handleStop} disabled={busy}>
            {busy ? 'Working…' : (<><IconStop /> Stop &amp; advise</>)}
          </button>
        )}
      </div>
    </div>
  );
}
