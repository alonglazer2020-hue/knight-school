---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["style.css"]
---

# Knight School app shell (all routes)

Scope: the whole app shell and every route (Coach home, Learn, lesson, Puzzles, Review, Settings, AI chat). Visitor mode: Operate.
Audience/job: one improving player, evening after a chess.com game, PC then phone; signed in with their chess.com username; sees their Elo, reviews games, fixes mistakes, trains the weak spot.
Constraints: static site, standard web controls, chessground board, free. Never copy chess.com's name, logo or assets. Never ask for a chess.com password.

## Direction contract

THESIS: The familiar chess-site layout, executed at full craft and made personal: your real chess.com Elo, your games and Coach Knox's plan on one screen. Refuses invented rank systems and decorative worlds; the owner chose the category standard (canon) over four original directions.
OWN-WORLD: Dark warm slate ground #262421, sidebar #1F1E1C, cards #312E2B with 10px radius, text #FFFFFF / #B3B0AD, bright green #81B64C for primary actions with dark ink text (contrast), a darker green bottom edge on primary buttons. Nunito Sans 400–800. Win green / loss red / draw grey as result states. Board in the classic green-and-cream palette.
STORY: Sign in with a chess.com username; see your Elo, its 30-game trend and the next goal; read Coach Knox; work through today's plan; open any recent game for review.
FIRST VIEWPORT: Left sidebar (logo, Coach / Learn / Puzzles / Review / Settings, account chip at the bottom; bottom tab bar on phones). Coach home: welcome header with connected pill and last-synced time; ratings card (main Elo, trend line, delta, other ratings, next-goal bar); Coach Knox card with Ask coach; Today's plan with Start buttons (first one green); Recent games with Review links. Signed out: a chess.com sign-in card leads.
FORM: canon (the category standard, chosen by the owner over the roll); seed:90a9ca77e57d3114. Signature move: the next-goal bar under your Elo, the one place progress is drawn.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
