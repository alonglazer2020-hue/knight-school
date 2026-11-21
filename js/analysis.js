// Game review logic: turns Stockfish evaluations into chess.com-style move classifications
// and plain-English coach explanations. DOM-free (tested by tools/check-analysis.mjs).
import { Chess } from '../vendor/chess.js';
import { winPct } from './engine.js';
import { uciOf, toMoveArg, epd } from './chessutil.js';

export const CLASSES = {
  // The familiar grade colours; `ink` keeps the symbol readable on each, `icon` names an icons.js icon used instead of text.
  brilliant: { label: 'Brilliant', sym: '!!', color: '#26C2A3', ink: '#0B2B24' },
  great: { label: 'Great', sym: '!', color: '#749BBF', ink: '#0F1B26' },
  best: { label: 'Best', sym: 'best', icon: 'star', color: '#81B64C', ink: '#13200A' },
  excellent: { label: 'Excellent', sym: 'ok', icon: 'check', color: '#96BC4B', ink: '#13200A' },
  good: { label: 'Good', sym: 'ok', icon: 'check', color: '#96AF8B', ink: '#13200A' },
  book: { label: 'Book', sym: 'book', icon: 'book', color: '#A88865', ink: '#1E150B' },
  inaccuracy: { label: 'Inaccuracy', sym: '?!', color: '#F7C045', ink: '#2A1F05' },
  mistake: { label: 'Mistake', sym: '?', color: '#FFA459', ink: '#2B1605' },
  miss: { label: 'Miss', sym: 'miss', icon: 'close', color: '#FF7769', ink: '#2B0B07' },
  blunder: { label: 'Blunder', sym: '??', color: '#CA3431', ink: '#FFFFFF' },
};
export const BAD = ['inaccuracy', 'mistake', 'miss', 'blunder'];
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const pick = a => a[Math.floor(Math.random() * a.length)];

export function parseGame(pgn) {
  const c = new Chess();
  c.loadPgn(pgn);
  const headers = c.getHeaders();
  const moves = c.history({ verbose: true });
  if (!moves.length) throw new Error('That game has no moves.');
  return { headers, moves, fens: [moves[0].before, ...moves.map(m => m.after)] };
}

// Engine result for positions where the game is already over (Stockfish has no move to give).
export function terminalEval(fen) {
  const c = new Chess(fen);
  if (c.isCheckmate()) return { best: null, lines: [{ cp: c.turn() === 'w' ? -10000 : 10000, mate: null, pv: [] }] };
  if (c.isDraw() || c.isStalemate()) return { best: null, lines: [{ cp: 0, mate: null, pv: [] }] };
  return null;
}

const material = fen => { // white minus black
  let s = 0;
  for (const ch of fen.split(' ')[0]) { const v = VAL[ch.toLowerCase()]; if (v) s += ch === ch.toUpperCase() ? v : -v; }
  return s;
};
function playLine(fen, pv, n) {
  const c = new Chess(fen), sans = [];
  for (const u of pv.slice(0, n)) { try { sans.push(c.move(toMoveArg(u)).san); } catch { break; } }
  return { fen: c.fen(), sans };
}
const evenPlies = pv => { const n = Math.min(6, pv.length); return n - (n % 2); };
const amount = v => (v >= 8 ? 'the queen' : v >= 5 ? 'a rook' : v >= 3 ? 'a piece' : v >= 2 ? 'two pawns' : 'a pawn');
const cap = s => s[0].toUpperCase() + s.slice(1);

// Play an engine line and sum it up for `color`: net material won (+) or lost (-), cut at the first even
// ply that already shows the final result (so trades finish but the line stays short), or at checkmate.
function outcome(fen, pv, color, n = 8) {
  const c = new Chess(fen), sans = [], sg = color === 'w' ? 1 : -1, start = material(fen), nets = [];
  for (const u of pv.slice(0, n)) {
    try { sans.push(c.move(toMoveArg(u)).san); } catch { break; }
    if (c.isCheckmate()) return { sans, net: 0, mate: true };
    nets.push(sg * (material(c.fen()) - start));
  }
  const last = nets.length - (nets.length % 2 || 0) - 1; // last even-length prefix
  if (last < 0) return { sans, net: 0, mate: false };
  const net = nets[last];
  let k = 1;
  while (k < last && Math.abs(nets[k] - net) > 1) k += 2; // within a pawn of the end result is the point
  return { sans: sans.slice(0, k + 1), net, mate: false };
}
const sanOf = (fen, uci) => { try { return new Chess(fen).move(toMoveArg(uci)).san; } catch { return null; } };

// The plainest reason a move is useful ("it takes the bishop"), or '' when nothing simple stands out.
export function idea(fen, uci, ply = 99) {
  const c = new Chess(fen);
  let m;
  try { m = c.move(toMoveArg(uci)); } catch { return ''; }
  if (c.isCheckmate()) return "it's checkmate";
  const hit = attackedBy(c, m.to);
  if (hit.length >= 2 && m.piece !== 'k') return `it attacks the ${hit.map(x => NAME[x.type]).join(' and the ')} at once`;
  if (m.captured && VAL[m.captured] >= 3) return `it takes the ${NAME[m.captured]}`;
  if (m.promotion) return `it makes a new ${NAME[m.promotion]}`;
  if (/[kq]/.test(m.flags)) return 'it castles the king to safety';
  if (c.inCheck()) return 'it gives check';
  const loose = hit.filter(x => x.type !== 'k' && (VAL[x.type] > VAL[m.piece] || !c.attackers(x.square, x.color).length));
  if (loose.length) return `it attacks the ${NAME[loose[0].type]} on ${loose[0].square}`;
  if (m.captured) return `it takes the pawn on ${m.to}`;
  if ('nb'.includes(m.piece) && ply < 24 && /[18]/.test(m.from[1])) return `it develops the ${NAME[m.piece]}`;
  if (m.piece === 'p' && ply < 20 && ['c4', 'd4', 'e4', 'c5', 'd5', 'e5'].includes(m.to)) return 'it takes space in the center';
  return '';
}

// Enemy pieces worth 3+ (or the king) attacked by the piece standing on `sq`.
function attackedBy(chess, sq) {
  const p = chess.get(sq);
  if (!p) return [];
  const out = [];
  for (const row of chess.board()) for (const x of row)
    if (x && x.color !== p.color && (VAL[x.type] >= 3 || x.type === 'k') && chess.attackers(x.square, p.color).includes(sq)) out.push(x);
  return out;
}

// Did this move leave the moved piece en prise for real (a sacrifice), not just trade?
function isSacrifice(m) {
  if (m.piece === 'p' || m.piece === 'k') return false;
  const c = new Chess(m.after);
  const opp = m.color === 'w' ? 'b' : 'w';
  const defended = c.attackers(m.to, m.color).length > 0;
  const atk = c.attackers(m.to, opp).filter(s => !(defended && c.get(s).type === 'k'));
  if (!atk.length) return false;
  const cheapest = Math.min(...atk.map(s => VAL[c.get(s).type] || 1));
  const risk = defended ? VAL[m.piece] - cheapest : VAL[m.piece];
  return risk - (m.captured ? VAL[m.captured] : 0) >= 2;
}

function evalPhrase(line) {
  if (!line) return '';
  if (line.mate != null) return `${line.mate > 0 ? 'White' : 'Black'} has checkmate in ${Math.abs(line.mate)}.`;
  const cp = line.cp, side = cp > 0 ? 'White' : 'Black', a = Math.abs(cp);
  if (a >= 9000) return '';
  if (a >= 500) return `${side} is winning.`;
  if (a >= 200) return `${side} is clearly better.`;
  if (a >= 70) return `${side} is slightly better.`;
  return 'The position is about equal.';
}

// Why was this move bad? Returns { tag, text } — tags feed the coach's weakness tracker.
function reason(m, fenBefore, E0, E1, bestSan, P, before, after, ply) {
  const sg = m.color === 'w' ? 1 : -1;
  const t0 = E0.lines[0], t1 = E1.lines[0];
  if (t0?.mate != null && Math.sign(t0.mate) === sg && !(t1?.mate != null && Math.sign(t1.mate) === sg))
    return { tag: 'missed-mate', text: `${P.You} had checkmate in ${Math.abs(t0.mate)}, starting with ${bestSan}!` };
  if (t1?.mate != null && Math.sign(t1.mate) === -sg) {
    const l = playLine(m.after, t1.pv, Math.min(5, 2 * Math.abs(t1.mate) - 1));
    return { tag: 'allowed-mate', text: `This allows checkmate in ${Math.abs(t1.mate)}: ${l.sans.join(' ')}.` };
  }
  if (t1?.pv?.length) {
    const l = playLine(m.after, t1.pv, evenPlies(t1.pv));
    const lost = sg * (material(m.after) - material(l.fen));
    if (lost >= 2) {
      const c = new Chess(m.after);
      const reply = c.move(toMoveArg(t1.pv[0]));
      if (reply.captured && VAL[reply.captured] >= 3)
        return { tag: 'hung', text: `This hangs ${P.your} ${NAME[reply.captured]}: ${reply.san} wins it.` };
      const hit = attackedBy(c, reply.to);
      if (hit.length >= 2 && reply.piece !== 'k')
        return { tag: 'allowed-fork', text: `This allows ${reply.san}, a fork that hits ${P.your} ${hit.map(x => NAME[x.type]).join(' and ')}.` };
    }
    const o = outcome(m.after, t1.pv, m.color);
    if (o.net <= -2) return { tag: 'allowed-tactic', text: `After ${o.sans.join(' ')}, ${P.you} lose ${amount(-o.net)}.` };
  }
  if (t0?.pv?.length) {
    const l = playLine(fenBefore, t0.pv, evenPlies(t0.pv));
    const gain = sg * (material(l.fen) - material(fenBefore));
    if (gain >= 2) {
      const c = new Chess(fenBefore);
      const bm = c.move(toMoveArg(t0.pv[0]));
      const hit = attackedBy(c, bm.to);
      if (hit.length >= 2 && bm.piece !== 'k') return { tag: 'missed-fork', text: `${P.You} missed ${bestSan}, a fork that wins material!` };
      if (bm.captured && VAL[bm.captured] >= 3) return { tag: 'missed-win', text: `${P.You} missed ${bestSan}, which wins a ${NAME[bm.captured]}.` };
    }
    const o = outcome(fenBefore, t0.pv, m.color);
    if (o.net >= 2) return { tag: 'missed-win', text: `${P.You} missed ${bestSan}. After ${o.sans.join(' ')}, ${P.you} would win ${amount(o.net)}.` };
  }
  const why = t0?.pv?.length ? idea(fenBefore, t0.pv[0], ply) : '';
  const harm = before >= 60 && after < 55 ? `This throws away ${P.your} advantage.`
    : before >= 45 && after < 40 ? `This hands ${P.other} the advantage.` : `This makes ${P.your} position worse.`;
  return { tag: 'positional', text: `${harm} Better was ${bestSan}${why ? `, because ${why}` : ''}.` };
}

const OPENERS = {
  best: ['{san} is the best move.', '{san} is exactly what the engine wanted.', 'Spot on, {san} is best.'],
  excellent: ['{san} is excellent, nearly as good as the top move.', '{san} is an excellent move.'],
  good: ['{san} is a good move. {best} was a little stronger.', '{san} is fine, though {best} was better.'],
};

// game = parseGame(...); evals[i] = engine result for game.fens[i] (white POV); openings = { epd: "ECO Name" }
export function buildReview(game, evals, myColor, openings = {}) {
  const { moves, fens } = game;
  const plies = [];
  let inBook = true, opening = null;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i], me = m.color, mine = me === myColor;
    const P = mine ? { You: 'You', you: 'you', your: 'your', other: 'your opponent' } : { You: 'Your opponent', you: 'they', your: 'their', other: 'you' };
    const E0 = evals[i], E1 = evals[i + 1];
    const wpMe = line => (me === 'w' ? winPct(line) : 100 - winPct(line));
    const before = wpMe(E0.lines[0]), after = wpMe(E1.lines[0]);
    const loss = Math.max(0, before - after);
    const acc = Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));
    const uci = uciOf(m);
    const best = E0.best;
    let bestSan = null;
    if (best) { try { bestSan = new Chess(fens[i]).move(toMoveArg(best)).san; } catch { /* engine gave an odd move */ } }

    const name = inBook && openings[epd(m.after)];
    let cls;
    if (name) { cls = 'book'; opening = name; }
    else {
      inBook = false;
      if (uci === best) cls = 'best';
      else if (loss < 2) cls = 'excellent';
      else if (loss < 5) cls = 'good';
      else if (loss < 10) cls = 'inaccuracy';
      else if (loss < 20) cls = 'mistake';
      else cls = 'blunder';

      const prev = plies[i - 1];
      if (['mistake', 'blunder'].includes(cls) && prev && ['mistake', 'blunder', 'miss'].includes(prev.cls) && before > 55)
        cls = 'miss'; // opponent just slipped and this move didn't punish it
      if ((cls === 'best' || cls === 'excellent') && after > 35 && before < 95 && isSacrifice(m)) cls = 'brilliant';
      else if (cls === 'best' && E0.lines[1] && after < 90) {
        const second = wpMe(E0.lines[1]);
        const recapture = moves[i - 1]?.captured && moves[i - 1].to === m.to;
        if (before - second >= 20 && !recapture && !new Chess(fens[i]).inCheck()) cls = 'great';
      }
    }

    let note, tag = null;
    const fill = s => s.replace('{san}', m.san).replace('{best}', bestSan ?? 'another move');
    if (cls === 'book') note = `${m.san} is a book move.${name !== plies.at(-1)?.opening ? ` This is the ${name.slice(4)}.` : ''}`;
    else if (cls === 'brilliant') {
      const pv = E1.lines[0]?.pv ?? [], o = outcome(m.after, pv, me), takes = o.sans[0] && new Chess(m.after).move(toMoveArg(pv[0])).to === m.to;
      const end = o.mate ? "it's checkmate" : o.net > 0 ? `${P.you} come out ${amount(o.net)} ahead` : `${P.you} get it back with a strong attack`;
      note = `${m.san}!! Brilliant! ${P.You} offered the ${NAME[m.piece]}. ` + (takes && o.sans.length > 1
        ? `If ${o.sans[0]} takes it, then after ${o.sans.slice(1).join(' ')} ${end}.`
        : `Taking it doesn't work, so the best reply is ${o.sans[0] ?? 'something else'}.`);
    } else if (cls === 'great') {
      const s2 = E0.lines[1]?.pv?.[0] && sanOf(fens[i], E0.lines[1].pv[0]), why = idea(fens[i], uci, i);
      note = `${m.san}! A great move, the only one that keeps ${P.your} advantage${why ? `: ${why}` : ''}.${s2 ? ` The next best, ${s2}, would have let it slip.` : ''}`;
    } else if (cls === 'good') {
      const why = best ? idea(fens[i], best, i) : '';
      const same = why === idea(fens[i], uci, i); // both moves do the same thing: the reason wouldn't explain the difference
      note = `${m.san} is a good move, but ${bestSan ?? 'another move'} was a little stronger${why && !same ? `: ${why}` : ''}.`;
    } else if (OPENERS[cls]) {
      const why = idea(fens[i], uci, i);
      note = fill(pick(OPENERS[cls])) + (why ? ` ${cap(why)}.` : '');
    } else {
      const r = reason(m, fens[i], E0, E1, bestSan ?? 'another move', P, before, after, i);
      tag = r.tag;
      if (tag === 'allowed-mate' && cls !== 'miss') cls = 'blunder'; // walking into mate is always a blunder
      const label = { inaccuracy: 'an inaccuracy', mistake: 'a mistake', blunder: 'a blunder', miss: 'a missed chance' }[cls];
      note = `${m.san} is ${label}. ${cls === 'miss' ? `${P.your === 'your' ? 'Your opponent' : 'You'} had just made a mistake, and this lets it slide. ` : ''}${r.text}`;
      if (!r.text.includes(bestSan ?? '\u0000')) note += ` Best was ${bestSan}.`;
    }
    if (cls !== 'book') note += ' ' + evalPhrase(E1.lines[0]);

    plies.push({ san: m.san, uci, color: me, cls, loss, acc, best, bestSan, note: note.trim(), tag, opening: name || opening, wpBefore: before, line: E1.lines[0]?.pv?.slice(0, 8) ?? [] });
  }

  // shortcut: plain average of per-move accuracy; Lichess/chess.com use weighted formulas, close enough for coaching
  const accOf = c => { const a = plies.filter(p => p.color === c).map(p => p.acc); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; };
  const counts = { w: {}, b: {} };
  for (const p of plies) counts[p.color][p.cls] = (counts[p.color][p.cls] ?? 0) + 1;
  return { plies, accuracy: { w: accOf('w'), b: accOf('b') }, counts, opening };
}
