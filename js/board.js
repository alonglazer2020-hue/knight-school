// Board = chessground (the Lichess board UI) kept in sync with chess.js (the rules).
import { Chessground } from '../vendor/chessground.js';
import { Chess } from '../vendor/chess.js';
import { moveSound } from './coach.js';

export const colorName = c => (c === 'w' ? 'white' : 'black');

function dests(chess) {
  const d = new Map();
  for (const m of chess.moves({ verbose: true })) {
    if (!d.has(m.from)) d.set(m.from, []);
    d.get(m.from).push(m.to);
  }
  return d;
}

import { toMoveArg } from './chessutil.js';
export { uciOf, toMoveArg } from './chessutil.js';

export class Board {
  constructor(el, { onMove } = {}) {
    this.chess = new Chess();
    this.onMove = onMove;
    this.interactive = false;
    this.lastMove = undefined;
    this.cg = Chessground(el, {
      coordinates: true,
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: true, check: true },
      movable: { free: false, showDests: true, events: { after: (o, d) => this.userMove(o, d) } },
      premovable: { enabled: false },
      draggable: { showGhost: true },
      drawable: { enabled: true, visible: true },
    });
  }

  load(fen, { orientation, lastMove, interactive = true } = {}) {
    this.chess.load(fen);
    this.interactive = interactive;
    this.lastMove = lastMove;
    if (orientation) this.cg.set({ orientation });
    this.sync();
  }

  sync() {
    const c = this.chess, turn = colorName(c.turn());
    this.cg.set({
      fen: c.fen(),
      turnColor: turn,
      check: c.inCheck() ? turn : false,
      lastMove: this.lastMove,
      movable: { color: this.interactive ? turn : undefined, dests: this.interactive ? dests(c) : new Map() },
    });
    this.cg.setAutoShapes([]);
  }

  userMove(from, to) {
    let m;
    // shortcut: always promotes to a queen; add a picker if underpromotion lessons are ever needed
    try { m = this.chess.move({ from, to, promotion: 'q' }); } catch { return this.sync(); }
    this.lastMove = [from, to];
    this.sync();
    moveSound(m, this.chess);
    this.onMove?.(m);
  }

  play(mv) {
    const m = this.chess.move(toMoveArg(mv));
    this.lastMove = [m.from, m.to];
    this.sync();
    moveSound(m, this.chess);
    return m;
  }

  undo() {
    this.chess.undo();
    const h = this.chess.history({ verbose: true }).at(-1);
    this.lastMove = h ? [h.from, h.to] : undefined;
    this.sync();
  }

  setInteractive(on) { this.interactive = on; this.sync(); }
  shapes(list) { this.cg.setAutoShapes(list); }
  flip() { this.cg.toggleOrientation(); }
}

// Arrow/circle helpers: arrow('e2e4'), circle('f7')
export const arrow = (uci, brush = 'green') => ({ orig: uci.slice(0, 2), dest: uci.slice(2, 4), brush });
export const circle = (sq, brush = 'green') => ({ orig: sq, brush });
