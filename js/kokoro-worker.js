// Runs the Kokoro voice off the main thread: loading the model and speaking take seconds of CPU,
// and on the page itself that froze every click and scroll until the coach had finished talking.
import { KokoroTTS } from '../vendor/kokoro/kokoro.web.js';

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const files = {};
let tts = null;
const load = () => (tts ??= KokoroTTS.from_pretrained(MODEL, {
  dtype: 'q8', device: 'wasm',
  progress_callback: p => {
    if (p.status !== 'progress' || !p.total) return;
    files[p.file] = [p.loaded, p.total];
    const [l, t] = Object.values(files).reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
    postMessage({ progress: l / t });
  },
}).catch(e => { tts = null; throw e; }));

// One job at a time, in order: { id, text?, voice? } -> { id, blob } (no text = just load the model).
let queue = Promise.resolve();
onmessage = ({ data: { id, text, voice } }) => {
  queue = queue.then(async () => {
    try {
      const t = await load();
      postMessage({ id, blob: text ? (await t.generate(text, { voice })).toBlob() : null });
    } catch (e) { postMessage({ id, error: String(e?.message ?? e) }); }
  });
};
