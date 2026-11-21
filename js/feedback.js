// Bug reports and ideas: a form anyone can send, stored in Firebase (feedback collection, create-only for players),
// optionally emailed to the owner (Web3Forms), and read on a private Inbox page that only admin accounts can open.
import * as store from './store.js';
import { API_KEY } from './sync.js';
import { idToken, session } from './auth.js';
import { VERSION, WEB3FORMS_KEY } from './config.js';
import { icon } from './icons.js';

const DOCS = 'https://firestore.googleapis.com/v1/projects/knight-school-6bddd/databases/(default)/documents';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KINDS = { bug: 'Bug', idea: 'Idea', other: 'Other' };
let lastPage = '#/coach';
export const rememberPage = hash => { if (!hash.startsWith('#/feedback') && !hash.startsWith('#/inbox')) lastPage = hash || '#/coach'; };

// Field values Firestore's REST API expects.
const S = v => ({ stringValue: String(v) });
async function authHeader() { try { const t = await idToken(); return t ? { Authorization: 'Bearer ' + t } : {}; } catch { return {}; } }

export async function sendFeedback({ kind, msg, contact, details }) {
  const report = {
    kind, msg: msg.slice(0, 2000), contact: contact.slice(0, 200),
    page: details ? lastPage.slice(0, 300) : '', ua: details ? navigator.userAgent.slice(0, 400) : '',
    ver: VERSION, user: session()?.user ?? store.get('chesscom', null)?.username ?? '', t: Date.now(),
  };
  const fields = Object.fromEntries(Object.entries(report).map(([k, v]) => [k, k === 't' ? { integerValue: String(v) } : S(v)]));
  const r = await fetch(`${DOCS}/feedback?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ fields }) })
    .catch(() => { throw new Error("Couldn't send. Check your internet and try again."); });
  if (!r.ok) throw new Error(`Couldn't send (${r.status}). Please try again later.`);
  if (WEB3FORMS_KEY) fetch('https://api.web3forms.com/submit', { // email copy; the report is already saved even if this fails
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: `Knight School ${KINDS[kind]}: ${msg.slice(0, 60)}`, from_name: 'Knight School', ...report, t: new Date(report.t).toISOString() }),
  }).catch(() => {});
}

export function feedbackView(view, params) {
  const kind0 = KINDS[params.get('kind')] ? params.get('kind') : 'bug';
  view.innerHTML = `<div class="page feedback"><h1>Report a bug or suggest an idea</h1>
    <p class="sub">Something broken, confusing or missing? Tell us. Every message is read.</p>
    <form class="card fbform">
      <div class="seg" role="radiogroup" aria-label="Type">${Object.entries(KINDS).map(([k, l]) => `<button type="button" data-k="${k}" class="${k === kind0 ? 'active' : ''}" aria-pressed="${k === kind0}">${l}</button>`).join('')}</div>
      <label class="field">What happened, or what's your idea?<textarea name="msg" maxlength="2000" required placeholder="For a bug: what did you do, what did you expect, and what happened instead?"></textarea></label>
      <label class="field">How can we reach you? <small>(optional: email, chess.com name or Discord)</small><input name="contact" maxlength="200" autocomplete="email"></label>
      <label class="switch"><input type="checkbox" name="details" checked> Include technical details (the page you were on, your browser and app version)</label>
      <div class="row"><button class="primary">${icon('send')} Send</button><a class="btn" href="${esc(lastPage)}">Cancel</a></div>
      <p class="msg" role="status"></p>
    </form></div>`;
  const f = view.querySelector('form');
  let kind = kind0;
  f.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    kind = b.dataset.k;
    f.querySelectorAll('[data-k]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
  });
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('.primary'), msg = f.querySelector('.msg');
    const wait = 30e3 - (Date.now() - store.get('fbLast', 0));
    if (wait > 0) { msg.textContent = `Please wait ${Math.ceil(wait / 1000)} seconds before sending another one.`; msg.classList.add('err'); return; }
    btn.disabled = true; msg.textContent = 'Sending…'; msg.classList.remove('err');
    try {
      await sendFeedback({ kind, msg: f.msg.value.trim(), contact: f.contact.value.trim(), details: f.details.checked });
      store.set('fbLast', Date.now());
      f.innerHTML = `<h2>Thank you!</h2><p class="sub">Your ${KINDS[kind].toLowerCase()} was sent.</p><div class="row"><a class="btn primary" href="${esc(lastPage)}">Back</a><a class="btn" href="#/feedback">Send another</a></div>`;
    } catch (err) { msg.textContent = err.message; msg.classList.add('err'); btn.disabled = false; }
  };
}

// The owner's inbox: readable only by accounts listed in Firebase under admins/{account id}.
export async function inboxView(view) {
  const s = session();
  view.innerHTML = `<div class="page inbox"><h1>Inbox</h1><p class="sub">Bug reports and ideas from players.</p><div class="list"><p class="sub">Loading…</p></div></div>`;
  const box = view.querySelector('.list');
  if (!s) { box.innerHTML = '<p class="sub">Sign in with your Knight School account to see the inbox.</p>'; return; }
  const r = await fetch(`${DOCS}/feedback?key=${API_KEY}&pageSize=200&orderBy=t%20desc`, { headers: await authHeader() }).catch(() => null);
  if (!r?.ok) {
    box.innerHTML = r?.status === 403
      ? `<p class="sub">Only the site owner can read the inbox. If that's you, add this account ID in Firebase (see SETUP-ACCOUNTS.md): <code>${esc(s.uid)}</code></p>`
      : "<p class=\"err\">Couldn't load the inbox. Check your internet.</p>";
    return;
  }
  const items = ((await r.json()).documents ?? []).map(d => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue ?? +v.integerValue])));
  box.innerHTML = items.length ? items.map(x => `<article class="card fbitem"><div class="card-head"><h2><span class="tag ${esc(x.kind)}">${esc(KINDS[x.kind] ?? x.kind)}</span> ${esc(x.user || 'anonymous')}</h2><span class="m">${new Date(x.t).toLocaleString()} · v${esc(x.ver)}</span></div>
      <p class="msgtext">${esc(x.msg)}</p>${x.contact ? `<p class="m">Reply to: ${esc(x.contact)}</p>` : ''}${x.page || x.ua ? `<p class="m">${esc(x.page)} · ${esc(x.ua)}</p>` : ''}</article>`).join('')
    : '<p class="sub">No reports yet.</p>';
}
