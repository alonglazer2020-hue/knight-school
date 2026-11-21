import { settings, toggle, hush, speak, voices, setVoice, AI_VOICES } from './coach.js';
import { cancel } from './engine.js';
import { learnIndex, lessonView } from './learn.js';
import { puzzleView } from './puzzles.js';
import { reviewIndex, reviewGame } from './review.js';
import { coachHome } from './home.js';
import { startAutoSync } from './sync.js';
import { initSyncPanel } from './sync-ui.js';
import { initChat, setPage } from './ai-coach.js';
import { icon } from './icons.js';
import { rank, beltSvg } from './belts.js';

// Shell: tabs (a bottom bar on phones), the belt badge, and icon buttons.
const TABS = [['coach', 'Coach', 'home'], ['learn', 'Learn', 'book'], ['puzzles', 'Puzzles', 'puzzle'], ['review', 'Review', 'chart']];
document.querySelector('nav.tabs').innerHTML = TABS.map(([id, label, ic]) => `<a href="#/${id}" data-tab="${id}">${icon(ic)}<span>${label}</span></a>`).join('');
document.getElementById('tChat').innerHTML = `${icon('chat')}<span>Ask coach</span>`;
document.getElementById('tVoice').innerHTML = icon('voice');
document.getElementById('tSync').innerHTML = icon('cloud');
function paintBelt() {
  const r = rank();
  document.getElementById('beltChip').innerHTML = `${beltSvg(r.belt, r.earned, { width: 56, height: 12, cls: 'belt mini' })}<span>${r.belt.name.replace(' belt', '')}</span>`;
  document.getElementById('beltChip').setAttribute('aria-label', `${r.belt.name}, ${r.earned} of 4 stripes toward the next belt`);
}

const view = document.getElementById('view');

function route() {
  cancel();
  hush();
  window.onkeydown = null;
  setPage(null); // each page tells the AI coach what's on screen
  const [path, query = ''] = location.hash.slice(2).split('?');
  const [tab = 'coach', arg] = path.split('/');
  const params = new URLSearchParams(query);
  document.querySelectorAll('nav a').forEach(a => { const on = a.dataset.tab === tab; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  paintBelt();
  view.innerHTML = '';
  window.scrollTo(0, 0);
  if (tab === 'learn') arg ? lessonView(view, arg) : learnIndex(view);
  else if (tab === 'puzzles') puzzleView(view, params);
  else if (tab === 'review') arg ? reviewGame(view, decodeURIComponent(arg)) : reviewIndex(view);
  else coachHome(view);
}
initChat(document.getElementById('tChat'), document.getElementById('chatPanel'));
window.addEventListener('hashchange', route);
route();

// Sync: when another device's progress arrives, redraw only "overview" pages so a lesson or puzzle in progress isn't reset.
const repaintSync = initSyncPanel(document.getElementById('tSync'), document.getElementById('syncPanel'), onRemoteChange);
function onRemoteChange() {
  repaintSync();
  paintBelt();
  const [path] = location.hash.slice(2).split('?');
  const [tab = 'coach', arg] = path.split('/');
  if (!arg && tab !== 'puzzles') route();
}
startAutoSync(onRemoteChange);

const tS = document.getElementById('tSound'), tV = document.getElementById('tVoice');
const paint = () => {
  tS.classList.toggle('off', !settings.sound);
  tV.classList.toggle('off', !settings.voice);
  tS.innerHTML = icon(settings.sound ? 'volume' : 'mute');
  tS.setAttribute('aria-pressed', settings.sound);
};
tS.onclick = () => { toggle('sound'); paint(); };
paint();

// Voice settings panel: on/off, which voice, speed, and a test line.
const panel = document.getElementById('voicePanel');
const vOn = panel.querySelector('.v-on'), vSel = panel.querySelector('.v-name'), vRate = panel.querySelector('.v-rate');
const q = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function fillVoices() {
  const vs = voices();
  const opt = ([id, label]) => `<option value="ai:${id}">${label}</option>`;
  vSel.innerHTML = `<optgroup label="HD voices (smoothest, ~110 MB, best on PC)">${AI_VOICES.filter(v => v[2]).map(opt).join('')}</optgroup>`
    + `<optgroup label="AI voices (~60 MB, quick on phones)">${AI_VOICES.filter(v => !v[2]).map(opt).join('')}</optgroup>`
    + (vs.length ? `<optgroup label="This browser's voices">${vs.map(v => `<option value="br:${q(v.name)}">${q(v.name.replace(/^Microsoft |^Google /, ''))}${/natural|neural/i.test(v.name) ? ' ★' : ''}</option>`).join('')}</optgroup>` : '');
  vSel.value = settings.voiceName;
  if (!vSel.value) vSel.selectedIndex = 0;
}
if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillVoices);
tV.onclick = () => { panel.hidden = !panel.hidden; if (!panel.hidden) fillVoices(); };
document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && e.target !== tV) panel.hidden = true; });
vOn.checked = settings.voice;
vRate.value = settings.rate;
const test = () => speak("Hi, I'm Coach Knox. Knight to f3, check! Let's find your best move.");
vOn.onchange = () => { if (vOn.checked !== settings.voice) toggle('voice'); paint(); if (vOn.checked) test(); };
vSel.onchange = () => { setVoice(vSel.value, +vRate.value); test(); };
vRate.onchange = () => { setVoice(vSel.value, +vRate.value); test(); };
panel.querySelector('.v-test').onclick = test;
