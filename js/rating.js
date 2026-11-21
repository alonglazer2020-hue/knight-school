// Rating history: every game's rating in one time control as a chart, plus best, record and win rate.
import { account, stats, history, games, mainTc } from './chesscom.js';
import { icon } from './icons.js';

const TCS = ['rapid', 'blitz', 'bullet', 'daily'];
const cap = s => s[0].toUpperCase() + s.slice(1);

function chart(h) {
  if (h.length < 2) return '<p class="sub">Play a few more games in this time control to see your chart.</p>';
  const w = 1000, ht = 300, pad = 6;
  const lo = Math.min(...h.map(x => x.r)), hi = Math.max(...h.map(x => x.r)), span = Math.max(hi - lo, 1);
  const y = r => ht - pad - ((r - lo) / span) * (ht - 2 * pad);
  const pts = h.map((x, i) => `${((i / (h.length - 1)) * w).toFixed(1)},${y(x.r).toFixed(1)}`).join(' ');
  const best = h.reduce((b, x) => (x.r > b.r ? x : b), h[0]);
  const bi = h.indexOf(best);
  const fmt = t => new Date(t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return `<div class="hchart"><div class="yax"><span>${hi}</span><span>${lo}</span></div>
    <svg viewBox="0 0 ${w} ${ht}" preserveAspectRatio="none" role="img" aria-label="Rating from ${h[0].r} to ${h.at(-1).r} over ${h.length} games; best ${best.r}">
      <polygon points="0,${ht} ${pts} ${w},${ht}" class="area"/><polyline points="${pts}" class="line"/>
      <circle cx="${((bi / (h.length - 1)) * w).toFixed(1)}" cy="${y(best.r).toFixed(1)}" r="5" class="best"/></svg>
    <div class="xax"><span>${fmt(h[0].t)}</span><span>${fmt(h.at(-1).t)}</span></div></div>`;
}

export function ratingView(view, params) {
  if (!account()) { view.innerHTML = '<div class="page"><h1>Rating history</h1><p class="sub">Connect your chess.com account on the Coach page to see your rating history.</p></div>'; return; }
  const st = stats() ?? {};
  const tcs = TCS.filter(t => st[t]?.r || history(t).length);
  const tc = tcs.includes(params.get('tc')) ? params.get('tc') : mainTc();
  const h = history(tc), s = st[tc] ?? {};
  const n = (s.w ?? 0) + (s.l ?? 0) + (s.d ?? 0);
  view.innerHTML = `<div class="page rating"><div class="crumb"><a href="#/coach">${icon('back')} Coach</a></div><h1>Rating history</h1>
    <div class="seg tcs">${tcs.map(t => `<a class="${t === tc ? 'active' : ''}" href="#/rating?tc=${t}">${cap(t)}</a>`).join('')}</div>
    <section class="card"><div class="rstats">
      <div><span class="lbl">Now</span><b>${s.r ?? h.at(-1)?.r ?? '–'}</b></div>
      <div><span class="lbl">Best</span><b>${s.best ?? '–'}</b></div>
      <div><span class="lbl">Record</span><b>${s.w ?? 0}<small>W</small> ${s.l ?? 0}<small>L</small> ${s.d ?? 0}<small>D</small></b></div>
      <div><span class="lbl">Win rate</span><b>${n ? Math.round((100 * (s.w ?? 0)) / n) + '%' : '–'}</b></div>
    </div>${chart(h)}<p class="m">${h.length} ${cap(tc).toLowerCase()} games loaded${games().length >= 5000 ? ' (newest 5000 games across all time controls)' : ''}.</p></section></div>`;
}
