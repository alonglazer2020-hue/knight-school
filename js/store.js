// Tiny localStorage wrapper; every read/write survives private mode / quota errors.
// Each synced key also gets a "last changed" timestamp (in ks.__t) so sync.js can merge devices.
const LOCAL_ONLY = new Set(['sound', 'voice', 'voiceName', 'rate', 'sync', '__t', 'aiKey', 'aiModel', 'beltSeen']); // per-device settings, never synced

function rawGet(k) { try { return localStorage.getItem('ks.' + k); } catch { return null; } }
function rawSet(k, v) { try { localStorage.setItem('ks.' + k, v); return true; } catch { return false; } }
function rawDel(k) { try { localStorage.removeItem('ks.' + k); } catch { /* ignore */ } }

export function get(key, fallback) {
  try { const v = rawGet(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}

let onChange = null;
export function setOnChange(fn) { onChange = fn; }

const stamps = () => get('__t', {});
function touch(key) {
  if (LOCAL_ONLY.has(key)) return;
  const t = stamps(); t[key] = Date.now(); rawSet('__t', JSON.stringify(t));
  onChange?.();
}

export function set(key, value) {
  if (rawSet(key, JSON.stringify(value))) touch(key); // storage full or blocked -> nothing changed
}
export function del(key) { rawDel(key); touch(key); } // the timestamp doubles as a tombstone

// ---- used by sync.js ----
function syncedKeys() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('ks.') && !LOCAL_ONLY.has(k.slice(3))) out.push(k.slice(3)); } } catch { /* blocked */ }
  return out;
}
// Give keys written before sync existed a timestamp: "now" on the first device, 0 (= lose to remote) when joining.
export function stampUnstamped(t) {
  const s = stamps();
  for (const k of syncedKeys()) if (!(k in s)) s[k] = t;
  rawSet('__t', JSON.stringify(s));
}
// { key: { v: raw JSON string or null (deleted), t } }
export function snapshot() {
  const s = stamps(), out = {};
  for (const k of new Set([...syncedKeys(), ...Object.keys(s)])) if (!LOCAL_ONLY.has(k)) out[k] = { v: rawGet(k), t: s[k] ?? 0 };
  return out;
}
export function applyRemote(key, v, t) {
  if (LOCAL_ONLY.has(key)) return;
  if (v == null) rawDel(key); else rawSet(key, v);
  const s = stamps(); s[key] = t; rawSet('__t', JSON.stringify(s));
}
