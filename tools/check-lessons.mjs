// Verifies every lesson: FENs load, lines are legal, and each "find" answer is (near-)best per Stockfish.
// Run: node tools/check-lessons.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Chess } from '../vendor/chess.js';
import { ALL_LESSONS } from '../js/lessons-data.js';

const sf = spawn(process.execPath, [fileURLToPath(new URL('../vendor/stockfish.js', import.meta.url))]);
let buf = '', waiter = null;
sf.stdout.on('data', d => { buf += d; const i = buf.lastIndexOf('bestmove'); if (waiter && i >= 0 && buf.indexOf('\n', i) >= 0) { const b = buf; buf = ''; waiter(b); } });
const go = fen => new Promise(res => { waiter = res; sf.stdin.write(`position fen ${fen}\ngo depth 16\n`); });
// score for the side to move, in centipawns (mate = +-100000)
async function score(fen) {
  const c = new Chess(fen);
  if (c.isCheckmate()) return -100000;
  if (c.isDraw()) return 0;
  const out = await go(fen);
  const last = out.split('\n').filter(l => l.includes(' score ')).at(-1);
  const m = last.match(/score (cp|mate) (-?\d+)/);
  return m[1] === 'mate' ? Math.sign(+m[2]) * (100000 - Math.abs(+m[2])) : +m[2];
}

const START = new Chess().fen();
const fenOf = s => { if (s.fen) return s.fen; const c = new Chess(); for (const mv of s.pgn.split(' ')) c.move(mv); return c.fen(); };
const strip = s => s.replace(/[+#]/g, '');
let problems = 0;
const fail = (where, msg) => { problems++; console.log(`FAIL ${where}: ${msg}`); };

for (const lesson of ALL_LESSONS) {
  for (const [i, s] of lesson.steps.entries()) {
    const where = `${lesson.id}#${i + 1}`;
    let fen;
    try { fen = fenOf(s); new Chess(fen); } catch (e) { fail(where, 'bad position: ' + e.message); continue; }
    if (s.line) {
      const c = new Chess(fen === START ? undefined : fen);
      for (const [san] of s.line) { try { c.move(san); } catch { fail(where, `illegal line move ${san}`); break; } }
      continue;
    }
    if (!s.answer) continue;
    const c = new Chess(fen);
    const legal = c.moves();
    if (s.answer === 'mate') {
      if (!legal.some(m => m.endsWith('#'))) fail(where, 'no mate in 1 exists');
      continue;
    }
    // best = what the side to move gets with perfect play
    const best = await score(fen);
    for (const a of s.answer) {
      const san = legal.find(m => strip(m) === strip(a));
      if (!san) { fail(where, `answer ${a} is illegal (legal: ${legal.join(' ')})`); continue; }
      const c2 = new Chess(fen); c2.move(san);
      const got = -(await score(c2.fen()));
      if (best - got > 80 && !(best > 900 && got > 900)) fail(where, `${a} scores ${got} but best is ${best}`);
    }
  }
}
sf.kill();
console.log(problems ? `${problems} problem(s)` : `All ${ALL_LESSONS.length} lessons OK`);
process.exit(problems ? 1 : 0);
