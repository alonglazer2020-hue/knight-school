// Game Review: import from chess.com / Lichess / PGN, analyse with Stockfish, and walk through it with the coach.
import { Board, arrow, uciOf } from './board.js';
import { coachBox, say, sfx } from './coach.js';
import { analyse, winPct } from './engine.js';
import { parseGame, buildReview, terminalEval, CLASSES, BAD } from './analysis.js';
import { Chess } from '../vendor/chess.js';
import * as store from './store.js';
import { setPage, openChat, sanLine } from './ai-coach.js';
import { bumpToday } from './levels.js';
import { account, games as ccGames, pgnOf } from './chesscom.js';
import { icon, iconPaths } from './icons.js';

const badge = c => `<i class="sym" style="background:${c.color};color:${c.ink}">${c.icon ? icon(c.icon) : c.sym}</i>`;

const DEPTH = 14;
const MAX_SAVED = 30;
let pending = null; // game picked from the list, waiting to be analysed
let openingsP = null;
const openings = () => (openingsP ??= fetch('vendor/openings.json').then(r => r.json()).catch(() => ({})));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const resultOf = pgn => pgn.match(/\[Result "([^"]+)"\]/)?.[1] ?? '*';

async function chesscomGames(user) {
  const r = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`);
  if (!r.ok) throw new Error(`chess.com doesn't know the username "${user}".`);
  const { archives = [] } = await r.json();
  const games = [];
  for (const url of archives.slice(-3).reverse()) {
    const a = await (await fetch(url)).json();
    games.push(...(a.games ?? []).reverse());
    if (games.length >= 25) break;
  }
  return games.filter(g => g.rules === 'chess' && g.pgn).slice(0, 25).map(g => ({
    key: g.url, pgn: g.pgn, white: g.white.username, black: g.black.username,
    wr: g.white.rating, br: g.black.rating, speed: g.time_class, date: g.end_time * 1000,
  }));
}
async function lichessGames(user) {
  const r = await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=25&pgnInJson=true&clocks=false&evals=false`, { headers: { Accept: 'application/x-ndjson' } });
  if (!r.ok) throw new Error(`Lichess doesn't know the username "${user}".`);
  return (await r.text()).split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(g => g.variant === 'standard').map(g => ({
    key: 'https://lichess.org/' + g.id, pgn: g.pgn, white: g.players.white.user?.name ?? 'Computer', black: g.players.black.user?.name ?? 'Computer',
    wr: g.players.white.rating, br: g.players.black.rating, speed: g.speed, date: g.createdAt,
  }));
}
const fetchGames = (src, u) => (src === 'lichess' ? lichessGames(u) : chesscomGames(u));

function myColorIn(g) {
  const u = (store.get('username', '') || '').toLowerCase();
  if (g.black && g.black.toLowerCase() === u) return 'b';
  return 'w';
}

function openGame(g) {
  pending = g;
  location.hash = '#/review/' + encodeURIComponent(g.key);
}

// Open one of your synced chess.com games (by its URL) for review; already-reviewed games open instantly.
export async function reviewChesscom(key) {
  if (store.get('rv.' + key, null)) { location.hash = '#/review/' + encodeURIComponent(key); return; }
  const g = ccGames().find(x => x.key === key), pgn = await pgnOf(key);
  if (!g || !pgn) throw new Error("Couldn't load that game from chess.com.");
  const h = k => pgn.match(new RegExp('\\[' + k + ' "([^"]*)"\\]'))?.[1];
  openGame({ key, pgn, white: h('White'), black: h('Black'), wr: +h('WhiteElo') || undefined, br: +h('BlackElo') || undefined, myColor: g.c, date: g.t });
}

// Used by the Coach page's one-click button.
export async function reviewLatest() {
  if (account() && ccGames()[0]) return reviewChesscom(ccGames()[0].key);
  const g = (await fetchGames(store.get('source', 'chesscom'), store.get('username', '')))[0];
  if (!g) throw new Error('No games found.');
  openGame(g);
}

// Rows for synced chess.com games (Coach page and Review page share them).
const RES = { W: 'Won', L: 'Lost', D: 'Draw' };
const ctlText = c => { const [base, inc] = String(c ?? '').split('+'); return base.includes('/') ? 'Daily' : `${Math.round(+base / 60) || base}${inc ? '|' + inc : ''}`; };
export function gameRows(list) {
  const all = ccGames();
  return list.map(g => {
    const prev = all.find(x => x.tc === g.tc && x.t < g.t), d = prev && g.me ? g.me - prev.me : null;
    const rv = store.get('rv.' + g.key, null);
    return `<li class="grow"><span class="res ${g.res}" title="${RES[g.res]}">${g.res}</span>
      <span class="who"><b>${esc(g.opp)}</b> <small>(${g.oppR ?? '?'})</small><small class="open">${esc(g.open || g.tc)}</small></span>
      <span class="tc">${g.tc === 'daily' ? 'Daily' : `${g.tc[0].toUpperCase() + g.tc.slice(1)} ${ctlText(g.ctl)}`}</span>
      <span class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d == null ? '' : d > 0 ? '+' + d : d < 0 ? '−' + -d : '±0'}</span>
      <span class="acc" title="${rv ? 'Your accuracy' : 'Not reviewed yet'}">${rv ? Math.round(rv.accuracy[rv.myColor]) + '%' : ''}</span>
      <button class="link rv" data-key="${esc(g.key)}">Review</button></li>`;
  }).join('');
}
export function bindGameRows(root, onError) {
  root.querySelectorAll('.rv').forEach(b => b.onclick = async () => {
    b.disabled = true; b.textContent = 'Loading…';
    try { await reviewChesscom(b.dataset.key); } catch (e) { b.disabled = false; b.textContent = 'Review'; onError?.(e.message); }
  });
}

export function reviewIndex(view) {
  if (account()) return reviewMine(view);
  reviewImport(view);
}
function reviewMine(view) {
  const list = ccGames().slice(0, 30), saved = store.get('reviews', []);
  view.innerHTML = `<div class="page"><h1>Game Review</h1>
    <p class="sub">Your newest chess.com games. Pick one: Stockfish 17 grades every move, Coach Knox explains your mistakes, and they become puzzles.</p>
    <section class="card"><div class="card-head"><h2>Your games</h2><span class="m">${account().username} · chess.com</span></div>
      ${list.length ? `<ol class="gamelist">${gameRows(list)}</ol>` : '<p class="sub">No games yet. Play one on chess.com, then come back.</p>'}<p class="err" role="status"></p></section>
    <details class="card"><summary>Review a game from somewhere else (Lichess or a PGN)</summary><div class="importbox"></div></details>
    ${saved.length ? `<h2>Past reviews</h2><div class="games">${saved.map(x => `<a class="game" href="#/review/${encodeURIComponent(x.key)}"><span>${esc(x.title)}</span><span class="m">${x.acc != null ? Math.round(x.acc) + '% accuracy' : ''}</span></a>`).join('')}</div>` : ''}
  </div>`;
  bindGameRows(view, m => { view.querySelector('.err').textContent = m; });
  reviewImport(view.querySelector('.importbox'), true);
}
function reviewImport(view, embedded = false) {
  let src = store.get('source', 'chesscom');
  const saved = store.get('reviews', []);
  view.innerHTML = `${embedded ? '' : `<div class="page"><h1>Game Review</h1>
    <p class="sub">Free, unlimited reviews with Stockfish 17. Every move gets a grade and an explanation, and your mistakes become puzzles. Tip: connect your chess.com account in Settings and your games show up here by themselves.</p>`}
    <div class="panel">
      <div class="seg"><button data-src="chesscom">chess.com</button><button data-src="lichess">Lichess</button></div>
      <form class="row user"><input name="u" placeholder="Your username" autocomplete="username" value="${esc(store.get('username', ''))}"><button class="primary">Load my games</button></form>
      <div class="games"></div>
      <details><summary>Or paste a PGN</summary><textarea placeholder="[Event ...] 1. e4 e5 ..."></textarea>
        <div class="row"><label><input type="checkbox" class="asblack"> I played Black</label><button class="b-pgn primary">Review</button></div></details>
    </div>
    ${!embedded && saved.length ? `<h2>Past reviews</h2><div class="games">${saved.map(s => `<a class="game" href="#/review/${encodeURIComponent(s.key)}">
      <span>${esc(s.title)}</span><span class="m">${s.acc != null ? Math.round(s.acc) + '% accuracy' : ''}</span></a>`).join('')}</div>` : ''}
  ${embedded ? '' : '</div>'}`;
  const $ = s => view.querySelector(s);
  const paint = () => view.querySelectorAll('.seg button').forEach(b => b.classList.toggle('active', b.dataset.src === src));
  view.querySelectorAll('.seg button').forEach(b => b.onclick = () => { src = b.dataset.src; store.set('source', src); paint(); });
  paint();

  $('form.user').onsubmit = async e => {
    e.preventDefault();
    const u = e.target.u.value.trim();
    if (!u) return;
    store.set('username', u);
    const box = $('.games');
    box.innerHTML = '<p class="sub">Loading games...</p>';
    try {
      const games = await fetchGames(src, u);
      if (!games.length) { box.innerHTML = '<p class="sub">No games found.</p>'; return; }
      box.innerHTML = games.map((g, i) => {
        const me = myColorIn(g), res = resultOf(g.pgn);
        const outcome = res === '1/2-1/2' ? 'Draw' : (res === '1-0') === (me === 'w') ? 'Won' : res === '*' ? '' : 'Lost';
        const opp = me === 'w' ? `${g.black} (${g.br ?? '?'})` : `${g.white} (${g.wr ?? '?'})`;
        return `<button class="game" data-i="${i}"><span><i class="dot ${me}"></i>vs ${esc(opp)}</span>
          <span class="m"><b class="${outcome.toLowerCase()}">${outcome}</b> · ${esc(g.speed)} · ${new Date(g.date).toLocaleDateString()}</span></button>`;
      }).join('');
      box.querySelectorAll('.game').forEach(b => b.onclick = () => openGame(games[+b.dataset.i]));
    } catch (err) {
      box.innerHTML = `<p class="err">${esc(err.message || 'Could not load games. Check the username and your connection.')}</p>`;
    }
  };

  $('.b-pgn').onclick = () => {
    const pgn = $('textarea').value.trim();
    try { parseGame(pgn); } catch { return alert('That PGN could not be read. Copy it from chess.com: Share → PGN.'); }
    let h = 0; for (const ch of pgn) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const hd = new Chess(); hd.loadPgn(pgn);
    const H = hd.getHeaders();
    const asBlack = $('.asblack').checked;
    openGame({ key: 'pgn-' + (h >>> 0).toString(36), pgn, white: H.White ?? 'White', black: H.Black ?? 'Black', myColor: asBlack ? 'b' : 'w' });
  };
}

export async function reviewGame(view, key) {
  const cached = store.get('rv.' + key, null);
  if (cached) return renderReview(view, cached);
  if (!pending || pending.key !== key) { location.hash = '#/review'; return; }
  const g = pending;

  view.innerHTML = `<div class="play"><div class="boardcol"><div class="board"></div></div>
    <aside class="side"><h2>Analyzing...</h2><div class="coachslot"></div>
    <div class="progress"><div></div></div><p class="sub ptext"></p></aside></div>`;
  const $ = s => view.querySelector(s);
  $('.coachslot').append(coachBox());
  const board = new Board($('.board'));
  let game;
  try { game = parseGame(g.pgn); } catch { say("I couldn't read that game's moves."); return; }
  const myColor = g.myColor ?? myColorIn(g);
  board.load(game.fens[0], { orientation: myColor === 'w' ? 'white' : 'black', interactive: false });
  say(`Let me analyze this game with Stockfish. I'm checking all ${game.moves.length} moves, it takes about a minute.`);

  const evals = [];
  for (let i = 0; i < game.fens.length; i++) {
    const r = terminalEval(game.fens[i]) ?? await analyse(game.fens[i], { depth: DEPTH, multipv: 2 });
    if (!r || !view.isConnected) return; // user left the page
    evals.push(r);
    if (i > 0) board.load(game.fens[i], { interactive: false, lastMove: [game.moves[i - 1].from, game.moves[i - 1].to] });
    $('.progress div').style.width = `${(100 * (i + 1)) / game.fens.length}%`;
    $('.ptext').textContent = `Move ${Math.ceil(i / 2)} of ${Math.ceil(game.moves.length / 2)}`;
  }
  const rv = buildReview(game, evals, myColor, await openings());
  const R = {
    key, myColor, white: g.white, black: g.black, wr: g.wr, br: g.br, result: resultOf(g.pgn), date: g.date ?? Date.now(),
    fens: game.fens, moves: game.moves.map(m => ({ from: m.from, to: m.to })),
    evals: evals.map(e => e.lines[0] ? { cp: e.lines[0].cp, mate: e.lines[0].mate } : { cp: 0, mate: null }),
    ...rv,
  };
  saveReview(R);
  renderReview(view, R, true);
}

function saveReview(R) {
  const mine = R.plies.map((p, i) => ({ ...p, i })).filter(p => p.color === R.myColor);
  const title = `${R.white} vs ${R.black} · ${R.result}`;
  // index + full data, keeping only the newest MAX_SAVED
  let list = store.get('reviews', []).filter(x => x.key !== R.key);
  list.unshift({ key: R.key, title, acc: R.accuracy[R.myColor], date: R.date });
  for (const old of list.slice(MAX_SAVED)) store.del('rv.' + old.key);
  list = list.slice(0, MAX_SAVED);
  store.set('reviews', list);
  store.set('rv.' + R.key, R);
  bumpToday('reviewed', true);

  // coach stats
  const tags = {};
  for (const p of mine) if (p.tag && p.cls !== 'inaccuracy') tags[p.tag] = (tags[p.tag] ?? 0) + 1;
  const early = mine.filter(p => ['mistake', 'blunder'].includes(p.cls) && p.i < 20).length;
  const games = store.get('games', []).filter(x => x.key !== R.key);
  games.unshift({ key: R.key, date: R.date, acc: R.accuracy[R.myColor], tags, early, opening: R.opening, counts: R.counts[R.myColor] });
  store.set('games', games.slice(0, 50));

  // your mistakes become puzzles
  const ms = store.get('mistakes', []);
  for (const p of mine) {
    if (!['mistake', 'blunder', 'miss'].includes(p.cls) || !p.best || ms.some(x => x.fen === R.fens[p.i])) continue;
    ms.push({ fen: R.fens[p.i], best: p.best, bestWp: p.wpBefore, played: p.san, note: `In the game you played ${p.san}. ${p.bestSan} was the move.`, themes: p.tag ? [p.tag] : [], game: R.key });
  }
  store.set('mistakes', ms.slice(-200));
}

function summaryText(R) {
  const me = R.myColor, c = R.counts[me];
  const acc = Math.round(R.accuracy[me]), oacc = Math.round(R.accuracy[me === 'w' ? 'b' : 'w']);
  let s = `You played with ${acc}% accuracy, your opponent ${oacc}%.`;
  if (R.opening) s += ` The opening was the ${R.opening.slice(4)}.`;
  const bl = c.blunder ?? 0, mi = (c.mistake ?? 0) + (c.miss ?? 0), gr = (c.great ?? 0) + (c.brilliant ?? 0);
  if (bl) s += ` You made ${bl} blunder${bl > 1 ? 's' : ''}${mi ? ` and ${mi} mistake${mi > 1 ? 's' : ''}` : ''}.`;
  else if (mi) s += ` No blunders, nice! But ${mi} mistake${mi > 1 ? 's' : ''}.`;
  else s += ' No blunders and no mistakes. Super clean game!';
  if (gr) s += ` And you found ${gr} great move${gr > 1 ? 's' : ''}!`;
  s += bl + mi ? ' Press "Key moments" and let\'s learn from them.' : '';
  return s;
}

function renderReview(view, R, fresh = false) {
  const N = R.plies.length;
  const flipped = R.myColor === 'b';
  view.innerHTML = `<div class="play review">
    <div class="boardcol">
      <div class="evalwrap"><div class="evalbar ${flipped ? 'flipped' : ''}"><div class="fill"></div><span class="evtxt"></span></div><div class="board"></div></div>
      <div class="nav"><button data-n="first" aria-label="First move">${icon('first')}</button><button data-n="prev" aria-label="Previous move">${icon('prev')}</button><button data-n="next" aria-label="Next move">${icon('next')}</button><button data-n="last" aria-label="Last move">${icon('last')}</button></div>
    </div>
    <aside class="side">
      <div class="crumb"><a href="#/review">${icon('back')} Games</a></div>
      <div class="players">
        <div><i class="dot w"></i>${esc(R.white)} ${R.wr ? `(${R.wr})` : ''}<b>${Math.round(R.accuracy.w)}%</b></div>
        <div><i class="dot b"></i>${esc(R.black)} ${R.br ? `(${R.br})` : ''}<b>${Math.round(R.accuracy.b)}%</b></div>
      </div>
      <div class="coachslot"></div>
      <div class="btns"><button class="b-retry">${icon('retry')} Retry move</button><button class="b-best">${icon('eye')} <span>Show best</span></button><button class="b-key primary">${icon('target')} Key moments</button><button class="b-ask">${icon('chat')} Ask coach</button></div>
      <svg class="graph" viewBox="0 0 ${Math.max(N, 1)} 100" preserveAspectRatio="none"></svg>
      <table class="tally"><tr><th></th><th>${esc(R.white)}</th><th>${esc(R.black)}</th></tr>
        ${Object.entries(CLASSES).map(([k, c]) => `<tr><td>${badge(c)}${c.label}</td><td>${R.counts.w[k] ?? 0}</td><td>${R.counts.b[k] ?? 0}</td></tr>`).join('')}
      </table>
      <div class="moves"></div>
    </aside></div>`;
  const $ = s => view.querySelector(s);
  $('.coachslot').append(coachBox());
  const board = new Board($('.board'), { onMove: retryMove });
  let idx = -1, showBest = true, retrying = false;

  // move list
  $('.moves').innerHTML = R.plies.map((p, i) => `${i % 2 === 0 ? `<span class="num">${i / 2 + 1}.</span>` : ''}
    <button class="mv" data-i="${i}">${badge(CLASSES[p.cls])}${esc(p.san)}</button>`).join('');
  $('.moves').onclick = e => { const b = e.target.closest('.mv'); if (b) go(+b.dataset.i); };

  // eval graph (white's win chance)
  const wps = R.evals.map(e => winPct(e));
  $('.graph').innerHTML = `<rect width="${N}" height="100" class="gbg"/>
    <path class="garea" d="M0 100 ${wps.map((w, i) => `L${(i * N) / Math.max(wps.length - 1, 1)} ${100 - w}`).join(' ')} L${N} 100 Z"/>
    <line x1="0" x2="${N}" y1="50" y2="50" class="gmid"/>
    ${R.plies.map((p, i) => ['blunder', 'mistake', 'miss', 'brilliant', 'great'].includes(p.cls)
      ? `<line x1="${i + 1}" x2="${i + 1}" y1="0" y2="100" stroke="${CLASSES[p.cls].mark ?? CLASSES[p.cls].color}" stroke-width="${Math.max(N / 200, 0.25)}" opacity=".9"/>` : '').join('')}
    <line class="gcur" x1="0" x2="0" y1="0" y2="100"/>`;
  $('.graph').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); go(Math.round(((e.clientX - r.left) / r.width) * N) - 1); };

  function shapesFor(i) {
    if (i < 0) return [];
    const p = R.plies[i], c = CLASSES[p.cls], m = R.moves[i];
    const s = [{ orig: m.to, customSvg: { html: `<circle cx="82" cy="18" r="16" fill="${c.color}" stroke="#fff" stroke-width="2.5"/>${c.icon
      ? `<g transform="translate(70.5 6.5) scale(.96)" fill="none" stroke="${c.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${iconPaths(c.icon)}</g>`
      : `<text x="82" y="24.5" font-size="${c.sym.length > 1 ? 16 : 20}" font-weight="800" text-anchor="middle" fill="${c.ink}" font-family="Archivo, sans-serif">${c.sym}</text>`}` } }];
    if (showBest && p.best && p.uci !== p.best && !['book', 'best', 'brilliant', 'great'].includes(p.cls)) s.push(arrow(p.best, 'green'));
    return s;
  }

  function go(i, speak = true) {
    i = Math.max(-1, Math.min(N - 1, i));
    retrying = false;
    const stepping = i === idx + 1 && i >= 0;
    if (stepping) {
      board.load(R.fens[i], { interactive: false, lastMove: i > 0 ? [R.moves[i - 1].from, R.moves[i - 1].to] : undefined });
      board.play(R.plies[i].uci);
    } else {
      board.load(R.fens[i + 1], { interactive: false, lastMove: i >= 0 ? [R.moves[i].from, R.moves[i].to] : undefined });
    }
    idx = i;
    board.shapes(shapesFor(i));
    const e = R.evals[i + 1];
    const wp = winPct(e);
    $('.fill').style.height = `${wp}%`;
    $('.evtxt').textContent = e.mate != null ? `M${Math.abs(e.mate)}` : Math.abs(e.cp) >= 9000 ? (e.cp > 0 ? '1-0' : '0-1') : (Math.abs(e.cp) / 100).toFixed(1);
    view.querySelectorAll('.mv').forEach(b => b.classList.toggle('cur', +b.dataset.i === i));
    const cur = view.querySelector(`.mv[data-i="${i}"]`), list = $('.moves');
    if (cur) list.scrollTop = cur.offsetTop - list.clientHeight / 2; // scroll only the list, never the page
    $('.gcur').setAttribute('x1', i + 1); $('.gcur').setAttribute('x2', i + 1);
    const p = R.plies[i];
    $('.b-retry').hidden = !(p && p.color === R.myColor && BAD.includes(p.cls) && p.best);
    if (speak) say(i < 0 ? summaryText(R) : p.note, p && BAD.includes(p.cls) ? 'sad' : p && ['brilliant', 'great', 'best'].includes(p.cls) ? 'happy' : '');
  }

  async function retryMove(m) {
    if (!retrying) return;
    const p = R.plies[idx];
    board.setInteractive(false);
    if (uciOf(m) === p.best) { sfx.correct(); return say(`Yes! ${p.bestSan} is the best move. That's what you missed in the game.`, 'happy'); }
    say('Let me check that...');
    const r = await analyse(board.chess.fen(), { depth: 13 });
    if (!r || !retrying) return;
    const wp = p.color === 'w' ? winPct(r.lines[0]) : 100 - winPct(r.lines[0]);
    if (wp >= p.wpBefore - 4) { sfx.correct(); return say(`${m.san} works too! Much better than ${p.san}.`, 'happy'); }
    sfx.wrong();
    say(`${m.san} isn't it either. Try again!`, 'sad');
    setTimeout(() => { board.undo(); board.setInteractive(true); }, 500);
  }

  $('.b-retry').onclick = () => {
    const p = R.plies[idx];
    retrying = true;
    board.load(R.fens[idx], { interactive: true, lastMove: idx > 0 ? [R.moves[idx - 1].from, R.moves[idx - 1].to] : undefined });
    say(`In the game you played ${p.san}. Find something better!`);
  };
  $('.b-best').onclick = () => { showBest = !showBest; $('.b-best span').textContent = showBest ? 'Hide best' : 'Show best'; board.shapes(shapesFor(idx)); };
  $('.b-best span').textContent = 'Hide best';
  $('.b-key').onclick = () => {
    const key = i => R.plies[i].color === R.myColor && ['blunder', 'mistake', 'miss', 'brilliant', 'great'].includes(R.plies[i].cls);
    for (let k = 1; k <= N; k++) { const j = (idx + k + N) % N; if (key(j)) return go(j); }
    say('No key moments in this game. Clean play!');
  };
  const nav = { first: () => go(-1), prev: () => go(idx - 1), next: () => go(idx + 1), last: () => go(N - 1) };
  view.querySelectorAll('.nav button').forEach(b => b.onclick = () => nav[b.dataset.n]());
  window.onkeydown = e => {
    if (e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowLeft') nav.prev(); else if (e.key === 'ArrowRight') nav.next();
    else if (e.key === 'Home') nav.first(); else if (e.key === 'End') nav.last(); else return;
    e.preventDefault();
  };
  // What the AI coach sees: the whole graded game, plus fresh Stockfish lines for the move on screen.
  const pov = e => {
    const s = R.myColor === 'w' ? 1 : -1;
    if (e.mate != null) return e.mate === 0 ? 'checkmate' : `mate in ${Math.abs(e.mate)} ${e.mate * s > 0 ? 'for' : 'against'} the player`;
    return `${e.cp * s > 0 ? '+' : ''}${((e.cp * s) / 100).toFixed(1)}`;
  };
  $('.b-ask').onclick = () => openChat(idx >= 0 ? 'Explain this move' : 'What did you think of this game?');
  setPage({
    chips: ['Explain this move', 'What did you think of this game?', 'What should I learn from this game?'],
    async info() {
      const me = R.myColor, opp = me === 'w' ? 'b' : 'w';
      const graded = R.plies.map((p, i) => `${i % 2 ? '' : Math.floor(i / 2) + 1 + '. '}${p.san}(${p.cls})`).join(' ');
      let s = `Game Review page. ${R.white} (${R.wr ?? '?'}) vs ${R.black} (${R.br ?? '?'}), result ${R.result}. The player was ${me === 'w' ? 'White' : 'Black'}. Accuracy: player ${Math.round(R.accuracy[me])}%, opponent ${Math.round(R.accuracy[opp])}%.${R.opening ? ` Opening: ${R.opening.slice(4)}.` : ''}
Whole game with Stockfish grades: ${graded}
`;
      if (idx < 0) return s + 'They are looking at the game overview (before move 1).';
      const p = R.plies[idx];
      const [before, after] = await Promise.all([analyse(R.fens[idx], { depth: 12, multipv: 3 }), analyse(R.fens[idx + 1], { depth: 12 })]);
      const bestLine = before?.lines.find(l => l.pv[0] === p.best); // only a line that starts with the review's best move
      s += `They are looking at move ${Math.floor(idx / 2) + 1}${idx % 2 ? '...' : '.'} ${p.san}, played by ${p.color === me ? 'the player' : 'the opponent'}, graded "${p.cls}". Review note: "${p.note}"
Evaluation before the move: ${pov(R.evals[idx])}; after it: ${pov(R.evals[idx + 1])}.
`;
      if (p.bestSan && p.uci !== p.best) s += `Stockfish's best move there was ${p.bestSan}${bestLine ? `; best line: ${sanLine(R.fens[idx], bestLine.pv)}` : ''}.
`;
      if (after?.lines[0]?.pv) s += `Stockfish's best continuation after ${p.san}: ${sanLine(R.fens[idx + 1], after.lines[0].pv)}.
`;
      return s + `Position after the move (FEN): ${R.fens[idx + 1]}`;
    },
  });
  if (flipped) board.flip();
  go(-1);
  if (fresh) sfx.win();
}
