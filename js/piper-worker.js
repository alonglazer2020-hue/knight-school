// Runs the Piper voices (vits-web) off the main thread; see voice-worker.js for the message format.
const LIB = '../vendor/vits/vits-web.js?v=3'; // patched copy: loads each voice model once

let lib = null;
const load = () => (lib ??= import(LIB).catch(e => { lib = null; throw e; }));

// One job at a time: the ONNX session can't run two inferences at once.
let queue = Promise.resolve();
let dropUpTo = 0, lastId = 0;
onmessage = ({ data }) => {
  if (data.drop) { dropUpTo = lastId; return; }
  const { id, voice, text, keep } = data;
  lastId = id;
  queue = queue.then(async () => {
    if (!keep && id <= dropUpTo) return postMessage({ id, error: 'dropped' });
    try {
      const t = await load();
      if (!text) { // download the voice model once (cached in the browser's private storage)
        if (!(await t.stored()).includes(voice)) await t.download(voice, p => p.total && postMessage({ id, progress: p.loaded / p.total }));
        return postMessage({ id, blob: null });
      }
      // A model read right after its first download can fail once; the retry reads the finished file.
      const run = () => t.predict({ text, voiceId: voice });
      postMessage({ id, blob: await run().catch(() => new Promise(r => setTimeout(r, 400)).then(run)) });
    } catch (e) { postMessage({ id, error: String(e?.message ?? e) }); }
  });
};
