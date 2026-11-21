// Free natural-sounding voices: Piper neural TTS (via vits-web + onnxruntime-web), running on the device.
// Each voice model (~60 MB) downloads once from Hugging Face and is cached in the browser (OPFS).
const LIB = '../vendor/vits/vits-web.js?v=3'; // patched copy: loads each voice model once

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

let lib = null;
const load = () => (lib ??= import(LIB).catch(e => { lib = null; throw e; }));
const downloads = {};

// Download the model once; onProgress(0..1) is called while it downloads.
export function ensureVoice(id, onProgress) {
  downloads[id] ??= (async () => {
    const t = await load();
    if ((await t.stored()).includes(id)) return;
    await t.download(id, p => p.total && onProgress?.(p.loaded / p.total));
  })().catch(e => { delete downloads[id]; throw e; });
  return downloads[id];
}

// One synthesis at a time: the ONNX session can't run two inferences at once.
let queue = Promise.resolve();
export function synth(text, id) {
  // A model read right after its first download can fail once; the retry reads the finished file.
  const run = async () => (await load()).predict({ text, voiceId: id }); // WAV blob
  const job = queue.then(() => run().catch(() => new Promise(r => setTimeout(r, 400)).then(run)));
  queue = job.catch(() => {});
  return job;
}
