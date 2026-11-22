// Lesson-writing helper: for each FEN, Stockfish's top 3 moves with scores (side to move's view).
// A good "find" step has one move far ahead of the rest. Run: node tools/probe.mjs "<fen>" ["<fen>" ...]
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Chess } from '../vendor/chess.js';
import { toMoveArg } from '../js/chessutil.js';

const sf = spawn(process.execPath, [fileURLToPath(new URL('../vendor/stockfish.js', import.meta.url))]);
let buf = '', waiter = null;
sf.stdout.on('data', d => { buf += d; const i = buf.lastIndexOf('bestmove'); if (waiter && i >= 0 && buf.indexOf('\n', i) >= 0) { const b = buf; buf = ''; waiter(b); } });
sf.stdin.write('setoption name MultiPV value 3\n');
for (const fen of process.argv.slice(2)) {
  try { new Chess(fen); } catch (e) { console.log(`BAD ${fen}: ${e.message}`); continue; }
  const out = await new Promise(res => { waiter = res; sf.stdin.write(`position fen ${fen}\ngo depth 18\n`); });
  const lines = [];
  for (const l of out.split('\n')) {
    if (!l.startsWith('info') || !l.includes(' pv ') || !l.includes(' depth 18 ')) continue;
    const k = +(l.match(/ multipv (\d+)/)?.[1] ?? 1);
    const m = l.match(/score (cp|mate) (-?\d+)/);
    const pv = l.split(' pv ')[1].trim().split(' ').slice(0, 5);
    const c = new Chess(fen), sans = [];
    for (const u of pv) { try { sans.push(c.move(toMoveArg(u)).san); } catch { break; } }
    lines[k - 1] = `${m[1] === 'mate' ? 'M' + m[2] : m[2]}  ${sans.join(' ')}`;
  }
  console.log(fen + '\n  ' + lines.filter(Boolean).join('\n  '));
}
sf.kill();
