// Coach Knox, the real-AI version: a chat coach (Google Gemini, free key the player pastes once) that knows
// the player's games, ratings, weak spots, lessons, past conversations and what's on screen right now.
// Chess facts come from Stockfish and the review data passed in; the AI's job is to explain and coach, not to calculate.
import * as store from './store.js';
import { speak, hush, lastSaid } from './coach.js';
import { weaknesses } from './home.js';
import { doneSet } from './learn.js';
import { ALL_LESSONS } from './lessons-data.js';
import { THEMES, mistakes } from './puzzles.js';
import { Chess } from '../vendor/chess.js';
import { toMoveArg } from './chessutil.js';
import { icon } from './icons.js';
import { rank } from './belts.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// shortcut: Google renames models every few months; aliases first, then pinned names. Update this list if all of them 404.
const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'];
const MEMORY = 40;   // chat messages kept (synced, so the coach remembers you on every device)
const SENT = 16;     // of those, how many go with each question

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hasKey = () => !!store.get('aiKey', '');

// UCI moves -> "Nf3 Nc6 Bb5" from a position, so the AI reads moves the way people write them.
export function sanLine(fen, ucis = [], n = 8) {
  const c = new Chess(fen), out = [];
  for (const u of ucis.slice(0, n)) { try { out.push(c.move(toMoveArg(u)).san); } catch { break; } }
  return out.join(' ');
}

// ---- what's on screen: each page registers { info: () => string | Promise<string>, chips: [...] } ----
let page = null, repaintChips = () => {};
export function setPage(p) { page = p; repaintChips(); }
const HOME_CHIPS = ['What should I work on?', 'Make me a plan for this week', 'Why do I keep losing?'];

// ---- everything Knight School knows about the player ----
function profile() {
  const L = [];
  const revs = store.get('reviews', []).slice(0, 8).map(r => store.get('rv.' + r.key, null)).filter(Boolean);
  const elo = revs.map(R => (R.myColor === 'w' ? R.wr : R.br)).find(Boolean);
  L.push(`Username: ${store.get('username', '') || 'not set'} (plays on ${store.get('source', 'chesscom') === 'lichess' ? 'Lichess' : 'chess.com'}).`);
  const rk = rank();
  L.push(`Knight School belt: ${rk.belt.name}${rk.next ? `; working toward ${rk.next.name}, still needs: ${rk.stripes.filter(x => !x.ok).map(x => x.label).join(', ')}` : ''}.`);
  L.push(`Game rating: ${elo ?? 'unknown (no games reviewed yet)'}. Puzzle rating on Knight School: ${Math.round(store.get('prating', 800))}.`);
  const pst = store.get('pstats', { solved: 0, failed: 0, byTheme: {} });
  const badThemes = Object.entries(pst.byTheme ?? {}).filter(([, b]) => b.f > b.s).map(([t]) => THEMES[t]?.label ?? t);
  L.push(`Puzzles: ${pst.solved} solved, ${pst.failed} failed${badThemes.length ? `; struggles with: ${badThemes.join(', ')}` : ''}.`);
  const done = doneSet();
  L.push(`Lessons finished: ${ALL_LESSONS.filter(l => done.has(l.id)).map(l => l.title).join(', ') || 'none yet'}.`);
  const weak = weaknesses();
  if (weak.length) L.push(`Recurring weaknesses found in their reviewed games: ${weak.map(w => `${w.label} (${w.n}x)`).join(', ')}.`);
  L.push(`Saved mistakes waiting to be practiced: ${mistakes().length}.`);
  if (revs.length) {
    L.push('Recent reviewed games (newest first):');
    for (const R of revs) {
      const me = R.myColor, opp = me === 'w' ? `${R.black} (${R.br ?? '?'})` : `${R.white} (${R.wr ?? '?'})`;
      const out = R.result === '1/2-1/2' ? 'draw' : R.result === '*' ? 'unfinished' : (R.result === '1-0') === (me === 'w') ? 'won' : 'lost';
      const bad = R.plies.map((p, i) => ({ ...p, i })).filter(p => p.color === me && ['blunder', 'mistake', 'miss'].includes(p.cls))
        .slice(0, 4).map(p => `move ${Math.floor(p.i / 2) + 1} ${p.san} (${p.cls}${p.tag ? ', ' + p.tag : ''}; better was ${p.bestSan})`);
      L.push(`- ${new Date(R.date).toLocaleDateString()}: as ${me === 'w' ? 'White' : 'Black'} vs ${opp}, ${out}, accuracy ${Math.round(R.accuracy[me])}%${R.opening ? `, opening ${R.opening.slice(4)}` : ''}. ${bad.length ? 'Worst moves: ' + bad.join('; ') : 'No big mistakes.'}`);
    }
  }
  return L.join('\n');
}

function systemPrompt(onScreen) {
  return `You are Coach Knox, the personal chess coach inside Knight School, a free chess-learning website.
You coach ONE player and know them well (profile below). Your goal: make them the best chess player they can be.

How to coach:
- Talk like a warm, direct human coach, not a textbook. Short answers: 2-5 sentences unless they ask for a plan or a deeper explanation. Plain text, no tables or headings; use "- " bullets only for plans.
- Match their level (see their ratings). Explain ideas they can use in their next game, and connect to their own games and recurring weaknesses whenever it fits.
- Be honest about mistakes but encouraging. Celebrate progress you can see in the data.
- Chess facts: only use moves and evaluations from the Stockfish/review data given to you. Never invent concrete variations or claim a move wins without that data. If there is no engine data, explain general ideas and suggest reviewing the game.
- Write moves in standard notation (Nf3, Bxe5, O-O). Evaluations are in pawns from the player's side (+1.5 = they are better).
- Remember what they told you in earlier messages (goals, how often they play, what they find hard) and build on it.
- You can add buttons to your answer that open Knight School training. Put them at the end, at most 3, exactly in this form:
  [lesson:ID] for a lesson. IDs: ${ALL_LESSONS.map(l => `${l.id} (${l.title})`).join(', ')}
  [puzzles:THEME] for puzzles. Themes: ${Object.entries(THEMES).map(([k, t]) => `${k} (${t.label})`).join(', ')}
  [mistakes] to practice positions where they went wrong in their own games. [review] to review their latest games.
- Only talk about chess and their improvement; gently steer other topics back to chess.

PLAYER PROFILE
${profile()}

WHAT IS ON THEIR SCREEN RIGHT NOW
${onScreen || 'The Coach home page (their stats and today\'s plan).'}
${lastSaid() ? `Your last spoken line on this screen was: "${lastSaid()}"` : ''}`;
}

// ---- Gemini ----
async function gemini(system, history) {
  const key = store.get('aiKey', '');
  const order = [...new Set([store.get('aiModel', ''), ...MODELS].filter(Boolean))];
  let limited = false, last = '';
  for (const m of order) {
    let r;
    try {
      r = await fetch(`${API}/${m}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: history.map(x => ({ role: x.r, parts: [{ text: x.t }] })) }),
      });
    } catch { throw new Error("I can't reach Google right now. Check your internet connection."); }
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const text = (j.candidates?.[0]?.content?.parts ?? []).filter(p => !p.thought).map(p => p.text ?? '').join('').trim();
      if (!text) throw new Error("Hmm, I didn't get an answer that time. Try asking again.");
      store.set('aiModel', m);
      return text;
    }
    last = j.error?.message ?? `error ${r.status}`;
    if (r.status === 429) { limited = true; continue; } // that model's free quota is used up: try a lighter one
    if (r.status === 404) continue;                      // model renamed/retired: try the next
    if ([400, 401, 403].includes(r.status) && /api key|permission|unauthori|not enabled|denied/i.test(last)) throw new Error('BADKEY');
    throw new Error(`Google's AI said: ${last}`);
  }
  throw new Error(limited ? "We've used today's free AI questions. They reset tomorrow; everything else on the site still works." : `Google's AI said: ${last}`);
}

async function checkKey(key) {
  const r = await fetch(`${API}?pageSize=1`, { headers: { 'x-goog-api-key': key } }).catch(() => null);
  if (!r) throw new Error("Couldn't reach Google. Check your internet connection.");
  if (!r.ok) throw new Error("That key didn't work. Copy the whole key from Google AI Studio and try again.");
}

// ---- answer formatting: **bold**, bullets, and [lesson:x] style buttons ----
function actionLink(kind, id) {
  if (kind === 'lesson' && ALL_LESSONS.some(l => l.id === id)) return [`#/learn/${id}`, `${icon('book')} ${esc(ALL_LESSONS.find(l => l.id === id).title)}`];
  if (kind === 'puzzles' && THEMES[id]) return [`#/puzzles?theme=${id}`, `${icon('puzzle')} ${esc(THEMES[id].label)} puzzles`];
  if (kind === 'mistakes') return ['#/puzzles?mode=mistakes', `${icon('retry')} Fix my mistakes`];
  if (kind === 'review') return ['#/review', `${icon('chart')} Review my games`];
  return null;
}
const ACTION_RE = /\[(lesson|puzzles|mistakes|review)(?::([\w-]+))?\]/g;
function format(text) {
  const links = [];
  const body = text.replace(ACTION_RE, (_, k, id) => { const a = actionLink(k, id); if (a) links.push(a); return ''; }).trim();
  const html = esc(body).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^\s*[-*] /gm, '• ').replace(/\n/g, '<br>');
  return { html, links, plain: body.replace(/\*\*/g, '').replace(/^\s*[-*] /gm, '') };
}

// One short personal note a day for the Coach page (one free AI request a day, cached).
export async function dailyNote() {
  if (!hasKey()) return null;
  const day = new Date().toDateString();
  const c = store.get('aiDaily', null);
  if (c?.day === day) return format(c.text);
  const text = await gemini(systemPrompt("The Coach home page. You are writing today's note at the top of it."),
    [{ r: 'user', t: "Write today's coach note for me: 2 or 3 short sentences. Name one specific thing from my recent games or progress, then the one thing I should focus on today. End with one button." }]);
  store.set('aiDaily', { day, text });
  return format(text);
}

// ---- the chat panel ----
let openFn = () => {};
export function openChat(question) { openFn(question); }

export function initChat(button, panel) {
  panel.innerHTML = `
    <div class="chat-head"><span class="avatar sm"><img src="img/knight.svg" alt=""></span><b>Coach Knox</b><small class="chat-sub">knows your games</small><button class="c-close ib" title="Close" aria-label="Close chat">${icon('close')}</button></div>
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-chips"></div>
    <form class="chat-form"><input name="q" placeholder="Ask your coach anything…" autocomplete="off" maxlength="600" aria-label="Your question"><button class="primary" aria-label="Send">${icon('send')}</button></form>
    <details class="chat-set"><summary>Coach settings</summary>
      <p class="vhint">The coach uses Google's Gemini AI with your own free key. Your questions and game data are sent to Google to get answers.</p>
      <div class="row"><button class="c-forget">Forget our chats</button><button class="c-nokey">Remove my key</button></div></details>`;
  const $ = s => panel.querySelector(s);
  const log = $('.chat-log');
  let busy = false;

  const bubble = (who, html, links = []) => {
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = html + (links.length ? `<div class="msg-links">${links.map(([h, l]) => `<a class="btn" href="${h}">${l}</a>`).join('')}</div>` : '');
    log.append(d);
    log.scrollTop = log.scrollHeight;
    return d;
  };

  function renderLog() {
    log.innerHTML = '';
    if (!hasKey()) return setupCard();
    const chat = store.get('chat', []);
    if (!chat.length) bubble('ai', "Hey! I'm your coach. I can see your games, your puzzle results and what you're looking at right now. Ask me anything, like why a move was bad, what to work on, or how to beat a certain opening.");
    for (const m of chat) m.r === 'user' ? bubble('me', esc(m.t)) : (({ html, links }) => bubble('ai', html, links))(format(m.t));
  }

  function setupCard() {
    const d = bubble('ai', `<b>Let's make me a real coach.</b> I need a free Google AI key. It takes about a minute and needs no credit card:
      <ol><li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> and sign in with your Google account.</li>
      <li>Press <b>Create API key</b>, then copy it.</li><li>Paste it here.</li></ol>
      <form class="keyform"><input name="k" placeholder="Paste your key" autocomplete="off" spellcheck="false"><button class="primary">Save</button></form>
      <small class="keymsg">The key stays on this device only. Do this once on each device you use.</small>`);
    d.querySelector('.keyform').onsubmit = async e => {
      e.preventDefault();
      const k = e.target.k.value.trim(), msg = d.querySelector('.keymsg');
      if (!k) return;
      msg.textContent = 'Checking your key…';
      try { await checkKey(k); } catch (err) { msg.textContent = err.message; msg.classList.add('err'); return; }
      store.set('aiKey', k);
      renderLog(); repaintChips();
    };
  }

  repaintChips = () => {
    const chips = hasKey() ? (page?.chips ?? HOME_CHIPS) : [];
    $('.chat-chips').innerHTML = chips.map(c => `<button class="chip" type="button">${esc(c)}</button>`).join('');
    $('.chat-form').hidden = !hasKey();
  };
  $('.chat-chips').onclick = e => { const b = e.target.closest('.chip'); if (b) ask(b.textContent); };

  async function ask(q) {
    q = q.trim();
    if (!q || busy || !hasKey()) return;
    busy = true;
    const chat = store.get('chat', []);
    chat.push({ r: 'user', t: q });
    bubble('me', esc(q));
    const wait = bubble('ai thinking', 'Thinking…');
    hush();
    try {
      const onScreen = page?.info ? await page.info() : '';
      const answer = await gemini(systemPrompt(onScreen), chat.slice(-SENT));
      chat.push({ r: 'model', t: answer });
      store.set('chat', chat.slice(-MEMORY));
      wait.remove();
      const { html, links, plain } = format(answer);
      bubble('ai', html, links);
      speak(plain);
    } catch (err) {
      wait.remove();
      if (err.message === 'BADKEY') { store.del('aiKey'); renderLog(); bubble('ai', 'Google rejected the saved key, so I removed it. Please paste a new one above.'); }
      else bubble('ai err', esc(err.message));
    } finally { busy = false; repaintChips(); }
  }

  $('.chat-form').onsubmit = e => { e.preventDefault(); const q = e.target.q.value; e.target.q.value = ''; ask(q); };
  $('.c-close').onclick = () => { panel.hidden = true; };
  $('.c-forget').onclick = () => { if (confirm('Forget everything you and the coach talked about?')) { store.set('chat', []); renderLog(); } };
  $('.c-nokey').onclick = () => { if (confirm('Remove your Google AI key from this device?')) { store.del('aiKey'); store.del('aiModel'); renderLog(); repaintChips(); } };
  log.addEventListener('click', e => { if (e.target.closest('.msg-links a') && matchMedia('(max-width: 860px)').matches) panel.hidden = true; });

  openFn = question => {
    const wasHidden = panel.hidden;
    panel.hidden = false;
    if (wasHidden) { renderLog(); repaintChips(); }
    if (question && hasKey()) ask(question); else $('.chat-form input')?.focus();
  };
  button.onclick = () => (panel.hidden ? openFn() : (panel.hidden = true));
  renderLog(); repaintChips();
}
