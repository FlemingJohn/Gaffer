// Capture microphone audio as a 16 kHz mono 16-bit WAV Blob — the format the
// engine's Whisper expects. Uses the Web Audio API (works offline in-browser);
// downsamples from the device rate to 16 kHz on stop.

function merge(buffers) {
  let len = 0;
  for (const b of buffers) len += b.length;
  const out = new Float32Array(len);
  let o = 0;
  for (const b of buffers) { out.set(b, o); o += b.length; }
  return out;
}

function downsample(data, inRate, outRate) {
  if (outRate >= inRate) return data;
  const ratio = inRate / outRate;
  const outLen = Math.floor(data.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), data.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += data[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/** Start recording. Returns { stop } → resolves to a WAV Blob (16 kHz mono). */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const buffers = [];
  let recording = true;

  proc.onaudioprocess = (e) => {
    if (!recording) return;
    buffers.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
  source.connect(proc);
  proc.connect(ctx.destination);

  async function stop() {
    recording = false;
    proc.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    const inRate = ctx.sampleRate;
    await ctx.close();
    return encodeWav(downsample(merge(buffers), inRate, 16000), 16000);
  }

  return { stop };
}
