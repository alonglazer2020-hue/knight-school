// Coach Knox: the speech bubble, the voice (Web Speech API) and synthesized sound effects (Web Audio).
import * as store from './store.js';
import { AI_VOICES, ensureVoice, synth } from './voice-ai.js';
import { KOKORO_VOICES, ensureKokoro, synthKokoro } from './voice-kokoro.js';
import { icon } from './icons.js';

let box = null;
let lastText = '';
const DEFAULT_VOICE = 'ko:af_heart';
if (!store.get('voiceV2', false)) { store.set('voiceName', DEFAULT_VOICE); store.set('voiceV2', true); } // one-time move to the natural voices
export const settings = {
  sound: store.get('sound', true), voice: store.get('voice', true),
  voiceName: /^(ko|ai|br):/.test(store.get('voiceName', '')) ? store.get('voiceName') : DEFAULT_VOICE,
  rate: store.get('rate', 1),
};

const SAN_RE = /\b(?:O-O-O|O-O)[+#]?|\b[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?/g;
const PIECE = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' };

export function coachBox() {
  const el = document.createElement('div');
  el.className = 'coach';
  el.innerHTML = `<div class="avatar" title="Coach Knox"><img src="img/knight.svg" alt=""></div>
    <div class="bubble"><b class="who">Coach Knox</b><span class="text"></span><small class="vstatus"></small><button class="replay" title="Say it again" aria-label="Say it again">${icon('replay')}</button></div>`;
  el.querySelector('.replay').onclick = () => speak(lastText);
  box = el;
  return el;
}

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const lastSaid = () => lastText;

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

// English voices on this device, best-sounding ("Natural"/neural) first.
const quality = v => (/natural|neural/i.test(v.name) ? 0 : /online|google|enhanced|premium/i.test(v.name) ? 1 : 2);
export function voices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
    .sort((a, b) => quality(a) - quality(b) || (b.lang === 'en-US') - (a.lang === 'en-US') || a.name.localeCompare(b.name));
}
function currentVoice() {
  const vs = voices();
  return vs.find(v => 'br:' + v.name === settings.voiceName) || vs[0] || null;
}

// settings.voiceName is "ai:<piper id>" or "br:<browser voice name>"
export { AI_VOICES };
let token = 0;
const audio = new Audio();
audio.preservesPitch = true;
// iOS only lets audio play after a tap; unlock our single <audio> element on the first one.
addEventListener('pointerdown', () => {
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  audio.play().catch(() => {});
}, { once: true });

function voiceStatus(msg) { document.querySelectorAll('.vstatus').forEach(e => { e.textContent = msg; }); }

// The natural voice is a ~90 MB download: on mobile data or data saver, wait until the player presses Test voice (force).
const onMobileData = () => { const c = navigator.connection; return !!c && (c.saveData || c.type === 'cellular'); };
export function speak(text, { force = false } = {}) {
  if (!settings.voice || !text) return;
  hush();
  const my = ++token;
  if (settings.voiceName.startsWith('ko:') && !force && !store.get('koReady', false) && onMobileData()) {
    voiceStatus('On mobile data the natural voice waits for Wi-Fi (about 90 MB). Press Test voice in Settings to download it now.');
    speakBrowser(spoken(text));
  } else if (settings.voiceName.startsWith('ko:')) speakAI(spoken(text), settings.voiceName.slice(3), my, KOKORO);
  else if (settings.voiceName.startsWith('ai:')) speakAI(spoken(text), settings.voiceName.slice(3), my);
  else speakBrowser(spoken(text));
}

function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = currentVoice();
  if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = settings.rate;
  speechSynthesis.speak(u);
}

const PIPER = { ensure: ensureVoice, synth };
const KOKORO = { ensure: (id, p) => ensureKokoro(p), synth: synthKokoro };
export { KOKORO_VOICES };

async function speakAI(text, id, my, eng = PIPER) {
  try {
    await eng.ensure(id, p => voiceStatus(`Downloading the coach's voice… ${Math.round(p * 100)}% (one time only)`));
    voiceStatus('');
    if (eng === KOKORO) store.set('koReady', true);
    // Speak sentence by sentence, generating the next one while the current one plays.
    const parts = text.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
    let next = eng.synth(parts[0], id);
    for (let i = 0; i < parts.length; i++) {
      const blob = await next;
      if (my !== token) return;
      if (i + 1 < parts.length) next = eng.synth(parts[i + 1], id);
      await play(blob, my);
      if (my !== token) return;
    }
  } catch (e) {
    if (my !== token) return;
    if (eng === KOKORO) { // too heavy for this device or offline: try the lighter AI voice before the browser's
      console.warn('Natural voice failed, trying the lighter AI voice', e);
      return speakAI(text, 'en_US-ryan-medium', my, PIPER);
    }
    console.warn('AI voice failed, using the browser voice', e);
    voiceStatus("Couldn't load the AI voice (check your internet). Using the browser voice for now.");
    speakBrowser(text);
  }
}

function play(blob, my) {
  return new Promise(resolve => {
    if (my !== token) return resolve();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.playbackRate = settings.rate;
    const done = () => { URL.revokeObjectURL(url); audio.onended = audio.onpause = null; resolve(); };
    audio.onended = done;
    audio.onpause = done;
    audio.play().catch(done);
  });
}

export function setVoice(name, rate) {
  settings.voiceName = name; settings.rate = rate;
  store.set('voiceName', name); store.set('rate', rate);
}
export function hush() {
  token++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (!audio.paused) audio.pause();
}

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
