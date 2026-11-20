import { settings, toggle, hush } from './coach.js';
import { cancel } from './engine.js';
import { learnIndex, lessonView } from './learn.js';
import { puzzleView } from './puzzles.js';
import { reviewIndex, reviewGame } from './review.js';
import { coachHome } from './home.js';

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

const tS = document.getElementById('tSound'), tV = document.getElementById('tVoice');
const paint = () => {
  tS.classList.toggle('off', !settings.sound);
  tV.classList.toggle('off', !settings.voice);
  tS.textContent = settings.sound ? '🔊' : '🔇';
};
tS.onclick = () => { toggle('sound'); paint(); };
tV.onclick = () => { toggle('voice'); paint(); };
paint();
