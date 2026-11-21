# Knight School

A free chess coach that runs in your browser. Live at https://alonglazer2020-hue.github.io/knight-school/

- **Belts:** your level is a belt, white to black. Each belt is earned with four stripes (lessons, puzzles, reviewed games, fixed mistakes, rating, accuracy), worked out from what you've actually done.
- **Coach:** the dojo page. Your belt and what earns the next stripe, today's session, and the weaknesses Coach Knox found in your games.
- **Ask coach (AI):** a chat coach (Google Gemini, free key pasted once) that sees your belt, reviewed games, ratings, weak spots and the current screen, remembers your chats, writes you a short note each day, and links you to the right lesson or puzzles. Stockfish supplies the chess facts; the AI explains them.
- **Learn:** 16 interactive lessons, laid out as a belt path from how the pieces move up to opening courses.
- **Puzzles:** unlimited free puzzles from Lichess, plus **My mistakes**: positions from your own games, brought back with spaced repetition until you solve them cleanly twice. Hints teach the routine first (checks, captures, threats) before showing the move.
- **Review:** chess.com- or Lichess-style game review with Stockfish 17. Every move gets a grade and an explanation, and you can retry your mistakes.
- **Voice:** Coach Knox talks with free on-device AI voices (Piper), including HD voices.
- **Sync:** progress syncs between phone and PC with a private code.

## Run it
Double-click **Start Knight School.bat**, or run `python serve.py` and open http://localhost:8765.

## Checks
- `node tools/check-lessons.mjs`: plays every lesson answer through Stockfish.
- `node tools/check-analysis.mjs`: checks the review grading on known games.
- `node tools/check-belts.mjs`: checks the belt and stripe maths.

## Credits
- Stockfish.js (GPLv3)
- chessground (GPLv3); piece set and logo knight (`img/knight.svg`) are cburnett's pieces, CC BY-SA 3.0, Colin M.L. Burnett
- chess.js (BSD)
- Piper voices via vits-web (MIT) and onnxruntime-web (MIT)
- Lucide icons (ISC)
- Archivo typeface (SIL OFL), via Google Fonts
- Lichess opening names and puzzle API (CC0)
- chess.com Published-Data API
