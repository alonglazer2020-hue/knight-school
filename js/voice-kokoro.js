// Kokoro: the most natural free voices, a neural TTS model that runs on your device (kokoro-js, Apache-2.0).
// The model (~90 MB) downloads once from Hugging Face and the browser caches it; the engine loads from jsDelivr.

// [id, label] — the best-rated Kokoro English voices.
export const KOKORO_VOICES = [
  ['af_heart', 'Heart · US woman'],
  ['af_bella', 'Bella · US woman'],
  ['am_michael', 'Michael · US man'],
  ['am_fenrir', 'Fenrir · US man'],
  ['am_puck', 'Puck · US man'],
  ['bf_emma', 'Emma · British woman'],
  ['bm_george', 'George · British man'],
  ['bm_fable', 'Fable · British man'],
];

// The model runs in a Web Worker (kokoro-worker.js) so the page stays clickable while it loads and speaks.
let worker = null, seq = 0, loading = null, onProgress = null;
const pending = new Map();
function call(msg) {
  if (!worker) {
    worker = new Worker(new URL('./kokoro-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.progress != null) return onProgress?.(data.progress);
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p?.reject(new Error(data.error)); else p?.resolve(data.blob);
    };
    worker.onerror = e => { // the worker itself broke (e.g. engine failed to load): fail everything, start fresh next time
      for (const p of pending.values()) p.reject(new Error(e.message || 'Voice worker failed'));
      pending.clear(); worker.terminate(); worker = null; loading = null;
    };
  }
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    worker.postMessage({ ...msg, id });
  });
}

// Load the model once; onProgress(0..1) while it downloads.
export function ensureKokoro(progress) {
  if (progress) onProgress = progress;
  return (loading ??= call({}).catch(e => { loading = null; throw e; }));
}

// Returns a WAV blob; the worker runs one job at a time.
export const synthKokoro = (text, voice) => call({ text, voice });
