import { useEffect, useRef, useState } from 'react';
import { SignalChip } from './common.jsx';
import { IconBall, IconStop } from './icons.jsx';
import { TRANSCRIPT, SIGNALS, CARD } from '../data/sample.js';
import { startRecording } from '../lib/recorder.js';
import { transcribe, session } from '../lib/api.js';

// Listening overlay. When the bridge is reachable and the mic is granted, it
// records → transcribes (Whisper) → gets a card (session). Otherwise it falls
// back to a scripted simulation so the UI still demos without the server.
export default function CaptureOverlay({ online, onCancel, onDone }) {
  const [phase, setPhase] = useState('recording'); // recording | transcribing | thinking | error
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [signals, setSignals] = useState([]);
  const [err, setErr] = useState('');
  const recRef = useRef(null);
  const simRef = useRef(false);

  useEffect(() => {
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    let typer;
    (async () => {
      if (online) {
        try {
          recRef.current = await startRecording();
          return;
        } catch {
          /* mic denied → simulate */
        }
      }
      simRef.current = true;
      let i = 0;
      typer = setInterval(() => {
        i += 2;
        setTranscript(TRANSCRIPT.slice(0, i));
        if (i >= TRANSCRIPT.length) clearInterval(typer);
      }, 45);
    })();
    return () => {
      clearInterval(clock);
      if (typer) clearInterval(typer);
    };
  }, [online]);

  async function handleStop() {
    // Simulated path: reveal sample signals, hand back the sample card.
    if (simRef.current || !recRef.current) {
      setSignals(SIGNALS);
      setPhase('thinking');
      setTimeout(() => onDone(CARD), 500);
      return;
    }
    // Real path: stop → transcribe → session.
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
  const statusText = {
    recording: online && !simRef.current ? 'listening…' : 'listening… (demo)',
    transcribing: 'transcribing on-device…',
    thinking: 'reading the game…',
    error: 'that didn’t work',
  }[phase];

  return (
    <div className="overlay">
      <div className="topbar" style={{ borderBottom: '1px solid var(--line)', padding: '4px 0 14px' }}>
        <span className="brand"><IconBall width={20} height={20} /><span className="mark">GAFFER</span></span>
        <span className="offline" style={{ color: 'var(--red-card)', borderColor: 'var(--red-card)' }}>
          <span className="dot" style={{ background: 'var(--red-card)' }} /> REC <span className="data">{mmss}</span>
        </span>
      </div>

      {phase === 'recording' && (
        <div className="wave" aria-hidden>
          {Array.from({ length: 13 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 6) * 0.1}s` }} />
          ))}
        </div>
      )}
      <div style={{ textAlign: 'center', color: 'var(--chalk-dim)' }}>{statusText}</div>

      {transcript && <p className="transcript">“{transcript}{phase === 'recording' && <span style={{ opacity: 0.4 }}>▍</span>}”</p>}

      <div className="status-row" style={{ flexDirection: 'column' }}>
        {signals.map((s) => (
          <SignalChip key={s.pattern} signal={s} />
        ))}
      </div>

      {err && <p style={{ color: 'var(--red-card)' }}>{err}</p>}

      <div style={{ marginTop: 'auto' }} className="btn-row">
        <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-primary icon-btn" onClick={handleStop} disabled={busy}>
          {busy ? 'Working…' : (<><IconStop /> Stop &amp; advise</>)}
        </button>
      </div>
    </div>
  );
}
