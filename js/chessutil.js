// DOM-free helpers shared by the browser UI and the Node checkers.
export const uciOf = m => m.from + m.to + (m.promotion || '');
export const toMoveArg = mv =>
  typeof mv === 'string' && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(mv)
    ? { from: mv.slice(0, 2), to: mv.slice(2, 4), promotion: mv[4] }
    : mv;
export const epd = fen => fen.split(' ').slice(0, 4).join(' ');
