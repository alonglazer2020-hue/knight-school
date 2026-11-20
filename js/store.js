// Tiny localStorage wrapper; every read/write survives private mode / quota errors.
export function get(key, fallback) {
  try { const v = localStorage.getItem('ks.' + key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
export function set(key, value) {
  try { localStorage.setItem('ks.' + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
}
export function del(key) {
  try { localStorage.removeItem('ks.' + key); } catch { /* ignore */ }
}
