// Coach home (the dojo): your belt and exactly what earns the next one, Coach Knox, today's session, and recurring weaknesses.
import { coachBox, say, sfx } from './coach.js';
import { nextLesson, doneSet } from './learn.js';
import { ALL_LESSONS } from './lessons-data.js';
import { THEMES, mistakes } from './puzzles.js';
import { reviewLatest } from './review.js';
import * as store from './store.js';
import { openChat, dailyNote } from './ai-coach.js';
import { rank, beltSvg, playerStats, today } from './belts.js';
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

export function coachHome(view) {
  const games = store.get('games', []);
  const st = playerStats();
  const r = rank(st);
  const weak = weaknesses();
  const top = weak[0];
  const due = mistakes().filter(m => !m.due || m.due <= Date.now()).length;
  const user = store.get('username', '');
  const theme = top?.theme ?? 'mix';
  const lessonTitle = id => ALL_LESSONS.find(l => l.id === id)?.title;
  const t = today();

  // Promotion and new stripes since this device last showed the belt.
  const seen = store.get('beltSeen', null);
  const promoted = seen && r.level > seen.level;
  const fresh = !seen || promoted ? 0 : Math.max(0, r.earned - seen.stripes);
  store.set('beltSeen', { level: r.level, stripes: r.earned });

  // The session: the next belt's lesson first, then the weak spot, your own mistakes, and your newest game.
  const beltLesson = r.stripes.find(s => !s.ok && s.go.startsWith('#/learn/'));
  const lesson = beltLesson ? ALL_LESSONS.find(l => '#/learn/' + l.id === beltLesson.go) : nextLesson();
  const steps = [
    due && { href: '#/puzzles?mode=mistakes', t: `Warm up: ${Math.min(due, 5)} position${due > 1 ? 's' : ''} from your own games`, m: 'Spaced repetition: they come back until you get them right twice', ok: (t.drilled ?? 0) >= Math.min(due, 5) },
    lesson && (t.lesson
      ? { href: `#/learn/${lesson.id}`, t: 'Lesson done today', m: `Want more? Next up: ${lesson.title}`, ok: true }
      : { href: `#/learn/${lesson.id}`, t: `Lesson: ${lesson.title}`, m: beltLesson ? `A stripe toward ${r.next.name}` : 'About 5 minutes', ok: false }),
    { href: `#/puzzles?theme=${theme}`, t: `10 puzzles: ${THEMES[theme]?.label ?? 'Mixed'}`, m: top ? `Your weak spot: ${top.label.toLowerCase()}` : 'Sharpen your eye', ok: t.solved >= 10, prog: Math.min(t.solved, 10) + '/10' },
    { btn: 'b-latest', t: 'Review your newest game', m: user ? `Pulls it from ${store.get('source', 'chesscom') === 'lichess' ? 'Lichess' : 'chess.com'} and finds your mistakes` : 'Add your username on the Review page', ok: t.reviewed },
  ].filter(Boolean);

  const firstOpen = r.stripes.find(s => !s.ok);
  const stripeRow = s => `<li class="${s.ok ? 'ok' : ''}">
      <span class="tick">${icon(s.ok ? 'check' : 'lock')}</span>
      <span class="lbl">${esc(s.label)}${!s.ok && s.need ? `<small>${s.have} / ${s.need}</small>` : ''}</span>
      ${s.ok ? '<span class="done">Earned</span>' : `<a class="btn sm ${s === firstOpen ? 'primary' : ''}" href="${s.go}">Go ${icon('arrow')}</a>`}</li>`;

  view.innerHTML = `<div class="page home">
    <section class="dojo">
      <div class="rankcard ${promoted ? 'promoted' : ''}" style="--belt:${r.belt.color};--belt-ink:${r.belt.ink}">
        <div class="rank-head">
          <h1 class="rankname">${r.belt.name}</h1>
          <p class="rank-about">${promoted ? 'Promoted! ' : ''}${esc(r.belt.about)}</p>
        </div>
        ${beltSvg(r.belt, r.earned, { width: 640, height: 44, cls: 'belt big', fresh })}
        ${r.next ? `<div class="rank-next">
          <h2>Next: ${r.next.name} <span class="count">${r.earned} of 4 stripes</span></h2>
          <ol class="stripes">${r.stripes.map(stripeRow).join('')}</ol>
        </div>` : '<p class="rank-about">Every belt earned. Keep reviewing your games and fixing your mistakes.</p>'}
      </div>
      <aside class="coachcol">
        <div class="coachslot"></div>
        <div class="note" hidden></div>
        <button class="b-talk">${icon('chat')} Talk to your coach</button>
        <dl class="numbers">
          <div><dt>Puzzle rating</dt><dd>${st.rating}</dd></div>
          <div><dt>Puzzles solved</dt><dd>${st.solved}</dd></div>
          <div><dt>Lessons</dt><dd>${st.done.size}<small>/${ALL_LESSONS.length}</small></dd></div>
          <div><dt>${games.length ? `Accuracy, last ${Math.min(games.length, 5)} game${Math.min(games.length, 5) === 1 ? '' : 's'}` : 'Accuracy (review a game)'}</dt><dd>${st.acc ?? '–'}${st.acc != null ? '<small>%</small>' : ''}</dd></div>
        </dl>
      </aside>
    </section>

    <section>
      <h2>Today's session</h2>
      <ol class="session">${steps.map(s => {
        const inner = `<span class="n">${s.ok ? icon('check') : ''}</span><span class="txt"><span class="t">${esc(s.t)}</span><span class="m">${esc(s.m)}</span></span>${s.prog && !s.ok ? `<span class="prog">${s.prog}</span>` : ''}${icon('arrow', 'go')}`;
        return `<li class="${s.ok ? 'ok' : ''}">${s.btn ? `<button class="srow ${s.btn}">${inner}</button>` : `<a class="srow" href="${s.href}">${inner}</a>`}</li>`;
      }).join('')}</ol>
    </section>

    ${weak.length ? `<section><h2>What I've noticed in your games</h2><div class="weak">${weak.slice(0, 3).map(w => `<article class="weakrow">
      <h3>${w.label} <span class="count">${w.n}× in your last ${Math.min(games.length, 10)} games</span></h3><p>${w.advice}</p>
      <div class="row"><a class="btn" href="#/learn/${w.lesson}">${icon('book')} ${lessonTitle(w.lesson) ?? 'Openings'}</a><a class="btn primary" href="#/puzzles?theme=${w.theme}">${icon('puzzle')} Train ${THEMES[w.theme]?.label ?? w.theme}</a></div></article>`).join('')}</div></section>` : ''}
  </div>`;
  view.querySelector('.coachslot').append(coachBox());
  view.querySelector('.b-talk').onclick = () => openChat();

  view.querySelector('.b-latest').onclick = async () => {
    if (!user) { location.hash = '#/review'; return; }
    say('Fetching your newest game...');
    try { await reviewLatest(); } catch (e) { say(`I couldn't load your games: ${e.message}`); }
  };

  const nextStripe = r.stripes.find(s => !s.ok);
  let msg;
  if (promoted) msg = `Promotion! You earned your ${r.belt.name}. ${r.next ? `Now let's go for ${r.next.name}.` : ''}`;
  else if (!games.length && !st.done.size) msg = "Hey, I'm Coach Knox, and this is your dojo. You start as a white belt. Earn four stripes to get each new belt. Your first stripe is the lesson on how the pieces move.";
  else if (top) msg = `Welcome back. In your games, the thing that keeps costing you is ${top.label.toLowerCase()}. ${top.advice}`;
  else if (nextStripe) msg = `Welcome back. You're ${4 - r.earned} stripe${4 - r.earned > 1 ? 's' : ''} from ${r.next.name}. Next stripe: ${nextStripe.label.toLowerCase()}.`;
  else msg = "Welcome back. Review a chess.com game and I'll find your weak spots.";
  say(msg, promoted ? 'happy' : '');
  if (promoted || fresh) sfx.win();

  // The AI coach's note for today, when you've connected it.
  const note = view.querySelector('.note');
  dailyNote().then(n => {
    if (!n || !view.isConnected) return;
    note.innerHTML = `<p>${n.html}</p>${n.links.length ? `<div class="msg-links">${n.links.map(([h, l]) => `<a class="btn sm" href="${h}">${l}</a>`).join('')}</div>` : ''}`;
    note.hidden = false;
  }).catch(() => {});
}
