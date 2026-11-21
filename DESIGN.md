---
name: Knight School
description: A free chess coach built around your real chess.com rating, your games and Coach Knox's plan.
colors:
  slate-ground: "#262421"
  slate-rail: "#1F1E1C"
  slate-card: "#312E2B"
  slate-raise: "#3A3733"
  slate-raise-hi: "#45423E"
  slate-line: "#403C38"
  text-primary: "#FFFFFF"
  text-secondary: "#C3C0BC"
  text-tertiary: "#A19E9A"
  move-green: "#81B64C"
  move-green-hi: "#95C45F"
  move-green-edge: "#45753C"
  move-green-ink: "#13200A"
  loss-red: "#CA3431"
  loss-text: "#F2766F"
  draw-grey: "#A19E9A"
  streak-amber: "#F7C045"
  board-dark: "#739552"
  board-light: "#EBECD0"
  bubble-paper: "#FFFFFF"
  bubble-ink: "#1A1A18"
typography:
  display:
    fontFamily: "Nunito Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  control: "6px"
  inset: "8px"
  card: "10px"
  pill: "999px"
spacing:
  row: "0.65rem"
  gap: "1rem"
  card-y: "1.1rem"
  card-x: "1.25rem"
  page-x: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.move-green}"
    textColor: "{colors.move-green-ink}"
    rounded: "{rounded.control}"
    padding: "0.62em 1.05em"
  button-primary-hover:
    backgroundColor: "{colors.move-green-hi}"
  button-secondary:
    backgroundColor: "{colors.slate-raise}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "0.62em 1.05em"
  button-secondary-hover:
    backgroundColor: "{colors.slate-raise-hi}"
  button-link:
    textColor: "{colors.move-green-hi}"
    padding: "0.3em 0.2em"
  card:
    backgroundColor: "{colors.slate-card}"
    rounded: "{rounded.card}"
    padding: "1.1rem 1.25rem"
  tile:
    backgroundColor: "{colors.slate-ground}"
    rounded: "{rounded.inset}"
    padding: "0.65rem 0.8rem"
  input:
    backgroundColor: "{colors.slate-ground}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "0.6em 0.8em"
  nav-item-active:
    backgroundColor: "{colors.slate-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.inset}"
    padding: "0.62rem 0.7rem"
  chip:
    backgroundColor: "{colors.slate-raise}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "0.38em 0.8em"
  chip-active:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.slate-ground}"
  goal-bar:
    backgroundColor: "{colors.slate-ground}"
    rounded: "5px"
    height: "10px"
  coach-bubble:
    backgroundColor: "{colors.bubble-paper}"
    textColor: "{colors.bubble-ink}"
    rounded: "{rounded.card}"
    padding: "0.7rem 2.4rem 0.8rem 0.95rem"
---

# Design System: Knight School

## Overview

**Creative North Star: "The Club Room After Hours"**

Knight School wears the category standard on purpose: the dark warm slate, left sidebar and bright green action that every serious chess site player already reads without thinking. The owner chose this canon over invented worlds, so the craft lives in execution, not novelty: tight card rhythm, tabular numbers, honest win/loss colour, one green button where the eye should go. It is personal rather than decorative; the screen is your real Elo, your games and Coach Knox's plan, nothing staged.

Density is medium-high, like a dashboard you check daily. Surfaces are flat tonal layers of one warm slate family; the only lift in the whole system is the green primary button's pressed-key bottom edge and the floating chat panel. Coach Knox speaks from a white paper bubble, the one light surface, so his voice reads as a person on a dark board.

The world refuses invented rank systems, belts, mascots-as-decoration and any copy of chess.com's name, logo or artwork. It borrows the category's grammar, never its brand.

**Key Characteristics:**
- Warm near-black slate in three tonal steps (ground, rail, card) with no borders between cards.
- One bright green primary per group, with a darker green bottom edge that depresses on press.
- Nunito Sans at 700 to 800 for anything you scan; tabular numerals everywhere.
- Result states as colour: win green, loss red, draw grey, in small square badges.
- The classic green and cream board with a yellow last-move tint.
- Lucide line icons only; chess notation (!!, ??, ?!) is text.

## Colors

One warm slate family for every surface, one green that means "do this", and result colours that mean exactly what the game says.

### Primary
- **Move Green** (#81B64C): primary buttons, the next-goal bar fill, the Elo trend line, done plan icons, win badges, active-check accents, selection highlight. Always paired with Move Green Ink (#13200A) for text on it.
- **Move Green Bright** (#95C45F): hover on primary buttons, positive deltas, link-style actions (Review, Ask coach), focus rings, the active tab on the phone tab bar.
- **Move Green Edge** (#45753C): the 3px bottom edge under primary buttons, the sign-in card's outline, completed puzzle dots.

### Secondary
- **Loss Red** (#CA3431): loss badges and the blunder grade. Text in loss red uses Loss Text (#F2766F) for contrast on slate.
- **Streak Amber** (#F7C045): puzzle streaks, voice/sync status, weakness counts. Never a button.

### Neutral
- **Slate Ground** (#262421): page background, and the recessed fill for tiles, notes, bars and inputs inside cards.
- **Slate Rail** (#1F1E1C): sidebar and phone tab bar.
- **Slate Card** (#312E2B): cards, panels, the active nav item.
- **Slate Raise** (#3A3733) and **Raise Hi** (#45423E): secondary buttons, chips, hover fills, current move.
- **Slate Line** (#403C38): hairline row dividers inside lists, input borders.
- **Text** (#FFFFFF), **Secondary** (#C3C0BC), **Tertiary** (#A19E9A): headings and values, supporting copy, captions and meta. Draw Grey shares the tertiary value.
- **Board Dark / Board Light** (#739552 / #EBECD0): the board squares and their coordinates, last move in a translucent yellow (rgba(245, 246, 105, .5)).
- **Bubble Paper / Bubble Ink** (#FFFFFF / #1A1A18): Coach Knox's speech bubble and AI chat replies; emphasis inside it is a deep green (#3D6B1F).

### Named Rules
**The One Green Rule.** Each group (a card, a plan list, a dialog) has at most one green primary button. In Today's plan only the first open item's Start is green; the rest are slate.
**The Result Means It Rule.** Green, red and grey are reserved for win, loss and draw (and the matching move grades). Never use loss red for decoration or green for a non-action.

## Typography

**Display Font:** Nunito Sans (with system-ui, -apple-system, Segoe UI, Roboto, sans-serif), variable 400 to 800 from Google Fonts.

**Character:** One friendly humanist sans doing all the work; weight, not family, makes hierarchy. Heavy 800 numbers make the Elo feel like a scoreboard.

### Hierarchy
- **Display** (800, 3rem, 1.05, -0.02em): the main rating number only.
- **Headline** (800, 1.65rem, 1.2): page titles such as the welcome header.
- **Title** (800, 1.08rem, 1.3): card heads (Today's plan, Recent games); 1.3rem in board side panels.
- **Body** (400, 16px, 1.5, tabular numerals): coach text and descriptions, max 70ch.
- **Label** (700, 0.85rem): rating labels, field labels, row meta; captions drop to 0.75 to 0.8rem in tertiary grey.

### Named Rules
**The Weight Not Size Rule.** Row titles and buttons are 700; headings and numbers are 800. Hierarchy inside a card comes from weight and grey level, not from new sizes.

## Layout

A 224px sidebar beside a fluid page (max 1180px, padding 1.8rem 2rem 4rem). The Coach home stacks a full-width ratings card (main rating and trend at 1fr, ratings tiles and next-goal bar at 1.45fr) over two equal columns of cards with 1rem gaps. Board pages use a board column beside a 400px side panel, with the board sticky and sized to the viewport height.

Rows inside lists are 0.55 to 0.65rem tall padding, separated by Slate Line hairlines, with no line above the first row. Under 1100px the ratings card and columns stack. Under 900px the sidebar becomes a 56px top bar and the nav becomes a fixed five-item bottom tab bar (64px plus safe area); the chat panel becomes a bottom sheet. Under 480px secondary columns (time control, plan progress, focus caption) drop.

## Elevation & Depth

Flat tonal layering. Depth comes from stepping the slate: rail is darkest, ground in the middle, cards above, and recessed elements (tiles, notes, bars, inputs) drop back to ground inside a card. Cards carry no border and no shadow.

### Shadow Vocabulary
- **Key edge** (`box-shadow: 0 3px 0 #45753C`): only under green primary buttons, collapsing to `0 1px 0` with a 2px drop on press. It is the category's pressed-key button, native to this world.
- **Floating panel** (`box-shadow: 0 20px 50px rgba(0, 0, 0, .55)`): only the Ask coach chat panel, which floats above the page.

### Named Rules
**The Only Lift Rule.** Nothing else gets a shadow. A new card that wants to stand out gets the green-edge outline (1px #45753C) like the sign-in card, not elevation.

## Shapes

Gently rounded, never pill-shaped except chips and status pills. Cards and panels 10px; inset tiles, nav items, plan icons and game rows 8px; buttons and inputs 6px; result badges 6px squares; lesson status markers are circles; the board itself 4px. The sidebar logo and Coach Knox's avatar sit on small white rounded squares (7 to 8px).

## Components

### Buttons
Solid, chunky and finger-sized.
- **Shape:** softly rounded (6px), 700 weight, 0.95rem, icon gap 0.45em.
- **Primary:** Move Green with Move Green Ink at 800 weight, key edge beneath; hover brightens to Move Green Bright; press drops 2px as the edge shrinks. Disabled returns to slate with no edge.
- **Secondary:** Slate Raise, white text, hover Raise Hi, press drops 1px.
- **Link:** no fill, Move Green Bright text; hover turns white and underlined. Used for Review and inline actions.
- **Outlined (Ask coach):** transparent with a Slate Line border and green text, sidebar only.
- **Focus:** 2px Move Green Bright outline, 2px offset, on every interactive element.

### Chips and Pills
- **Chip:** Slate Raise pill (999px), 0.84rem; active chip inverts to white with slate text.
- **Status pill:** translucent green (rgba(129, 182, 76, .14)) with light green text (#B4DA8A) and a Lucide icon, for "Connected to chess.com".

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Slate Card on Slate Ground.
- **Shadow Strategy:** none (see Elevation).
- **Border:** none; the sign-in card alone carries a 1px Move Green Edge outline.
- **Internal Padding:** 1.1rem by 1.25rem; card head sits on a baseline row with a tertiary "See all" or count on the right.

### Inputs / Fields
- **Style:** Slate Ground fill, 1px Slate Line border, 6px radius, green caret.
- **Focus:** border shifts to tertiary grey; the global green focus ring covers keyboard focus.
- **Error:** message in Loss Text below the field.

### Navigation
Sidebar on Slate Rail: logo, then Coach / Learn / Puzzles / Review / Settings with Lucide icons, 700 weight, secondary grey. Hover is a 5% white wash; active is a Slate Card fill with white text. Account chip pinned to the bottom. On phones the same five items become a bottom tab bar with stacked icon and 0.72rem label; active turns Move Green Bright with no fill.

### Result Badge and Move Grades
Square 26px badges with W / L / D in 800: win on Move Green with green ink, loss on Loss Red with white, draw on grey with near-black. Move grades use the familiar grade palette (Brilliant teal #26C2A3 through Blunder #CA3431), each round badge carrying its own ink colour chosen for contrast; grades without a notation symbol (best, good, book, miss) use a Lucide icon instead of text.

### Coach Bubble
Coach Knox's knight avatar on a white rounded square beside a white speech bubble with a left-pointing tail, 10px radius, near-black text, a small grey "Coach Knox" name line and a replay icon button in the corner. The avatar hops on good news and shakes on bad, disabled under reduced motion.

### Next-Goal Bar (signature)
Under the ratings tiles: "Next goal: 1800" with points-to-go on the right, a 10px recessed Slate Ground track with a Move Green fill that eases in over 0.8s, and a caption row of start rating, focus advice and target. It is the one place the screen tells you where you are going.

## Do's and Don'ts

### Do:
- **Do** keep one green primary per group; every other button in that group is Slate Raise or a link.
- **Do** put dark ink (#13200A) on green fills and use Loss Text (#F2766F), not Loss Red, for red text on slate.
- **Do** use Lucide inline SVG icons at 1.15em with a 2px round stroke.
- **Do** write chess notation (!!, !, ?!, ?, ??) as text, and give each grade badge its own ink colour for contrast.
- **Do** disable hover fills on touch screens under `(hover: none)` so no fill stays stuck after a tap.
- **Do** step surfaces by tone (rail, ground, card, raise) instead of adding borders or shadows.

### Don't:
- **Don't** copy chess.com's name, logo or any of its assets; the category look is shared, the brand is not.
- **Don't** use emoji or Unicode glyphs as icons.
- **Don't** invent rank systems, belts or decorative worlds; ratings are the player's real chess.com Elo.
- **Don't** add shadows beyond the primary key edge and the floating chat panel.
- **Don't** use green, red or grey for anything that is not an action or a win, loss or draw.

## Looks (Settings > Look)

The layout, spacing and components above are shared. Three looks change only colour, type face, board squares and the primary-button treatment; each is a set of custom-property overrides on `html[data-theme=…]` in `style.css`, and the choice syncs with the player's progress.

- **Violet (default):** ground #15151B, card #1F1F28, primary #9B87F5 with ink #120B2E and edge #6A55D6, board #8C7CC4 / #EFEDF7, type **Lexend**. Chosen by the owner as the default so the site reads as its own, not as chess.com.
- **Midnight:** ground #0E1B3D, card #16264F, primary porcelain #F5F2EA with midnight ink and no bottom edge, progress and wins in route green #2BA84A, board #7D8FB4 / #E4E7EE, type **Overpass**.
- **Classic:** the warm slate and green described above, type **Nunito Sans**.

Rule: a look never changes layout, spacing or controls, only the tokens.
