# Knight School

A free chess coach that runs in your browser. Live at https://alonglazer2020-hue.github.io/knight-school/

- **chess.com account:** sign in with your chess.com username (no password; it uses chess.com's free public API). Your ratings and every game sync in, and new games appear automatically.
- **Elo:** your level is your real chess.com rating in your main time control (or your Knight School puzzle rating when signed out), with the next round-number goal and a training focus for your rating band.
- **Coach:** your Elo and its trend, the next goal, Coach Knox, today's plan (newest game to review, your own mistakes, puzzles, a lesson for your level), recent games and the weaknesses found in your reviews.
- **Settings:** chess.com account, coach voice, sounds, device sync and the AI coach in one place.
- **Ask coach (AI):** a chat coach (Google Gemini, free key pasted once) that sees your chess.com ratings and games, reviewed games, ratings, weak spots and the current screen, remembers your chats, writes you a short note each day, and links you to the right lesson or puzzles. Stockfish supplies the chess facts; the AI explains them.
- **Learn:** 16 interactive lessons, grouped by Elo, from how the pieces move up to opening courses.
- **Puzzles:** unlimited free puzzles from Lichess, plus **My mistakes**: positions from your own games, brought back with spaced repetition until you solve them cleanly twice. Hints teach the routine first (checks, captures, threats) before showing the move.
- **Review:** chess.com- or Lichess-style game review with Stockfish 17. Every move gets a grade and an explanation, and you can retry your mistakes.
- **Voice:** Coach Knox talks with natural on-device voices (Kokoro), with lighter Piper voices for older phones. Everything runs free in your browser.
- **Accounts:** sign in with your chess.com username and a Knight School password; your progress follows you to every device (or sync with a private code, no account).
- **Looks:** Violet (default), Midnight or Classic, in Settings.
- **Rating history, bug reports and ideas, installable app** (add to home screen; opens offline).

## Run it
Double-click **Start Knight School.bat**, or run `python serve.py` and open http://localhost:8765.

## Checks
- `node tools/check-lessons.mjs`: plays every lesson answer through Stockfish.
- `node tools/check-analysis.mjs`: checks the review grading on known games.
- `node tools/check-levels.mjs`: checks the Elo level maths.
- `node tools/check-chesscom.mjs [username]`: live check of the chess.com sync against a public account.
- `node tools/check-auth.mjs`: accounts and account sync against a fake server.

One-time Firebase and Google setup: see SETUP-ACCOUNTS.md.

## Credits
- Stockfish.js (GPLv3)
- Piece move and capture sounds (`snd/move.mp3`, `snd/capture.mp3`): Lichess "standard" sound set, from github.com/lichess-org/lila, AGPLv3+.
- chessground (GPLv3); piece set and logo knight (`img/knight.svg`) are cburnett's pieces, CC BY-SA 3.0, Colin M.L. Burnett. The app icons and `img/og-image.png` are made from that knight (same licence).
- chess.js (BSD)
- Kokoro voices via kokoro-js (Apache-2.0; model Kokoro-82M, Apache-2.0)
- Piper voices via vits-web (MIT) and onnxruntime-web (MIT)
- Lucide icons (ISC)
- Lexend, Overpass and Nunito Sans typefaces (SIL OFL), via Google Fonts
- Lichess opening names and puzzle API (CC0)
- chess.com Published-Data API
