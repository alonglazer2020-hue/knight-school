# Product

<!-- impeccable:product-schema 1 -->

> Inferred from the repository and the owner's chat requests (the owner asked for unattended work with no questions). Facts marked *(inferred)* were not confirmed in words.

## Platform

web

## Users

One primary user: the owner, a beginner-to-improving chess player who plays games on chess.com and uses Knight School to study instead of paying for Chessly or chess.com Diamond. Uses it on a Windows PC and on a phone, synced. *(inferred: plays mostly rapid/blitz; sessions are short, 10–30 minutes, often right after a lost game.)*

## Product Purpose

A free, personal chess coach. It teaches from zero (lessons), drills tactics (Lichess puzzles plus the player's own mistakes), reviews the player's real chess.com/Lichess games with Stockfish, tracks recurring weaknesses, and talks: a spoken coach (Coach Knox) and an AI chat coach that knows the player's games, level and history. Success: the player's rating goes up and they stop repeating the same mistakes.

## Positioning

Everything a paid coach-and-course stack does, free and personal: the coach reads *your* games, turns *your* blunders into puzzles, and plans *your* next session. Not a book, not a generic course: the owner explicitly asked for "a personal coach that understands me … not something like a book".

## Operating Context

- Loop: play on chess.com → open Knight School → review the game → fix the mistakes → lesson/puzzles on the weak spot → play again.
- Runs as a static site on GitHub Pages (no server); Stockfish 17 runs in the browser; Lichess puzzle API and chess.com public API are fetched client-side.
- Progress syncs between devices through Firestore with a private sync code; the AI coach uses the player's own free Google Gemini key.

## Capabilities and Constraints

- Static ES modules, no build step, hash routes: Coach (home), Learn (16 lessons), Puzzles (Lichess + My mistakes), Review (import, analyse, walk through), AI chat panel on every page.
- Must stay free: no paid APIs, no accounts beyond the optional Google key.
- Voice: on-device neural TTS (Piper voices, ~60 MB each, cached) with browser voices as fallback. No impersonation of real people's voices.
- Board: chessground; rules: chess.js; engine: Stockfish 17.1 lite WASM.

## Brand Commitments

- Name: **Knight School**; coach persona: **Coach Knox** (♞ knight). Friendly, direct, encouraging, never condescending.
- The owner hated the robotic voice; voice quality matters.

## Evidence on Hand

- No users, testimonials, ratings data or press beyond the owner. Do not invent any.
- Content: 16 lessons in `js/lessons-data.js`, puzzle themes in `js/puzzles.js`, review grading in `js/analysis.js`.

## Product Principles

1. Personal over generic: every screen should use what we know about this player when we know it.
2. The board is the work: chess positions get the space and the clarity; chrome stays out of the way.
3. Coach, don't lecture: short spoken lines, one idea at a time, then the player moves.
4. Truth from the engine: concrete chess claims come from Stockfish, never from invention.
5. Free, forever, on any device.

## Accessibility & Inclusion

Usable on a phone one-handed; readable contrast on board labels and coach text; sound and voice always optional with visual equivalents. *(inferred: WCAG AA as the floor.)*
