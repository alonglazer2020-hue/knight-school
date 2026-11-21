// Runs the review pipeline on known games with real Stockfish and asserts the obvious verdicts.
// Run: node tools/check-analysis.mjs
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { parseGame, buildReview, terminalEval } from '../js/analysis.js';

const sf = spawn(process.execPath, [fileURLToPath(new URL('../vendor/stockfish.js', import.meta.url))]);
let buf = '', waiter = null;
sf.stdout.on('data', d => { buf += d; const i = buf.lastIndexOf('bestmove'); if (waiter && i >= 0 && buf.indexOf('\n', i) >= 0) { const b = buf; buf = ''; waiter(b); } });
sf.stdin.write('setoption name MultiPV value 2\n');
// Same parsing as js/engine.js, reading stdout instead of worker messages.
function analyse(fen) {
  return new Promise(res => {
    waiter = out => {
      const lines = [];
      for (const l of out.split('\n')) {
        if (!l.startsWith('info') || !l.includes(' pv ') || l.includes('bound')) continue;
        const k = +(l.match(/ multipv (\d+)/)?.[1] ?? 1) - 1;
        const cp = l.match(/ score cp (-?\d+)/), mate = l.match(/ score mate (-?\d+)/);
        lines[k] = { cp: cp ? +cp[1] : null, mate: mate ? +mate[1] : null, pv: l.split(' pv ')[1].trim().split(' ') };
      }
      const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
      for (const x of lines) if (x) { if (x.cp != null) x.cp *= sign; if (x.mate != null) x.mate *= sign; }
      const best = out.match(/bestmove (\S+)/)[1];
      res({ best: best === '(none)' ? null : best, lines: lines.filter(Boolean) });
    };
    sf.stdin.write(`position fen ${fen}\ngo depth 14\n`);
  });
}
const openings = JSON.parse(readFileSync(new URL('../vendor/openings.json', import.meta.url)));

async function run(pgn, myColor) {
  const g = parseGame(pgn);
  const evals = [];
  for (const f of g.fens) evals.push(terminalEval(f) ?? await analyse(f));
  return buildReview(g, evals, myColor, openings);
}

// Blackburne Shilling trap: White takes the bait and gets mated.
const r1 = await run('1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3# 0-1', 'w');
for (const p of r1.plies) console.log(p.color, p.san.padEnd(6), p.cls.padEnd(10), p.tag ?? '', '|', p.note);
console.log('accuracy', r1.accuracy, 'opening', r1.opening);
const by = san => r1.plies.find(p => p.san === san);
assert.equal(r1.plies[0].cls, 'book');
assert.ok(['mistake', 'blunder', 'miss'].includes(by('Nxf7').cls), 'Nxf7 should be bad');
assert.ok(['mistake', 'blunder'].includes(by('Be2').cls), 'Be2 allows mate');
assert.equal(by('Be2').tag, 'allowed-mate');
assert.ok(['best', 'great', 'brilliant'].includes(by('Nf3#').cls));
assert.ok(r1.accuracy.b > r1.accuracy.w);
// The coach says why: what is lost, and what a good move does.
assert.match(by('Nxf7').note, /you lose a rook/);
assert.match(by('Nf3#').note, /checkmate/);
assert.ok(by('Nxf7').line.length > 0, 'keeps the line after the move for "Show why"');

// Hanging the queen
const r2 = await run('1. e4 e5 2. Qh5 Nc6 3. Qxe5+ Nxe5 *', 'w');
const q = r2.plies.find(p => p.san === 'Qxe5+');
console.log(q.cls, q.tag, q.note);
assert.equal(q.cls, 'blunder');
assert.equal(q.tag, 'hung');

sf.kill();
console.log('analysis checks passed');
