// Checks the Elo level maths with fake data: node tools/check-levels.mjs
const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k), key: i => [...mem.keys()][i], get length() { return mem.size; } };
const { level, levelNews, today, bumpToday } = await import('../js/levels.js');
const set = (k, v) => localStorage.setItem('ks.' + k, JSON.stringify(v));
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };

let l = level();
assert(l.source === 'Knight School' && l.rating === 800 && l.goal === 900 && l.toGo === 100, 'signed out: puzzle rating 800, goal 900');
set('chesscom', { username: 'someone' }); set('ccStats', { rapid: { r: 742 }, blitz: { r: 615 } });
const now = Date.now(), day = 864e5;
set('ccGames', [{ key: 'b', t: now - day, tc: 'rapid', me: 742 }, { key: 'a', t: now - 40 * day, tc: 'rapid', me: 704 }]);
l = level();
assert(l.source === 'chess.com' && l.tc === 'rapid' && l.rating === 742, 'signed in: main rapid 742');
assert(l.goal === 800 && l.prev === 700 && l.toGo === 58 && l.pct === 42, 'goal 800, 58 to go');
assert(l.delta === 38 && l.band.max === 800, '+38 in 30 days, 600–800 band');
assert(levelNews() === '', 'first view: no news');
set('ccStats', { rapid: { r: 805 } });
assert(levelNews().includes('800'), 'crossing 800 is announced');
assert(levelNews() === '', 'announced once');
set('mainTc', 'blitz'); set('ccStats', { rapid: { r: 805 }, blitz: { r: 615 } });
assert(level().tc === 'blitz' && level().rating === 615, 'main rating follows the Settings choice');
bumpToday('solved'); assert(today().solved === 1, 'daily counter');
console.log('level checks passed');
