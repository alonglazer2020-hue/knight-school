import { settings, toggle, hush, speak, voices, setVoice, AI_VOICES } from './coach.js';
import { cancel } from './engine.js';
import { learnIndex, lessonView } from './learn.js';
import { puzzleView } from './puzzles.js';
import { reviewIndex, reviewGame } from './review.js';
import { coachHome } from './home.js';
import { startAutoSync } from './sync.js';
import { initSyncPanel } from './sync-ui.js';

const view = document.getElementById('view');

function route() {
  cancel();
  hush();
  window.onkeydown = null;
  const [path, query = ''] = location.hash.slice(2).split('?');
  const [tab = 'coach', arg] = path.split('/');
  const params = new URLSearchParams(query);
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  view.innerHTML = '';
  window.scrollTo(0, 0);
  if (tab === 'learn') arg ? lessonView(view, arg) : learnIndex(view);
  else if (tab === 'puzzles') puzzleView(view, params);
  else if (tab === 'review') arg ? reviewGame(view, decodeURIComponent(arg)) : reviewIndex(view);
  else coachHome(view);
}
window.addEventListener('hashchange', route);
route();

// Sync: when another device's progress arrives, redraw only "overview" pages so a lesson or puzzle in progress isn't reset.
const repaintSync = initSyncPanel(document.getElementById('tSync'), document.getElementById('syncPanel'), onRemoteChange);
function onRemoteChange() {
  repaintSync();
  const [path] = location.hash.slice(2).split('?');
  const [tab = 'coach', arg] = path.split('/');
  if (!arg && tab !== 'puzzles') route();
}
startAutoSync(onRemoteChange);

const tS = document.getElementById('tSound'), tV = document.getElementById('tVoice');
const paint = () => {
  tS.classList.toggle('off', !settings.sound);
  tV.classList.toggle('off', !settings.voice);
  tS.textContent = settings.sound ? '🔊' : '🔇';
};
tS.onclick = () => { toggle('sound'); paint(); };
paint();

// Voice settings panel: on/off, which voice, speed, and a test line.
const panel = document.getElementById('voicePanel');
const vOn = panel.querySelector('.v-on'), vSel = panel.querySelector('.v-name'), vRate = panel.querySelector('.v-rate');
const q = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function fillVoices() {
  const vs = voices();
  vSel.innerHTML = `<optgroup label="AI voices (natural)">${AI_VOICES.map(([id, label]) => `<option value="ai:${id}">${label}</option>`).join('')}</optgroup>`
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
