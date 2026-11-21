// Cross-device sync through Firestore (Firebase free plan), using its REST API, so there's no SDK to load.
// Devices share a random 20-character sync code; each saved item lives at sync/{code}/k/{item}.
// Security rules only allow access to a code's items if you know the code (no listing of codes).
import * as store from './store.js';
import { idToken, session } from './auth.js';

export const API_KEY = 'AIzaSyCdx8IKGnnyDfqfjZzvNxXYiYu1kPPody8'; // public web key by design; access is limited by Firestore rules
const PROJECT = 'knight-school-6bddd';
const DOCS = `projects/${PROJECT}/databases/(default)/documents`;
const BASE = `https://firestore.googleapis.com/v1/${DOCS}`;
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I to avoid typos; 20 chars = 100 bits

export const state = () => store.get('sync', { code: null, at: 0, error: '' });
const saveState = s => store.set('sync', s);
export const pretty = c => c.match(/.{1,4}/g).join('-');
export function normalize(input) {
  const c = String(input).toUpperCase().replace(/[^0-9A-Z]/g, '');
  return c.length === 20 && [...c].every(ch => ALPHABET.includes(ch)) ? c : null;
}
function newCode() {
  return [...crypto.getRandomValues(new Uint8Array(20))].map(b => ALPHABET[b & 31]).join('');
}
const docId = key => btoa(String.fromCharCode(...new TextEncoder().encode(key))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function pull(t) {
  const out = {};
  let page = '';
  do {
    const r = await fetch(`${BASE}/${t.path}?key=${API_KEY}&pageSize=300${page ? '&pageToken=' + encodeURIComponent(page) : ''}`, { headers: t.headers });
    if (!r.ok) throw new Error(`couldn't read your progress (${r.status})`);
    const j = await r.json();
    for (const d of j.documents ?? []) {
      const f = d.fields;
      out[f.k.stringValue] = { v: f.v?.stringValue ?? null, t: +f.t.integerValue };
    }
    page = j.nextPageToken;
  } while (page);
  return out;
}

async function push(tg, entries) {
  for (let i = 0; i < entries.length; i += 400) {
    const writes = entries.slice(i, i + 400).map(([k, v, t]) => ({
      update: {
        name: `${DOCS}/${tg.path}/${docId(k)}`,
        fields: { k: { stringValue: k }, v: v == null ? { nullValue: null } : { stringValue: v }, t: { integerValue: String(t) } },
      },
    }));
    const r = await fetch(`${BASE}:commit?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...tg.headers }, body: JSON.stringify({ writes }) });
    if (!r.ok) throw new Error(`couldn't save your progress (${r.status})`);
  }
}

// Lists that should be combined from both devices instead of "newest wins".
const byKey = cap => (a, b) => {
  const m = new Map();
  for (const x of [...b, ...a]) if (x?.key) m.set(x.key, x);
  return [...m.values()].sort((x, y) => (y.date ?? 0) - (x.date ?? 0)).slice(0, cap);
};
const UNION = {
  done: (a, b) => [...new Set([...a, ...b])],
  games: byKey(50),
  reviews: byKey(30),
};

// Where progress lives: your account when signed in, else the shared sync code (null = not syncing).
async function target() {
  const tok = await idToken();
  if (tok) return { path: `users/${session().uid}/k`, headers: { Authorization: 'Bearer ' + tok } };
  const c = state().code;
  return c ? { path: `sync/${c}/k`, headers: {} } : null;
}
const codeTarget = c => ({ path: `sync/${c}/k`, headers: {} });

let running = null, again = false;
// Returns true if anything on this device changed.
export function syncNow() {
  if (running) { again = true; return running; }
  running = (async () => {
    let changed = false;
    do {
      again = false;
      changed = (await syncOnce()) || changed;
    } while (again);
    return changed;
  })().finally(() => { running = null; });
  return running;
}

async function syncOnce() {
  let t;
  try { t = await target(); } catch (e) { saveState({ ...state(), error: e.message }); return false; }
  if (!t) return false;
  try {
    const remote = await pull(t);
    const local = store.snapshot();
    const toPush = [];
    let changed = false;
    for (const k of new Set([...Object.keys(remote), ...Object.keys(local)])) {
      const R = remote[k], L = local[k];
      if (!R) { toPush.push([k, L.v, L.t]); continue; }
      if (L && L.t === R.t) continue;
      if (UNION[k] && L?.v != null && R.v != null) {
        const merged = JSON.stringify(UNION[k](JSON.parse(L.v), JSON.parse(R.v)));
        const t = Math.max(L.t, R.t) + 1;
        if (merged !== L.v) changed = true;
        store.applyRemote(k, merged, t);
        toPush.push([k, merged, t]);
      } else if (!L || R.t > L.t) {
        store.applyRemote(k, R.v, R.t);
        changed = true;
      } else {
        toPush.push([k, L.v, L.t]);
      }
    }
    await push(t, toPush);
    saveState({ ...state(), at: Date.now(), error: '' });
    return changed;
  } catch (e) {
    saveState({ ...state(), error: navigator.onLine ? e.message : "you're offline" });
    return false;
  }
}

// First device: makes a new code and uploads this device's progress.
export async function createCode() {
  store.stampUnstamped(Date.now());
  saveState({ code: newCode(), at: 0, error: '' });
  await syncNow();
  return state().code;
}
// Other devices: adopt an existing code; the cloud copy wins over this device's older, unsynced progress.
export async function joinCode(input) {
  const code = normalize(input);
  if (!code) throw new Error('That code should be 20 letters/numbers, like ABCD-EFGH-JKLM-NPQR-STUV.');
  const remote = await pull(codeTarget(code));
  if (!Object.keys(remote).length) throw new Error("No progress found for that code. Check it and try again.");
  store.stampUnstamped(0);
  saveState({ code, at: 0, error: '' });
  return syncNow();
}
// Just signed in: a brand-new account takes this device's progress; an existing one wins over unsynced local data.
export async function adoptAccount() {
  const remote = await pull(await target());
  store.stampUnstamped(Object.keys(remote).length ? 0 : Date.now());
  saveState({ code: null, at: 0, error: '' });
  return syncNow();
}
export function leave() { saveState({ code: null, at: 0, error: '' }); }

// Sync automatically: shortly after any change, when the tab is hidden/shown, and on start.
let timer = null;
export function startAutoSync(onRemoteChange) {
  store.setOnChange(() => { clearTimeout(timer); timer = setTimeout(syncNow, 3000); });
  const run = async () => { if (await syncNow()) onRemoteChange(); };
  document.addEventListener('visibilitychange', run);
  addEventListener('online', run);
  run();
}
