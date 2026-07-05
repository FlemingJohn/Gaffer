// Client for the local bridge server (proxied at /api by Vite). Every call is
// on-device; if the bridge isn't running, callers fall back to sample data.

const BASE = '/api';

export async function health() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export async function session(observation) {
  const r = await fetch(`${BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observation }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `session ${r.status}`);
  return r.json();
}

export async function transcribe(wavBlob) {
  const r = await fetch(`${BASE}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wavBlob,
  });
  if (!r.ok) throw new Error(`transcribe ${r.status}`);
  return (await r.json()).transcript;
}

export async function tts(text) {
  const r = await fetch(`${BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`tts ${r.status}`);
  return r.blob();
}
