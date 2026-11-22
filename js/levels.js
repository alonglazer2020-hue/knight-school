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
  { max: 1500, name: 'Strong club player', focus: 'Calculation and clean, blunder-free games', lessons: ['remove-defender', 'back-rank', 'opposition', 'breakthrough', 'queens-gambit'], themes: ['sacrifice', 'skewer', 'trappedPiece'] },
  { max: Infinity, name: 'Advanced', focus: 'Deep calculation and long-term plans', lessons: ['smothered-combo', 'rook-endgames', 'structures'], themes: ['sacrifice', 'mix'] },
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

// Today's counters for the daily plan, stored per device ({ d: date, per: { device: { solved, lesson, ... } } })
// so two devices add up instead of overwriting each other when they sync. Resets each day.
const device = () => store.get('dev', null) ?? (store.set('dev', Math.random().toString(36).slice(2, 10)), store.get('dev'));
const perOf = (t, d) => (t?.d !== d ? {} : t.per ?? { old: t }); // { old } = a day saved before per-device counts
export function today() {
  const d = new Date().toDateString(), out = { d, solved: 0, fixed: 0, drilled: 0, lesson: false, reviewed: false };
  for (const x of Object.values(perOf(store.get('today', null), d)))
    for (const [k, v] of Object.entries(x)) if (k !== 'd') out[k] = typeof v === 'number' ? (out[k] ?? 0) + v : out[k] || v;
  return out;
}
export function bumpToday(key, v = 1) {
  const d = new Date().toDateString(), per = perOf(store.get('today', null), d), me = { ...per[device()] };
  me[key] = typeof v === 'number' ? (me[key] ?? 0) + v : v;
  store.set('today', { d, per: { ...per, [device()]: me } });
}
// Sync: keep the newer day; on the same day keep each device's fuller entry (counts only grow during a day).
export function mergeToday(a, b) {
  if (a?.d !== b?.d) return Date.parse(a?.d) >= Date.parse(b?.d) ? a : b;
  const size = x => Object.values(x ?? {}).reduce((s, v) => s + (+v || 0), 0);
  const per = { ...perOf(a, a.d) };
  for (const [k, v] of Object.entries(perOf(b, b.d))) if (size(v) > size(per[k])) per[k] = v;
  return { d: a.d, per };
}
