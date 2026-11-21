---
name: Knight School
description: A free personal chess coach run like a dojo, where your level is a belt you earn stripe by stripe.
colors:
  ink-0: "#121A3A"
  ink-1: "#1A2550"
  ink-2: "#23305F"
  ink-3: "#33427A"
  ink-4: "#45558F"
  canvas: "#F1ECE0"
  canvas-ink: "#1B2033"
  muted: "#A3AAC4"
  seal: "#E5482D"
  seal-hi: "#CF3E24"
  seal-lo: "#B5341D"
  good: "#7BCB86"
  bad: "#FF8A78"
  amber: "#F2B04A"
  board-slate: "#8191BD"
  board-mist: "#E3E6EE"
  belt-white: "#F2EFE8"
  belt-yellow: "#F2C230"
  belt-orange: "#F08A24"
  belt-green: "#3FA34D"
  belt-blue: "#2F7DE1"
  belt-purple: "#8A4FD8"
  belt-brown: "#8B5A2B"
  belt-black: "#16161A"
  belt-bar-black: "#16161A"
  belt-bar-red: "#C8312A"
  belt-tape: "#F4F1EA"
  grade-best: "#DCE0EC"
  grade-excellent: "#B8C0D8"
  grade-good: "#929CBE"
  grade-book: "#5E6B98"
  grade-blunder: "#C9455A"
typography:
  display:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(3rem, 7vw, 5.2rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 62"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.2vw, 3.1rem)"
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: "-0.005em"
    fontVariation: "\"wdth\" 62"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.01em"
    fontVariation: "\"wdth\" 62"
  numeral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 850
    lineHeight: 1
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 62"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  belt: "2px"
  control: "8px"
  panel: "10px"
  card: "14px"
  pill: "999px"
spacing:
  xs: "0.35rem"
  sm: "0.5rem"
  md: "0.9rem"
  lg: "1.1rem"
  xl: "1.5rem"
  section: "2.6rem"
components:
  button-primary:
    backgroundColor: "{colors.seal}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.62em 1.05em"
  button-primary-hover:
    backgroundColor: "{colors.seal-hi}"
  button-primary-active:
    backgroundColor: "{colors.seal-lo}"
  button-secondary:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.62em 1.05em"
  button-secondary-hover:
    backgroundColor: "{colors.ink-3}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    size: "40px"
  input:
    backgroundColor: "{colors.ink-0}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    padding: "0.6em 0.8em"
  chip:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.pill}"
    padding: "0.38em 0.8em"
  chip-active:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.canvas-ink}"
  panel:
    backgroundColor: "{colors.ink-1}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.panel}"
    padding: "1.1rem"
  rank-card:
    backgroundColor: "{colors.ink-1}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.card}"
    padding: "1.8rem 1.8rem 1.3rem"
  coach-bubble:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.canvas-ink}"
    rounded: "{rounded.card}"
    padding: "0.75rem 2.4rem 0.85rem 1rem"
  top-bar:
    backgroundColor: "{colors.ink-1}"
    textColor: "{colors.canvas}"
    height: "62px"
---

# Design System: Knight School

## Overview

**Creative North Star: "The Dojo"**

Knight School is a kendo hall at night: deep aizome-indigo floors, gi-canvas cloth for anything the coach says, and a single vermilion seal stamped only where the player is meant to act. Your level is a belt you are earning, and every screen keeps that belt and its next stripe within reach. The system refuses the category default of a brown-and-green dashboard of equal stat tiles; rank is told as one heavy belt with a checklist, and stats sit in a quiet ruled list beside it.

Density is moderate and calm. Flat panels of indigo step up by tone rather than by shadow, ruled with hairlines one step lighter. Type is a single variable family, Archivo, pulled to condensed black for ranks, headings and numbers, and left at normal width for everything the player reads or clicks. Colour is rationed: indigo and canvas carry the whole interface, vermilion means "do this", amber-to-crimson means "this went wrong", and belt hues appear only where they report a rank.

**Key Characteristics:**
- Indigo ink ramp ground, gi-canvas text and coach surfaces, flat colour throughout.
- One vermilion seal colour, for actions only.
- Condensed black uppercase Archivo for rank, headings and figures; normal width for UI.
- The belt is the signature: stripes tape on when earned, the belt ties on at promotion.
- Board squares in cool slate and mist, so the board belongs to the same night.

## Colors

A cool indigo-and-canvas world with one warm seal for action and a separate warm scale reserved for errors.

### Primary
- **Vermilion Seal** (seal): every primary action, and nothing else: the next stripe's Go, Next puzzle, Ask coach, Send, Load my games, the next lesson's status dot. Hover deepens to **Pressed Seal** (seal-hi), active to **Dried Seal** (seal-lo). Text on seal is pure white.

### Neutral
- **Aizome Night** (ink-0): page ground, input wells, segmented-control trough.
- **Aizome Deep** (ink-1): panels, cards, top bar, bottom tab bar, chat panel.
- **Aizome Raised** (ink-2): secondary buttons, hover fills, active segment.
- **Aizome Rule** (ink-3): hairline borders and row dividers, empty progress tracks.
- **Aizome Strong Rule** (ink-4): hover borders, focus border on inputs, the lesson-path ring.
- **Gi Canvas** (canvas): body text, headings, the coach's speech bubble, earned-state markers (ticks, completed lesson dots), active tab underline, eval-bar fill.
- **Canvas Ink** (canvas-ink): text set on canvas surfaces.
- **Faded Indigo** (muted): secondary text, metadata, inactive tabs, completed items.

### Status
- **Moss** (good) for won games; **Coral** (bad) for lost games and errors; **Amber** (amber) for streaks, warnings and weakness counts.

### Board
- **Slate** (board-slate) dark squares and **Mist** (board-mist) light squares. Last move and selection are translucent tints of Aizome Night (20% and 32%); move targets are Aizome Night dots. Never green or yellow highlight squares.

### Belt hues (rank data)
White, yellow, orange, green, blue, purple, brown and black belts (belt-*), with a black rank bar (red, belt-bar-red, on the black belt) and off-white tape (belt-tape). These colours appear only inside a belt, a belt swatch or the mini belt chip.

### Move-grade scale
A single severity ramp. Good moves step from canvas through the indigo greys: Brilliant and Great in Gi Canvas, Best (grade-best), Excellent (grade-excellent), Good (grade-good), Book (grade-book). Problems step warm: Inaccuracy in Amber, Mistake and Miss in Coral, Blunder in Crimson (grade-blunder).

### Named Rules
**The Seal Rule.** Vermilion means "act here". It never decorates, never marks status, never fills a chart, and selected or active states use canvas, not seal.

**The Belt-Is-Data Rule.** A belt hue appears only when it reports a rank. No yellow headings, no green success states borrowed from the belts.

**The Warm-Means-Wrong Rule.** Amber, coral and crimson are the error side of the severity scale. Good outcomes stay in canvas and cool indigo.

## Typography

**Display Font:** Archivo, condensed (wdth 62), weights 800 to 900
**Body Font:** Archivo, normal width, 400 to 650 (fallback system-ui, Segoe UI, Roboto, sans-serif)

**Character:** One variable family stretched two ways: condensed black caps read like a rank stamped on cloth, normal-width Archivo stays plain and friendly for reading and controls. Numbers are tabular everywhere.

### Hierarchy
- **Display** (900, clamp 3 to 5.2rem, 0.86): the rank name on the coach home. Uppercase, condensed.
- **Headline** (850, clamp 2.1 to 3.1rem, 0.95): page titles. Uppercase, condensed.
- **Title** (800, 1.4rem, 1.05): section headings such as Today's session and Next: Orange belt; card titles at 1.12rem. Uppercase, condensed.
- **Numeral** (850, 1.7rem, 1): stat values, puzzle rating, player scores, session step numbers. Condensed, tabular; units drop to 0.6em in Faded Indigo.
- **Body** (400, 16px, 1.55): all reading text; supporting copy capped near 68ch.
- **Label** (600, 0.95rem, 1.2): buttons, tabs, list-row titles (650 at 1.02rem). Sentence case, normal width.

### Named Rules
**The Two-Widths Rule.** Condensed is for rank, headings and numbers only. Anything the player reads as a sentence or clicks as a control is normal width.

## Layout

Single centred column at 1140px max with 1.25rem gutters on reading pages; board pages use a two-column grid (board, then a 400px side panel) at 1220px with the board column sticky under the top bar and the board capped at viewport height minus 150px. The coach home is a two-column dojo grid: rank card, then a 360px coach column holding Coach Knox, a talk button and the stats list. Sections are separated by 2.6rem; list rows sit 0.45 to 0.55rem apart; panel padding is 1.1rem.

Responsive: at 1000px the dojo grid stacks and the coach column becomes a two-up grid; at 860px the tabs move to a fixed four-column bottom bar (64px plus safe area, active tab marked by a 3px canvas line on top), the top bar drops to 56px, logo text and Ask coach text hide, board pages stack to one column, and the chat becomes a bottom sheet at 88dvh. At 420px the belt chip label and session progress column hide.

## Elevation & Depth

Depth is tonal: ink-0 ground, ink-1 panels, ink-2 raised and hover, each edged with an ink-3 hairline. Panels at rest carry no shadow. Shadows are reserved for things that float above the page or must lift off it.

### Shadow Vocabulary
- **Board lift** (`box-shadow: 0 12px 32px rgba(0,0,0,.5)`): the chessboard only, so the work surface sits above the chrome.
- **Popover** (`box-shadow: 0 18px 40px rgba(0,0,0,.5)`): settings popovers under the top bar.
- **Sheet** (`box-shadow: 0 22px 50px rgba(0,0,0,.55)`): the floating coach chat panel.

### Named Rules
**The Flat Cloth Rule.** Surfaces are flat indigo at rest. No gradients, no glows, no coloured shadows; a shadow means the element floats.

## Shapes

Gently rounded rectangles: 8px for controls and inputs, 10px for panels and list rows, 14px for the rank card, board side panel, chat and coach bubble. Chips are full pills. Status markers (ticks, session numbers, lesson dots, grade badges, avatar) are circles. The belt itself is nearly square-cornered (2 to 3px) so it reads as cloth, not a button. Speech surfaces pinch one corner to 4px on the speaker's side.

## Components

### Buttons
- **Shape:** gently rounded (8px), 1px border.
- **Primary:** Vermilion Seal fill and border, white label, 600 weight. Hover to seal-hi, active to seal-lo plus a 1px press. Disabled primaries fall back to Aizome Raised with Faded Indigo text.
- **Secondary:** Aizome Raised fill, Aizome Rule border, canvas label; hover steps to ink-3 fill and ink-4 border. Leading Lucide icon at 1.15em with a 0.45em gap.
- **Icon button:** 40px square, transparent until hover. Off state dims to a darker muted indigo; warning state is amber.
- **Focus:** 2px canvas outline, 2px offset, on every focusable element.

### Chips
- **Style:** pill, secondary-button colours, 0.84rem.
- **State:** active chip is Gi Canvas with Canvas Ink text. Never seal.

### Segmented control
Aizome Night trough with a 3px inset; segments are transparent muted text, the active one is Aizome Raised with a rule border.

### Cards / Containers
- **Corner Style:** 10px (panels, rows), 14px (rank card, side panel).
- **Background:** Aizome Deep, Aizome Raised on hover for clickable rows.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px Aizome Rule, Aizome Strong Rule on hover.
- **Internal Padding:** 1.1rem; rank card 1.8rem.

### Inputs / Fields
- **Style:** Aizome Night well, 1px Aizome Rule stroke, 8px radius, vermilion caret.
- **Focus:** border steps to Aizome Strong Rule; the global canvas focus ring applies on keyboard focus.

### Navigation
Top bar in Aizome Deep, 62px, sticky, with a hairline beneath. Tabs are label-weight Faded Indigo with a Lucide icon; hover lifts to canvas; active is canvas with a 3px canvas underline. On phones the same tabs become a bottom bar with icon over label. The belt chip (a 56 by 12px mini belt plus belt name) sits at the right of the bar.

### Belt (signature component)
An SVG cloth band in the belt hue, two thin stitch lines at 22% and 78% height, and a rank bar (black, red on the black belt) placed from 64% to 88% of the width holding up to four off-white tape stripes. Unearned tapes sit at 16% opacity; earned tapes are solid. Sizes: hero belt full width by 46px, mini belt 56 by 12px, swatch 40 by 12px. Motion: a newly earned stripe tapes on with scaleY from the top (0.7s, 0.5s delay, ease-out expo); a promotion ties the hero belt on with a left-to-right clip-path reveal (1.1s). Paired with the next-belt checklist: ruled rows with a 30px circular tick (canvas when earned), the requirement, and a Go button; only the first unearned row's Go is primary.

### Lesson path
Each belt's lessons are one connected path: a 2px Aizome Rule rail through 34px circular status dots. Done is a canvas dot with a check, next is a seal dot with a canvas row border, locked is an Aizome Night dot with a Strong Rule ring.

### Coach Knox
Circular canvas avatar holding the cburnett knight, beside a canvas speech bubble in Canvas Ink with a condensed uppercase speaker name. Happy mood hops the avatar; sad mood shakes it and turns it amber.

### Move-grade badge
A circular badge in the grade colour with its ink. Annotation grades use the chess symbols (!!, !, ?!, ?, ??); Best, Excellent, Good, Book and Miss use Lucide icons (star, check, book, close), never emoji.

## Do's and Don'ts

### Do:
- **Do** keep the ground in the indigo ramp (ink-0 to ink-4) and set text in Gi Canvas.
- **Do** use Vermilion Seal (#E5482D) only on actions, with hover #CF3E24.
- **Do** show belt hues only as rank data: the belt, its swatch, the belt chip.
- **Do** use Archivo condensed (wdth 62) black uppercase for rank, headings and numbers, normal width for UI.
- **Do** draw every icon from the Lucide set in js/icons.js: inline SVG, currentColor stroke, stroke-width 2, round caps and joins.
- **Do** colour move grades on the ink-to-canvas / amber-to-crimson severity scale.
- **Do** keep board highlights as indigo tints on slate and mist squares.
- **Do** honour reduced motion: all animations and transitions switch off.

### Don't:
- **Don't** use gradients or glows on interface surfaces. (The board's checker pattern and move-target dots are drawn with CSS gradients as a rendering technique; that is not a decorative gradient.)
- **Don't** use emoji or Unicode glyphs as icons.
- **Don't** put seal on status, selection, active tabs, active chips or charts.
- **Don't** borrow a belt colour for headings, success states or accents.
- **Don't** lay stats out as a row of equal tiles; they live in a ruled list.
- **Don't** add shadows to resting panels.
