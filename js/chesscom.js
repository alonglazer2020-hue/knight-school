// chess.com account link through the free public API (api.chess.com/pub): profile, ratings and every game.
// "Signing in" = telling us your chess.com username. Nothing private is needed or stored; the public API has no passwords.
// The username syncs between devices; ratings and the game index are re-fetched on each device (kept out of sync).
import * as store from './store.js';

const API = 'https://api.chess.com/pub/player/';
const esc = encodeURIComponent;
const get = async url => {
  const r = await fetch(url);
  if (r.status === 404) throw new Error('NOT_FOUND');
  if (!r.ok) throw new Error(`chess.com said ${r.status}`);
  return r.json();
};

export const account = () => store.get('chesscom', null);          // { username, avatar, name, joined, url }
export const stats = () => store.get('ccStats', null);             // { rapid, blitz, bullet, daily: {r, best, w, l, d}, puzzles }
export const games = () => store.get('ccGames', []);               // newest first, see compact() below
export const lastSync = () => store.get('ccSync', 0);

export async function signIn(username) {
  const u = String(username).trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,25}$/.test(u)) throw new Error('That doesn\'t look like a chess.com username (letters, numbers, _ and -).');
  let p;
  try { p = await get(API + esc(u)); } catch (e) {
    throw new Error(e.message === 'NOT_FOUND' ? `chess.com has no player called "${username}".` : "Couldn't reach chess.com. Check your internet and try again.");
  }
  store.set('chesscom', { username: p.username ?? u, avatar: p.avatar ?? '', name: p.name ?? '', joined: (p.joined ?? 0) * 1000, url: p.url ?? `https://www.chess.com/member/${u}` });
  store.set('username', p.username ?? u); store.set('source', 'chesscom'); // the Review page's game import uses these
  store.del('ccGames'); store.del('ccMonths'); store.del('ccStats');
  await refresh();                      // recent months first, so the site is usable right away
  refresh(true).catch(() => {});        // then every older month in the background
  return true;
}
export function signOut() {
  for (const k of ['chesscom', 'ccGames', 'ccMonths', 'ccStats', 'ccSync']) store.del(k);
}

const rec = s => s && { r: s.last?.rating, best: s.best?.rating, w: s.record?.win ?? 0, l: s.record?.loss ?? 0, d: s.record?.draw ?? 0 };

// One game, small enough to keep thousands: { key, t, tc, ctl, c, me, opp, oppR, res, how, open }
function compact(g, me) {
  const c = g.white.username.toLowerCase() === me ? 'w' : 'b';
  const mine = c === 'w' ? g.white : g.black, them = c === 'w' ? g.black : g.white;
  const res = mine.result === 'win' ? 'W' : ['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient'].includes(mine.result) ? 'D' : 'L';
  const open = (g.eco ?? '').split('/openings/')[1]?.replace(/-/g, ' ').replace(/\s\d.*$/, '') ?? '';
  return { key: g.url, t: g.end_time * 1000, tc: g.time_class, ctl: g.time_control, c, me: mine.rating, opp: them.username, oppR: them.rating, res, how: res === 'W' ? them.result : mine.result, open };
}

let running = null;
// Pull ratings and new games. Past months never change, so each is downloaded once; the current month every time.
export function refresh(full = false) {
  const acc = account();
  if (!acc) return Promise.resolve(false);
  running ??= (async () => {
    const me = acc.username.toLowerCase();
    const s = await get(API + esc(me) + '/stats');
    store.set('ccStats', { rapid: rec(s.chess_rapid), blitz: rec(s.chess_blitz), bullet: rec(s.chess_bullet), daily: rec(s.chess_daily), puzzles: s.tactics?.highest?.rating ?? null });
    const { archives = [] } = await get(API + esc(me) + '/games/archives');
    const done = new Set(store.get('ccMonths', []));
    const byKey = new Map(games().map(g => [g.key, g]));
    const todo = archives.filter((u, i) => i === archives.length - 1 || !done.has(u)).reverse(); // newest first
    for (const url of full ? todo : todo.slice(0, 3)) {
      if (full && byKey.size >= 5000) break; // a full sync walks every month; quick syncs only the latest few
      const a = await get(url);
      if (account()?.username.toLowerCase() !== me) return false; // signed out or switched while downloading
      for (const g of a.games ?? []) if (g.rules === 'chess' && g.white && g.black) byKey.set(g.url, compact(g, me));
      if (url !== archives.at(-1)) done.add(url);
      // shortcut: keeps the newest 5000 games (~1 MB) so localStorage never fills; move to IndexedDB if more history is needed
      store.set('ccGames', [...byKey.values()].sort((x, y) => y.t - x.t).slice(0, 5000));
      store.set('ccMonths', [...done]);
    }
    store.set('ccSync', Date.now());
    return true;
  })().finally(() => { running = null; });
  return running;
}
export const syncing = () => !!running;

// The full PGN of one game, fetched from its month's archive when the Review page needs it.
export async function pgnOf(key) {
  const g = games().find(x => x.key === key);
  if (!g) return null;
  const d = new Date(g.t);
  const a = await get(`${API}${esc(account().username.toLowerCase())}/games/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  return a.games?.find(x => x.url === key)?.pgn ?? null;
}

// ---- Elo views ----
// Your main time control: the one you chose in Settings, else the one you played most in the last 60 days.
export function mainTc() {
  const pick = store.get('mainTc', 'auto');
  if (pick !== 'auto') return pick;
  const since = Date.now() - 60 * 864e5, n = {};
  for (const g of games()) if (g.t > since && g.tc !== 'daily') n[g.tc] = (n[g.tc] ?? 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] ?? (stats()?.rapid?.r ? 'rapid' : stats()?.blitz?.r ? 'blitz' : 'rapid');
}
// Rating after each game in one time control, oldest first: [{ t, r }]
export const history = (tc = mainTc()) => games().filter(g => g.tc === tc && g.me).map(g => ({ t: g.t, r: g.me })).reverse();
// Rating change over the last `days` in that time control.
export function change(tc = mainTc(), days = 30) {
  const h = history(tc), since = Date.now() - days * 864e5;
  const before = [...h].reverse().find(x => x.t < since) ?? h.find(x => x.t >= since);
  return h.length && before ? h.at(-1).r - before.r : 0;
}
