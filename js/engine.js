// Stockfish 17.1 (lite, single-threaded WASM) in a Web Worker. Jobs run one at a time.
// analyse() returns scores from WHITE's point of view: { best, lines: [{ cp, mate, pv: [uci...] }] }
let worker = null, ready = null, chain = Promise.resolve(), gen = 0;

function send(cmd) { worker.postMessage(cmd); }
function waitFor(prefix, onLine) {
  return new Promise(resolve => {
    const h = e => {
      const line = String(e.data);
      onLine?.(line);
      if (line.startsWith(prefix)) { worker.removeEventListener('message', h); resolve(line); }
    };
    worker.addEventListener('message', h);
  });
}
function init() {
  ready ??= (async () => {
    worker = new Worker('vendor/stockfish.js');
    let p = waitFor('uciok'); send('uci'); await p;
    send('setoption name Hash value 32');
    p = waitFor('readyok'); send('isready'); await p;
  })();
  return ready;
}

export function analyse(fen, { depth = 14, multipv = 1 } = {}) {
  const myGen = gen;
  const job = chain.then(async () => {
    if (myGen !== gen) return null; // cancelled while queued
    await init();
    const lines = [];
    send(`setoption name MultiPV value ${multipv}`);
    send(`position fen ${fen}`);
    const done = waitFor('bestmove', l => {
      if (!l.startsWith('info') || !l.includes(' pv ') || l.includes('bound')) return;
      const k = +(l.match(/ multipv (\d+)/)?.[1] ?? 1) - 1;
      const cp = l.match(/ score cp (-?\d+)/), mate = l.match(/ score mate (-?\d+)/);
      lines[k] = { cp: cp ? +cp[1] : null, mate: mate ? +mate[1] : null, pv: l.split(' pv ')[1].trim().split(' ') };
    });
    send(`go depth ${depth}`);
    const best = (await done).split(' ')[1];
    const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
    for (const x of lines) if (x) { if (x.cp != null) x.cp *= sign; if (x.mate != null) x.mate *= sign; }
    return { best: best === '(none)' ? null : best, lines: lines.filter(Boolean) };
  });
  chain = job.catch(() => {});
  return job;
}

// Drop queued jobs and stop the running search (its result comes back early; callers ignore stale results).
export function cancel() { gen++; if (worker) send('stop'); }

// Win chance (0-100) for White, Lichess's formula.
export function winPct(line) {
  if (!line) return 50;
  if (line.mate != null) return line.mate > 0 ? 100 : line.mate < 0 ? 0 : 50;
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * line.cp)) - 1);
}
