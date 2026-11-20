// Coach Knox: the speech bubble, the voice (Web Speech API) and synthesized sound effects (Web Audio).
import * as store from './store.js';

let box = null;
let lastText = '';
export const settings = { sound: store.get('sound', true), voice: store.get('voice', true) };

const SAN_RE = /\b(?:O-O-O|O-O)[+#]?|\b[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?/g;
const PIECE = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' };

export function coachBox() {
  const el = document.createElement('div');
  el.className = 'coach';
  el.innerHTML = `<div class="avatar" title="Coach Knox">♞</div>
    <div class="bubble"><span class="text"></span><button class="replay" title="Say it again">🔁</button></div>`;
  el.querySelector('.replay').onclick = () => speak(lastText);
  box = el;
  return el;
}

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function say(text, mood = '') {
  lastText = text;
  if (!box) return;
  box.querySelector('.text').innerHTML = esc(text).replace(SAN_RE, '<b>$&</b>');
  box.dataset.mood = '';
  void box.offsetWidth; // restart the mood animation
  box.dataset.mood = mood;
  speak(text);
}

// "Nxe5+" -> "knight takes e5, check" so the voice reads moves like a human.
export function spoken(text) {
  return text.replace(SAN_RE, san => {
    if (san.startsWith('O-O-O')) return 'castles long' + (san.endsWith('#') ? ', checkmate' : san.endsWith('+') ? ', check' : '');
    if (san.startsWith('O-O')) return 'castles' + (san.endsWith('#') ? ', checkmate' : san.endsWith('+') ? ', check' : '');
    const m = san.match(/^([KQRBN])?([a-h]?[1-8]?)(x?)([a-h][1-8])(?:=([QRBN]))?([+#]?)$/);
    if (!m) return san;
    const [, p, from, x, to, promo, chk] = m;
    let s = p ? PIECE[p] + ' ' : (x ? from + ' ' : '');
    s += x ? 'takes ' + to : to;
    if (promo) s += ' promotes to ' + PIECE[promo];
    if (chk === '+') s += ', check';
    if (chk === '#') s += ', checkmate';
    return s;
  }).replace(/!!/g, '').replace(/\?\?/g, '');
}

let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  return vs.find(v => /natural|neural/i.test(v.name) && /en-US/.test(v.lang))
    || vs.find(v => /natural|neural|online/i.test(v.name))
    || vs.find(v => /Google US English/.test(v.name))
    || vs.find(v => v.lang === 'en-US') || vs[0] || null;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };

export function speak(text) {
  if (!settings.voice || !('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(spoken(text));
  voice ??= pickVoice();
  if (voice) u.voice = voice;
  u.rate = 1.05;
  speechSynthesis.speak(u);
}
export function hush() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

// ---- Sound effects, synthesized so there are no audio files to license ----
let ac = null;
function ctx() {
  ac ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function knock(t0 = 0, gain = 0.5, freq = 1700) {
  const a = ctx(), t = a.currentTime + t0;
  const len = Math.floor(a.sampleRate * 0.06);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.2;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(bp).connect(g).connect(a.destination); src.start(t);
  const o = a.createOscillator(), og = a.createGain();
  o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.07);
  og.gain.setValueAtTime(gain * 0.7, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(og).connect(a.destination); o.start(t); o.stop(t + 0.09);
}
function tone(freq, t0, dur, type = 'sine', gain = 0.18) {
  const a = ctx(), t = a.currentTime + t0;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const fx = {
  move: () => knock(0, 0.45),
  capture: () => { knock(0, 0.6, 1200); knock(0.045, 0.5, 2200); },
  castle: () => { knock(0, 0.45); knock(0.11, 0.45); },
  check: () => { knock(0, 0.5); tone(988, 0.02, 0.18, 'triangle', 0.12); },
  promote: () => { knock(0, 0.45); tone(784, 0.03, 0.12); tone(1175, 0.1, 0.18); },
  end: () => { knock(0, 0.5); [523, 659, 784].forEach((f, i) => tone(f, 0.05 + i * 0.02, 0.6, 'triangle', 0.1)); },
  correct: () => [659, 880, 1319].forEach((f, i) => tone(f, i * 0.07, 0.22)),
  wrong: () => { tone(220, 0, 0.16, 'square', 0.07); tone(165, 0.13, 0.22, 'square', 0.07); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle', 0.14)),
};
export const sfx = new Proxy(fx, { get: (o, k) => () => { if (settings.sound) try { o[k](); } catch { /* audio unavailable */ } } });

export function moveSound(move, chess) {
  if (chess.isGameOver()) sfx.end();
  else if (chess.inCheck()) sfx.check();
  else if (move.promotion) sfx.promote();
  else if (/[kq]/.test(move.flags)) sfx.castle();
  else if (move.captured) sfx.capture();
  else sfx.move();
}

export function toggle(key) {
  settings[key] = !settings[key];
  store.set(key, settings[key]);
  if (key === 'voice' && !settings.voice) hush();
  return settings[key];
}
