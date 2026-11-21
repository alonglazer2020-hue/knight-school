// Live check of the chess.com link against a public account: node tools/check-chesscom.mjs [username]
const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k), key: i => [...mem.keys()][i], get length() { return mem.size; } };
const cc = await import('../js/chesscom.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
await cc.signIn('zz-no-such-player-q9').then(() => assert(false, 'unknown user rejected'), e => assert(/no player/.test(e.message), 'clear error for unknown user'));
const t0 = Date.now();
await cc.signIn(process.argv[2] ?? 'erik');
const s = cc.stats(), g = cc.games();
assert(cc.account().username, 'account saved');
assert(g.length > 0 && g.every(x => x.key && x.t && ['W', 'L', 'D'].includes(x.res)), 'games indexed');
assert(g[0].t >= g.at(-1).t, 'newest first');
console.log('signed in as', cc.account().username, '| main', cc.mainTc(), cc.stats()[cc.mainTc()]?.r, '| change 30d', cc.change(), '| games', g.length, '| history', cc.history().length, '|', Date.now() - t0, 'ms');
const pgn = await cc.pgnOf(g[0].key);
assert(pgn && pgn.includes('[White'), 'pgn fetched on demand');
cc.signOut(); assert(!cc.account() && !cc.games().length, 'sign out clears');
console.log('chess.com checks passed');
