import { workerClient } from './voice-worker.js';
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
const call = workerClient(new URL('./kokoro-worker.js', import.meta.url));
let loading = null;

// Load the model once; onProgress(0..1) while it downloads.
export function ensureKokoro(onProgress) {
  return (loading ??= call({}, onProgress).catch(e => { loading = null; throw e; }));
}

// Returns a WAV blob; the worker runs one job at a time.
export const synthKokoro = (text, voice) => call({ text, voice });
