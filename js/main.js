// App shell: sidebar navigation (a bottom tab bar on phones), the account chip, routing and background syncing.
import { hush } from './coach.js';
import { cancel } from './engine.js';
import { learnIndex, lessonView } from './learn.js';
import { puzzleView } from './puzzles.js';
import { reviewIndex, reviewGame } from './review.js';
import { coachHome } from './home.js';
import { settingsView } from './settings.js';
import { feedbackView, inboxView, rememberPage } from './feedback.js';
import { privacyView, termsView } from './legal.js';
import { ratingView } from './rating.js';
import { startAutoSync } from './sync.js';
import { initChat, setPage } from './ai-coach.js';
import { icon } from './icons.js';
import { account, refresh as refreshChesscom, lastSync } from './chesscom.js';
import { level } from './levels.js';

import * as store from './store.js';

// The look (Settings > Look): violet by default; it follows your account like the rest of your progress.
export const LOOKS = { violet: '#15151B', midnight: '#0E1B3D', classic: '#1F1E1C' };
export function applyLook() {
  const look = LOOKS[store.get('theme', 'violet')] ? store.get('theme', 'violet') : 'violet';
  document.documentElement.dataset.theme = look;
  document.querySelector('meta[name=theme-color]').content = LOOKS[look];
}
applyLook();
addEventListener('ks-look', applyLook);

const TABS = [['coach', 'Coach', 'home'], ['learn', 'Learn', 'book'], ['puzzles', 'Puzzles', 'puzzle'], ['review', 'Review', 'chart'], ['settings', 'Settings', 'settings']];
document.querySelector('nav.tabs').innerHTML = TABS.map(([id, label, ic]) => `<a href="#/${id}" data-tab="${id}">${icon(ic)}<span>${label}</span></a>`).join('');
document.getElementById('tChat').innerHTML = `${icon('chat')}<span>Ask coach</span>`;
document.querySelector('.bug').innerHTML = `${icon('bug')}<span>Report a bug</span>`;

// Installable app: a service worker keeps the site working offline and lets phones add it to the home screen.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
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
  rememberPage(location.hash);
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
  else if (tab === 'feedback') feedbackView(view, params);
  else if (tab === 'inbox') inboxView(view);
  else if (tab === 'privacy') privacyView(view);
  else if (tab === 'terms') termsView(view);
  else if (tab === 'rating') ratingView(view, params);
  else coachHome(view);
}
initChat(document.getElementById('tChat'), document.getElementById('chatPanel'));
window.addEventListener('hashchange', route);
route();

// New data from another device or from chess.com: redraw only overview pages, never a lesson or puzzle in progress.
function onRemoteChange() {
  applyLook();
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
