// Knight School accounts: your chess.com username plus a password you pick for this site (never your chess.com one).
// Firebase Authentication's email/password sign-in through its REST API, so there's no SDK to load. Firebase needs an
// email, so each account uses a made-up one built from the username; nothing is ever sent to it.
import * as store from './store.js';
import { API_KEY } from './sync.js';

const ID = 'https://identitytoolkit.googleapis.com/v1/accounts:';
const TOKEN = 'https://securetoken.googleapis.com/v1/token';
export const emailOf = u => `${String(u).trim().toLowerCase()}@players.knightschool.dev`;
export const session = () => store.get('auth', null); // { uid, user, id, refresh, exp }, device-only

// Firebase error codes -> what the player should do.
const MESSAGES = {
  EMAIL_EXISTS: 'That chess.com name already has a Knight School account. Sign in instead.',
  EMAIL_NOT_FOUND: 'Wrong username or password.',
  INVALID_PASSWORD: 'Wrong username or password.',
  INVALID_LOGIN_CREDENTIALS: 'Wrong username or password.',
  USER_DISABLED: 'This account has been switched off.',
  WEAK_PASSWORD: 'Pick a password with at least 6 characters.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many tries. Wait a few minutes and try again.',
  OPERATION_NOT_ALLOWED: "Accounts aren't switched on yet. For now, connect your chess.com username without an account.",
  CONFIGURATION_NOT_FOUND: "Accounts aren't switched on yet. For now, connect your chess.com username without an account.",
};
export const friendly = code => MESSAGES[String(code).split(/[ :]/)[0]] ?? 'Something went wrong. Check your internet and try again.';

async function call(path, body) {
  let r;
  try { r = await fetch(`${ID}${path}?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  catch { throw new Error("Can't reach the login server. Check your internet."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(friendly(j.error?.message ?? ''));
  return j;
}
const save = (j, user) => store.set('auth', { uid: j.localId ?? j.user_id, user, id: j.idToken ?? j.id_token, refresh: j.refreshToken ?? j.refresh_token, exp: Date.now() + (+(j.expiresIn ?? j.expires_in) - 60) * 1000 });

function checkInput(username, password) {
  if (!/^[A-Za-z0-9_-]{3,25}$/.test(String(username).trim())) throw new Error("That doesn't look like a chess.com username (letters, numbers, _ and -).");
  if (String(password).length < 6) throw new Error('Pick a password with at least 6 characters.');
}
export async function signUp(username, password) {
  checkInput(username, password);
  const u = username.trim().toLowerCase();
  save(await call('signUp', { email: emailOf(u), password, returnSecureToken: true }), u);
}
export async function signIn(username, password) {
  checkInput(username, password);
  const u = username.trim().toLowerCase();
  save(await call('signInWithPassword', { email: emailOf(u), password, returnSecureToken: true }), u);
}

// A fresh ID token for Firestore (they last an hour); null when signed out or the account is gone.
export async function idToken() {
  const s = session();
  if (!s) return null;
  if (Date.now() < s.exp) return s.id;
  const r = await fetch(`${TOKEN}?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refresh)}` });
  if (r.status === 400) { store.del('auth'); return null; } // revoked or deleted: signed out
  if (!r.ok) throw new Error("Can't reach the login server.");
  save(await r.json(), s.user);
  return session().id;
}

// Signing out removes your progress from this device too (it stays safe in your account), so a shared phone stays private.
export function signOut() {
  store.del('auth');
  store.clearSynced();
}
