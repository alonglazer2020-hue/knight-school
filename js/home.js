// Coach home: your chess.com Elo and its trend, the next goal, Coach Knox, today's plan, recent games and what keeps costing you.
import { coachBox, say, sfx } from './coach.js';
import { nextLesson, doneSet } from './learn.js';
import { ALL_LESSONS } from './lessons-data.js';
import { THEMES, mistakes } from './puzzles.js';
import { gameRows, bindGameRows, reviewChesscom } from './review.js';
import * as store from './store.js';
import { openChat, dailyNote } from './ai-coach.js';
import { level, levelNews, today } from './levels.js';
import { account, stats, games as ccGames, history, lastSync, syncing } from './chesscom.js';
import { signInForm, accountForm } from './settings.js';
import { icon } from './icons.js';

const WEAK = {
  'hung': { label: 'Hanging pieces', theme: 'hangingPiece', lesson: 'values', advice: 'Before every move, do a blunder check: which of my pieces are attacked, and are they defended?' },
  'allowed-fork': { label: 'Walking into forks', theme: 'fork', lesson: 'fork', advice: "Watch the enemy knights and queen. Before you move, ask: can they jump to a square that hits two of my pieces?" },
  'missed-fork': { label: 'Missing forks', theme: 'fork', lesson: 'fork', advice: 'Every move, look for one piece that could attack two targets at once.' },
  'allowed-mate': { label: 'King safety', theme: 'mateIn2', lesson: 'mates', advice: 'Castle early and keep pawns in front of your king. When your opponent has checks, look at all of them.' },
  'missed-mate': { label: 'Missing checkmates', theme: 'mateIn2', lesson: 'mates', advice: 'Checks first! Before anything else, look at every check you can give.' },
  'missed-win': { label: 'Missing tactics', theme: 'mix', lesson: 'pin', advice: 'Scan for Checks, Captures and Threats, in that order, every single move.' },
  'allowed-tactic': { label: 'Tactical blind spots', theme: 'discoveredAttack', lesson: 'discovered', advice: 'Before you move, ask: what does my opponent want to do next?' },
  'positional': { label: 'Planning', theme: 'mix', lesson: 'principles', advice: 'Follow the opening principles, then improve your worst piece every move.' },
};

export function weaknesses() {
  const games = store.get('games', []).slice(0, 10);
  const tally = {};
  for (const g of games) for (const [t, n] of Object.entries(g.tags ?? {})) tally[t] = (tally[t] ?? 0) + n;
  const early = games.reduce((s, g) => s + (g.early ?? 0), 0);
  const list = Object.entries(tally).filter(([t]) => WEAK[t]).map(([t, n]) => ({ ...WEAK[t], n })).sort((a, b) => b.n - a.n);
  if (early >= 2) list.push({ label: 'The opening', theme: 'opening', lesson: 'italian', advice: 'You often go wrong in the first 10 moves. Learn one opening for White and one for Black.', n: early });
  return list.sort((a, b) => b.n - a.n);
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ago = x => { const m = Math.round((Date.now() - x) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };
const cap = s => s[0].toUpperCase() + s.slice(1);

// The rating trend over the last games, as a small line chart.
function spark(h) {
  if (h.length < 2) return '';
  const lo = Math.min(...h.map(x => x.r)), hi = Math.max(...h.map(x => x.r)), w = 240, ht = 64;
  const pts = h.map((x, i) => `${((i / (h.length - 1)) * w).toFixed(1)},${(ht - 4 - ((x.r - lo) / Math.max(hi - lo, 1)) * (ht - 8)).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${ht}" preserveAspectRatio="none" role="img" aria-label="Rating over your last ${h.length} games, from ${h[0].r} to ${h.at(-1).r}">
    <polygon points="0,${ht} ${pts} ${w},${ht}" class="area"/><polyline points="${pts}" class="line"/></svg>`;
}

export function coachHome(view) {
  const acc = account(), st = stats(), lv = level();
  const weak = weaknesses(), top = weak[0];
  const due = mistakes().filter(m => !m.due || m.due <= Date.now()).length;
  const t = today(), done = doneSet(), recent = ccGames().slice(0, 6);
  const theme = top?.theme ?? lv.band.themes[0] ?? 'mix';
  const lesson = nextLesson(), bandLesson = lesson && lv.band.lessons.includes(lesson.id);

  // The plan: your newest unreviewed game, your own mistakes, puzzles on the weak spot, then a lesson for your Elo.
  const newest = recent[0], unreviewed = newest && !store.get('rv.' + newest.key, null);
  const target = recent.find(g => !store.get('rv.' + g.key, null)); // the newest game you haven't reviewed yet
  const steps = [
    target && { act: 'review', ic: 'chart', t: target === newest ? 'Review your last game' : 'Review a recent game', m: `${target.res === 'W' ? 'Won' : target.res === 'L' ? 'Lost' : 'Draw'} vs ${target.opp} · ${cap(target.tc)} · ${ago(target.t)} · about 5 min`, ok: false },
    acc && !target && recent.length && { href: '#/review', ic: 'chart', t: 'All recent games reviewed', m: 'Play a game on chess.com and it shows up here', ok: true },
    !acc && { href: '#/review', ic: 'chart', t: 'Review a game', m: 'Connect chess.com above, or paste a game on the Review page', ok: t.reviewed },
    due && { href: '#/puzzles?mode=mistakes', ic: 'retry', t: `Fix ${Math.min(due, 5)} mistake${due > 1 ? 's' : ''} from your games`, m: 'They come back until you solve them twice · about 5 min', ok: (t.drilled ?? 0) >= Math.min(due, 5) },
    { href: `#/puzzles?theme=${theme}`, ic: 'puzzle', t: `10 puzzles: ${THEMES[theme]?.label ?? 'Mixed'}`, m: `${top ? `Your weak spot: ${top.label.toLowerCase()}` : `Picked for ${lv.rating} Elo`} · about 10 min`, ok: t.solved >= 10, prog: `${Math.min(t.solved, 10)}/10` },
    lesson && { href: `#/learn/${lesson.id}`, ic: 'book', t: `Lesson: ${lesson.title}`, m: `${bandLesson ? `For your level: ${lv.band.focus.toLowerCase()}` : 'Next lesson for your level'} · about 5 min`, ok: t.lesson },
  ].filter(Boolean);
  const firstOpen = steps.find(x => !x.ok);
  const others = acc && st ? ['rapid', 'blitz', 'bullet', 'daily'].filter(x => x !== lv.tc && st[x]?.r).slice(0, 3) : [];
  const d = lv.delta;

  view.innerHTML = `<div class="page home">
    <header class="welcome">
      <h1>${acc ? `Welcome back, ${esc(acc.username)}` : 'Welcome to Knight School'}</h1>
      ${acc ? `<span class="pill">${icon('check')} Connected to chess.com</span><span class="m synced">${syncing() ? 'Loading your games…' : `Games synced ${ago(lastSync())}`}</span>` : ''}
    </header>

    ${acc ? '' : `<section class="card connect"><div><h2>Sign in with your chess.com username</h2>
      <p class="sub">Make a free Knight School account with your chess.com username and a password. Knight School pulls in your Elo and every game you play, builds your training from them, and your progress follows you to every device.</p>
      <details class="quick"><summary>No account? Just connect your chess.com username</summary><div class="quickslot"></div></details></div><div class="formslot"></div></section>`}

    <section class="card ratings">
      <div class="main-rating">
        <span class="lbl">${lv.label}${acc ? '' : ' · Knight School'}</span>
        <div class="big"><b>${lv.rating}</b>${d != null ? `<span class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)} this month</span>` : ''}</div>
        ${spark(history(lv.tc).slice(-30))}${history(lv.tc).length > 1 ? `<div class="spark-cap"><span>${Math.min(history(lv.tc).length, 30)} games ago</span><span>Last game</span></div>` : ''}
      </div>
      <div class="side-ratings">
        ${others.length ? `<div class="tiles">${others.map(x => `<div class="tile"><span class="lbl">${cap(x)}</span><b>${st[x].r}</b><small>best ${st[x].best ?? '–'}</small></div>`).join('')}
          <div class="tile"><span class="lbl">Puzzle rating</span><b>${Math.round(store.get('prating', 800))}</b><small>on Knight School</small></div></div>` : ''}
        <div class="goal">
          <div class="goal-head"><span>Next goal: <b>${lv.goal}</b></span><span class="m">${lv.toGo} to go</span></div>
          <div class="bar" role="progressbar" aria-label="Progress to ${lv.goal}" aria-valuemin="${lv.prev}" aria-valuemax="${lv.goal}" aria-valuenow="${lv.rating}"><i style="width:${lv.pct}%"></i></div>
          <div class="goal-foot"><span>${lv.prev}</span><span class="focus">${lv.band.name}: ${lv.band.focus.toLowerCase()}</span><span>${lv.goal}</span></div>
        </div>
      </div>
    </section>

    <div class="cols">
      <div class="col">
        <section class="card knox"><div class="coachslot"></div><div class="note" hidden></div><button class="b-talk">${icon('chat')} Ask coach</button></section>
        <section class="card"><div class="card-head"><h2>Today's plan</h2><span class="m">${steps.filter(x => x.ok).length} of ${steps.length} done</span></div>
          <ol class="plan">${steps.map(x => `<li class="${x.ok ? 'ok' : ''}"><span class="pi">${icon(x.ok ? 'check' : x.ic)}</span>
            <span class="txt"><b>${esc(x.t)}</b><small>${esc(x.m)}</small></span>${x.prog && !x.ok ? `<span class="prog">${x.prog}</span>` : ''}
            ${x.href ? `<a class="btn ${x === firstOpen ? 'primary' : ''}" href="${x.href}">${x.ok ? 'Again' : 'Start'}</a>` : `<button class="act-${x.act} ${x === firstOpen ? 'primary' : ''}">Start</button>`}</li>`).join('')}</ol>
          <p class="err plan-err" role="status"></p></section>
      </div>
      <div class="col">
        ${acc ? `<section class="card"><div class="card-head"><h2>Recent games</h2><a class="m" href="#/review">See all</a></div>
          ${recent.length ? `<ol class="gamelist">${gameRows(recent)}</ol>` : '<p class="sub">No games yet. Play one on chess.com and it shows up here.</p>'}</section>` : ''}
        <section class="card"><div class="card-head"><h2>What keeps costing you</h2>${weak.length ? `<span class="m">last ${Math.min(store.get('games', []).length, 10)} reviewed games</span>` : ''}</div>
          ${weak.length ? weak.slice(0, 3).map(w => `<article class="weakrow"><h3>${w.label} <span class="count">${w.n}×</span></h3><p>${w.advice}</p>
            <div class="row"><a class="btn sm" href="#/learn/${w.lesson}">${icon('book')} ${ALL_LESSONS.find(l => l.id === w.lesson)?.title ?? 'Lesson'}</a><a class="btn sm" href="#/puzzles?theme=${w.theme}">${icon('puzzle')} ${THEMES[w.theme]?.label ?? w.theme} puzzles</a></div></article>`).join('')
          : '<p class="sub">Review a few of your games and I\'ll find the mistakes you keep repeating.</p>'}</section>
      </div>
    </div>
  </div>`;
  const $ = q => view.querySelector(q);
  $('.coachslot').append(coachBox());
  $('.b-talk').onclick = () => openChat();
  const reroute = () => dispatchEvent(new HashChangeEvent('hashchange')); // redraw sidebar and page
  if (!acc) { $('.formslot').append(accountForm(reroute)); $('.quickslot').append(signInForm(reroute)); }
  const err = m => { $('.plan-err').textContent = m; };
  bindGameRows(view, err);
  $('.act-review')?.addEventListener('click', async e => {
    e.target.disabled = true; e.target.textContent = 'Loading…';
    try { await reviewChesscom(target.key); } catch (x) { err(x.message); e.target.disabled = false; e.target.textContent = 'Start'; }
  });

  const news = acc ? levelNews() : '';
  let msg;
  if (news) msg = news + ' Great work.';
  else if (!acc) msg = "Hi, I'm Coach Knox. Connect your chess.com account and I'll look at your real games, your Elo and what keeps costing you, then plan your training.";
  else if (unreviewed && newest.res === 'L') msg = `You lost your last game to ${newest.opp}. Let's review it first and find the moment it went wrong.`;
  else if (unreviewed) msg = `New game against ${newest.opp}. Let's review it while it's fresh.`;
  else if (top) msg = `In your games, the thing that keeps costing you is ${top.label.toLowerCase()}. ${top.advice}`;
  else msg = `You're ${lv.toGo} points from ${lv.goal}. At your level the focus is ${lv.band.focus.toLowerCase()}.`;
  say(msg, news ? 'happy' : '');
  if (news) sfx.win();

  // The AI coach's note for today, when it's connected.
  const note = $('.note');
  dailyNote().then(n => {
    if (!n || !view.isConnected) return;
    note.innerHTML = `<p>${n.html}</p>${n.links.length ? `<div class="msg-links">${n.links.map(([hr, l]) => `<a class="btn sm" href="${hr}">${l}</a>`).join('')}</div>` : ''}`;
    note.hidden = false;
  }).catch(() => {});
}
