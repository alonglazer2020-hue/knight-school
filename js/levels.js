// Your level is your Elo: your chess.com rating in your main time control when you're signed in,
// otherwise your Knight School puzzle rating. Goals are the next round hundred; the training plan follows your rating band.
// DOM-free so tools can check it.
import * as store from './store.js';
import { account, stats, mainTc, change, history } from './chesscom.js';

// What players around each rating usually need next, and where on the site to train it.
export const BANDS = [
  { max: 600, name: 'Learning the game', focus: 'Rules, checkmate and not giving pieces away', lessons: ['pieces', 'check', 'special', 'values'], themes: ['hangingPiece', 'mateIn1'] },
  { max: 800, name: 'Beginner', focus: 'Stop hanging pieces, start spotting forks', lessons: ['principles', 'scholar-defense', 'fork'], themes: ['hangingPiece', 'fork'] },
  { max: 1000, name: 'Improving', focus: 'Pins, discovered attacks and mating patterns', lessons: ['pin', 'discovered', 'mates'], themes: ['pin', 'discoveredAttack', 'mateIn2'] },
  { max: 1200, name: 'Club player', focus: 'Basic endgames and one opening for each colour', lessons: ['endgame', 'italian', 'london', 'caro-kann', 'slav'], themes: ['endgame', 'backRankMate'] },
  { max: 1500, name: 'Strong club player', focus: 'Calculation and clean, blunder-free games', lessons: ['queens-gambit'], themes: ['sacrifice', 'skewer', 'trappedPiece'] },
  { max: Infinity, name: 'Advanced', focus: 'Deep calculation and long-term plans', lessons: [], themes: ['sacrifice', 'mix'] },
];
const TC = { rapid: 'Rapid', blitz: 'Blitz', bullet: 'Bullet', daily: 'Daily', puzzles: 'Puzzle' };

// { rating, source: 'chess.com'|'Knight School', tc, label, goal, prev, toGo, pct, band, delta (30 days) }
export function level() {
  const cc = account() && stats();
  const tc = cc ? mainTc() : 'puzzles';
  const rating = Math.round(cc ? stats()[tc]?.r ?? history(tc).at(-1)?.r ?? 0 : store.get('prating', 800));
  const goal = Math.floor(rating / 100) * 100 + 100, prev = goal - 100;
  return {
    rating, tc, source: cc ? 'chess.com' : 'Knight School', label: `${TC[tc] ?? tc} rating`,
    goal, prev, toGo: goal - rating, pct: Math.round((rating - prev)), band: BANDS.find(b => rating < b.max),
    delta: cc ? change(tc) : null,
  };
}

// "You reached 800!" when the rating crossed a hundred since this device last showed it ('' otherwise).
export function levelNews() {
  const l = level(), seen = store.get('levelSeen', null);
  store.set('levelSeen', { goal: l.goal, tc: l.tc });
  if (!seen || seen.tc !== l.tc || l.goal <= seen.goal) return '';
  return `You reached ${l.prev}! Next goal: ${l.goal}.`;
}

// Today's counters for the daily plan ({ d: date, solved, fixed, drilled, lesson, reviewed }); resets each day.
export function today() {
  const t = store.get('today', null), d = new Date().toDateString();
  return t?.d === d ? t : { d, solved: 0, fixed: 0, lesson: false, reviewed: false };
}
export function bumpToday(key, v = 1) {
  const t = today();
  t[key] = typeof v === 'number' ? (t[key] ?? 0) + v : v;
  store.set('today', t);
}
