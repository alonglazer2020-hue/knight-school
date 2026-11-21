// Talk to a voice engine that runs in a Web Worker. Voice models take seconds of CPU per sentence;
// on the page's own thread that froze clicks, scrolling and move sounds (worst on phones).
// Messages: page -> worker { id, ...msg }; worker -> page { id, progress } while working, then { id, blob } or { id, error }.
export function workerClient(url) {
  let worker = null, seq = 0;
  const pending = new Map();
  return function call(msg, onProgress) {
    if (!worker) {
      worker = new Worker(url, { type: 'module' });
      worker.onmessage = ({ data }) => {
        const p = pending.get(data.id);
        if (!p) return;
        if (data.progress != null) return p.onProgress?.(data.progress);
        pending.delete(data.id);
        if (data.error) p.reject(new Error(data.error)); else p.resolve(data.blob);
      };
      worker.onerror = e => { // the worker itself broke (engine failed to load, out of memory): fail all, start fresh next time
        for (const p of pending.values()) p.reject(new Error(e.message || 'Voice worker failed'));
        pending.clear(); worker.terminate(); worker = null;
      };
    }
    return new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject, onProgress });
      worker.postMessage({ ...msg, id });
    });
  };
}
