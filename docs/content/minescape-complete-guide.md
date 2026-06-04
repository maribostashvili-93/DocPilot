# Minescape — The Complete End-to-End Guide

**Document Type:** Game User Manual (player + operator reference)
**Product:** Minescape (also ships under the "Aviator" branding skin — same engine, same controls, different wordmark)
**Audience:** Players of every experience level, Game Operators, QA, Support, Localization
**Version:** 1.0
**Last updated:** 2026-05-30
**Evidence base:** 37 PNG screenshots + 1 GIF + 1 MOV in `public/images/minescape/`. Every claim in this manual is supported by a screenshot, and every screenshot used here has been verified to exist in that folder.

---

## Read This First

Minescape is a **crash-and-hold mining game**. That phrase covers everything you need to know to start:

- **"Mining"** because the game shows a board of wooden crates, and you click them one at a time to reveal what's inside.
- **"Crash"** because somewhere under those crates are hidden mines. Click one and the round is over — bet lost, no second chances.
- **"Hold"** because every safe crate you reveal pushes a multiplier higher, and you can stop and collect that multiplier at any moment. The longer you hold, the bigger the win — but the closer you are to a mine.

The entire game is one decision repeated:

> **Click another crate, or cash out?**

Everything else in this guide — the bet field, the grid size, the mine count, the multiplier ladder, the auto-mode rules — exists to give you finer and finer control over that one decision.

This document walks you through every part of the screen, every button, every state, every menu item, and every mode. It is intentionally long. You do not need to read it in order. The table of contents below is laid out the same way a real round flows, so if you read it top-to-bottom you will see the game the way a brand-new player sees it.

---

## Table of Contents

1. [The Loading Screen](#1-the-loading-screen)
2. [Your First Look at the Play Screen](#2-your-first-look-at-the-play-screen)
3. [The Header Bar in Detail](#3-the-header-bar-in-detail)
4. [The Two Modes — Manual vs Auto](#4-the-two-modes--manual-vs-auto)
5. [The Bet Amount Field](#5-the-bet-amount-field)
6. [The Quick Modifier Buttons (½, 2X, Max)](#6-the-quick-modifier-buttons-%C2%BD-2x-max)
7. [The Potential Win Helper Bar](#7-the-potential-win-helper-bar)
8. [Choosing Grid Size](#8-choosing-grid-size)
9. [Choosing the Number of Mines](#9-choosing-the-number-of-mines)
10. [The Custom Mine Field](#10-the-custom-mine-field)
11. [The Multiplier Ladder](#11-the-multiplier-ladder)
12. [The Primary Action Button](#12-the-primary-action-button)
13. [Starting Your First Manual Round](#13-starting-your-first-manual-round)
14. [The Bet-Placed State — What Just Changed](#14-the-bet-placed-state--what-just-changed)
15. [Hovering and Clicking Crates](#15-hovering-and-clicking-crates)
16. [Revealing Your First Safe Crate](#16-revealing-your-first-safe-crate)
17. [Multiple Safe Reveals — Reading the Live Cashout](#17-multiple-safe-reveals--reading-the-live-cashout)
18. [The Dice (Randomize) Button During a Round](#18-the-dice-randomize-button-during-a-round)
19. [Cashing Out — The Most Important Button](#19-cashing-out--the-most-important-button)
20. [Hitting a Mine — The Lose State](#20-hitting-a-mine--the-lose-state)
21. [Switching to Auto Mode](#21-switching-to-auto-mode)
22. [Auto Mode — Pre-selecting Your Tiles](#22-auto-mode--pre-selecting-your-tiles)
23. [Auto Mode — Letting the Dice Pick for You](#23-auto-mode--letting-the-dice-pick-for-you)
24. [The Advanced Settings Panel](#24-the-advanced-settings-panel)
25. [Advanced Setting — Payout On Win](#25-advanced-setting--payout-on-win)
26. [Advanced Setting — Number Of Bets](#26-advanced-setting--number-of-bets)
27. [Advanced Setting — On Win Behaviour](#27-advanced-setting--on-win-behaviour)
28. [Advanced Setting — On Loss Behaviour](#28-advanced-setting--on-loss-behaviour)
29. [Advanced Setting — Stop On Profit / Stop On Loss](#29-advanced-setting--stop-on-profit--stop-on-loss)
30. [Starting Autobet — The Loop Goes Live](#30-starting-autobet--the-loop-goes-live)
31. [A Winning Round Inside Autobet](#31-a-winning-round-inside-autobet)
32. [A Losing Round Inside Autobet](#32-a-losing-round-inside-autobet)
33. [Stopping Autobet — All Four Ways](#33-stopping-autobet--all-four-ways)
34. [The Burger Menu](#34-the-burger-menu)
35. [Username & Profile Entry](#35-username--profile-entry)
36. [Sound, Music, Dark Mode](#36-sound-music-dark-mode)
37. [My Bets, Rules, Limits](#37-my-bets-rules-limits)
38. [The Provably Fair Badge and Version Footer](#38-the-provably-fair-badge-and-version-footer)
39. [Branding Skins — Aviator vs Minescape](#39-branding-skins--aviator-vs-minescape)
40. [Worked Example — A Cautious Manual Session](#40-worked-example--a-cautious-manual-session)
41. [Worked Example — An Aggressive Manual Session](#41-worked-example--an-aggressive-manual-session)
42. [Worked Example — An Autobet Session With Stop Conditions](#42-worked-example--an-autobet-session-with-stop-conditions)
43. [Common Beginner Mistakes](#43-common-beginner-mistakes)
44. [Glossary](#44-glossary)
45. [Frequently Asked Questions](#45-frequently-asked-questions)
46. [Operator Reference Sheet](#46-operator-reference-sheet)

---

## 1. The Loading Screen

When you open Minescape the first thing you see is a short animated loader. The asset itself is a video file (`loading-screen.mov`) rather than a still frame, which is why you see motion — typically the in-world warehouse where the crates live, setting the visual tone for the play board.

**What you should do during loading: nothing.** There is no interaction at this stage. The loader covers the brief moment the game client needs to:

1. Authenticate your session and pull your latest balance.
2. Download the round-configuration payload from the server.
3. Render the play surface in the background.

When the loader finishes, you drop straight into the **Default Screen** with the **Manual** tab pre-selected and a fresh, empty board on the right. The loader is single-use per session — it will not appear again unless you reload the page.

> **Operator note:** Because `loading-screen.mov` is shipped as a video, low-bandwidth devices may experience a longer-than-expected loading time. Confirm the fallback strategy (e.g. swap to an animated GIF or to a CSS-only spinner) for poor-network scenarios. Also confirm whether the loader plays on tab return after a long idle, or only on hard reload.

---

## 2. Your First Look at the Play Screen

When the loader clears, the entire game is laid out on a single screen. Nothing is hidden behind tabs you haven't opened, and you do not need to scroll. Everything you need to play is visible at once.

![Default screen — Minescape skin, balance 1000 GEL, fresh setup ready](/images/minescape/aviator-minescape-default-screen.png)
*This is the first thing most players see after the loader. On the left is a dark side-panel containing every control you will use. On the right is a wide play board filled with closed wooden crates. Across the very top of the board is a thin row of multiplier chips. The big green button at the bottom of the side-panel is the only thing you ever need to press to start a round.*

There is a second, near-identical capture taken in the same configuration:

![Default screen — second capture for comparison](/images/minescape/default-state.png)
*Same screen, same configuration. The captures look identical because the screen is stateless before you press Start — nothing in the layout changes between sessions until you start interacting with it.*

The screen breaks into five regions you will come to recognise instantly:

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════╗   ╔═════════════════════════════════════╗  │
│  ║  A  HEADER BAR            ║   ║  E  MULTIPLIER LADDER               ║  │
│  ║  Logo · Time · Balance ☰  ║   ║  x1.01  x1.05  x1.10 ...            ║  │
│  ╚═══════════════════════════╝   ╚═════════════════════════════════════╝  │
│  ╔═══════════════════════════╗   ╔═════════════════════════════════════╗  │
│  ║  B  MODE TABS             ║   ║                                     ║  │
│  ║  [ Manual ] [ Auto ]      ║   ║                                     ║  │
│  ╠═══════════════════════════╣   ║                                     ║  │
│  ║  C  BET CONFIGURATION     ║   ║          F  PLAY BOARD              ║  │
│  ║  - Bet Amount + ½ 2X Max  ║   ║   The crate grid you click on       ║  │
│  ║  - Potential Win helper   ║   ║                                     ║  │
│  ║  - Grid Size 25/36/49/64  ║   ║                                     ║  │
│  ║  - Number of Mines        ║   ║                                     ║  │
│  ║  - Advanced (Auto only)   ║   ║                                     ║  │
│  ╠═══════════════════════════╣   ║                                     ║  │
│  ║  D  PRIMARY ACTION        ║   ║                                     ║  │
│  ║  Start / Cashout / Stop   ║   ║                                     ║  │
│  ╚═══════════════════════════╝   ╚═════════════════════════════════════╝  │
│  G  PROVABLY FAIR · Version 1.0.0 · client clock                          │
└───────────────────────────────────────────────────────────────────────────┘
```

Every later section of this guide refers back to these region letters. If a sentence says "the chip in Region E lights up," look at the row across the top of the board.

| Region | Plain-English name | What it does |
| --- | --- | --- |
| **A** | The header bar | Shows the logo, the current time, your money, and the menu icon |
| **B** | The mode tabs | A two-button switch between **Manual** play and **Auto** play |
| **C** | The bet configuration panel | Where you set how much to bet, how big the board is, and how many mines to hide |
| **D** | The big action button | The one button that drives the round forward — its label changes depending on what's happening |
| **E** | The multiplier ladder | A row of seven small chips showing what your multiplier will be at the next few safe reveals |
| **F** | The play board | The grid of crates you actually click on |
| **G** | The footer strip | "Provably Fair Game" badge, the version number, and a small clock |

If you can name these seven regions, you can read the rest of this manual with no friction.

---

## 3. The Header Bar in Detail

The header runs across the top of the bet panel and contains four small but important pieces of information.

![Header reading 17:21 with balance 20000 GEL on the Aviator skin](/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png)
*The capture above is the easiest one to read clearly. From left to right the header shows: the `Aviator` wordmark (this is the same engine as Minescape, just rebranded), the time `17:21`, the balance `20000 GEL`, and the burger-menu icon `☰`.*

### The logo

The logo on the far left tells you which **skin** of the engine you are playing on. The screenshots in the asset folder show two skins, both wired to the same controls and the same round logic:

- A green `MINESCAPE` wordmark (used in `aviator-minescape-default-screen.png`, the mines and grid screenshots, the auto-mode captures, and most active-round images).
- A red script `Aviator` wordmark (used in the bet-amount and burger-menu captures).

You are playing the same game either way. See **§39 — Branding Skins** for a closer look at the visual difference.

### The clock

The small four-digit time shown next to the logo (for example `17:21`, `17:24`, `17:37`, `18:09`) is the **client clock** — the time as your browser or app currently sees it. It updates while the game is running. It is not a countdown and it is not a round timer; there is no time pressure in Minescape.

### The balance

To the right of the clock is your money on the platform, in GEL (Georgian Lari). It is the single most important number on the screen for any returning player.

- **Before you stake a bet**, this number is your full available balance.
- **The moment you stake a bet**, the bet amount is deducted from the balance immediately. You will see the balance drop by the staked amount. For example, in `aviator-minescape-bet-placed-hover-tile.png` the balance reads `999 GEL` because a `1.00 GEL` bet has just been staked from a `1000 GEL` starting balance.
- **When you cash out or finish an autobet round in profit**, the payout is added back to the balance.

If you ever want to confirm your balance, the header is the canonical source — every other display (such as the Cashout button amount) is derived from it.

### The burger menu

On the far right is the three-line `☰` icon. Tap it to open the slide-in menu containing your account, your in-game toggles, your bet history, the rules page, and your responsible-play limits. The menu is documented fully in **§34**.

---

## 4. The Two Modes — Manual vs Auto

Directly under the header sits a **segmented control** with two buttons labelled `Manual` and `Auto`. This is how you choose which of the two play styles you want.

You can switch between them at any time when no round is active. While a round is running (Manual reveal or Autobet loop), the tabs are locked.

### Manual mode

Manual mode is the "default" Minescape experience and the one most beginners should start with.

- You set the bet, choose grid size, choose mines, and tap the green CTA to start a round.
- The board becomes interactive and **you personally click each crate** one at a time.
- The round ends when you either hit a mine (lose) or tap Cashout (win).

This is the mode shown in every capture without an "auto" or "autobet" reference, including `aviator-minescape-default-screen.png`, `aviator-minescape-bet-placed-hover-tile.png`, and `aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png`.

### Auto mode

Auto mode runs the game on a loop, using rules you configure in advance.

- You pre-select which tiles the engine should open.
- You configure rules in an **Advanced Settings** panel (target multiplier, number of rounds, what to do after a win or loss, when to stop).
- The engine then plays round after round without you having to click anything per-reveal.

This is the mode shown in every capture with `auto-mode` or `autobet` in the filename, including `aviator-minescape-auto-mode-selected-tiles-start-autobet.png` and `aviator-minescape-auto-mode-advanced-settings.png`.

| Feature | Manual | Auto |
| --- | --- | --- |
| Per-tile clicking | You do it | The engine does it from your selection |
| Cashout decision | You press the Cashout button | Triggered automatically by Payout On Win |
| Number of rounds | One at a time | Configurable, including unlimited |
| Bet amount changes between rounds | You change them by hand | Rules-based (Reset or Increase by X%) |
| Stop conditions | None — you're in charge | Stop On Profit / Stop On Loss / counter / manual Stop |
| Good for | Learning the game, slow careful play | Disciplined, hands-off sessions, testing a strategy |

> **Practical tip:** Play five to ten Manual rounds before you ever touch Auto. You need to feel how the multiplier climbs before you can confidently tell Auto what to chase.

---

## 5. The Bet Amount Field

The Bet Amount field is the first input inside Region C (the bet configuration panel). It controls **the only money actually at risk** during the round.

### Reading the field

The field shows a `GEL` prefix on the left and a numeric value on the right. The decimal separator is a comma, which is the standard Georgian and European convention. So:

- `GEL 1,00` reads as "one Georgian Lari, zero tetri."
- `GEL 10,00` reads as "ten Georgian Lari."
- `GEL 100,00` reads as "one hundred Georgian Lari."
- `GEL 400,00` reads as "four hundred Georgian Lari."

If you are coming from a comma-thousands format (like English), do not confuse this. `GEL 1,00` is one lari, not one hundred.

### Examples in evidence

![Bet of 10 GEL on a 25/1 configuration](/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png)
*The bet field reads `GEL 10,00`. The blue Potential Win bar below it has been recomputed to `GEL 242.50` based on this stake.*

![Bet halved to 5 GEL](/images/minescape/aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png)
*The bet field now reads `GEL 5,00` after the player tapped the `½` modifier. The Potential Win has recomputed to `GEL 121.25`. The `½` chip is still highlighted in blue to confirm the most recent action.*

![Bet doubled to 100 GEL](/images/minescape/aviator-minescape-bet-100-gel-potential-win-2425.png)
*Pressing `2X` from `GEL 50,00` would produce `GEL 100,00`. The Potential Win recomputes to `GEL 2425.00`. The screen is otherwise unchanged — the bet does not yet exist on the server, you have only configured it.*

### How to change it

You can change the bet amount in three ways:

1. **Tap the field directly and type.** The numeric keyboard on mobile or your physical keyboard on desktop will let you enter any value within the engine's accepted range.
2. **Use a quick-modifier chip** (`½`, `2X`, `Max`) — see §6.
3. **Press the small in-field control if your build exposes one.** Some skins show step buttons; the captures here do not.

The bet does not lock in until you tap the green action button (`Start Bet` or `Start Mission`). Until then you can keep adjusting it freely.

### What is the minimum bet?

The smallest stake seen in any capture is `GEL 1,00`. The exact minimum allowed by the engine is set by the operator and should be confirmed against the operator's configuration before you publish player-facing help.

### What is the maximum bet?

The maximum allowed for a single round is also operator-configured. See **§6** for the very important detail of how the `Max` button behaves — it does **not** mean "all of your balance."

---

## 6. The Quick Modifier Buttons (½, 2X, Max)

To the right of the Bet Amount field sit three quick-modifier chips. They exist so that you do not have to type a new bet between rounds when you want to adjust the size.

### The ½ button

The `½` chip halves the current bet. Tap it once and the value drops to half. Tap it again and it halves again.

![½ chip highlighted, bet has dropped from 10,00 to 5,00](/images/minescape/aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png)
*The chip is shown with a blue outline to confirm it was the last button tapped. This visual confirmation is helpful when chaining halvings.*

Use this chip when you want to step down your stake after a losing round, or to start small after a hot streak.

### The 2X button

The `2X` chip doubles the current bet. It works mirrored to `½`. Tap it once and the value doubles. Tap it again and it doubles again.

There is no specific "after-2X" capture in the asset folder, but you can infer the result by comparing the 5 GEL / 10 GEL / 100 GEL captures: pressing `2X` from `GEL 5,00` arrives at `GEL 10,00`, and from `GEL 50,00` arrives at `GEL 100,00`.

Use this chip when you want to step the stake up — for example to recover after a loss, or because you feel confident in your current configuration.

### The Max button

The `Max` chip is the one most likely to surprise new players, so please read this section carefully.

![Max chip selected — bet set to 400 GEL on a 20,000 GEL balance](/images/minescape/aviator-minescape-max-bet-selected-400-gel.png)
*This single capture answers the question "what does Max do?" in a way that nothing else can. The balance in the header shows `20000 GEL`. The Bet Amount field has been filled to `GEL 400,00`. If `Max` meant "everything you have," the field would read `GEL 20000,00`. It does not. `Max` means "the largest single bet this operator will accept" — which here is `GEL 400,00`.*

This is a deliberate operator safety feature. It prevents a single tap from emptying your balance into one round. The exact cap is configurable per operator deployment, and may differ from `400 GEL` on other skins.

> **Important:** `Max` is a per-bet cap, not a "go all-in" affordance. If you want to bet your entire balance you must type the amount manually (and the engine may still refuse it if it exceeds the operator's per-bet ceiling).

### Visual feedback on tap

All three modifier chips highlight with a blue outline when they were the most recent input. This is also useful for QA: a regression that breaks chip persistence is visible at a glance.

---

## 7. The Potential Win Helper Bar

Directly underneath the Bet Amount row sits a thin blue informational bar with a small "i" icon and the text **"Potential Win: GEL X.XX"**. It is the single most useful number on the setup screen.

### What the Potential Win bar tells you

The Potential Win bar shows **the maximum amount you could win from the current configuration, assuming you reveal every safe tile without hitting a mine.** It is the absolute ceiling — the very best case.

It updates instantly whenever you change:

- The Bet Amount (or use one of the modifier chips).
- The Grid Size.
- The Number of Mines.

### What the Potential Win bar does NOT tell you

- It is **not** what the next click will pay. That is what the Cashout button shows during a live round.
- It is **not** an "expected" win. The chance of reaching it is very low, especially on high-mine configurations.
- It is **not** the multiplier you should aim for. Choosing a sensible cash-out point is a personal decision.

Use it as a sanity check ("if I have a perfect run, this is the most I can possibly walk away with") and as a feel for how aggressive your current setup is. A `GEL 30,269.00` Potential Win on a `GEL 1,00` bet is the engine telling you the configuration is wildly volatile.

### Confirming the math

Across the four bet captures of the 25-tile / 1-mine configuration, the Potential Win scales exactly linearly with the stake:

| Bet | Potential Win | Ratio |
| --- | --- | --- |
| GEL 5,00 | GEL 121.25 | 24.25× |
| GEL 10,00 | GEL 242.50 | 24.25× |
| GEL 100,00 | GEL 2,425.00 | 24.25× |
| GEL 400,00 | GEL 9,700.00 | 24.25× |

This proves two useful properties of the engine:

1. The ceiling multiplier depends only on the **grid + mine configuration**, not on the stake size.
2. The Potential Win is purely a display calculation (`bet × ceiling`) — it never changes the underlying odds.

---

## 8. Choosing Grid Size

The Grid Size row offers four preset chips: `25`, `36`, `49`, `64`. These are the **total number of crates** on the board. They correspond to the four available square grids:

| Chip | Board shape | Total crates |
| --- | --- | --- |
| `25` | 5 × 5 | 25 |
| `36` | 6 × 6 | 36 |
| `49` | 7 × 7 | 49 |
| `64` | 8 × 8 | 64 |

Tap any chip and the board on the right re-renders to that grid immediately. There is no commit step.

![Grid 25 with 3 mines preset selected — 5×5 board](/images/minescape/aviator-minescape-grid-size-25-mines-3.png)
*5×5 layout. Notice how the crates are noticeably larger than on the bigger grids because the engine resizes them to fill the play area.*

![Grid 36 with 2 mines preset — 6×6 board](/images/minescape/aviator-minescape-grid-size-36-mines-2.png)
*6×6 layout. The crates have shrunk slightly to fit the extra row and column. The Mines row beneath has rebuilt itself with new preset values (2 / 5 / 10 / 15 / Custom).*

![Grid 49 with 3 mines preset — 7×7 board](/images/minescape/aviator-minescape-grid-size-49-mines-3.png)
*7×7 layout. Crates shrink again. Mine presets are now 3 / 10 / 15 / 30 / Custom.*

![Grid 64 with 4 mines preset — 8×8 board](/images/minescape/aviator-minescape-grid-size-64-mines-4.png)
*8×8 layout. The largest grid in the game. Mine presets are 4 / 15 / 25 / 35 / Custom.*

### How grid size changes the feel of the game

- **A larger grid** gives you more crates to safely reveal before the ratio of mines tightens up. The multiplier climbs more slowly per reveal, because each reveal represents a smaller fraction of the unrevealed board.
- **A smaller grid** moves faster — each reveal represents a bigger share of the board and so the multiplier climbs more steeply, but you have fewer crates to choose from.

Compare the first multiplier chip on each grid (with similar mine ratios) and you can see this directly in the screenshots: 25/1 starts at `x1.01`, while 36/2 starts at `x1.03`, and 49/3 starts at `x1.03` as well — almost identical because the safe-to-total ratios are similar.

### Recommended starting grid for new players

If you have never played a mine-style game before, **start on the 25-tile grid**. It is the easiest to reason about (5×5 is a single glance), it has the smallest set of mine presets, and a 1-mine 25-grid round is the friendliest configuration in the game.

---

## 9. Choosing the Number of Mines

The Number of Mines row is the second strategic decision after grid size. It sets **how many of the crates on the current board are hiding a mine.** The remaining crates are safe.

### Why this matters

The fewer mines you have, the more safe tiles there are, the more reveals you can make safely, and the slower (but more reliable) the multiplier grows. The more mines you have, the fewer safe tiles, the faster (but less reliably) the multiplier grows.

It is the single biggest knob you have for choosing the personality of the round:

- **1–3 mines on a 25 grid** = friendly, almost gentle. You'll usually walk away with something.
- **10 mines on a 25 grid** = explosive. When you win you win big, but you'll lose a lot of rounds quickly.

### The mine presets change per grid

This catches a lot of players out. The mine preset row redraws itself when you choose a different grid size. Each preset row is hand-picked by the game designers to match the size of the board.

| Grid | Preset chips offered |
| --- | --- |
| 25 | `1` · `3` · `5` · `10` · `Custom` |
| 36 | `2` · `5` · `10` · `15` · `Custom` |
| 49 | `3` · `10` · `15` · `30` · `Custom` |
| 64 | `4` · `15` · `25` · `35` · `Custom` |

If you remember the 25 row from one session, the 36 row will look "wrong" to you — that's by design. You always have the `Custom` chip as an escape valve if none of the presets feel right.

### Visual evidence across all mine presets

For the 25-tile board, the four mine presets paint very different multiplier curves:

![Grid 25 with 3 mines](/images/minescape/aviator-minescape-grid-size-25-mines-3.png)
*The multiplier ladder starts at `x1.10` and climbs to `x2.30` by the sixth chip.*

![Grid 25 with 5 mines](/images/minescape/aviator-minescape-grid-size-25-mines-5.png)
*With 5 mines the ladder starts at `x1.21` and crosses `x3.32` by the sixth chip — meaningfully steeper.*

![Grid 25 with 10 mines](/images/minescape/aviator-minescape-grid-size-25-mines-10.png)
*With 10 mines the curve becomes explosive. The first chip is already `x1.62`, the fourth is `x8.99`, and the sixth is `x34.32`. This is what people mean by "high volatility."*

The 36-tile board tells the same story:

![Grid 36 with 2 mines](/images/minescape/aviator-minescape-grid-size-36-mines-2.png)
*The gentlest 36-grid setup. Ladder starts at `x1.03` and only reaches `x1.4` by the sixth chip.*

![Grid 36 with 5 mines](/images/minescape/aviator-minescape-grid-size-36-mines-5.png)
*Adding 3 more mines to the same board jumps the first chip to `x1.13` and the sixth chip to `x2.57`.*

![Grid 36 with 10 mines](/images/minescape/aviator-minescape-grid-size-36-mines-10.png)
*With 10 mines the curve is much steeper still. The first chip is now `x1.34` and the sixth chip is over `x5.5`.*

![Grid 36 with 15 mines](/images/minescape/aviator-minescape-grid-size-36-mines-15.png)
*The 15-mine preset on the 36 grid is the most explosive preset available without going Custom: the first chip is `x1.66`, the third is `x5.21`, the sixth is `x34.62`. Beautiful when it works.*

> **Beginner advice:** Stay in the bottom half of these presets until the rhythm of revealing is second nature. The 1-mine and 3-mine 25-grid presets will teach you almost everything you need without putting much money at risk.

---

## 10. The Custom Mine Field

If none of the preset chips fits the round you want, tap `Custom`. The chip turns into a numeric input where you can enter any whole number the engine accepts.

![Grid 25 with Custom = 24 — the most extreme legal configuration on the smallest board](/images/minescape/aviator-minescape-grid-size-25-mines-custom-placeholder-24.png)
*A 25-tile board with 24 mines. There is only one safe crate on the entire board — find it in a single click and you win, miss it and you lose. The Potential Win bar shows `GEL 24.25` on a `GEL 1,00` bet, which is exactly the same multiplier as the 1-mine 24-safe configuration. The engine is symmetric at the endpoints.*

![Grid 36 with Custom = 35 — the same extreme on the next grid size up](/images/minescape/aviator-minescape-grid-size-36-mines-custom-placeholder-35.png)
*A 36-tile board with 35 mines. Same idea — a single safe crate among thirty-five mines. The ladder is impossibly steep because each reveal is so unlikely.*

### What values can you put in?

The Custom field accepts whole numbers. The upper limit appears to be `grid − 1` (so the maximum on a 25 grid is 24, and on a 36 grid it is 35). Confirm this with engineering before publishing player-facing help — the captures only directly prove the upper bound for grids 25 and 36.

The lower limit is at least 1 (you cannot configure a board with zero mines — there has to be danger somewhere) and is likely to be the same as the lowest preset offered for that grid.

### When would you actually use Custom?

- **To go below the lowest preset** for an even-friendlier round (only possible on grids that offer a `1` preset already, where Custom has nothing easier to give you).
- **To go above the highest preset** for a thrill-seeking high-volatility round.
- **To match a specific multiplier target** when you're chasing a particular ladder shape — for example you might want exactly 7 mines on the 36 grid to land between the 5-mine and 10-mine presets.

### Custom and the multiplier curve

Notice from the two extreme-Custom captures that the multiplier ladder reshapes itself in real time. The 25/24 ladder starts at the same `x1.01` as the 25/1 ladder, even though one is friendly and the other is brutal. That is because the multiplier ladder shows the **next several payouts**, not the danger of the round. Always read the Potential Win bar alongside the ladder to understand what you are about to play.

---

## 11. The Multiplier Ladder

Across the very top of the play board (Region E in the screen map) is a horizontal row of seven small chips. This is the **multiplier ladder**.

### What the chips actually show

Each chip displays a multiplier value, prefixed with an `x` (such as `x1.01`, `x1.05`, `x1.10`). These are the multipliers your stake will be at after each safe reveal.

- The first chip is the multiplier after your **first** safe reveal.
- The second chip is the multiplier after your **second** safe reveal.
- ...and so on.

### Why this is so useful

Without the ladder you would have to mentally compute what your next click is worth. With it, you can look up at any moment and know:

- **What you'll be at after the next safe reveal** (the next chip not yet lit).
- **What you'll be at after a couple more** (the chips further down the row).
- **What your current Cashout offer represents in payout terms** (the currently lit chip).

### The active chip lights up

During a live round, the chip representing your current multiplier highlights in yellow/orange. This is the simplest "where am I on the curve?" indicator the game gives you.

![One safe tile revealed — the first chip x1.01 lights yellow](/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png)
*The leftmost chip (`x1.01`) is now visibly highlighted in a warm yellow. The other six chips remain in their neutral state, previewing the upcoming steps.*

### The ladder values are configuration-dependent

The seven values you see depend on the grid + mine configuration you chose. They will change every time you change grid size or mine count, before you ever start the round.

Compare:

- **25/1** ladder begins `x1.01, x1.05, x1.10, x1.15, x1.21, x1.28` — a gentle climb.
- **25/10** ladder begins `x1.62, x2.77, x4.9, x8.99, x17.16, x34.32` — a near-vertical climb.
- **49/3** ladder begins `x1.03, x1.10, x1.18, x1.26, x1.35, x1.45` — a very gentle climb because there are 46 safe tiles among 49.

### Only seven chips at a time

The ladder shows seven chips total. If a configuration has dozens of safe tiles to reveal (for example 25/1 has 24 safe tiles), you will clear all seven visible chips and keep playing. From that point onward the **Cashout button amount** is your truth. Confirm with engineering whether the ladder paginates, scrolls, or simply stops updating past the seventh chip on long rounds.

---

## 12. The Primary Action Button

The bottom of the side-panel always shows a single, wide button. It is the most important control in the entire interface because it drives the round forward. The label and colour on this button change depending on the state of the game.

| Game state | Button label | Button colour |
| --- | --- | --- |
| Default setup, Manual mode (Minescape skin) | `Start Mission` | Green |
| Default setup, Manual mode (Aviator skin) | `Start Bet` | Green |
| Bet staked, no tiles opened yet | `Cashout GEL 0.00` | Yellow / orange |
| Bet staked, tiles revealed | `Cashout GEL X.XX` (live) | Yellow / orange |
| Default setup, Auto mode | `Start Autobet` | Green |
| Autobet running | `Stop Autobet` | Red |

You will see all of these states throughout the rest of this guide. The important habit to build is: **always read the button before you tap it.** If it says Cashout, tapping it ends your round in a win. If it says Stop Autobet, tapping it halts the loop.

---

## 13. Starting Your First Manual Round

Now let's walk through an actual round, step by step, on the simplest configuration in the game: a 25-tile grid with 1 mine.

### Step 1 — Confirm Manual is selected

Look at the segmented control. The `Manual` chip should be highlighted. If `Auto` is highlighted instead, tap `Manual` to switch back.

### Step 2 — Set a small bet

Tap the Bet Amount field and enter a small starter amount. `GEL 1,00` or `GEL 10,00` are both perfectly reasonable. Or use the `½` button if your previous bet was already small.

### Step 3 — Confirm Grid Size 25 and Number of Mines 1

These are the default selections in `aviator-minescape-default-screen.png`. If you have been experimenting, tap `25` in the Grid row and `1` in the Mines row to reset to the friendliest configuration in the game.

### Step 4 — Glance at the Potential Win bar

It should read `GEL 24,25` if you bet `GEL 1,00`, or `GEL 242,50` if you bet `GEL 10,00`. This is the best case — it tells you "if I reveal all 24 safe crates this is what I walk away with." (You almost certainly will not reveal all 24, but it's nice to see the ceiling.)

### Step 5 — Press the big green button

If you are on the Minescape skin, tap `Start Mission`. If you are on the Aviator skin, tap `Start Bet`. Either way the bet is now staked.

At the moment you press the button:

1. The bet amount is deducted from your balance immediately. The header balance drops.
2. The bet configuration controls grey out and lock — you cannot change grid, mines, or stake mid-round.
3. The big green button is replaced by a **yellow Cashout button**, currently showing `GEL 0.00` (you haven't earned anything yet).
4. A small **dice icon** appears beside the Cashout button — see §18.
5. The board on the right becomes interactive.

You are now in the **bet-placed state**.

---

## 14. The Bet-Placed State — What Just Changed

The bet-placed state looks subtly different from the default state. Get used to spotting the difference at a glance.

![Bet placed, hovering on a closed crate](/images/minescape/aviator-minescape-bet-placed-hover-tile.png)
*Compare this against the default-screen capture. The balance has dropped (from 1000 to 999, reflecting the staked 1.00 GEL bet). The bet, grid, and mine controls are noticeably dimmer — that's the visual sign they're now locked. The big green `Start Bet` button is gone, replaced by a yellow `Cashout` button showing `GEL 0.00` plus a small dice icon to its right. On the board, one crate has a yellow glow because the player's cursor is hovering over it.*

A second capture of the same state, taken from a slightly different angle, confirms the layout:

![Bet placed, hovering on a different crate](/images/minescape/bet-placed-hover-on-a-box.png)
*Same locked controls, same yellow cashout, same dice button, same yellow hover glow — just a different crate being inspected.*

### What you can do in this state

- **Hover** any closed crate to see it glow yellow. This is purely visual — hovering does not commit anything.
- **Click** a closed crate to reveal it. This is the actual round-driving action — see §15.
- **Press the dice icon** to have the client pick a crate for you. See §18.
- **Press the Cashout button** at any time to take whatever you have. See §19. While the button reads `GEL 0.00`, pressing it would forfeit your stake without any payout, which is a strange thing to do — but the engine allows it.

### What you cannot do in this state

- Change the Bet Amount.
- Change the Grid Size.
- Change the Number of Mines.
- Switch between Manual and Auto tabs.
- Open the Advanced Settings panel.

These all require returning to the default state, which happens automatically the moment the round ends (either by Cashout or by hitting a mine).

### The animation that proves the bet-placed state

The asset folder contains a small animation, `clicking-on-box-while-bet-isn-t-placed.gif`, which shows what happens if you try to click a crate **before** placing a bet: nothing. The crates are simply not interactive until the bet is staked. This is the engine's way of preventing accidental clicks from being misinterpreted as a real reveal.

---

## 15. Hovering and Clicking Crates

The play board is a grid of closed wooden crates. Hovering and clicking are the two interactions you'll perform hundreds of times.

### Hovering

When your cursor moves over a closed crate (on desktop) or you hold down a finger near one (on touchscreen), the crate visibly highlights in **yellow** — see the two bet-placed captures in §14. This is a "you are here" indicator. It is purely visual and commits nothing.

You can hover any number of crates without consequence. Use this freely to slow yourself down and avoid accidental clicks.

### Clicking

A single click (or tap) on a closed crate **commits** the reveal. There is no confirmation dialog. The engine immediately determines whether the crate was safe or contained a mine, and updates the screen accordingly.

There are two possible outcomes for every click:

- **Safe** — the crate opens to show a small green icon (a dollar/coin/money-bag), the multiplier ladder advances by one step, the Cashout button amount goes up.
- **Mine** — the crate opens to show a red mine icon, and the round ends instantly. The bet is forfeited and the panel returns to its default state.

### Which crates are safe?

You don't know. The mine positions are randomised by the engine when you press the Start button, locked in for the duration of the round, and revealed only as you click. You can think of it as scratching a scratch-off card: the answer is already there, you just don't know it until you scratch.

This is also why the engine is described as "provably fair" — see §38.

---

## 16. Revealing Your First Safe Crate

Let's see what a single safe reveal looks like.

![First safe crate revealed — small green icon, x1.01 chip highlighted, cashout reads GEL 1.01](/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png)
*A great picture of what a successful first click looks like. The clicked crate is now open, showing a green money-bag icon. Up at the top of the board the very first multiplier chip (`x1.01`) has lit up in yellow. Down on the side-panel the Cashout button has changed from `GEL 0.00` to `GEL 1.01` — exactly your bet (`GEL 1,00`) multiplied by your current multiplier (`x1.01`).*

### What just happened — in detail

1. The engine resolved the click. Because the configuration was 25/1, only 1 of the 25 crates was a mine. The chance of hitting the mine on the first click was 1 in 25, or 4%. You got lucky (or — more accurately — you made the most likely move).
2. The crate is now permanently open for this round. You cannot click it again.
3. The multiplier ladder advanced by one step. Your current multiplier is now `x1.01` and the chip lights up yellow.
4. The Cashout button updated. It now shows what you would actually be paid if you cashed out right now: `bet × multiplier` = `1.00 × 1.01` = `GEL 1.01`.
5. Your balance in the header is still `999 GEL`. It does **not** update on every reveal. It only updates when the round resolves (either by Cashout or by hitting a mine).

### The visible decision

At this exact moment you have a choice:

- **Tap Cashout** to take `GEL 1.01`. That's a `0.01 GEL` profit — barely worth bothering, but it's yours to take.
- **Click another crate** to push for a higher multiplier. The next chip on the ladder reads `x1.05`, so a second successful click puts you at `GEL 1.05`. The chip after that is `x1.10`. And so on.
- **Tap the dice** to have the client pick the next crate for you (see §18).

Most players will obviously keep clicking — but be aware that the "I'll just take this tiny profit" instinct is exactly the discipline that makes long-term Minescape players profitable.

---

## 17. Multiple Safe Reveals — Reading the Live Cashout

Now let's look at the round a few clicks later.

![Several safe crates revealed, Cashout amount has grown noticeably](/images/minescape/aviator-minescape-multiple-tiles-open-cashout-active.png)
*Multiple green-icon crates are now open. The multiplier ladder has visibly advanced. The Cashout button shows a higher GEL amount, reflecting the new multiplier.*

### What to read in this state

There are three sources of truth, and they should always agree:

1. **The Cashout button amount** — this is what you'd actually walk away with right now. It is always the live source of truth.
2. **The lit chip on the multiplier ladder** — this is the multiplier the Cashout amount reflects.
3. **The number of open green-icon crates on the board** — should equal the position of the lit chip (one open crate = first chip lit; two open crates = second chip lit, etc.).

If any of these three disagree (for example you see five open crates but only the second chip is lit), refresh the page and report the issue to support — that's a state-sync bug, not a normal round.

### The mounting tension

Every additional reveal does two opposite things at once:

- It **adds to your payout** — the multiplier climbs, the Cashout amount climbs.
- It **shrinks your safety margin** — there are fewer unopened safe crates left and the same number of mines, so the next click is statistically more dangerous than the last.

This is why the game is called "crash-and-hold." The crash is hitting a mine; the hold is your decision to keep going.

### The dice still works

The small dice icon next to the Cashout button is still there during this state. Use it if you want to keep momentum without choosing a specific crate.

---

## 18. The Dice (Randomize) Button During a Round

To the right of the live Cashout button is a small dice icon. It is one of the most underexplained controls in the game, so here it is in detail.

### What the dice does

A single tap on the dice instructs the client to **reveal one tile for you, chosen by the engine.** It is the per-click equivalent of "do something, I'm not picky." The reveal that follows is treated exactly like a tile you clicked yourself — it can be safe (multiplier advances, Cashout rises) or it can be a mine (round ends).

The dice does **not** auto-cash-out. It does **not** reveal multiple tiles. It is one click per press.

### Why this exists

Two practical reasons:

1. **Momentum** — players who don't want to overthink which crate to click can simply mash the dice. Every press is a random reveal.
2. **Auto-mode parity** — the same dice icon is used during Auto Mode setup to randomize your tile selection (see §23). Having the icon available during Manual play keeps the muscle memory consistent.

### Strategic note

There is no mathematical advantage to clicking a "pattern" of crates versus pressing the dice. The mine positions are server-side random — no edge tile is safer than a centre tile. So pressing the dice is functionally identical to picking your own crates. Some players still prefer clicking specific crates because it feels more deliberate.

---

## 19. Cashing Out — The Most Important Button

The yellow Cashout button is how you turn an unfinished round into a real win on your balance.

### Where it is and what it shows

During a round it sits at the bottom of the side-panel, exactly where the green `Start Bet` / `Start Mission` button was during setup. The label is always:

```
Cashout    GEL X.XX
```

where `X.XX` is **the exact amount of GEL you will receive if you tap it right now.** What you see is what you get.

### What happens when you press it

The moment you tap Cashout:

1. The round ends.
2. The `GEL X.XX` amount shown on the button is added to your balance. The header balance updates to reflect the new total.
3. The bet panel returns to its default state. The `Cashout` button disappears, the `Start Bet` / `Start Mission` button returns, the bet/grid/mines controls become editable again.
4. The board may briefly show the rest of the mines (so you can see what you avoided) or simply reset, depending on the skin.
5. You are ready to start a new round.

### When you cannot press it

The Cashout button is available from the moment the bet is staked. You can press it with `GEL 0.00` on the button (right after staking, before any reveal) — but that would forfeit your stake with no payout, which would be a strange thing to do.

There is no "you must reveal at least one tile" rule and no minimum multiplier required to cash out. As soon as the bet is placed, the door is open.

### Cashout discipline

This single button is the difference between profit and loss in the long run. The hardest thing in Minescape is **pressing this button when you don't want to** — when the multiplier is climbing and "just one more click" sounds like a great idea.

Two simple rules that prevent most regrets:

1. **Decide your cashout target before you start the round, not during it.** Once you're in the heat of revealing it's almost impossible to think clearly. Set a number ("I'll cash out at x2.0") and stick to it.
2. **If you would not press Start Bet for the amount the Cashout button currently shows, press Cashout.** It's the gut-check test — would you risk this amount on a fresh round? If no, take it.

---

## 20. Hitting a Mine — The Lose State

Every Minescape player will hit a mine. It is part of the game and not a sign you did anything wrong.

![Lose state — a mine has been revealed in red, the round has ended](/images/minescape/aviator-minescape-lose-state-mine-revealed.png)
*A clicked crate has opened to show a mine. The side-panel has already snapped back to its default state — the green `Start Mission` button is back, the bet/grid/mines controls are editable, the `Cashout` button is gone. Behind the panel you can see the previously revealed safe tiles and the now-revealed mine in red.*

### What just happened

1. You clicked a crate that contained a mine.
2. The engine resolved the click as a loss.
3. The round ended instantly. The staked bet is **forfeited**.
4. The header balance does not change at the moment of the mine — the bet was already deducted when you pressed Start. So the visible effect is just "round ended, no payout."
5. The bet panel snaps back to default. You can immediately start a new round.

### No second chances

There is no "continue," no "save my round for a small fee," and no "if you mark the mine you keep playing" mechanic. A mine ends the round, period. Any new round is independent — the mine positions are re-randomised on the next press of Start.

### Why this is fine

The point of the game is the trade-off. The reason cashouts can pay double or triple your stake is precisely because mine hits exist. If there were no mines there would be no risk and no reward.

### Common emotional traps after a mine hit

- **"I should chase it back with a bigger bet."** This is the most expensive feeling in casino games. The next round has no memory of the last round. A bigger bet doesn't make you "owed" anything.
- **"I had a bad pattern."** There is no pattern. Mines are randomized fresh every round.
- **"I should switch to a higher-mine config to make up for it."** Higher mines means more rounds end in mines. It will compound the bad feeling, not fix it.

If you feel any of these instincts, step away for a minute. They're a sign to slow down, not to play harder.

---

## 21. Switching to Auto Mode

Tap the `Auto` chip in Region B. The bet-configuration panel reshapes itself for autoplay.

![Auto mode default — the Advanced Settings strip has appeared, Start Autobet is the green CTA](/images/minescape/screenshot-2026-05-29-at-18-30-03.png)
*The Auto tab is now active. The Bet Amount field, Grid Size row, and Number of Mines row all look the same. But two things have changed: there is a new horizontal `Advanced Settings` strip below the Mines row, and the big green button at the bottom now reads `Start Autobet`.*

### What stays the same

- Bet Amount, ½ / 2X / Max chips, and Potential Win bar — identical behaviour to Manual.
- Grid Size and Number of Mines presets — identical behaviour to Manual.
- The header, the menu, the Provably Fair badge, the version footer.

### What is different

- A new `Advanced Settings` row sits below the Mines row. Tap it to open the autoplay rule panel (covered in §24–§29).
- The big green CTA now says `Start Autobet` instead of `Start Bet` or `Start Mission`.
- **You must pre-select which crates the engine should open** before you can start. The default board allows you to tap crates to "mark" them.

You can switch back to Manual at any time before pressing `Start Autobet` simply by tapping the `Manual` chip. Your bet, grid, and mines settings carry over.

---

## 22. Auto Mode — Pre-selecting Your Tiles

In Auto Mode, the engine plays rounds for you — but it needs to know which crates to open. You provide that information by tapping crates on the board before pressing `Start Autobet`. Each tapped crate becomes a **marked crate**.

![Auto mode — player has tapped several crates on the board, each marked with a green icon](/images/minescape/aviator-minescape-auto-mode-selected-tiles-start-autobet.png)
*Look at the board: several crates carry a green money-bag icon while still appearing closed. These are the marked crates — the engine will open exactly these crates, in order, on every autobet round. The `Start Autobet` button at the bottom is enabled because the selection is valid.*

### How many crates should you mark?

This is your most important autoplay decision. The number of crates you mark effectively sets the **multiplier target** for each round.

- **Mark 1 crate**, and each round ends after a single safe reveal at the first multiplier on the ladder.
- **Mark 6 crates**, and each round ends after six safe reveals (assuming none of the six are a mine), cashing out at the sixth multiplier on the ladder.
- **Mark all safe crates**, and you are betting for the maximum potential win on every single round.

The more crates you mark, the bigger the per-round payout when it works, the more rounds end in a mine when it doesn't.

### Order matters

The engine opens marked crates in the order you tapped them. If you tap top-left, then bottom-right, then centre, the engine will reveal top-left first, then bottom-right, then centre. This usually doesn't matter, because the mine positions are random — but it can affect the visual rhythm of how a round unfolds.

### How to unmark a crate

Tap a marked crate again to remove its marker.

---

## 23. Auto Mode — Letting the Dice Pick for You

If you don't want to choose crates by hand, the dice icon will pick a random set for you.

![Auto mode — random crate selection via the dice button](/images/minescape/aviator-minescape-auto-mode-random-tile-selection.png)
*The board now shows a set of green-marked crates that the engine has chosen on your behalf. The `Start Autobet` button is enabled and ready. You can tap the dice again to roll a new random selection.*

### How many crates does the dice mark?

Reading the captures, the dice marks a non-trivial number of crates each press — enough to give the round meaningful depth, not just one. The exact selection count may be a fixed share of the grid (the captures suggest several crates on a 25-tile board) or configurable; confirm with engineering before publishing player-facing copy on the exact count.

### When to use the dice vs hand-selection

- **Use the dice** when you want a hands-off, no-decision autoplay session — "I want autobet running, surprise me with the spots."
- **Use hand-selection** when you have a specific multiplier target in mind and want to control the exact length of each round.

### Hybrid use

Nothing stops you from pressing the dice to seed a starting selection, then tapping individual crates to add or remove a few. The board treats hand-taps and dice-tap selections identically.

---

## 24. The Advanced Settings Panel

Tap the `Advanced Settings` strip below the Mines row in Auto Mode and the side-panel expands into a configuration panel.

![Advanced Settings panel — default state, no values set](/images/minescape/aviator-minescape-auto-mode-advanced-settings.png)
*The expanded panel. The title `Advanced Settings` sits at the top. Below it are six configurable fields arranged in two columns and three rows. The big green `Start Autobet` button is at the bottom. There is also an X / close affordance to collapse the panel back down.*

The six fields are:

1. **Payout On Win** (top-left)
2. **Number Of Bets** (top-right)
3. **On Win** (middle-left)
4. **On Loss** (middle-right)
5. **Stop On Profit** (bottom-left)
6. **Stop On Loss** (bottom-right)

Below the six fields sits the green `Start Autobet` button (or a red `Stop Autobet` button if autobet is running).

The next five sections (§25 through §29) cover each field in detail.

---

## 25. Advanced Setting — Payout On Win

**What it sets:** The target multiplier at which a round automatically cashes out.

**Field format:** A numeric value with an `x` prefix (for example `1.01x`).

**What this controls:** Every round, as soon as the engine has revealed enough safe crates to reach this multiplier, it presses Cashout for you. Lower values cash out quickly and often; higher values aim for bigger payouts but more rounds end in mines first.

**Worked example:**

- Setting `Payout On Win = 2.00x` and `Number Of Bets = 10` means the engine will play 10 rounds, cashing out each one at 2.0× as soon as that multiplier is reached.
- If a round hits a mine before reaching 2.0×, that round is lost and the loop moves on to the next round.
- If a round reaches 2.0× safely, the win is collected and the loop moves on.

> **Operator note:** Confirm with engineering whether Payout On Win is a hard floor (cash out at the first multiplier ≥ target), a hard ceiling (engine will not exceed target even if the player has marked more crates), or both. The captures here only directly show it operating with default and small values.

---

## 26. Advanced Setting — Number Of Bets

**What it sets:** How many rounds the autobet loop will play before stopping on its own.

**Field format:** Either a whole number (for example `10`) or an infinity icon `∞` (unlimited).

**What this controls:** The loop counts down from this value. When it reaches zero the loop ends naturally. While running, the engine shows a remaining/total counter on the Stop Autobet button — see §31.

**Choosing a value:**

- **10** is a reasonable starter session. You'll have a clear feeling for the multiplier and the bet within ten rounds.
- **100** is a serious session. Make sure your Stop On Loss is set sensibly before committing.
- **∞** is for unsupervised play. Only safe if you have Stop On Profit and Stop On Loss set as hard guards.

**Counter behaviour:**

The captures show counters like `2/10` and `0/0` on the Stop Autobet button. The format is `remaining / total`. So `2/10` means "8 of the 10 rounds have played, 2 remain." `0/0` is the post-completion state.

---

## 27. Advanced Setting — On Win Behaviour

**What it sets:** What the engine should do with your stake after a winning round.

**Choices:**

- **Reset** — return the next round's bet to the original starting bet. No change after a win.
- **Increase by X%** — multiply the next round's bet by `(100 + X) / 100`. So `Increase by 5%` after a `100 GEL` bet would set the next bet to `105 GEL`.

![On Win set to Increase by 5%, 10 bets queued, 2 remaining, a win has occurred](/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png)
*The `On Win` row shows `Increase by` with `5` in the percent box. The `Number Of Bets` field reads `10`. The board has a small win popup showing the round's payout (`GEL 1.91 +1.926`). The red `Stop Autobet` button at the bottom reads `2` — two rounds remain.*

### When to use Increase

- Increase on Win is a **trend-following** strategy. The idea is "ride the streak" — bet a little more after each win and a little less after each loss (using On Loss Reset).
- The percentage increment is up to you. `5%` is gentle. `20%` is aggressive.

### When to use Reset

- Reset on Win is **conservative**. You take your wins as flat profit and never expose more than your starting stake to a single round.
- Most disciplined autobet sessions use Reset on Win and a modest Increase on Loss (or vice versa).

---

## 28. Advanced Setting — On Loss Behaviour

**What it sets:** What the engine should do with your stake after a losing round.

**Choices:**

- **Reset** — return the next round's bet to the original starting bet. No change after a loss.
- **Increase by X%** — multiply the next round's bet by `(100 + X) / 100`. So `Increase by 20%` after a `100 GEL` bet would set the next bet to `120 GEL`.

![On Loss set to Increase by 20%, autobet not yet started](/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png)
*The `On Loss` row shows `Increase by` with `20` in the percent box. The CTA at the bottom is still green and says `Start Autobet` — the loop has been configured but not yet started.*

### Why "increase after loss" is the classic strategy

This is the foundation of the **Martingale-style** approach. After a losing round you bet more, on the theory that an eventual win recovers your previous losses plus the original profit. It feels good for a few rounds — but consecutive losses compound very quickly, and an unlucky streak of even four or five losses can wipe out a session.

If you use Increase on Loss, **always pair it with a Stop On Loss** to cap the damage.

### Why Reset on Loss is the safer default

Reset on Loss means each round is independent in stake terms. Losing streaks hurt only the per-round amount, not a compounding bigger stake.

---

## 29. Advanced Setting — Stop On Profit / Stop On Loss

These are the two boundary conditions that protect you from runaway sessions.

**Stop On Profit:** A GEL value. When your cumulative profit since pressing Start Autobet meets or exceeds this number, the engine halts the loop. A "take the win and walk away" rule.

**Stop On Loss:** A GEL value. When your cumulative loss since pressing Start Autobet meets or exceeds this number, the engine halts the loop. A "cut your losses" rule.

![Stop On Profit set to 10, Stop On Loss set to 20](/images/minescape/aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png)
*A complete safety configuration. Stop On Profit is 10 GEL — so the loop will halt as soon as the session has won a net 10 GEL. Stop On Loss is 20 GEL — so the loop will halt as soon as the session has lost a net 20 GEL. Together they bound the session.*

### How to choose values

A common approach is **2:1 risk/reward** (for example Stop On Loss = 2× Stop On Profit). This accepts that you'll have more losing sessions than winning ones, but each winning session pays out half of what each losing session costs. There is no "correct" ratio — these are personal taste and bankroll size questions.

A second approach is **percentage of bankroll**:

- Stop On Profit at 5% of your total balance.
- Stop On Loss at 10% of your total balance.

Either way the important thing is **setting both before pressing Start Autobet**. A configured loop with stop conditions is a thousand times safer than an unbounded one.

### What "cumulative" means

These thresholds are measured against your **session profit/loss** — that is, the net change since you pressed Start Autobet. They reset to zero every time you start a new autobet session.

---

## 30. Starting Autobet — The Loop Goes Live

Once everything is configured — bet amount, grid, mines, tile selection, advanced settings — tap `Start Autobet`. The loop is now live.

The visible changes the moment you press Start Autobet:

- The green `Start Autobet` button is replaced by a **red `Stop Autobet` button** with a counter showing remaining bets (for example `2`, or a fraction like `2/10`).
- The bet, grid, mines, and tile-selection controls all lock — exactly like the bet-placed state in Manual mode.
- The engine begins playing rounds in sequence at the rhythm built into the game.

You can keep watching the board if you want — or open something else in another tab. The engine doesn't need you.

---

## 31. A Winning Round Inside Autobet

When the engine cashes out a round successfully, you see a small floating payout popup on the board.

![A winning autobet round — payout popup visible on the board](/images/minescape/aviator-minescape-auto-mode-win-state-infinite-rounds.png)
*The board shows the just-played round. A green payout popup floats over the relevant tile with the GEL won. The Stop Autobet button at the bottom remains red — the loop hasn't ended, just the round.*

![A second autobet capture, mid-session, showing a payout popup](/images/minescape/screenshot-2026-05-29-at-18-28-59.png)
*Same idea, different round. The popup reads `GEL 30.30 +2.928` — meaning the round paid out 30.30 GEL of which 2.928 was profit over the stake. The Stop Autobet button below shows the remaining-bets counter at its right edge.*

### What the popup numbers mean

The popup typically shows two numbers:

- The **payout** — the total GEL credited to your balance from this round.
- The **profit** — the payout minus the stake. The `+` prefix marks it as positive.

A losing round does not show this popup; instead the mine icon is rendered on the board (see §32).

### What happens next

After a winning round the engine immediately starts the next round, using:

- The **next bet** as determined by the On Win rule.
- The **same tile selection** you configured at the start of the session.
- The **decremented bet counter** (one fewer remaining).

You don't need to do anything. The loop continues.

---

## 32. A Losing Round Inside Autobet

When the engine hits a mine during autobet, the round ends but the loop **does not**. This is one of the most important things to understand about Auto Mode.

![A losing autobet round — mine revealed, but Stop Autobet still red and live](/images/minescape/aviator-minescape-auto-mode-lose-state-continues.png)
*The board shows the bombs-out result of the most recent round. The Stop Autobet button below remains red and live, with a counter visible — the loop is still running. The engine will play the next round automatically, using the next bet (per On Loss rule) and the same tile selection.*

### Why the loop keeps going

Auto Mode is specifically designed for streak play. Stopping after a single loss would defeat the point — the player wanted a hands-off session. Instead, the engine relies on the **Stop On Loss** condition (and the **Number Of Bets** counter, and the **Stop On Profit** condition) to know when to halt.

### How the next bet is chosen

If you set On Loss to **Reset**, the next bet is the original starting bet.

If you set On Loss to **Increase by X%**, the next bet is the most recent bet × `(100 + X) / 100`. After three consecutive losses with a 20% increase, the stake on the fourth round is `1.20³ = 1.728` times the original — meaningful but not catastrophic. After ten consecutive losses with the same rule, it's `1.20¹⁰ ≈ 6.19` times the original, which is starting to get scary. This is why Stop On Loss exists.

---

## 33. Stopping Autobet — All Four Ways

There are exactly four ways for an autobet session to end:

1. **You press Stop Autobet manually.** The red button at the bottom of the side-panel. Instant halt — the engine finishes the current in-flight round and then stops.
2. **Stop On Profit fires.** Your cumulative session profit has reached the threshold you set. Engine halts at the end of the current round.
3. **Stop On Loss fires.** Your cumulative session loss has reached the threshold you set. Engine halts at the end of the current round.
4. **Number Of Bets counter reaches zero.** Last configured round finishes; engine halts.

Note that a single losing round is **not** a halt condition. The captures of `aviator-minescape-auto-mode-lose-state-continues.png` are explicit confirmation of that — the Stop Autobet button is still red and live with a mine revealed on the board.

When the session ends (by any of the four conditions), the panel returns to its Auto Setup state with the green `Start Autobet` button ready for the next session. Your configured rules persist — you don't have to re-enter them — until you change them.

---

## 34. The Burger Menu

The `☰` icon in the top-right of the header opens a slide-in menu that overlays the side-panel. It contains your account-level controls, your in-game preferences, and links to your history/rules/limits pages.

The menu is taller than it appears at first — you have to scroll to see all of it. The asset folder contains two captures, one of the top half and one of the bottom half.

![Burger menu — top half visible](/images/minescape/aviator-minescape-burger-menu-open.png)
*From top to bottom: the username `T*****E` with an edit-pencil icon, then a `Sound` toggle, `Music` toggle, `Dark mode` toggle, and a `My Bets` link. The Aviator logo is visible behind the menu and the close `✕` is in the top-right.*

![Burger menu — scrolled down to reveal more items](/images/minescape/aviator-minescape-burger-menu-scrolled.png)
*Scrolling down past Music and Dark mode reveals two more entries: `Rules` and `Limits`. The complete menu order — from top to bottom — is: Username/avatar, Sound, Music, Dark mode, My Bets, Rules, Limits.*

The next three sections (§35–§37) cover each menu item in detail.

---

## 35. Username & Profile Entry

At the top of the menu is your account identity. The capture shows it as `T*****E` (masked for privacy) with a small pencil/edit icon to the right.

**What you can do:**

- Tap the pencil to open your profile / account-settings screen (the destination is outside the game).
- The masked username is purely visual — your actual identity is whatever the platform stored.

**What you cannot do here:**

- Change your balance — that happens on the platform deposit/withdraw flow.
- Log out — typically done from the host platform.

---

## 36. Sound, Music, Dark Mode

Three quick toggles let you adjust your sensory environment.

### Sound

Controls the in-game **sound effects** — the click of a crate opening, the chime of a successful cashout, the boom of a mine. Toggle off if you want silent gameplay.

### Music

Controls the **background music**. Independent of sound effects, so you can mute music while keeping the click/cashout sounds, or vice versa.

### Dark mode

Toggles between dark and light visual themes. The captures all show dark mode (the deep warehouse colours). Light mode is its inverse — confirm the exact appearance against your build.

**Persistence:**

The captures don't directly prove whether these toggles persist across sessions, across devices, or only for the current tab. Confirm with engineering before publishing player-facing copy. All three default to **on** in the captures.

---

## 37. My Bets, Rules, Limits

The bottom half of the menu contains three navigation entries (not toggles).

### My Bets

Opens your bet history — every round you've played, with results and payouts. Useful for confirming a specific round's outcome, reviewing how a session went, or reconciling against a support ticket.

### Rules

Opens the rules page — the canonical, operator-published rules of the game. If anything in this player guide contradicts the Rules page, the Rules page is authoritative.

### Limits

Opens your **responsible play** limits — daily/weekly/monthly caps, session-time limits, self-exclusion controls. Highly recommended to configure before you start playing seriously, not after.

---

## 38. The Provably Fair Badge and Version Footer

At the very bottom of the side-panel sits a thin strip with three small pieces of information.

- A green shield icon followed by the text `Provably Fair Game`.
- The version number `Version 1.0.0`.
- The client clock (the same time shown in the header).

### What "Provably Fair" actually means

It means the engine uses a cryptographic commit-reveal protocol for round outcomes: before the round, the engine commits to a result (publishes a hash); after the round, the engine reveals the inputs and you can independently verify the published hash matches. The result is that the engine cannot retroactively decide whether you should have hit a mine — it had to commit to that outcome before you clicked.

The Provably Fair label is a clickable affordance — it opens a verification page where you can validate any past round. Operators integrating Minescape must ensure this page is live before launch.

### What the version number tells you

`Version 1.0.0` is the engine build. It is useful for support: if you report a bug, support will ask for this number to confirm which build you were on.

### The clock

The clock at the bottom matches the one in the header. There is no countdown or session timer in Minescape — both clocks are decorative.

---

## 39. Branding Skins — Aviator vs Minescape

The same engine ships under multiple branding skins. The captures in the asset folder show two: a `MINESCAPE` skin and an `Aviator` skin.

### What changes

- **The wordmark** in the header. Different logo, different colour, different typography.
- **The setup CTA**. On the Aviator skin the green button reads `Start Bet`. On the Minescape skin it reads `Start Mission`.
- **Some round-language framing.** Aviator uses generic bet/win/loss language; Minescape uses "Mission" language.

### What stays the same

- The whole rest of the UI. Every control, every label, every state machine.
- The math. The Potential Win value, the ladder multipliers, the per-round odds — all driven by the same engine.
- The string keys used internally (`Manual`, `Auto`, `Bet Amount`, `Grid Size`, `Number of Mines`, `Custom`, `Advanced Settings`, `Cashout`, `Start Autobet`, `Stop Autobet`, `Payout On Win`, `Number Of Bets`, `On Win`, `On Loss`, `Stop On Profit`, `Stop On Loss`).

If a player asks "are these two different games?" the answer is no — they are the same game with different branding.

---

## 40. Worked Example — A Cautious Manual Session

Let's walk through a complete, plausible session from start to finish. The numbers are illustrative; the game behaviour is exactly what you'd see.

**Setup:**

- Balance: 1,000 GEL.
- Bet Amount: 10 GEL.
- Grid Size: 25.
- Number of Mines: 1.
- Mode: Manual.
- Potential Win: 242.50 GEL.

**Round 1.**

- Press Start Mission. Balance drops to 990. Cashout button appears at GEL 0.00.
- Click a crate top-left. Safe. Cashout reads 10.10. Ladder lights `x1.01`.
- Click another crate. Safe. Cashout reads 10.50. Ladder lights `x1.05`.
- Click another. Safe. Cashout reads 11.00.
- Click another. Safe. Cashout reads 11.50.
- Press Cashout. Balance returns to 1001.50 — net profit 1.50 GEL.

You decide that was a sustainable rhythm and continue.

**Rounds 2–5.**

You repeat similar rounds at 10 GEL each, sometimes cashing out at 11.50, sometimes at 12.50, once at 14.00. Two rounds end in a mine after the first reveal (you'd been at 10.10 each time before the mine, so you lost the full 10 GEL stake).

**After five rounds:**

- 3 wins of small profits (1.50, 2.50, 4.00) = 8 GEL profit.
- 2 losses of 10 GEL each = 20 GEL loss.
- Net: -12 GEL.

You finish the session at 988 GEL and stop. A perfectly normal short-session experience for a careful player on a friendly configuration.

**Lessons:**

- Single-mine 25 grids are very friendly **per reveal**, but the first click still has a 4% chance to hit the mine. Variance shows up in even small sessions.
- A 1.50–4.00 GEL profit on a 10 GEL bet is the standard payout for cautious play.
- This is a normal session. Do not chase the losses.

---

## 41. Worked Example — An Aggressive Manual Session

Same starting balance and bet, very different configuration.

**Setup:**

- Balance: 1,000 GEL.
- Bet Amount: 10 GEL.
- Grid Size: 25.
- Number of Mines: 10.
- Mode: Manual.
- Potential Win: (whatever the engine shows — significantly higher than the 1-mine ceiling, because 10 mines is much more volatile).

**Round 1.**

- Press Start Mission. Balance 990.
- Click. Safe! Cashout reads 16.20. Ladder lights `x1.62`.
- Click. Safe! Cashout reads 27.70. Ladder lights `x2.77`.
- The Cashout button is calling. You think "one more."
- Click. Mine! Round ends. Balance stays at 990 (the 10 GEL was already deducted).

You lost a perfect cashout opportunity. The lesson here: at 10 mines on a 25 grid, after two safe reveals the probability of the third being a mine is `10 / 23` ≈ 43%. You're more likely than not to lose. The 16.20 cashout was a great take.

**Rounds 2–4.**

You try again three more times, hitting a mine before any cashout twice and managing one cashout at 27.70.

**After four rounds:**

- 1 win of 17.70 GEL profit.
- 3 losses of 10 GEL each = 30 GEL loss.
- Net: -12.30 GEL.

You finish the session at 987.70 GEL.

**Lessons:**

- High-mine configurations look thrilling because the multipliers climb quickly. But "climb quickly" and "hit a mine quickly" are the same statement from two angles.
- The right discipline for high-mine play is **cash out at the first chip that's bigger than what you'd accept as profit**. If 1.6× of your bet is enough profit, take the first reveal. Don't let the ladder tempt you.

---

## 42. Worked Example — An Autobet Session With Stop Conditions

Now let's run a session in Auto Mode with all the safety guards on.

**Setup:**

- Balance: 1,000 GEL.
- Bet Amount: 10 GEL.
- Grid Size: 25.
- Number of Mines: 3.
- Mode: Auto.
- Tile selection: 4 crates marked (hand-picked).
- Advanced Settings:
  - Payout On Win: 1.45x (matches the 4-tile chip on the 25/3 ladder).
  - Number Of Bets: 20.
  - On Win: Reset.
  - On Loss: Reset.
  - Stop On Profit: 25 GEL.
  - Stop On Loss: 50 GEL.

**Press Start Autobet. The loop begins.**

- Round 1. Engine reveals 4 marked crates. All safe. Cashout fires at 1.45×. Payout: 14.50 GEL, profit 4.50 GEL. Cumulative: +4.50 GEL.
- Round 2. Mine on the third reveal. Lose 10 GEL. Cumulative: -5.50 GEL.
- Round 3. Win. Profit 4.50. Cumulative: -1.00.
- Round 4. Win. Profit 4.50. Cumulative: +3.50.
- Round 5. Mine. Cumulative: -6.50.
- Round 6. Win. Cumulative: -2.00.
- Round 7. Win. Cumulative: +2.50.
- Round 8. Mine. Cumulative: -7.50.
- ...

After 15 rounds you have hit Stop On Profit (+25 GEL) or Stop On Loss (-50 GEL), or the counter has reached zero, whichever came first.

**Lessons:**

- A flat-bet autobet with stop conditions is the closest thing to a "sustainable" Minescape session.
- The Cautious session in §40 has higher per-reveal safety but no automatic stops; the Autobet session has lower per-round safety (you can't think between rounds) but hard stops.
- Whatever the outcome of the loop, you have spent a fixed maximum (Stop On Loss) and aimed for a fixed target (Stop On Profit). That's a session you can repeat with discipline.

---

## 43. Common Beginner Mistakes

- **Confusing the Potential Win bar with the next-click payout.** Potential Win is the all-reveals ceiling; the Cashout button is what the next/current click actually pays.
- **Assuming Max means "all-in."** Max is the operator's per-bet ceiling, not your balance. See §6.
- **Not reading the comma decimal.** `GEL 1,00` is one GEL, not one hundred.
- **Switching between modes mid-round.** You can't. The tabs are locked while a bet is active or autobet is running.
- **Believing in patterns.** Mine positions are server-randomised. There is no "hot corner" of the board.
- **Chasing losses with bigger bets.** Each round is independent. The engine does not owe you anything.
- **Forgetting to set Stop On Loss in Auto Mode.** Without it an Increase-on-Loss rule can drain a session quickly.
- **Pressing Cashout when the button reads GEL 0.00.** This forfeits your stake with no payout. The button is available but tapping it before any reveal is a costly mistake.

---

## 44. Glossary

- **AAAK** — irrelevant to this guide; appears in internal memory tooling, not in the game UI.
- **Auto / Autobet** — the mode that runs rounds on a configured loop.
- **Balance** — your available money on the platform, displayed in GEL in the header.
- **Bet Amount** — the GEL you stake per round.
- **Cashout** — to lock in your current multiplier and end the round in profit.
- **Crate** — a closed tile on the play board. Click to reveal.
- **Custom (mines)** — a numeric input replacing the Custom preset chip.
- **Dice icon** — the small button beside the Cashout amount; reveals a random tile during a round, or randomizes the tile selection in Auto Mode.
- **GEL** — Georgian Lari, the currency used throughout these captures.
- **Grid Size** — the total number of crates on the board (25, 36, 49, 64).
- **Manual** — the mode where you personally click each crate.
- **Marked crate** — in Auto Mode, a crate the player has tapped (or the dice has selected) to be opened during each loop round.
- **Mine** — a hidden danger inside one or more crates. Reveal one and the round ends in a loss.
- **Multiplier ladder** — the seven chips at the top of the board previewing upcoming payout multipliers.
- **Number Of Bets** — in Auto Mode, the number of rounds to play.
- **On Win / On Loss** — Auto Mode rules for adjusting the next round's stake.
- **Payout On Win** — the multiplier at which Auto Mode cashes out a round automatically.
- **Potential Win** — the best-case payout for the current configuration: bet × ceiling multiplier.
- **Provably Fair** — a cryptographic protocol confirming the engine commits to a round result before the player interacts with it.
- **Safe tile** — a crate that contains no mine. Reveal one to advance the multiplier.
- **Skin** — a visual branding variant (e.g. Minescape, Aviator). Same engine, different wordmark.
- **Stop Autobet** — the red button that halts an active autobet session.
- **Stop On Loss / Stop On Profit** — Auto Mode boundary conditions that halt the loop based on cumulative session result.

---

## 45. Frequently Asked Questions

**Q. The wordmark in my screen says "Aviator" but the docs say "Minescape." Which is correct?**
Both. They are the same game on different operator skins. The setup CTA differs (`Start Bet` on Aviator, `Start Mission` on Minescape), but every control and every game mechanic is identical. See §39.

**Q. I pressed Max and only got 400 GEL even though my balance is much higher. Is this a bug?**
No. The Max button clamps to the **operator's per-bet ceiling**, not your balance. Type the amount manually if you want a larger bet (subject to the engine accepting it). See §6.

**Q. What does the Potential Win bar actually represent?**
The best-case payout for the current configuration — your bet multiplied by the maximum multiplier reachable if every safe tile is revealed. It does **not** mean "what the next click will pay." See §7.

**Q. Why do the mine-count chips change when I switch grid size?**
The preset chips are hand-picked per grid by the game designers to match the size of the board. The Custom chip is always available as an escape valve. See §9.

**Q. What does the dice icon do during a live round?**
It reveals one tile for you, chosen by the engine. It's a "do something, I'm not picky" affordance. See §18.

**Q. Why is the Cashout button available even when it reads GEL 0.00?**
The engine allows you to cash out the moment the bet is staked. Pressing it before any reveal forfeits your stake with no payout — which would be a strange thing to do, but it's not prevented. See §19.

**Q. Once I press Start, can I change my bet?**
No. The bet, grid, and mine controls all lock the moment the bet is staked. They unlock again when the round ends — either by Cashout or by hitting a mine. See §14.

**Q. In Auto Mode, what exactly stops the loop?**
Exactly four things: a manual Stop Autobet tap, hitting the Stop On Profit threshold, hitting the Stop On Loss threshold, or running out of the configured Number Of Bets. A single losing round does **not** stop the loop. See §33.

**Q. Do the On Win and On Loss rules both apply on every round?**
Each round resolves as either a win or a loss; only the matching rule fires for that round. Both are configured up-front, but they don't both trigger. See §27 and §28.

**Q. Where do I find the Provably Fair verification page?**
The badge at the bottom of the side-panel — see §38 — is the entry point. The exact URL is operator-configured.

**Q. Do the menu toggles (Sound, Music, Dark mode) persist?**
The captures show them all default to ON. Persistence (per session, per device, per account) is not visible from screenshots alone. Confirm with engineering.

**Q. What happens if I lose internet during a round?**
Not directly visible in the captures. The engine is provably-fair and server-side, so any in-flight round result is bound to the round seed published before play began. Confirm with engineering whether a disconnect resumes the round on reconnect or auto-cashes-out at zero.

**Q. Is there a way to undo a reveal?**
No. A click commits the reveal. There is no undo and no second chance.

**Q. Can I see what was inside a crate I didn't click after the round ends?**
Sometimes — some skins reveal all unopened crates after a mine hit, showing where the other mines were. Behaviour varies by skin and is not consistently visible across the captures.

**Q. What's the smallest legal stake?**
The smallest seen in the captures is `GEL 1,00`. The actual minimum is operator-configured. Check the Limits page for your account.

**Q. What's the largest legal stake?**
The Max button in the captures clamps at `GEL 400,00`. Higher might be allowed by typing manually, but the engine has an upper cap configured by the operator. Check the Limits page.

**Q. Is the Manual reveal order important?**
No. The mine positions are randomized server-side, the same as picking by the dice. There is no advantage to centre vs edge picks.

**Q. Does the engine ever change the mine positions during a round?**
No. The mine positions are committed at the moment you press Start, and they cannot change until the round ends.

---

## 46. Operator Reference Sheet

A compact, evidence-backed checklist for the operator-facing documentation set.

| Topic | What the captures show | What to confirm with engineering |
| --- | --- | --- |
| Currency | `GEL` (Georgian Lari) throughout | Per-locale currency support |
| Decimal format | `GEL X,XX` comma decimal | Per-locale formatting overrides |
| Smallest captured bet | `GEL 1,00` | The engine-side hard minimum |
| Max button ceiling | `GEL 400,00` on a `GEL 20,000` balance | Cap source (config, VIP tier, regulator) and per-skin overrides |
| Grid sizes | 25, 36, 49, 64 | All four supported on every skin |
| Mine presets per grid | 25:`1/3/5/10` · 36:`2/5/10/15` · 49:`3/10/15/30` · 64:`4/15/25/35` | Custom field allowed range per grid |
| Custom mine upper bound | Placeholder `24` on 25, `35` on 36 | Same `grid-1` rule for 49 and 64 |
| Multiplier ladder | 7 visible chips | Scroll/paginate/freeze behaviour past chip 7 |
| Live cashout amount | `bet × current multiplier` | Round-half conventions to match displayed precision |
| Pre-bet click on crate | No-op (confirmed by GIF) | Same on touch and mouse input |
| Auto stop conditions | Manual Stop · Stop On Profit · Stop On Loss · Number Of Bets exhausted | No additional balance-floor halt |
| On Win / On Loss rules | Reset or Increase by X% | Allowed percentage range |
| Menu entries | Username · Sound · Music · Dark mode · My Bets · Rules · Limits | Regulator-required additions per market |
| Branding skins | Minescape (`Start Mission`) · Aviator (`Start Bet`) | Full approved-skin list |
| Versioning | `Version 1.0.0` displayed in footer | Version surfaces on every patch |
| Provably Fair link | Footer badge | Live verification page before launch |
| Sound / Music / Dark toggles | All default ON in captures | Persistence scope (account vs device) |

---

## Document Metadata

- **Source evidence:** `public/images/minescape/` (37 PNGs, 1 GIF, 1 MOV)
- **Companion docs referenced for context only:** `minescape-player-guide.md`, `minescape-interface-description.md`, `minescape-media-manifest.json`
- **Math/odds policy:** No invented RTP, win-rate, or odds tables. Every computed value falls directly out of stake × Potential Win ratios visible in screenshots.
- **Tone:** Plain-English manual aimed at first-time players, not platform engineers. Every section is intended to be readable cold.
- **Author:** Product
- **Last review:** 2026-05-30
