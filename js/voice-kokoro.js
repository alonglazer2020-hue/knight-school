// Kokoro: the most natural free voices, a neural TTS model that runs on your device (kokoro-js, Apache-2.0).
// The model (~90 MB) downloads once from Hugging Face and the browser caches it; the engine loads from jsDelivr.
const LIB = '../vendor/kokoro/kokoro.web.js';
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';

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

let tts = null;
// Load the model once; onProgress(0..1) while it downloads.
export function ensureKokoro(onProgress) {
  tts ??= (async () => {
    const { KokoroTTS } = await import(LIB);
    const files = {};
    return KokoroTTS.from_pretrained(MODEL, {
      dtype: 'q8', device: 'wasm',
      progress_callback: p => {
        if (p.status !== 'progress' || !p.total) return;
        files[p.file] = [p.loaded, p.total];
        const [l, t] = Object.values(files).reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
        onProgress?.(l / t);
      },
    });
  })().catch(e => { tts = null; throw e; });
  return tts;
}

// One synthesis at a time; returns a WAV blob.
let queue = Promise.resolve();
export function synthKokoro(text, voice) {
  const job = queue.then(async () => (await (await ensureKokoro()).generate(text, { voice })).toBlob());
  queue = job.catch(() => {});
  return job;
}
