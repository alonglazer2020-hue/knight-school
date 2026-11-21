// Checks accounts + account sync against a fake Firebase (no network, no real accounts): node tools/check-auth.mjs
const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k), key: i => [...mem.keys()][i], get length() { return mem.size; } };
globalThis.document = { addEventListener() {} };
// (Node has its own navigator; onLine is only read on errors)

const users = new Map(), docs = new Map(), seen = [];
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, o = {}) => {
  url = String(url); seen.push(url.split('?')[0] + ' ' + (o.headers?.Authorization ?? ''));
  const body = o.body && o.headers?.['Content-Type'] === 'application/json' ? JSON.parse(o.body) : null;
  if (url.includes('accounts:signUp')) {
    if (users.has(body.email)) return json(400, { error: { message: 'EMAIL_EXISTS' } });
    users.set(body.email, body.password);
    return json(200, { localId: 'uid-' + users.size, idToken: 'tok', refreshToken: 'ref', expiresIn: '3600' });
  }
  if (url.includes('accounts:signInWithPassword')) {
    if (users.get(body.email) !== body.password) return json(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } });
    return json(200, { localId: 'uid-1', idToken: 'tok', refreshToken: 'ref', expiresIn: '3600' });
  }
  if (url.includes('securetoken')) return json(200, { user_id: 'uid-1', id_token: 'tok2', refresh_token: 'ref2', expires_in: '3600' });
  if (url.includes('api.chess.com')) return json(200, url.endsWith('/stats') ? {} : url.endsWith('/archives') ? { archives: [] } : { username: 'tester' });
  if (url.includes(':commit')) { for (const w of body.writes) docs.set(w.update.name, w.update.fields); return json(200, {}); }
  if (url.includes('/documents/users/')) {
    if (o.headers?.Authorization !== 'Bearer tok' && o.headers?.Authorization !== 'Bearer tok2') return json(403, {});
    return json(200, { documents: [...docs].filter(([n]) => n.includes('/users/uid-1/')).map(([name, fields]) => ({ name, fields })) });
  }
  return json(404, {});
};

const auth = await import('../js/auth.js');
const sync = await import('../js/sync.js');
const store = await import('../js/store.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const err = async (p, re, m) => { try { await p; assert(false, m); } catch (e) { assert(re.test(e.message), m + ' (got: ' + e.message + ')'); } };

await err(auth.signUp('ab', 'secret1'), /chess\.com username/, 'short username rejected');
await err(auth.signUp('tester', '123'), /6 characters/, 'short password rejected');
store.set('done', ['pieces']); // progress made before signing up
await auth.signUp('Tester', 'secret1');
assert(auth.session().uid === 'uid-1' && auth.session().user === 'tester', 'session saved, username lower-cased');
assert(auth.emailOf('Tester') === 'tester@players.knightschool.dev', 'made-up email');
await sync.adoptAccount();
assert([...docs.keys()].some(n => n.includes('/users/uid-1/k/')), 'progress uploaded under the account');
assert(seen.some(s => s.includes('/documents/users/uid-1/k') && s.endsWith('Bearer tok')), 'account sync sends the login token');
await err(auth.signUp('tester', 'other12'), /already has a Knight School account/, 'name taken');

auth.signOut();
assert(!auth.session() && store.get('done', null) === null, 'sign out clears progress from the device');
await err(auth.signIn('tester', 'wrong12'), /Wrong username or password/, 'wrong password');
await auth.signIn('tester', 'secret1');
await sync.adoptAccount();
assert(JSON.stringify(store.get('done', [])) === '["pieces"]', 'signing in on a new device brings progress back');

store.set('auth', { ...auth.session(), exp: 0 }); // token expired
assert(await auth.idToken() === 'tok2', 'expired token refreshes');
console.log('auth checks passed');
