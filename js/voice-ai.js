// Free natural-sounding voices: Piper neural TTS (via vits-web + onnxruntime-web), running on the device.
// Each voice model (~60 MB) downloads once from Hugging Face and is cached in the browser (OPFS).
import { workerClient } from './voice-worker.js';

// [id, label, hd]: HD models sound smoother but are about twice the download (~110 MB) and slower on phones.
export const AI_VOICES = [
  ['en_US-ryan-high', 'Ryan HD · US man', true],
  ['en_US-lessac-high', 'Lessac HD · US woman', true],
  ['en_GB-cori-high', 'Cori HD · British woman', true],
  ['en_US-ljspeech-high', 'Linda HD · US woman', true],
  ['en_US-ryan-medium', 'Ryan · US man'],
  ['en_US-joe-medium', 'Joe · US man'],
  ['en_US-hfc_male-medium', 'Hank · US man'],
  ['en_GB-alan-medium', 'Alan · British man'],
  ['en_GB-northern_english_male-medium', 'Ned · Northern English man'],
  ['en_US-lessac-medium', 'Lessac · US woman'],
  ['en_US-amy-medium', 'Amy · US woman'],
  ['en_US-kristin-medium', 'Kristin · US woman'],
  ['en_US-hfc_female-medium', 'Holly · US woman'],
  ['en_GB-jenny_dioco-medium', 'Jenny · British woman'],
];

const call = workerClient(new URL('./piper-worker.js', import.meta.url));
export const dropPiper = () => call.drop();
const downloads = {};

// Download the model once; onProgress(0..1) is called while it downloads.
export function ensureVoice(id, onProgress) {
  return (downloads[id] ??= call({ voice: id, keep: true }, onProgress).catch(e => { delete downloads[id]; throw e; }));
}

// A WAV blob; the worker runs one job at a time.
export const synth = (text, id, keep = false) => call({ text, voice: id, keep });
