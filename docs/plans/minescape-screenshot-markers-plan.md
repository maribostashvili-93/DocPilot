# Minescape Screenshot Marker Plan

**Purpose:** Internal planning document for Nukri to review before approving the marker overlays I'm placing on screenshots inside the DocPilot Minescape guide. This is **not** a player-facing doc — it explains intent, region geometry, and labelling so any annotation work I (or a future editor) does can be reviewed at a glance.

**Source images:** `public/images/minescape/` (all paths below are relative to `/images/minescape/`).

**Marker conventions used here:**

- **Shape markers** = rectangular outline drawn over a region, with a label chip. Used to call out a region/control.
- **Hotspot markers** = filled circles or rounded chips placed over a single icon/button, with a description popover. Used for one-tap explanations.
- **Pointer markers** = arrow drawn from a label to a tiny target. Used when the target is too small to outline.
- Marker positions below use **percentage coordinates** `(x, y, w, h)` where the screenshot's top-left is `(0, 0)` and bottom-right is `(100, 100)`. These match DocPilot's `MarkerDraft` schema (x, y, w, h are all 0-100 percentages of the rendered figure).
- **Label colour conventions:**
  - **Blue** = informational region label (region name, e.g. "Header").
  - **Green** = primary action / positive outcome (Start, Cashout, win popups).
  - **Yellow** = caution / important watch-this (Max button gotcha, mine warning, balance lock).
  - **Red** = destructive / loss state (mine reveal, Stop Autobet).
  - **Gray** = passive informational (clock, version footer).

---

## How to read the per-screenshot plan

Each entry below has:

1. **Filename** — exact path relative to `/images/minescape/`.
2. **Used in section** — which DocPilot section this is the hero/inline screenshot for.
3. **Markers** — table of every marker I want to place, with its kind, label, geometry, and the description popover text.

When I (or Nukri) open this image in the DocPilot annotated-figure editor, the X/Y/W/H values below will be the starting positions. They can be nudged from the marker inspector without retouching this doc.

---

## SCREENSHOT 1 — `aviator-minescape-default-screen.png`

**Used in:** Section 2 — "Loading And Screen Anatomy" (hero shot)

This is the screenshot that introduces the whole layout. Markers below label each named region so a first-time reader can map the prose to the picture.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | shape | A — Header | blue | 4 | 1 | 36 | 7 | Logo, time, balance, burger menu — every header element lives here. |
| 2 | shape | B — Mode Tabs | blue | 4 | 9 | 36 | 8 | Switch between Manual and Auto play. Locked during an active round. |
| 3 | shape | C — Bet Setup | blue | 4 | 18 | 36 | 50 | Bet Amount, quick modifiers, Potential Win, Grid Size, Number of Mines. |
| 4 | shape | D — Action Button | green | 4 | 70 | 36 | 9 | The single button that drives the round (label depends on state). |
| 5 | shape | E — Multiplier Ladder | yellow | 42 | 1 | 56 | 7 | 7 chips previewing your upcoming multipliers per safe reveal. |
| 6 | shape | F — Play Board | blue | 42 | 9 | 56 | 86 | The crate grid. Clicked once per reveal. |
| 7 | shape | G — Footer | gray | 4 | 82 | 36 | 13 | Provably Fair badge, version, client clock. |

---

## SCREENSHOT 2 — `aviator-minescape-bet-10-gel-potential-win-242-50.png`

**Used in:** Section 3 — "The Header Bar" and Section 5 — "Configuring Your Bet"

The clearest capture for reading exact bet values. Header is sharp; bet panel shows all four quick modifiers; Potential Win is readable.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Logo | gray | 7 | 11 | 8 | 9 | Aviator skin wordmark. The Minescape skin shows MINESCAPE here. |
| 2 | hotspot | Clock | gray | 17 | 12 | 4 | 5 | Client clock. Updates while the game runs. Not a round timer. |
| 3 | hotspot | Balance | yellow | 24 | 11 | 11 | 7 | Your available money in GEL. Drops the moment a bet is staked. |
| 4 | hotspot | Burger menu | blue | 36 | 12 | 3 | 5 | Opens the account + preferences slide-in (see Section 13). |
| 5 | shape | Bet Amount | blue | 7 | 33 | 16 | 7 | Numeric stake field. `GEL X,XX` comma-decimal format. |
| 6 | hotspot | 1/2 | blue | 25 | 33 | 4 | 5 | Halves the current bet. Highlighted blue when last action. |
| 7 | hotspot | 2X | blue | 30 | 33 | 4 | 5 | Doubles the current bet. |
| 8 | hotspot | Max | yellow | 35 | 33 | 4 | 5 | Caps at the **operator's per-bet limit, not your balance**. |
| 9 | shape | Potential Win | green | 7 | 42 | 32 | 5 | Best-case payout = bet × ceiling multiplier. Updates on any config change. |

---

## SCREENSHOT 3 — `aviator-minescape-max-bet-selected-400-gel.png`

**Used in:** Section 5 — "Configuring Your Bet" (the Max-button gotcha)

The single image that proves Max is not "go all-in." Highlight the contrast between balance and Max fill.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | pointer | Balance: 20,000 GEL | gray | 24 | 7 | 14 | 8 | The player has 20,000 GEL available. |
| 2 | pointer | Max filled: 400 GEL | yellow | 7 | 30 | 16 | 8 | Max only filled 400 — proof Max = operator cap, not balance. |
| 3 | hotspot | Max button (highlighted) | yellow | 35 | 33 | 4 | 5 | Notice the highlighted blue outline confirming Max was tapped. |

---

## SCREENSHOT 4 — `aviator-minescape-grid-size-25-mines-custom-placeholder-24.png`

**Used in:** Section 6 — "Choosing Grid Size And Mines" (Custom field demo)

Shows the Custom chip replaced by a numeric input.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Custom = 24 | yellow | 36 | 67 | 5 | 5 | Replaces the Custom preset chip when tapped. Max value = grid-1 (24 on a 25 board). |
| 2 | shape | Mine presets row | blue | 7 | 65 | 32 | 8 | The presets shown depend on the active grid size. |
| 3 | pointer | Potential Win = 24.25 GEL | green | 7 | 42 | 32 | 5 | Same 24.25× ceiling as 25/1 — symmetric endpoint. |

---

## SCREENSHOT 5 — `aviator-minescape-bet-placed-hover-tile.png`

**Used in:** Section 8 — "Playing A Manual Round" (the bet-placed state)

Shows controls locked, Cashout button live, dice present, hover glow.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | shape | Controls locked | gray | 7 | 18 | 32 | 50 | All bet setup controls dim. Cannot change stake/grid/mines mid-round. |
| 2 | shape | Cashout button | green | 7 | 75 | 28 | 7 | Yellow CTA replacing Start. Updates live as you reveal. |
| 3 | hotspot | Dice icon | blue | 36 | 75 | 4 | 5 | Random reveal — engine picks one tile for you. |
| 4 | hotspot | Hover glow | yellow | 60 | 35 | 8 | 12 | Hovering a closed crate lights it yellow — purely visual, no commit. |
| 5 | pointer | Balance dropped | yellow | 24 | 11 | 11 | 7 | Balance moved 1000 → 999 the moment the bet was staked. |

---

## SCREENSHOT 6 — `aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png`

**Used in:** Section 9 — "Revealing Tiles" (the first safe reveal)

Single best capture for the round-progress mechanics.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | First safe reveal | green | 70 | 40 | 6 | 9 | Crate opened, green icon appears. Round continues. |
| 2 | hotspot | x1.01 lit | green | 44 | 1 | 7 | 6 | The matching multiplier chip lights yellow at the top of the board. |
| 3 | pointer | Cashout = 1.01 GEL | green | 7 | 75 | 28 | 7 | bet × multiplier = 1.00 × 1.01 = 1.01 GEL ready to lock in. |

---

## SCREENSHOT 7 — `aviator-minescape-lose-state-mine-revealed.png`

**Used in:** Section 9 — "Hitting A Mine"

Shows the lose state and the panel auto-resetting.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Mine revealed | red | 65 | 18 | 8 | 12 | The clicked crate contained a mine. Round ends, stake forfeited. |
| 2 | shape | Panel reset | gray | 7 | 18 | 32 | 60 | The bet panel has already snapped back to default — ready for the next round. |

---

## SCREENSHOT 8 — `aviator-minescape-auto-mode-selected-tiles-start-autobet.png`

**Used in:** Section 10 — "Auto Mode — Pre-Selecting Tiles"

Shows pre-marked crates and the Auto CTA.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | shape | Marked crates | green | 50 | 15 | 45 | 70 | Tiles the engine will open each round (in tap order). Tap again to unmark. |
| 2 | shape | Advanced Settings strip | blue | 7 | 60 | 32 | 6 | Tap to open the autoplay rules panel (see Section 11). |
| 3 | shape | Start Autobet | green | 7 | 75 | 28 | 7 | Green CTA. Becomes red Stop Autobet while running. |

---

## SCREENSHOT 9 — `aviator-minescape-auto-mode-advanced-settings.png`

**Used in:** Section 11 — "Auto Mode — Advanced Settings"

Shows the full settings panel for the first time.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | shape | Payout On Win | blue | 7 | 14 | 16 | 7 | Target multiplier — engine auto-cashes-out when reached. |
| 2 | shape | Number Of Bets | blue | 24 | 14 | 16 | 7 | How many rounds to run. Infinity icon = unlimited. |
| 3 | shape | On Win rule | blue | 7 | 24 | 16 | 10 | After a win: Reset stake or Increase by X%. |
| 4 | shape | On Loss rule | blue | 24 | 24 | 16 | 10 | After a loss: Reset stake or Increase by X%. |
| 5 | shape | Stop On Profit | green | 7 | 36 | 16 | 7 | Halt when cumulative profit hits this GEL value. |
| 6 | shape | Stop On Loss | red | 24 | 36 | 16 | 7 | Halt when cumulative loss hits this GEL value. |
| 7 | shape | Start Autobet | green | 7 | 75 | 28 | 7 | Commits the configuration and starts the loop. |

---

## SCREENSHOT 10 — `aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png`

**Used in:** Section 11 — "Stop conditions worked example"

Shows safety boundaries filled with concrete values.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Stop On Profit: 10 | green | 8 | 39 | 14 | 5 | Loop halts as soon as session profit ≥ 10 GEL. |
| 2 | hotspot | Stop On Loss: 20 | red | 24 | 39 | 14 | 5 | Loop halts as soon as session loss ≥ 20 GEL. |
| 3 | pointer | Risk:Reward = 2:1 | gray | 7 | 36 | 32 | 9 | Asymmetric guard — accepting more losing sessions than winning ones. |

---

## SCREENSHOT 11 — `aviator-minescape-auto-mode-lose-state-continues.png`

**Used in:** Section 12 — "Auto Mode — A Losing Round Doesn't Stop The Loop"

Critical capture proving that one mine doesn't halt autobet.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Mine | red | 65 | 18 | 8 | 12 | A round inside autobet ended in a mine. |
| 2 | shape | Stop Autobet still live | red | 7 | 73 | 32 | 7 | Loop continues. Only Stop conditions / counter / manual Stop halt it. |

---

## SCREENSHOT 12 — `aviator-minescape-auto-mode-win-state-infinite-rounds.png`

**Used in:** Section 12 — "Auto Mode — A Winning Round"

Shows the floating payout popup during a successful autobet round.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Payout popup | green | 65 | 25 | 14 | 10 | Floating chip showing GEL paid + profit on this round. |
| 2 | shape | Stop Autobet (live) | red | 7 | 73 | 32 | 7 | Loop continues to the next round automatically. |

---

## SCREENSHOTS 13 & 14 — `aviator-minescape-burger-menu-open.png` and `-scrolled.png`

**Used in:** Section 13 — "Menu, Provably Fair, Versioning"

Two captures together cover the whole menu.

### 13a — `aviator-minescape-burger-menu-open.png`

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | shape | Avatar + username | blue | 16 | 25 | 24 | 8 | Masked username and edit pencil. Tap to manage the account. |
| 2 | shape | Sound toggle | blue | 16 | 33 | 24 | 6 | Game SFX (clicks, chimes, mine boom). |
| 3 | shape | Music toggle | blue | 16 | 39 | 24 | 6 | Background music — independent of SFX. |
| 4 | shape | Dark mode toggle | blue | 16 | 45 | 24 | 6 | Theme switch. All captures show dark mode. |
| 5 | shape | My Bets | blue | 16 | 51 | 24 | 6 | Bet history link — useful for support tickets. |
| 6 | pointer | Close (✕) | gray | 36 | 16 | 4 | 5 | Closes the slide-in. Or tap outside the menu. |

### 13b — `aviator-minescape-burger-menu-scrolled.png`

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | shape | Rules | blue | 16 | 39 | 24 | 6 | Operator-published rules — authoritative if this guide disagrees. |
| 2 | shape | Limits | yellow | 16 | 45 | 24 | 6 | Responsible play — daily / weekly caps, session timer, self-exclusion. |

---

## SCREENSHOT 15 — Footer detail (any default-screen capture)

**Used in:** Section 13 — "Provably Fair & Versioning"

A small detail crop of the side-panel footer.

| # | Kind | Label | Colour | x | y | w | h | Description popover |
| - | --- | --- | --- | -- | -- | -- | -- | --- |
| 1 | hotspot | Provably Fair shield | green | 7 | 92 | 10 | 5 | Clickable badge that links to verification. Operators must wire this up before launch. |
| 2 | hotspot | Version 1.0.0 | gray | 18 | 92 | 8 | 5 | Engine build. Quoted in support tickets. |

---

## Build order and what I'm doing automatically

To keep the first ship of this doc useful but not over-engineered, the build script will:

1. **Embed all 15 hero screenshots** in the right sections as `<figure class="figure annotated-figure">` blocks.
2. **Seed marker data on the first 3 hero shots only** (Default Screen — 7 region markers; Bet-Placed — 5 markers; Advanced Settings — 7 markers). This proves the marker system works end-to-end without burning hours hand-tuning all 50+ markers in the table above before review.
3. **Leave the remaining ~30 markers as planned-but-not-placed**, documented in this file, ready for me or an editor to add through the DocPilot admin UI after Nukri signs off on the placement strategy.

If Nukri wants me to seed all markers from the start, the same script can take a `--all-markers` flag and lift positions from the tables above. That's a 5-minute switch.

---

## Editor workflow once the marker plan is approved

1. Log into `/admin/login` with `admin` / `admin`.
2. Navigate to `/admin/sections` and open the Minescape complete guide.
3. For each screenshot listed above, click the figure → open the annotated-image editor.
4. Use the marker inspector's numeric X/Y/W/H fields to place markers per the tables above.
5. The marker labels and descriptions are translation keys — they will appear in `/admin/translations` for localisation.
6. Publish through `/admin/publishing` once the placements are confirmed.

---

**Author:** Claude (planning artefact, not for player consumption)
**Last update:** 2026-05-30
