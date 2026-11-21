// The belt system: your level, worked out from what you've actually done (lessons, puzzles, reviewed games, fixed mistakes).
// Nothing is stored except what the rest of the site already saves, so the belt syncs between devices for free.
// DOM-free so tools can check it.
import * as store from './store.js';

// Each belt is earned with four stripes. A stripe is one requirement: { label, done(stats), go: link to work on it, progress }
const lesson = (id, label) => ({ label: `Lesson: ${label}`, test: s => s.done.has(id), go: `#/learn/${id}` });
const anyLesson = (ids, label) => ({ label, test: s => ids.some(id => s.done.has(id)), go: '#/learn' });
const solved = n => ({ label: `Solve ${n} puzzles`, test: s => s.solved >= n, go: '#/puzzles', have: s => s.solved, need: n });
const rating = n => ({ label: `Puzzle rating ${n}`, test: s => s.rating >= n, go: '#/puzzles', have: s => s.rating, need: n });
const reviews = n => ({ label: `Review ${n} of your games`, test: s => s.games >= n, go: '#/review', have: s => s.games, need: n });
const fixed = n => ({ label: `Fix ${n} of your own mistakes`, test: s => s.fixed >= n, go: '#/puzzles?mode=mistakes', have: s => s.fixed, need: n });
const accuracy = n => ({ label: `${n}% average accuracy (last 5 games)`, test: s => s.acc != null && s.games >= 5 && s.acc >= n, go: '#/review', have: s => s.acc ?? 0, need: n });

export const BELTS = [
  { id: 'white', name: 'White belt', color: '#F2EFE8', ink: '#1B2033', about: 'Everyone starts here.' },
  { id: 'yellow', name: 'Yellow belt', color: '#F2C230', ink: '#2A2106', about: 'You know the rules.', need: [lesson('pieces', 'How the pieces move'), lesson('check', 'Check & checkmate'), lesson('special', 'Special moves'), solved(5)] },
  { id: 'orange', name: 'Orange belt', color: '#F08A24', ink: '#2B1604', about: "You don't give pieces away.", need: [lesson('values', 'Piece values'), lesson('principles', 'Opening principles'), lesson('scholar-defense', "Stopping Scholar's Mate"), solved(25)] },
  { id: 'green', name: 'Green belt', color: '#3FA34D', ink: '#08210C', about: 'You see tactics.', need: [lesson('fork', 'The fork'), lesson('pin', 'Pins & skewers'), lesson('discovered', 'Discovered attacks'), rating(1000)] },
  { id: 'blue', name: 'Blue belt', color: '#2F7DE1', ink: '#FFFFFF', about: 'You finish games and learn from them.', need: [lesson('mates', 'Must-know checkmates'), lesson('endgame', 'Pawn races'), reviews(3), fixed(5)] },
  { id: 'purple', name: 'Purple belt', color: '#8A4FD8', ink: '#FFFFFF', about: 'You have a repertoire.', need: [anyLesson(['italian', 'london', 'queens-gambit'], 'An opening for White'), anyLesson(['caro-kann', 'slav'], 'A defense for Black'), rating(1200), reviews(10)] },
  { id: 'brown', name: 'Brown belt', color: '#8B5A2B', ink: '#FFFFFF', about: 'You play clean games.', need: [rating(1400), accuracy(70), fixed(25), solved(250)] },
  { id: 'black', name: 'Black belt', color: '#16161A', ink: '#FFFFFF', about: 'Knight School master.', need: [rating(1600), accuracy(80), fixed(60), solved(500)] },
];

export function playerStats() {
  const pst = store.get('pstats', {});
  const games = store.get('games', []);
  const recent = games.slice(0, 5);
  return {
    done: new Set(store.get('done', [])),
    solved: pst.solved ?? 0,
    fixed: pst.fixed ?? 0,
    rating: Math.round(store.get('prating', 800)),
    games: games.length,
    acc: recent.length ? Math.round(recent.reduce((s, g) => s + g.acc, 0) / recent.length) : null,
  };
}

// { belt, next, stripes: [{label, ok, go, have, need}] for the next belt, level: 0-7 }
export function rank(stats = playerStats()) {
  let level = 0;
  while (level + 1 < BELTS.length && BELTS[level + 1].need.every(r => r.test(stats))) level++;
  const next = BELTS[level + 1] ?? null;
  const stripes = (next?.need ?? []).map(r => ({ label: r.label, ok: r.test(stats), go: r.go, have: r.have?.(stats), need: r.need }));
  return { level, belt: BELTS[level], next, stripes, earned: stripes.filter(s => s.ok).length };
}

// The belt as an SVG: a cloth band in the belt colour and a black rank bar holding up to four white tape stripes.
// (Black belt's bar is red, like the real thing.)
export function beltSvg(belt, stripes = 0, { width = 320, height = 34, cls = 'belt', fresh = 0 } = {}) {
  const bar = belt.id === 'black' ? '#C8312A' : '#16161A';
  const edge = belt.id === 'white' ? '#C9C3B4' : 'rgba(0,0,0,.28)';
  const barX = width * 0.64, barW = width * 0.24, tapeW = Math.max(4, barW / 11);
  const tapes = Array.from({ length: 4 }, (_, i) =>
    `<rect class="tape ${i < stripes ? 'on' : ''} ${i < stripes && i >= stripes - fresh ? 'new' : ''}" x="${barX + barW - (i + 1) * tapeW * 2.1}" y="0" width="${tapeW}" height="${height}" fill="#F4F1EA"/>`).join('');
  return `<svg class="${cls}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${belt.name}, ${stripes} of 4 stripes">
    <rect width="${width}" height="${height}" fill="${belt.color}"/>
    <rect y="${height * 0.22}" width="${width}" height="1" fill="${edge}"/><rect y="${height * 0.78 - 1}" width="${width}" height="1" fill="${edge}"/>
    <rect x="${barX}" width="${barW}" height="${height}" fill="${bar}"/>${belt.id === 'black' ? '' : tapes}
  </svg>`;
}

// Today's counters for the daily session ({ d: date, solved, fixed, lesson, reviewed }); resets each day.
export function today() {
  const t = store.get('today', null), d = new Date().toDateString();
  return t?.d === d ? t : { d, solved: 0, fixed: 0, lesson: false, reviewed: false };
}
export function bumpToday(key, v = 1) {
  const t = today();
  t[key] = typeof v === 'number' ? (t[key] ?? 0) + v : v;
  store.set('today', t);
}

// "Stripe earned!" / "Promotion!" line, comparing the rank before an action with now ('' when nothing changed).
export function stripeNews(before) {
  const now = rank();
  if (now.level > before.level) return ` Promotion! You just earned your ${now.belt.name}.`;
  if (now.earned > before.earned && now.next) return ` Stripe earned: ${now.earned} of 4 toward your ${now.next.name}.`;
  return '';
}
