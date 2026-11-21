// Settings: chess.com account, coach voice, sounds, device sync and the AI coach, all on one page.
import { settings, toggle, speak, voices, setVoice, AI_VOICES, KOKORO_VOICES } from './coach.js';
import { account, stats, signIn, signOut, refresh, lastSync, games, syncing } from './chesscom.js';
import { initSyncPanel } from './sync-ui.js';
import { icon } from './icons.js';
import * as store from './store.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ago = t => { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : new Date(t).toLocaleString(); };
export const TEST_LINE = "Hi, I'm Coach Knox. Knight to f3, check! Let's find your best move.";

// The chess.com sign-in form, also used on the Coach page when you're signed out.
export function signInForm(onDone) {
  const f = document.createElement('form');
  f.className = 'signin';
  f.innerHTML = `<label for="ccUser">chess.com username</label>
    <div class="row"><input id="ccUser" name="u" placeholder="Your chess.com username" autocomplete="username" autocapitalize="none" spellcheck="false" required>
    <button class="primary">Connect</button></div>
    <p class="hint">Only your username: we read your public ratings and games. Never type your chess.com password here.</p>
    <p class="msg" role="status"></p>`;
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('button'), msg = f.querySelector('.msg');
    btn.disabled = true; btn.textContent = 'Connecting…'; msg.textContent = ''; msg.classList.remove('err');
    try { await signIn(f.u.value); onDone?.(); }
    catch (err) { msg.textContent = err.message; msg.classList.add('err'); btn.disabled = false; btn.textContent = 'Connect'; }
  };
  return f;
}

export function settingsView(view, onRemoteChange) {
  const acc = account(), s = stats();
  view.innerHTML = `<div class="page settings"><h1>Settings</h1>
    <section class="card" id="set-account"><h2>chess.com account</h2></section>
    <section class="card"><h2>Coach voice</h2>
      <label class="switch"><input type="checkbox" class="v-on"> Coach Knox talks out loud</label>
      <label class="field">Voice<select class="v-name"></select></label>
      <label class="field">Speed<input type="range" class="v-rate" min="0.7" max="1.5" step="0.05"></label>
      <div class="row"><button class="primary v-test">${icon('play')} Test voice</button><small class="vstatus"></small></div>
      <p class="hint">Natural voices sound like a real person and run on your device for free. The first one you pick downloads once (about 90 MB), then works offline. On older phones, the AI voices are quicker.</p>
    </section>
    <section class="card"><h2>Sounds</h2>
      <label class="switch"><input type="checkbox" class="s-on"> Move and puzzle sound effects</label>
    </section>
    <section class="card"><div class="syncbox"></div></section>
    <section class="card"><h2>AI coach</h2><div class="aibox"></div></section>
  </div>`;
  const $ = q => view.querySelector(q);

  // chess.com account
  const paintAccount = () => {
    const a = account(), st = stats(), box = $('#set-account');
    box.innerHTML = '<h2>chess.com account</h2>';
    if (!a) {
      box.insertAdjacentHTML('beforeend', '<p class="sub">Connect your chess.com account and Knight School uses your real Elo and every game you play.</p>');
      box.append(signInForm(() => { paintAccount(); dispatchEvent(new CustomEvent('ks-account')); }));
      return;
    }
    const tcs = ['rapid', 'blitz', 'bullet', 'daily'].filter(t => st?.[t]?.r);
    box.insertAdjacentHTML('beforeend', `
      <div class="acct">${a.avatar ? `<img src="${esc(a.avatar)}" alt="" width="48" height="48">` : `<span class="av">${esc(a.username[0].toUpperCase())}</span>`}
        <div><b>${esc(a.username)}</b><small>${games().length} games loaded · synced ${ago(lastSync())}${syncing() ? ' · loading older games…' : ''}</small></div>
        <a class="btn" href="${esc(a.url)}" target="_blank" rel="noopener">Profile</a></div>
      <label class="field">Main rating (your level)<select class="main-tc">
        <option value="auto">Automatic: what I play most</option>${tcs.map(t => `<option value="${t}">${t[0].toUpperCase() + t.slice(1)} · ${st[t].r}</option>`).join('')}</select></label>
      <div class="row"><button class="cc-sync">${icon('replay')} Sync now</button><button class="cc-out">Sign out</button></div>`);
    $('.main-tc').value = store.get('mainTc', 'auto');
    $('.main-tc').onchange = e => store.set('mainTc', e.target.value);
    $('.cc-sync').onclick = async e => { e.target.disabled = true; e.target.textContent = 'Syncing…'; try { await refresh(true); } catch { /* shown as stale time */ } paintAccount(); };
    $('.cc-out').onclick = () => { if (confirm('Disconnect your chess.com account from Knight School? Your lessons, puzzles and reviews stay.')) { signOut(); paintAccount(); dispatchEvent(new CustomEvent('ks-account')); } };
  };
  paintAccount();

  // voice
  const vOn = $('.v-on'), vSel = $('.v-name'), vRate = $('.v-rate');
  const q = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const fill = () => {
    const vs = voices();
    const opt = p => ([id, label]) => `<option value="${p}:${id}">${label}</option>`;
    vSel.innerHTML = `<optgroup label="Natural voices (most human)">${KOKORO_VOICES.map(opt('ko')).join('')}</optgroup>`
      + `<optgroup label="HD AI voices">${AI_VOICES.filter(v => v[2]).map(opt('ai')).join('')}</optgroup>`
      + `<optgroup label="AI voices (lighter, for phones)">${AI_VOICES.filter(v => !v[2]).map(opt('ai')).join('')}</optgroup>`
      + (vs.length ? `<optgroup label="Built into this browser (robotic)">${vs.map(v => `<option value="br:${q(v.name)}">${q(v.name.replace(/^Microsoft |^Google /, ''))}</option>`).join('')}</optgroup>` : '');
    vSel.value = settings.voiceName;
    if (!vSel.value) vSel.selectedIndex = 0;
  };
  fill();
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fill, { once: true });
  vOn.checked = settings.voice; vRate.value = settings.rate;
  const test = () => speak(TEST_LINE);
  vOn.onchange = () => { if (vOn.checked !== settings.voice) toggle('voice'); if (vOn.checked) test(); };
  vSel.onchange = () => { setVoice(vSel.value, +vRate.value); test(); };
  vRate.onchange = () => { setVoice(vSel.value, +vRate.value); test(); };
  $('.v-test').onclick = test;

  // sounds
  $('.s-on').checked = settings.sound;
  $('.s-on').onchange = () => { if ($('.s-on').checked !== settings.sound) toggle('sound'); };

  // device sync (the existing panel, rendered in place)
  initSyncPanel(null, $('.syncbox'), onRemoteChange);

  // AI coach key
  const ai = $('.aibox');
  const paintAi = () => {
    const has = !!store.get('aiKey', '');
    ai.innerHTML = has
      ? `<p class="sub">Connected with your Google AI key. Ask coach is on every page.</p><div class="row"><button class="ai-chats">Forget our chats</button><button class="ai-out">Remove key</button></div>`
      : '<p class="sub">Not set up yet. Open <b>Ask coach</b> and follow the one-minute setup (free Google AI key).</p>';
    ai.querySelector('.ai-chats')?.addEventListener('click', () => { if (confirm('Forget everything you and the coach talked about?')) store.set('chat', []); });
    ai.querySelector('.ai-out')?.addEventListener('click', () => { if (confirm('Remove your Google AI key from this device?')) { store.del('aiKey'); store.del('aiModel'); paintAi(); } });
  };
  paintAi();
}
