// App shell: sidebar navigation (a bottom tab bar on phones), the account chip, routing and background syncing.
import { hush } from './coach.js';
import { cancel } from './engine.js';
import { learnIndex, lessonView } from './learn.js';
import { puzzleView } from './puzzles.js';
import { reviewIndex, reviewGame } from './review.js';
import { coachHome } from './home.js';
import { settingsView } from './settings.js';
import { startAutoSync } from './sync.js';
import { initChat, setPage } from './ai-coach.js';
import { icon } from './icons.js';
import { account, refresh as refreshChesscom, lastSync } from './chesscom.js';
import { level } from './levels.js';

const TABS = [['coach', 'Coach', 'home'], ['learn', 'Learn', 'book'], ['puzzles', 'Puzzles', 'puzzle'], ['review', 'Review', 'chart'], ['settings', 'Settings', 'settings']];
document.querySelector('nav.tabs').innerHTML = TABS.map(([id, label, ic]) => `<a href="#/${id}" data-tab="${id}">${icon(ic)}<span>${label}</span></a>`).join('');
document.getElementById('tChat').innerHTML = `${icon('chat')}<span>Ask coach</span>`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Who you are and your level, bottom of the sidebar.
function paintMe() {
  const a = account(), lv = level(), chip = document.getElementById('meChip');
  chip.innerHTML = a
    ? `${a.avatar ? `<img src="${esc(a.avatar)}" alt="" width="32" height="32">` : `<span class="av">${esc(a.username[0].toUpperCase())}</span>`}<span><b>${esc(a.username)}</b><small>${lv.label.replace(' rating', '')} ${lv.rating}</small></span>`
    : `<span class="av">${icon('user')}</span><span><b>Connect chess.com</b><small>Puzzle rating ${lv.rating}</small></span>`;
  chip.href = a ? '#/settings' : '#/coach';
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
  paintMe();
  view.innerHTML = '';
  window.scrollTo(0, 0);
  if (tab === 'learn') arg ? lessonView(view, arg) : learnIndex(view);
  else if (tab === 'puzzles') puzzleView(view, params);
  else if (tab === 'review') arg ? reviewGame(view, decodeURIComponent(arg)) : reviewIndex(view);
  else if (tab === 'settings') settingsView(view, onRemoteChange);
  else coachHome(view);
}
initChat(document.getElementById('tChat'), document.getElementById('chatPanel'));
window.addEventListener('hashchange', route);
route();

// New data from another device or from chess.com: redraw only overview pages, never a lesson or puzzle in progress.
function onRemoteChange() {
  paintMe();
  const [path] = location.hash.slice(2).split('?');
  const [tab = 'coach', arg] = path.split('/');
  if (!arg && !['puzzles', 'settings'].includes(tab)) route();
}
startAutoSync(onRemoteChange);

// Pull new chess.com games on start and whenever you come back to the tab (at most every 2 minutes).
async function pullChesscom() {
  if (!account() || document.hidden || Date.now() - lastSync() < 120e3) return;
  try { if (await refreshChesscom()) onRemoteChange(); } catch { /* offline: try again later */ }
}
document.addEventListener('visibilitychange', pullChesscom);
addEventListener('ks-account', paintMe); // signed in from Settings
pullChesscom();
