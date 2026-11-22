// Lesson content. Pure data (no DOM) so tools/check-lessons.mjs can verify every answer with Stockfish.
// Step kinds:
//   info : { fen|pgn, say, arrows?, circles? }                 -> press Next
//   find : { fen|pgn, say, answer: ['SAN'...] | 'mate', ok, hint } -> play the right move
//   line : { fen|pgn, say, side: 'w'|'b', line: [[san, note]...], drill? } -> play your side of a line
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function opening(id, title, side, intro, line, ideas) {
  return {
    id, title, steps: [
      { fen: START, side, say: intro },
      { fen: START, side, line, say: `Let's learn it move by move. You play ${side === 'w' ? 'White' : 'Black'}. Read my note after each move.` },
      { fen: START, side, line, drill: true, say: 'Now from memory! Play the whole line without notes. I will help if you get stuck.' },
      { pgn: line.map(x => x[0]).join(' '), side, say: ideas },
    ],
  };
}

export const COURSES = [
  {
    id: 'basics', title: 'Chess Basics', icon: '♙', lessons: [
      {
        id: 'pieces', title: 'How the pieces move', steps: [
          { fen: START, say: "Welcome to Knight School! I'm Coach Knox. Chess is played on 64 squares, and White always moves first. Each side has 8 pawns, 2 rooks, 2 knights, 2 bishops, a queen and a king. Press Next and let's meet them." },
          { fen: '7k/8/8/p7/8/8/8/R5K1 w - - 0 1', say: 'The rook moves in straight lines: up, down, left or right, as far as it wants. Capture the black pawn with your rook.', answer: ['Rxa5'], ok: 'Nice! Rooks love open lines.', hint: 'Slide the rook straight up the a-file.' },
          { fen: '7k/8/8/8/4p3/8/8/1B4K1 w - - 0 1', say: 'The bishop moves diagonally, as far as it wants. It always stays on the same color square. Capture the pawn.', answer: ['Bxe4'], ok: 'Exactly. Diagonal power!', hint: 'Follow the diagonal from b1 up to the right.' },
          { fen: '7k/3p4/8/8/8/8/8/3Q2K1 w - - 0 1', say: 'The queen is the strongest piece: she moves like a rook AND a bishop. Capture the pawn.', answer: ['Qxd7'], ok: 'The queen is worth about nine pawns. Keep her safe!', hint: 'Straight up the d-file.' },
          { fen: '7k/8/8/8/8/2p5/8/1N4K1 w - - 0 1', say: 'The knight moves in an L shape: two squares one way, then one square to the side. It is the only piece that can jump over others. Capture the pawn.', answer: ['Nxc3'], ok: 'Great jump! Knights are tricky because their moves are hard to see.', hint: 'Two up, one to the right.' },
          { fen: '7k/8/8/8/8/3p4/4P3/6K1 w - - 0 1', say: 'Pawns move straight forward one square, or two on their very first move. But they capture diagonally, one square forward. Capture the black pawn.', answer: ['exd3'], ok: 'Perfect. Pawns move straight but capture diagonally.', hint: 'Your e2 pawn can capture one square diagonally forward.' },
          { fen: '8/8/8/4k3/8/8/8/4K3 w - - 0 1', circles: ['d1', 'd2', 'e2', 'f2', 'f1'], say: 'The king moves one square in any direction. He is the most important piece: if your king is trapped, you lose. The king can never move into check.' },
        ],
      },
      {
        id: 'check', title: 'Check, checkmate & stalemate', steps: [
          { fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', arrows: ['a1a8'], say: 'When a piece attacks the king, that is CHECK. The king must escape immediately: by moving, by blocking, or by capturing the attacker. If there is no escape, it is CHECKMATE and the game is over.' },
          { fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', say: "Black's king is stuck behind its own pawns. Deliver checkmate in one move!", answer: 'mate', ok: 'Checkmate! This is called a back-rank mate. It happens to beginners and grandmasters alike.', hint: 'Use your rook on the back rank, the 8th row.' },
          { fen: 'k7/8/1K6/8/8/8/8/7Q w - - 0 1', say: 'Your king helps your queen here. Find checkmate!', answer: 'mate', ok: 'Checkmate! The king and queen work together.', hint: 'Bring the queen next to the black king, protected by your own king.' },
          { fen: 'k7/8/1Q6/8/8/8/8/6K1 b - - 0 1', circles: ['a8'], say: "Careful! Here it's Black's move, the king is NOT in check, but it has no legal moves. That is STALEMATE, and it's a draw. Always leave the losing king a square, unless you are delivering checkmate." },
          { fen: 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1', say: 'Your turn. Find checkmate, and do NOT stalemate!', answer: 'mate', ok: 'Checkmate, no stalemate. Well played!', hint: 'Put the queen right in front of the king, where your own king protects her.' },
        ],
      },
      {
        id: 'special', title: 'Special moves', steps: [
          { fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1', say: 'CASTLING moves the king two squares toward a rook, and the rook jumps over to the other side. It keeps your king safe and brings your rook into play. Castle now: drag your king two squares to the right.', answer: ['O-O'], ok: "Castled! You can't castle if the king or that rook has moved, or out of, through, or into check.", hint: 'Move the king from e1 to g1.' },
          { fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', arrows: ['d7d5'], say: 'Black just moved a pawn two squares, landing next to yours. You may capture it as if it moved only one: that is EN PASSANT. Your e5 pawn captures diagonally to d6. Try it!', answer: ['exd6'], ok: "En passant! You can only do it immediately after the two-square move.", hint: 'Move your e5 pawn to d6.' },
          { fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', say: 'When a pawn reaches the last row, it PROMOTES, usually to a queen. Promote your pawn!', answer: ['b8=Q'], ok: 'A brand new queen, and it gives check too!', hint: 'Push the b7 pawn to b8.' },
        ],
      },
      {
        id: 'values', title: 'Piece values & free pieces', steps: [
          { fen: START, say: 'Pieces have rough values: a pawn is 1, a knight 3, a bishop 3, a rook 5, and a queen 9. The king is priceless. Trade when it helps you, and never give pieces away for free.' },
          { fen: '6k1/5ppp/8/3n4/8/8/5PPP/3R2K1 w - - 0 1', say: 'A piece nobody defends is called "hanging". Black left a knight hanging. Take it!', answer: ['Rxd5'], ok: 'Free knight! Always ask: what did my opponent leave unprotected?', hint: 'Look down the d-file.' },
          { fen: '3q1r1k/8/4N3/8/8/8/8/6K1 w - - 0 1', say: 'Your knight can capture two different pieces. Pick the most valuable one!', answer: ['Nxd8'], ok: 'You took the queen, worth 9, instead of the rook, worth 5. Even if Black takes your knight back, you won big.', hint: 'Which is worth more, the queen or the rook?' },
          { fen: '6k1/5ppp/8/8/3q4/8/2N2PPP/3R2K1 w - - 0 1', say: 'Before EVERY move, do a blunder check: what can my opponent take? What can I take? Black left its queen open. Capture it safely!', answer: ['Nxd4', 'Rxd4'], ok: 'Queen won! Both captures work, because the queen was undefended.', hint: 'The queen on d4 is attacked by two of your pieces.' },
        ],
      },
      {
        id: 'principles', title: 'Opening principles', steps: [
          { fen: START, arrows: ['e2e4', 'd2d4'], circles: ['d4', 'e4', 'd5', 'e5'], say: 'Rule one: fight for the CENTER. Pawns on e4 and d4 control the key squares and open lines for your pieces.' },
          { fen: START, arrows: ['g1f3', 'b1c3', 'f1c4', 'c1f4'], say: 'Rule two: DEVELOP your knights and bishops early. Knights before bishops is a good habit. Every move should bring a new piece into the game.' },
          { pgn: 'e4 e5 Nf3 Nc6 Bc4 Bc5', arrows: ['e1g1'], say: 'Rule three: CASTLE early to keep your king safe, usually within the first ten moves.' },
          { fen: START, circles: ['d1'], say: "Rule four: don't bring your queen out too early. She gets chased around by smaller pieces and you lose time. And don't move the same piece twice without a good reason." },
          { fen: START, side: 'w', line: [['e4', 'Center pawn.'], ['e5', 'Black takes the center too.'], ['Nf3', 'Develop a knight, and attack e5.'], ['Nc6', 'Black defends.'], ['Bc4', 'Develop the bishop, aiming at f7.'], ['Bc5', 'Black copies.'], ['O-O', 'Castled! King safe, rook ready.']], say: "Let's put it together. Play the moves: center, knight, bishop, castle." },
        ],
      },
    ],
  },
  {
    id: 'tactics', title: 'Tactics', icon: '⚔', lessons: [
      {
        id: 'fork', title: 'The fork', steps: [
          { fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', say: 'A FORK is one piece attacking two things at once. Your opponent can only save one. Knights are the best forkers. Find a knight move that attacks the king AND the rook.', answer: ['Nc7+'], ok: 'Royal fork! The king must move, and you take the rook next.', hint: 'Look for a square where the knight checks the king and also hits a8.' },
          { fen: '7k/8/3n1r2/8/4P3/8/8/K7 w - - 0 1', say: 'Even a humble pawn can fork. Attack both black pieces with one pawn move.', answer: ['e5'], ok: 'Pawn fork! Black will lose a knight or a rook to a single pawn.', hint: 'Pawns capture diagonally, so push one up between the two pieces.' },
          { fen: '8/6k1/8/r7/8/8/8/4Q2K w - - 0 1', say: 'The queen forks too. Find a queen move that checks the king and attacks the rook.', answer: ['Qc3+'], ok: 'Check and attack! After the king deals with the check, the rook falls.', hint: 'One long diagonal hits g7, the other hits a5. Where do they cross?' },
        ],
      },
      {
        id: 'pin', title: 'Pins & skewers', steps: [
          { fen: '6k1/8/8/3q4/8/1P6/8/4KB2 w - - 0 1', say: "A PIN attacks a piece that can't move because something more valuable stands behind it. Pin the black queen to its king!", answer: ['Bc4'], ok: 'The queen is pinned to the king. If she takes the bishop, your pawn takes her back. You win the queen for a bishop!', hint: 'Put your bishop on the diagonal between the queen and the king, protected by your pawn.' },
          { fen: '8/8/2k4r/8/8/8/8/R5K1 w - - 0 1', say: 'A SKEWER is a pin in reverse: attack the valuable piece first, and when it moves you capture what is behind it. Skewer the king and rook!', answer: ['Ra6+'], ok: 'Skewer! The king must step away and the rook on h6 falls.', hint: 'Check the king along the 6th rank.' },
        ],
      },
      {
        id: 'discovered', title: 'Discovered attacks', steps: [
          { fen: '3qk3/8/8/4N3/8/8/8/4R1K1 w - - 0 1', arrows: ['e1e8'], say: 'A DISCOVERED attack happens when one piece moves out of the way and uncovers an attack by another. Your rook is aiming at the king, hidden behind your knight. Move the knight with discovered check AND attack the queen.', answer: ['Nc6+'], ok: 'Discovered check! Black must handle the rook check, and your knight wins the queen.', hint: 'Find a knight move that attacks d8 and keeps clear of the black king.' },
        ],
      },
    ],
  },
  {
    id: 'mates', title: 'Checkmate Patterns', icon: '♚', lessons: [
      {
        id: 'mates', title: 'Must-know checkmates', steps: [
          { pgn: 'e4 e5 Bc4 Nc6 Qh5 Nf6', say: "SCHOLAR'S MATE: Black just made a big mistake by attacking your queen instead of defending f7. Checkmate!", answer: 'mate', ok: "Qxf7 is checkmate! The bishop protects the queen. As Black, defend f7 with g6 or Qe7.", hint: 'Look at the f7 square. Your queen and bishop both aim at it.' },
          { fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', say: "SMOTHERED MATE: Black's king is boxed in by its own pieces. A single knight can finish it!", answer: 'mate', ok: 'Smothered mate! The king had no room to breathe.', hint: 'Which square lets the knight check h8?' },
          { fen: '6k1/5p1p/5PpQ/8/8/8/8/6K1 w - - 0 1', say: "The QUEEN KISS: the queen lands right next to the king, protected by a friend. Find it!", answer: 'mate', ok: 'Checkmate! The f6 pawn protects your queen on g7.', hint: 'Put the queen on g7.' },
          { fen: '7k/R7/8/8/8/8/8/1R4K1 w - - 0 1', say: 'The LADDER MATE: two rooks take turns cutting off the king. One rook guards the 7th row. Finish with the other!', answer: 'mate', ok: 'Ladder mate! You can push a lone king to the edge like this from anywhere on the board.', hint: 'The 8th rank is open for your b1 rook.' },
        ],
      },
    ],
  },
  {
    id: 'endgames', title: 'Endgames', icon: '♔', lessons: [
      {
        id: 'endgame', title: 'Pawn races & the square', steps: [
          { fen: '8/8/8/8/P6k/8/8/K7 w - - 0 1', arrows: ['a4a8'], say: "In the endgame, every pawn is a future queen. RULE OF THE SQUARE: draw a box from your pawn to the promotion row. If the enemy king can't step into that box, it can't catch the pawn." },
          { fen: '8/8/8/8/P6k/8/8/K7 w - - 0 1', say: "Black's king is far outside the square. Make the winning move!", answer: ['a5'], ok: 'Run, pawn, run! The black king is too slow and you will get a new queen.', hint: 'Push the pawn.' },
          { fen: '8/8/8/3k4/8/8/3P4/3K4 w - - 0 1', say: "Here's a key idea: in king and pawn endings, the king should go IN FRONT of its pawn. Kings are strong fighters once the queens are gone. Bring your king up!", answer: ['Ke2', 'Kc2'], ok: 'Exactly. Lead with the king, the pawn follows.', hint: 'Move the king forward, toward the center.' },
        ],
      },
    ],
  },
  {
    id: 'club', title: 'Club Player Skills', icon: '♖', lessons: [
      {
        id: 'remove-defender', title: 'Remove the defender', steps: [
          { fen: '5rk1/pp3ppp/5n2/6B1/8/3Q4/PP3PPP/1B4K1 w - - 0 1', arrows: ['d3h7'], circles: ['f6'], say: "Your queen and bishop aim at h7, but the knight on f6 guards it. When one piece does an important job, attack THAT piece. This is called removing the defender." },
          { fen: '5rk1/pp3ppp/5n2/6B1/8/3Q4/PP3PPP/1B4K1 w - - 0 1', say: 'Remove the defender!', answer: ['Bxf6'], ok: "If Black takes back with gxf6, Qxh7 is checkmate. If not, you're simply a piece up.", hint: 'Which white piece can take the knight on f6?' },
        ],
      },
      {
        id: 'back-rank', title: 'Back-rank weakness', steps: [
          { fen: '6k1/5ppp/8/8/8/7P/5PP1/6K1 w - - 0 1', circles: ['h2'], say: "A king behind three unmoved pawns has no escape square. One rook or queen on the back rank can be checkmate. Strong players give the king air with a move like h3, called luft, once things calm down." },
          { fen: '3r2k1/5ppp/8/8/1Q6/8/5PPP/3R2K1 b - - 0 1', say: "You're Black. White's king has no air, and White's rook is defended only once. Find the winning blow!", answer: ['Rxd1+'], ok: 'After Rxd1+ White can only block with Qe1, and Rxe1 is checkmate. Always check the back rank, yours and theirs.', hint: 'Capture on d1 with check.' },
        ],
      },
      {
        id: 'opposition', title: 'King opposition', steps: [
          { fen: '8/4k3/8/4K3/4P3/8/8/8 b - - 0 1', arrows: ['e5e7'], say: 'When two kings face each other with one square between them, that is the OPPOSITION. The side that must move has to step aside. Here Black is to move, so the black king must give way and White wins.' },
          { fen: '4k3/8/8/4K3/4P3/8/8/8 w - - 0 1', say: 'Golden rule: a king on the 6th rank in front of its pawn always wins. Get there!', answer: ['Kd6', 'Ke6', 'Kf6'], ok: 'Your king leads the way and the pawn will queen. Kings are fighters in the endgame.', hint: 'Step up to the 6th rank, next to or in front of the e-file.' },
        ],
      },
      {
        id: 'breakthrough', title: 'Pawn breakthrough', steps: [
          { fen: '8/ppp3k1/8/PPP5/8/8/8/K7 w - - 0 1', say: "Three pawns against three, and both kings far away. It looks equal, but one pawn sacrifice breaks through and makes a new queen. It's a famous trick." },
          { fen: '8/ppp3k1/8/PPP5/8/8/8/K7 w - - 0 1', say: 'Find the breakthrough!', answer: ['b6'], ok: 'If axb6, then c6! And if cxb6, then a6! Either way one of your pawns runs through to queen before the black king arrives.', hint: 'Push the middle pawn.' },
        ],
      },
      {
        id: 'smothered-combo', title: 'The smothered mate combo', steps: [
          { fen: '3r3k/6pp/1q6/6N1/2Q5/8/5PPP/6K1 w - - 0 1', say: "Black's king is boxed in by its own pawns. A famous combination wins by force: check, double check, a queen sacrifice, then a knight mate. Calculate it! First move?", answer: ['Nf7+'], ok: 'Check! The king must go back to g8.', hint: 'Start with a knight check.' },
          { fen: '3r2k1/5Npp/1q6/8/2Q5/8/5PPP/6K1 w - - 2 2', say: 'Now a double check: the knight moves and uncovers your queen on the same diagonal.', answer: ['Nh6+'], ok: 'Double check! Only the king can move, back to h8.', hint: 'The knight jumps where it also gives check, letting the queen check too.' },
          { fen: '3r3k/6pp/1q5N/8/2Q5/8/5PPP/6K1 w - - 4 3', say: 'Now the brave part. Give up your queen with check!', answer: ['Qg8+'], ok: "Black must take with the rook, because the king can't: your knight guards g8.", hint: 'Put the queen right next to the king, where the knight protects her.' },
          { fen: '6rk/6pp/1q5N/8/8/8/5PPP/6K1 w - - 0 4', say: 'Finish it!', answer: 'mate', ok: "Smothered mate! This combination is called Philidor's Legacy. Calculating 4 moves ahead like this is how strong players win.", hint: 'Your knight goes back to f7.' },
        ],
      },
      {
        id: 'rook-endgames', title: 'Rook endgames: Philidor & Lucena', steps: [
          { fen: '3k4/8/r7/3PK3/8/8/8/7R b - - 0 1', arrows: ['a6h6'], say: "Rook endgames are the most common endgames. Defending: keep your rook on your 3rd rank (the 6th here) so the enemy king can't come forward. If the pawn advances, check the king from behind. That's the PHILIDOR position, and it's a draw." },
          { fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1', say: "Attacking: your pawn is on the 7th, but your king is stuck in front of it and the black rook checks from the side. That's the LUCENA position. The winning trick is to build a bridge with your rook." },
          { fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1', side: 'w', say: 'Play the winning plan: push the black king away with a check, put your rook on the 4th rank, then walk your king out. When the checks run out, the rook blocks.', line: [['Rd1+', 'Push the black king one file further away.'], ['Ke7', 'The king steps aside.'], ['Rd4', 'The bridge! The rook waits on the 4th rank.'], ['Ra1', 'Black gets ready to check.'], ['Kc7', 'Out comes your king.'], ['Rc1+', 'Check.'], ['Kb6', 'Keep walking toward the rook.'], ['Rb1+', 'Check.'], ['Kc6', 'Step aside.'], ['Rc1+', 'Check again.'], ['Kb5', 'Toward your bridge.'], ['Rb1+', 'Last check.'], ['Rb4', 'The bridge blocks the checks, and the pawn will queen.']] },
        ],
      },
      {
        id: 'structures', title: 'Pawn structures & plans', steps: [
          { fen: 'r1bq1rk1/pp2bppp/2n1pn2/8/3P4/2NB1N2/PP3PPP/R1BQ1RK1 w - - 0 1', circles: ['d4'], say: "Strong players think in plans, and plans come from the pawns. Here White has an ISOLATED queen's pawn on d4: no pawn on c or e can protect it. It gives White space and attacking chances, but it can become a weakness in the endgame." },
          { fen: 'r1bq1rk1/pp2bppp/2n1pn2/8/3P4/2NB1N2/PP3PPP/R1BQ1RK1 w - - 0 1', arrows: ['f1e1', 'd1e2', 'f3e5'], say: 'With the isolated pawn: attack! Put your pieces on active squares and use e5 for a knight. Against it: trade pieces, block the square in front of it (d5), and win it in the endgame.' },
          { fen: '6k1/5ppp/8/1P6/8/8/5PPP/6K1 w - - 0 1', arrows: ['b5b8'], say: 'A PASSED pawn has no enemy pawn in front of it or on the next files. Passed pawns must be pushed: in the endgame it ties down the enemy king while your king eats the other pawns.' },
          { fen: 'r1bq1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R2QKB1R w - - 0 1', arrows: ['b2b4', 'b4b5'], say: "When you have fewer pawns on one side, push them anyway: the MINORITY ATTACK. b4 and b5 here will leave Black with a weak pawn on c6 or d5 to attack. The rule: find the weak pawn or square, then aim all your pieces at it." },
        ],
      },
    ],
  },
  {
    id: 'openings', title: 'Opening Courses', icon: '📖', lessons: [
      opening('italian', 'Italian Game (White)', 'w',
        'The Italian Game is perfect for beginners: fast development, quick castling, and pressure on f7. It starts with e4, Nf3 and Bc4.',
        [['e4', 'Take the center and open lines for your queen and bishop.'], ['e5', 'Black takes the center too.'],
          ['Nf3', 'Develop and attack the e5 pawn.'], ['Nc6', 'Black defends e5 and develops.'],
          ['Bc4', 'The Italian bishop! It aims at f7, the weakest square near the black king.'], ['Bc5', 'Black mirrors you. This is the Giuoco Piano, the "quiet game".'],
          ['c3', 'Prepare to play d4 later and build a big center.'], ['Nf6', 'Black attacks your e4 pawn.'],
          ['d3', 'Solid: protect e4 and open your other bishop.'], ['d6', 'Black solidifies too.'],
          ['O-O', 'Castle early. King safe, rook connected.'], ['O-O', 'Black castles as well.'],
          ['Re1', 'The rook backs up the e-pawn and prepares d4.'], ['a6', 'Black makes a retreat square for the bishop.'],
          ['Bb3', 'Tuck your bishop away from any ...d5 or ...Na5 attacks.']],
        'Key ideas in the Italian: aim at f7, castle quickly, then prepare d4. A typical plan is Nbd2, Nf1 and Ng3, bringing the knight toward the kingside.'),
      opening('london', 'London System (White)', 'w',
        'The London System is a set-up you can play against almost anything: d4, Bf4, e3, Nf3, c3, Bd3 and castle. Easy to learn, hard to beat.',
        [['d4', 'Grab the center with the queen pawn.'], ['d5', 'Black stops you from playing e4 easily.'],
          ['Bf4', 'The London bishop! Develop it BEFORE e3 so it does not get locked in.'], ['Nf6', 'Black develops.'],
          ['e3', 'Now open the way for your other bishop.'], ['e6', 'Black does the same.'],
          ['Nf3', 'Knight out, controlling e5.'], ['c5', 'Black hits your center.'],
          ['c3', 'The London triangle: c3, d4, e3. Your center is rock solid.'], ['Nc6', 'Black adds pressure on d4.'],
          ['Nbd2', 'Knight to d2, keeping c3 for the pawn and supporting e4 later.'], ['Bd6', 'Black offers to trade bishops.'],
          ['Bg3', 'Keep your good bishop. If Black takes, your h-pawn opens a file.'], ['O-O', 'Black castles.'],
          ['Bd3', 'Develop the last minor piece, aiming at the black king.']],
        'Key ideas in the London: same set-up every game, castle short, then look for Ne5, Qe2 and a kingside attack. If Black plays ...Qb6 early, defend b2 with Qb3 or Qc1.'),
      opening('queens-gambit', "Queen's Gambit (White)", 'w',
        "The Queen's Gambit offers a pawn to take the center. It's one of the oldest and most respected openings.",
        [['d4', 'Center pawn.'], ['d5', 'Black matches.'],
          ['c4', 'The gambit: you offer the c-pawn to pull Black away from the center.'], ['e6', "Black declines with the Queen's Gambit Declined, keeping a strong d5."],
          ['Nc3', 'Develop and add pressure on d5.'], ['Nf6', 'Black defends d5.'],
          ['Bg5', 'Pin the knight that defends d5.'], ['Be7', 'Black breaks the pin.'],
          ['e3', 'Open the way for your light-square bishop.'], ['O-O', 'Black castles.'],
          ['Nf3', 'Develop and castle soon.'], ['h6', 'Black asks your bishop a question.'],
          ['Bh4', 'Keep the pin.']],
        "Key ideas: pressure on d5, develop everything, castle, then use your queenside space. If Black takes on c4 with dxc4 early, you can usually win the pawn back with e3 and Bxc4."),
      opening('caro-kann', 'Caro-Kann (Black vs e4)', 'b',
        "The Caro-Kann is a rock-solid answer to 1.e4. You play c6 and d5, challenge the center, and get your light-square bishop out before playing e6.",
        [['e4', 'White takes the center.'], ['c6', 'Prepare d5, supported by the c-pawn.'],
          ['d4', 'White builds a big center.'], ['d5', 'Strike back at e4!'],
          ['Nc3', 'White defends e4.'], ['dxe4', 'Take the pawn.'],
          ['Nxe4', 'White recaptures.'], ['Bf5', 'Develop the bishop OUTSIDE your pawn chain, with tempo on the knight.'],
          ['Ng3', 'White attacks your bishop.'], ['Bg6', 'Retreat but stay on the diagonal.'],
          ['h4', 'White threatens h5 to trap the bishop.'], ['h6', 'Give your bishop an escape square on h7.'],
          ['Nf3', 'White develops.'], ['Nd7', 'Develop, and keep the knight away from Ne5 attacks.'],
          ['h5', 'White pushes.'], ['Bh7', 'The bishop is safe on h7.'],
          ['Bd3', 'White offers a bishop trade.'], ['Bxd3', 'Trade it.'],
          ['Qxd3', 'White recaptures.'], ['e6', 'NOW play e6. Your bishop is already outside, so your position is solid and healthy.']],
        "Key ideas in the Caro-Kann: bishop out first, then e6, Ngf6, Be7 and castle. Your pawn structure is excellent for the endgame."),
      opening('slav', 'Slav Defense (Black vs d4)', 'b',
        "The Slav is a solid answer to 1.d4 and the Queen's Gambit, with the same idea as the Caro-Kann: support d5 with c6 and keep your bishop free.",
        [['d4', 'White takes the center.'], ['d5', 'Match it.'],
          ['c4', "The Queen's Gambit."], ['c6', 'The Slav: defend d5 with a pawn, keeping your c8 bishop free.'],
          ['Nf3', 'White develops.'], ['Nf6', 'You develop.'],
          ['Nc3', 'More pressure on d5.'], ['dxc4', 'Take the pawn! White must spend time to win it back.'],
          ['a4', 'White stops you from holding the pawn with b5.'], ['Bf5', 'Your bishop comes out before e6. That is the whole point of the Slav.'],
          ['e3', 'White prepares to take c4 back.'], ['e6', 'Now open your other bishop.'],
          ['Bxc4', 'White wins the pawn back.'], ['Bb4', 'Pin the c3 knight.'],
          ['O-O', 'White castles.'], ['O-O', 'You castle. A comfortable position.']],
        'Key ideas in the Slav: bishop out before e6, take on c4 when White allows it, then develop and castle. Typical later moves are Nbd7 and Qe7.'),
      opening('scholar-defense', "Stopping Scholar's Mate (Black)", 'b',
        "Lots of players try a fast queen attack on f7. Here's how to shut it down and punish it.",
        [['e4', 'White opens.'], ['e5', 'Take your share of the center.'],
          ['Qh5', 'The early queen attacks e5 and eyes f7.'], ['Nc6', 'Defend e5 and develop.'],
          ['Bc4', 'Now White threatens Qxf7 mate!'], ['g6', 'Block the queen and attack her at the same time.'],
          ['Qf3', 'White renews the mate threat on f7.'], ['Nf6', 'Block the f-file with a developing move. f7 is now safe, and you are ahead in development.']],
        "Remember: when White's queen comes out early, defend f7 and develop with tempo by attacking the queen. Each attack gains you time."),
    ],
  },
];

export const ALL_LESSONS = COURSES.flatMap(c => c.lessons);
