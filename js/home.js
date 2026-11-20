// Coach home: reads your reviewed games, finds recurring weaknesses, and builds today's plan.
import { coachBox, say } from './coach.js';
import { nextLesson, doneSet } from './learn.js';
import { ALL_LESSONS } from './lessons-data.js';
import { THEMES, mistakes } from './puzzles.js';
import { reviewLatest } from './review.js';
import * as store from './store.js';

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

export function coachHome(view) {
  const games = store.get('games', []);
  const done = doneSet();
  const lesson = nextLesson();
  const weak = weaknesses();
  const top = weak[0];
  const ms = mistakes().length;
  const recent = games.slice(0, 5);
  const avg = recent.length ? Math.round(recent.reduce((s, g) => s + g.acc, 0) / recent.length) : null;
  const pst = store.get('pstats', { solved: 0 });
  const user = store.get('username', '');
  const theme = top?.theme ?? 'mix';
  const lessonTitle = id => ALL_LESSONS.find(l => l.id === id)?.title;

  view.innerHTML = `<div class="page home">
    <div class="hero"><div class="coachslot"></div></div>
    <div class="stats">
      <div><b>${Math.round(store.get('prating', 800))}</b><span>Puzzle rating</span></div>
      <div><b>${pst.solved}</b><span>Puzzles solved</span></div>
      <div><b>${done.size}/${ALL_LESSONS.length}</b><span>Lessons</span></div>
      <div><b>${avg ?? '–'}${avg != null ? '%' : ''}</b><span>Avg accuracy (last ${recent.length || 5})</span></div>
    </div>
    <h2>Today's plan</h2>
    <div class="plan">
      ${lesson ? `<a class="card" href="#/learn/${lesson.id}"><span class="k">1</span><span class="t">Lesson: ${lesson.title}</span><span class="m">~5 min</span></a>` : ''}
      <a class="card" href="#/puzzles?theme=${theme}"><span class="k">${lesson ? 2 : 1}</span><span class="t">10 puzzles: ${THEMES[theme]?.label ?? 'Mixed'}</span><span class="m">${top ? 'Your weak spot' : 'Warm up'}</span></a>
      ${ms ? `<a class="card" href="#/puzzles?mode=mistakes"><span class="k">★</span><span class="t">Fix ${ms} mistake${ms > 1 ? 's' : ''} from your games</span><span class="m">Your own positions</span></a>` : ''}
      <button class="card b-latest"><span class="k">♞</span><span class="t">Review your latest game</span><span class="m">${user ? 'from ' + (store.get('source', 'chesscom') === 'lichess' ? 'Lichess' : 'chess.com') : 'Add your username'}</span></button>
    </div>
    ${weak.length ? `<h2>What I've noticed</h2><div class="weak">${weak.slice(0, 3).map(w => `<div class="card col">
      <span class="t">${w.label} <em>${w.n}× in your last ${Math.min(games.length, 10)} games</em></span><p>${w.advice}</p>
      <div class="row"><a class="btn" href="#/learn/${w.lesson}">Lesson: ${lessonTitle(w.lesson) ?? 'Openings'}</a><a class="btn primary" href="#/puzzles?theme=${w.theme}">Train ${THEMES[w.theme]?.label ?? w.theme}</a></div></div>`).join('')}</div>` : ''}
  </div>`;
  view.querySelector('.coachslot').append(coachBox());

  view.querySelector('.b-latest').onclick = async () => {
    if (!user) { location.hash = '#/review'; return; }
    say('Fetching your latest game...');
    try { await reviewLatest(); } catch (e) { say(`I couldn't load your games: ${e.message}`); }
  };

  let msg;
  if (!games.length && !done.size) msg = "Hey, I'm Coach Knox! I'll teach you chess from zero. Start with the first lesson, then review your chess.com games here and I'll tell you exactly what to work on.";
  else if (top) msg = `Welcome back! Looking at your games, your biggest weakness is ${top.label.toLowerCase()}. ${top.advice} Today: ${lesson ? `a lesson on ${lesson.title}, then ` : ''}some ${THEMES[theme]?.label.toLowerCase() ?? ''} puzzles.`;
  else if (games.length) msg = `Welcome back! Your recent accuracy is ${avg}%. Keep it up: ${lesson ? `next lesson is ${lesson.title}.` : 'more puzzles today!'}`;
  else msg = `Welcome back! ${lesson ? `Next up: ${lesson.title}.` : ''} Review a chess.com game and I'll find your weak spots.`;
  say(msg);
}
