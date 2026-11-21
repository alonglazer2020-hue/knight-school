// Checks the belt maths with fake progress: node tools/check-belts.mjs
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k),
  key: i => [...mem.keys()][i], get length() { return mem.size; },
};
const { rank, stripeNews, today, bumpToday } = await import('../js/belts.js');
const set = (k, v) => localStorage.setItem('ks.' + k, JSON.stringify(v));
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };

assert(rank().belt.id === 'white' && rank().earned === 0, 'new player is a white belt with 0 stripes');
set('done', ['pieces', 'check']);
assert(rank().earned === 2 && rank().belt.id === 'white', 'two lessons = two stripes');
const before = rank();
set('done', ['pieces', 'check', 'special']); set('pstats', { solved: 5 });
assert(rank().belt.id === 'yellow', 'four stripes = yellow belt');
assert(stripeNews(before).includes('Promotion'), 'promotion is announced');
set('done', ['pieces', 'check', 'special', 'values', 'principles', 'scholar-defense', 'fork', 'pin', 'discovered']);
set('pstats', { solved: 30 }); set('prating', 990);
assert(rank().belt.id === 'orange' && rank().earned === 3, 'green needs rating 1000: orange with 3 stripes');
set('prating', 1000);
assert(rank().belt.id === 'green', 'rating 1000 earns green');
assert(today().solved === 0, 'today starts at zero'); bumpToday('solved'); bumpToday('solved');
assert(today().solved === 2, 'today counts');
console.log('belt checks passed');
