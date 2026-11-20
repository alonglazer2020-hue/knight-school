# Knight School ♞

A free chess coach that runs on your own computer.
- **Coach:** Coach Knox finds your recurring mistakes and gives you a daily plan.
- **Ask coach (AI):** a chat coach (Google Gemini, free key pasted once) that sees your reviewed games, ratings, weak spots and the current screen, remembers your chats, and links you to the right lesson or puzzles. Stockfish supplies the chess facts; the AI explains them.
- **Learn:** 16 interactive lessons, from how the pieces move up to opening courses.
- **Puzzles:** unlimited free puzzles from Lichess, plus a **My Mistakes** drill built from your own games.
- **Review:** chess.com- or Lichess-style game review with Stockfish 17. Every move gets a grade and an explanation, and you can retry your mistakes.

## Run it
Double-click **Start Knight School.bat**, or run `python serve.py` and open http://localhost:8765.
Needs Python and an internet connection for puzzles and game import. The engine runs offline in your browser.

Your progress is saved in your browser (localStorage). A different browser starts fresh.

## Checks
- `node tools/check-lessons.mjs`: plays every lesson answer through Stockfish.
- `node tools/check-analysis.mjs`: checks the review grading on known games.

## Credits
- Stockfish.js (GPLv3)
- chessground (GPLv3)
- chess.js (BSD)
- Lichess opening names and puzzle API (CC0)
- chess.com Published-Data API
