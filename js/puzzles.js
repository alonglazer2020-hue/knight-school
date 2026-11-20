// Puzzles from the free Lichess puzzle API, plus "My Mistakes": positions from your own reviewed games.
import { Board, arrow, circle, uciOf, toMoveArg } from './board.js';
import { coachBox, say, sfx } from './coach.js';
import { analyse, cancel, winPct } from './engine.js';
import { Chess } from '../vendor/chess.js';
import * as store from './store.js';

export const THEMES = {
  mix: { label: 'Mixed', tip: 'Look at every check, capture and threat.' },
  mateIn1: { label: 'Mate in 1', tip: 'There is a checkmate in one move. Look at every check!' },
  mateIn2: { label: 'Mate in 2', tip: 'Checkmate in two moves. Start with a forcing move, usually a check.' },
  hangingPiece: { label: 'Free pieces', tip: 'Something is undefended. Find it and grab it.' },
  fork: { label: 'Forks', tip: 'One piece can attack two targets at once.' },
  pin: { label: 'Pins', tip: 'A piece is stuck because something more valuable stands behind it.' },
  skewer: { label: 'Skewers', tip: 'Attack a valuable piece; when it moves, take what is behind it.' },
  discoveredAttack: { label: 'Discovered attacks', tip: 'Move one piece to uncover an attack by another.' },
  backRankMate: { label: 'Back-rank mate', tip: 'The king is stuck behind its own pawns on the back row.' },
  trappedPiece: { label: 'Trapped pieces', tip: 'An enemy piece has no safe squares. Attack it!' },
  promotion: { label: 'Promotion', tip: 'A pawn is close to becoming a queen.' },
  endgame: { label: 'Endgames', tip: 'In the endgame, kings fight and pawns want to promote.' },
  opening: { label: 'Opening traps', tip: 'Something went wrong early. Punish it!' },
  sacrifice: { label: 'Sacrifices', tip: 'Giving up material can lead to something bigger.' },
};
const DIFFS = ['easiest', 'easier', 'normal', 'harder', 'hardest'];
const SOLVED = ['Got it!', 'Brilliant!', 'Nailed it!', 'Yes! Great vision.', 'Perfect!'];
const pick = a => a[Math.floor(Math.random() * a.length)];

export const mistakes = () => store.get('mistakes', []);

async function fetchLichess(theme, diff) {
  const r = await fetch(`https://lichess.org/api/puzzle/next?angle=${theme}&difficulty=${diff}`);
  if (!r.ok) throw new Error('Lichess said ' + r.status);
  const { game, puzzle } = await r.json();
  let fen = puzzle.fen, lastMove = puzzle.lastMove;
  if (!fen) { // older API shape: replay the game moves
    const c = new Chess();
    for (const m of game.pgn.split(' ')) c.move(m);
    const h = c.history({ verbose: true }).at(-1);
    fen = c.fen(); lastMove = h.from + h.to;
  }
  return { id: puzzle.id, fen, lastMove, solution: puzzle.solution, themes: puzzle.themes, rating: puzzle.rating };
}

export function puzzleView(view, params) {
  let theme = params.get('theme') || store.get('ptheme', 'mix');
  let diff = store.get('pdiff', 'easier');
  let mode = params.get('mode') === 'mistakes' ? 'mistakes' : 'lichess';
  let p = null, k = 0, failed = false, hintLevel = 0, prefetch = null, busy = false;

  view.innerHTML = `<div class="play">
    <div class="boardcol"><div class="board"></div></div>
    <aside class="side">
      <div class="seg"><button data-mode="lichess">Puzzles</button><button data-mode="mistakes">My mistakes <span class="mcount"></span></button></div>
      <div class="pinfo"><span class="rating"></span><span class="streak"></span></div>
      <div class="coachslot"></div>
      <div class="btns"><button class="b-hint">Hint</button><button class="b-sol">Solution</button><button class="b-next primary">Next puzzle</button></div>
      <div class="filters">
        <label>Theme</label><div class="chips">${Object.entries(THEMES).map(([k2, t]) => `<button class="chip" data-theme="${k2}">${t.label}</button>`).join('')}</div>
        <label>Difficulty</label><select class="diff">${DIFFS.map(d => `<option>${d}</option>`).join('')}</select>
      </div>
    </aside></div>`;
  const $ = s => view.querySelector(s);
  $('.coachslot').append(coachBox());
  const board = new Board($('.board'), { onMove });
  $('.diff').value = diff;

  function paint() {
    view.querySelectorAll('.seg button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    view.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
    $('.filters').hidden = mode !== 'lichess';
    $('.mcount').textContent = `(${mistakes().length})`;
    const st = store.get('pstats', { solved: 0, failed: 0, streak: 0 });
    $('.rating').textContent = mode === 'lichess' ? `Your puzzle rating: ${Math.round(store.get('prating', 800))}` : 'Positions where you went wrong in your own games';
    $('.streak').textContent = st.streak > 1 ? `🔥 ${st.streak} in a row` : '';
  }

  async function next() {
    cancel();
    paint();
    failed = false; hintLevel = 0; k = 0;
    $('.b-next').disabled = true;
    if (mode === 'mistakes') {
      const list = mistakes();
      if (!list.length) {
        p = null;
        board.load('4k3/8/8/8/8/8/8/4K3 w - - 0 1', { interactive: false });
        return say('No saved mistakes yet. Review one of your chess.com games and I will collect every mistake you made, so you can practice them here.');
      }
      const m = list[Math.floor(Math.random() * list.length)];
      p = { ...m, solution: [m.best], mistake: true };
    } else {
      say('Finding a puzzle...');
      try {
        p = (prefetch && await prefetch) || await fetchLichess(theme, diff);
      } catch (e) {
        prefetch = null;
        $('.b-next').disabled = false;
        return say("I couldn't reach Lichess for a puzzle. Check your internet connection and press Next puzzle.");
      }
      prefetch = fetchLichess(theme, diff).catch(() => null);
    }
    const side = p.fen.split(' ')[1];
    const lm = p.lastMove ? [p.lastMove.slice(0, 2), p.lastMove.slice(2, 4)] : undefined;
    board.load(p.fen, { orientation: side === 'w' ? 'white' : 'black', lastMove: lm, interactive: true });
    const who = side === 'w' ? 'White' : 'Black';
    if (p.mistake) say(`From your game: you played ${p.played} here. ${who} to move. Find the better move!`);
    else say(`${who} to move. Find the best move!${p.rating ? ` This one is rated ${p.rating}.` : ''}`);
  }

  function finish(win) {
    board.setInteractive(false);
    $('.b-next').disabled = false;
    const st = store.get('pstats', { solved: 0, failed: 0, streak: 0, byTheme: {} });
    st.byTheme ??= {};
    const clean = win && !failed && hintLevel < 2;
    if (clean) { st.solved++; st.streak++; } else { st.failed++; st.streak = 0; }
    for (const t of p.themes ?? []) { const b = (st.byTheme[t] ??= { s: 0, f: 0 }); clean ? b.s++ : b.f++; }
    store.set('pstats', st);
    if (p.rating && !p.mistake) {
      const r = store.get('prating', 800), e = 1 / (1 + 10 ** ((p.rating - r) / 400));
      store.set('prating', Math.max(100, r + 24 * ((clean ? 1 : 0) - e)));
    }
    if (p.mistake) {
      const list = mistakes();
      const m = list.find(x => x.fen === p.fen);
      if (m) {
        m.streak = clean ? (m.streak ?? 0) + 1 : 0;
        // mastered after two clean solves
        store.set('mistakes', m.streak >= 2 ? list.filter(x => x !== m) : list);
      }
    }
    paint();
    if (win) {
      sfx.win();
      const tip = (p.themes ?? []).map(t => THEMES[t]).find(Boolean);
      say(`${pick(SOLVED)} ${p.mistake ? (p.note ?? '') : tip && tip !== THEMES.mix ? `That was a ${tip.label.toLowerCase().replace(/s$/, '')} puzzle. ${tip.tip}` : ''}`, 'happy');
    }
  }

  async function onMove(m) {
    if (busy) return;
    const uci = uciOf(m), want = p.solution[k];
    if (uci === want || board.chess.isCheckmate()) {
      k++;
      if (k >= p.solution.length || board.chess.isCheckmate()) return finish(true);
      board.setInteractive(false);
      say(pick(['Good, keep going!', 'Yes! And now?', 'Correct. What next?']));
      setTimeout(() => { board.play(p.solution[k++]); board.setInteractive(true); }, 450);
      return;
    }
    if (p.mistake) { // your own game: accept any move about as good as the engine's best
      busy = true; board.setInteractive(false); say('Let me check that move...');
      const r = await analyse(board.chess.fen(), { depth: 13 });
      busy = false;
      const mover = p.fen.split(' ')[1];
      const wp = mover === 'w' ? winPct(r?.lines[0]) : 100 - winPct(r?.lines[0]);
      if (r && wp >= p.bestWp - 3) { say('That works too!'); return finish(true); }
    }
    failed = true;
    sfx.wrong();
    say(pick(["Not quite. Look again.", "That's not it. What does your opponent threaten?", 'Nope. Try another idea.']), 'sad');
    setTimeout(() => { board.undo(); board.setInteractive(true); }, 500);
  }

  $('.b-hint').onclick = () => {
    if (!p) return;
    hintLevel++;
    const mv = toMoveArg(p.solution[k]);
    const tip = (p.themes ?? []).map(t => THEMES[t]).find(Boolean);
    if (hintLevel === 1 && tip) return say(`Hint: ${tip.tip}`);
    if (hintLevel <= 2) { board.shapes([circle(mv.from, 'yellow')]); return say('Hint: move the highlighted piece.'); }
    board.shapes([arrow(p.solution[k], 'yellow')]);
    say('Here is the move. Play it!');
  };
  $('.b-sol').onclick = () => {
    if (!p || board.interactive === false) return;
    failed = true;
    board.setInteractive(false);
    let i = k;
    const step = () => {
      if (i >= p.solution.length) { finish(false); return say('That was the solution. Try the next one!'); }
      board.play(p.solution[i++]);
      setTimeout(step, 700);
    };
    step();
  };
  $('.b-next').onclick = next;
  view.querySelectorAll('.seg button').forEach(b => b.onclick = () => { mode = b.dataset.mode; prefetch = null; next(); });
  view.querySelectorAll('.chip').forEach(b => b.onclick = () => { theme = b.dataset.theme; store.set('ptheme', theme); prefetch = null; next(); });
  $('.diff').onchange = e => { diff = e.target.value; store.set('pdiff', diff); prefetch = null; next(); };
  next();
}
