// Turns Lichess chess-openings TSVs (CC0) into vendor/openings.json: { "<fen without clocks>": "ECO Name" }
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { Chess } from '../vendor/chess.js';
const dir = new URL('../vendor/', import.meta.url);
const out = {};
for (const l of 'abcde') {
  for (const line of readFileSync(new URL(`${l}.tsv`, dir), 'utf8').split('\n').slice(1)) {
    const [eco, name, pgn] = line.split('\t');
    if (!pgn) continue;
    const c = new Chess();
    c.loadPgn(pgn.trim());
    out[c.fen().split(' ').slice(0, 4).join(' ')] = `${eco} ${name}`;
  }
}
writeFileSync(new URL('openings.json', dir), JSON.stringify(out));
for (const l of 'abcde') unlinkSync(new URL(`${l}.tsv`, dir));
console.log(Object.keys(out).length, 'openings');
