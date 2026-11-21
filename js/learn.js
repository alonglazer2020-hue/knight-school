import { Chess } from '../vendor/chess.js';
import { setPage } from './ai-coach.js';
import { bumpToday, BELTS, rank, stripeNews } from './belts.js';
import { icon } from './icons.js';
import { Board, arrow, circle, uciOf } from './board.js';
import { coachBox, say, sfx } from './coach.js';
import { COURSES, ALL_LESSONS } from './lessons-data.js';
import * as store from './store.js';

const strip = s => s.replace(/[+#]/g, '');
const PRAISE = ['Nice!', 'Great move!', "That's it!", 'Excellent!', 'Well done!'];
const pick = a => a[Math.floor(Math.random() * a.length)];
const fenOf = s => { if (s.fen) return s.fen; const c = new Chess(); for (const m of s.pgn.split(' ')) c.move(m); return c.fen(); };

export const doneSet = () => new Set(store.get('done', []));
export const nextLesson = () => ALL_LESSONS.find(l => !doneSet().has(l.id));

// The curriculum as a belt path: each belt's lessons are stripes toward it.
const PATH = [
  ['yellow', ['pieces', 'check', 'special']],
  ['orange', ['values', 'principles', 'scholar-defense']],
  ['green', ['fork', 'pin', 'discovered']],
  ['blue', ['mates', 'endgame']],
  ['purple', ['italian', 'london', 'queens-gambit', 'caro-kann', 'slav']],
];
export function learnIndex(view) {
  const done = doneSet();
  const nxt = nextLesson();
  view.innerHTML = `<div class="page learn"><h1>Learn</h1>
    <p class="sub">${done.size} of ${ALL_LESSONS.length} lessons done. Each lesson is interactive: you move the pieces, Coach Knox talks you through it, and it counts as a stripe toward your next belt.</p>
    ${PATH.map(([beltId, ids]) => {
      const b = BELTS.find(x => x.id === beltId);
      const n = ids.filter(id => done.has(id)).length;
      return `<section class="beltsec" style="--belt:${b.color}">
      <h2><span class="swatch"></span>${b.name}<span class="count">${n} of ${ids.length} done</span></h2>
      <p class="sub">${b.about}</p>
      <ol class="lessons">${ids.map(id => ALL_LESSONS.find(l => l.id === id)).map(l => `<li><a class="lesson ${done.has(l.id) ? 'done' : ''} ${nxt?.id === l.id ? 'next' : ''}" href="#/learn/${l.id}">
        <span class="st">${done.has(l.id) ? icon('check') : nxt?.id === l.id ? icon('play') : ''}</span>
        <span class="t">${l.title}</span>
        <span class="m">${done.has(l.id) ? 'Done' : nxt?.id === l.id ? 'Up next' : `${l.steps.length} steps`}</span>${icon('arrow', 'go')}</a></li>`).join('')}</ol>
    </section>`;
    }).join('')}</div>`;
}

export function lessonView(view, id) {
  const lesson = ALL_LESSONS.find(l => l.id === id);
  if (!lesson) { location.hash = '#/learn'; return; }
  view.innerHTML = `<div class="play">
    <div class="boardcol"><div class="board"></div></div>
    <aside class="side">
      <div class="crumb"><a href="#/learn">${icon('back')} Lessons</a></div>
      <h2>${lesson.title}</h2>
      <div class="dots"></div>
      <div class="coachslot"></div>
      <div class="btns"><button class="b-back">${icon('back')} Back</button><button class="b-hint">${icon('bulb')} Hint</button><button class="b-next primary">Next</button></div>
    </aside></div>`;
  const $ = s => view.querySelector(s);
  $('.coachslot').append(coachBox());
  const board = new Board($('.board'), { onMove });
  let i = 0, ply = 0, fails = 0;
  const step = () => lesson.steps[i];

  function show() {
    const s = step();
    const fen = fenOf(s);
    const side = s.side ?? fen.split(' ')[1];
    ply = 0; fails = 0;
    board.load(fen, { orientation: side === 'w' ? 'white' : 'black', interactive: !!(s.answer || s.line) });
    board.shapes([...(s.arrows ?? []).map(a => arrow(a)), ...(s.circles ?? []).map(c => circle(c))]);
    $('.dots').innerHTML = lesson.steps.map((_, k) => `<span class="${k < i ? 'on' : k === i ? 'cur' : ''}"></span>`).join('');
    $('.b-next').disabled = !!(s.answer || s.line);
    $('.b-next').textContent = i === lesson.steps.length - 1 ? 'Finish' : 'Next';
    $('.b-back').disabled = i === 0;
    $('.b-hint').hidden = !(s.answer || s.line);
    setPage({
      chips: ['Explain this simpler', 'Why does this matter in real games?', 'Give me a hint'],
      info: () => `Lesson "${lesson.title}", step ${i + 1} of ${lesson.steps.length}. The lesson says: "${s.say}" Board (FEN): ${board.chess.fen()}${s.answer ? `. The task's answer is ${[].concat(s.answer).join(' or ')}: hint toward it, don't just give it away unless asked.` : ''}`,
    });
    say(s.say);
    if (s.line) autoReply();
  }

  function complete(msg) {
    board.setInteractive(false);
    $('.b-next').disabled = false;
    sfx.correct();
    say(msg, 'happy');
  }

  // play the opponent's moves of a line until it's the student's turn again
  function autoReply() {
    const s = step();
    if (ply >= s.line.length) return complete(s.drill ? 'Perfect recall! You know this line.' : 'Line complete! Press Next.');
    if (board.chess.turn() === s.side) return board.setInteractive(true);
    board.setInteractive(false);
    setTimeout(() => {
      const [san, note] = s.line[ply++];
      board.play(san);
      if (!s.drill && note) say(note);
      autoReply();
    }, 550);
  }

  function onMove(m) {
    const s = step();
    if (s.answer) {
      const ok = s.answer === 'mate' ? board.chess.isCheckmate() : s.answer.some(a => strip(a) === strip(m.san));
      if (ok) return complete(s.ok ?? pick(PRAISE));
      fails++;
      sfx.wrong();
      say(fails > 1 && s.hint ? s.hint : 'Not quite. Try again!', 'sad');
      setTimeout(() => board.undo(), 450);
      return;
    }
    if (s.line) {
      const [san, note] = s.line[ply];
      if (strip(m.san) === strip(san)) {
        ply++; fails = 0;
        if (!s.drill && note) say(note);
        return autoReply();
      }
      fails++;
      sfx.wrong();
      setTimeout(() => {
        board.undo();
        if (fails >= 2) {
          const c = new Chess(board.chess.fen()); const mv = c.move(san);
          board.shapes([arrow(uciOf(mv), 'blue')]);
          say(`In this line we play ${san}. ${note ?? ''}`);
        } else say('That move is not in this line. Think about the idea, then try again.', 'sad');
      }, 450);
    }
  }

  $('.b-next').onclick = () => {
    if (i < lesson.steps.length - 1) { i++; return show(); }
    const before = rank();
    const done = doneSet(); done.add(lesson.id); store.set('done', [...done]); bumpToday('lesson', true);
    const news = stripeNews(before);
    sfx.win();
    const nxt = nextLesson();
    say(`Lesson complete!${news} ${nxt ? `Up next: ${nxt.title}.` : 'You finished every lesson. Time for puzzles!'}`, 'happy');
    $('.btns').innerHTML = `<a class="btn" href="#/learn">All lessons</a>${nxt ? `<a class="btn primary" href="#/learn/${nxt.id}">Next lesson ${icon('arrow')}</a>` : `<a class="btn primary" href="#/puzzles">Puzzles ${icon('arrow')}</a>`}`;
  };
  $('.b-back').onclick = () => { if (i > 0) { i--; show(); } };
  $('.b-hint').onclick = () => {
    const s = step();
    if (s.line) {
      const c = new Chess(board.chess.fen()); const mv = c.move(s.line[ply][0]);
      board.shapes([arrow(uciOf(mv), 'blue')]);
      return say(`Play ${s.line[ply][0]}.`);
    }
    say(s.hint ?? 'Look at every check and every capture first.');
  };
  show();
}
