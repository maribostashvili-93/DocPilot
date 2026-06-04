# Minescape — Master Documentation

**Document Type:** Product master reference (player-presenting layer)
**Product:** Minescape (also shipped under the `Aviator` branding skin — same engine, same controls, different wordmark)
**Audience:** Internal teams (Product, Engineering, QA, Support, Localization), Casino Operators, Aggregators, Account Managers
**Version:** 2.0
**Last updated:** 2026-06-03
**Authoritative evidence base:** 37 PNG screenshots, 1 GIF, 1 MOV in `public/images/minescape/`

---

## 0. How To Use This Document

This is the single source of truth for what Minescape **is**, **does**, and **shows** to a player today. It is organised so that any team member can land on a section, read it cold, and walk away with statements they can defend in front of an operator or a regulator.

| If you are… | Read these sections first |
| --- | --- |
| New to the product | §1 (Product Summary), §3 (Screen Anatomy), §5–§7 (Modes & Bet flow) |
| Casino operator / aggregator | §1, §16 (Operator Reference Matrix), §17 (Integration Notes), §18 (Open Engineering Questions) |
| Account manager | §1, §19 (What you CAN/CANNOT say), §16 (Operator Reference Matrix) |
| Support / QA | §3–§14 (every UI state), §15 (Edge cases observed) |
| Localization | §20 (Canonical String Inventory) |
| Anyone writing player copy | §1, §5–§14, §19 |

**Evidence policy.** Every claim in this document is anchored to a screenshot in `public/images/minescape/`. Where a claim cannot be proven from the captures, it is flagged with an "⚠ Confirm with engineering" note. There are no invented RTP figures, win-rate percentages, or odds tables in this document. The earlier `minescape-player-guide.md` contains several such invented figures that should not be repeated externally; see §21 (Audit of Prior Docs).

**Skin policy.** The engine ships under at least two visual skins in the evidence:

- **Minescape** — green wordmark, `Start Mission` CTA.
- **Aviator** — red script wordmark, `Start Bet` CTA.

Both skins are wired to the same logic. Where a control or label differs by skin, both forms are quoted side-by-side.

---

## 1. Product Summary (one-pager)

Minescape is a **crash-and-hold mining game**. A player stakes a bet, the engine hides mines beneath a grid of crates, and the player opens crates one at a time. Each safe crate advances a payout multiplier; hitting a mine ends the round and forfeits the stake. The player decides when to **Cashout** at the current multiplier — or keep going for a higher one.

The entire loop is one repeated decision: **open another crate, or cash out?**

**Configurable per round (player-controlled):**

- **Bet Amount** in GEL (Georgian Lari, comma decimal).
- **Grid Size** — `25` (5×5), `36` (6×6), `49` (7×7), or `64` (8×8).
- **Number of Mines** — preset chips per grid, or a `Custom` numeric field.
- **Mode** — Manual (the player clicks each crate) or Auto (the engine clicks for them on a configurable loop).

**Fixed per round (engine-controlled):**

- Mine positions are randomised server-side at the moment the bet is placed and locked for the round.
- The multiplier ladder shown above the board is derived from the grid+mines configuration before the round and is the same for every player on that configuration.
- The maximum (ceiling) multiplier and the live cashout multiplier are functions of the configuration and revealed-tile count; the stake is a linear multiplier on the GEL payout.

**Provably Fair.** A footer badge labels the engine as provably fair, meaning the engine commits to the round outcome before play and the player can later verify it. The verification destination is operator-configured.

**What this game is not.**

- It is **not** a timed game. There is no countdown, no round timer.
- It is **not** a luck-only game in terms of UI — the player chooses bet, grid, mines, when to cash out, and (in Auto) the tile selection and the loop's stop conditions.
- It is **not** a slot — there are no reels, no symbols, no paylines.
- It is **not** an "all-in by default" game — the `Max` button is operator-capped, not a balance dump (see §8).

---

## 2. Skins (Visual Branding)

The evidence shows two skins of the same engine.

### Minescape skin

![Minescape skin — default play screen, balance 1000 GEL](/images/minescape/aviator-minescape-default-screen.png)

- Green `MINESCAPE` wordmark in the header.
- Primary CTA in Manual mode reads `Start Mission`.
- Default capture uses a 1,000 GEL balance.

### Aviator skin

![Aviator skin — default play screen, balance 20000 GEL, bet field 10,00](/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png)

- Red script `Aviator` wordmark in the header.
- Primary CTA in Manual mode reads `Start Bet`.
- Default capture uses a 20,000 GEL balance.

**What changes between skins:** wordmark, CTA label, balance amounts in the captures (incidental, not engine behaviour), and some "Mission" vs "Bet" terminology.

**What stays the same:** every control, every state machine, every rule. The math, the ladder, the Potential Win formula, the burger menu structure, and the footer are identical.

---

## 3. Default Screen Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│  ╔════════════════════════╗   ╔════════════════════════════════╗   │
│  ║ A  HEADER              ║   ║ E  MULTIPLIER LADDER (7 chips) ║   │
│  ║ Logo • Time • Balance ☰║   ║ x1.01  x1.05  x1.1  …          ║   │
│  ╚════════════════════════╝   ╠════════════════════════════════╣   │
│  ╔════════════════════════╗   ║                                ║   │
│  ║ B  MODE TABS           ║   ║                                ║   │
│  ║ [ Manual ] [ Auto ]    ║   ║                                ║   │
│  ╠════════════════════════╣   ║ F  PLAY BOARD                  ║   │
│  ║ C  BET CONFIGURATION   ║   ║   Closed crates with cross-    ║   │
│  ║   Bet Amount + ½ 2X Max║   ║   straps; click to reveal      ║   │
│  ║   Potential Win bar    ║   ║                                ║   │
│  ║   Grid Size 25/36/49/64║   ║                                ║   │
│  ║   Number of Mines      ║   ║                                ║   │
│  ║   Advanced (Auto only) ║   ║                                ║   │
│  ╠════════════════════════╣   ║                                ║   │
│  ║ D  PRIMARY ACTION CTA  ║   ║                                ║   │
│  ║   Start / Cashout / Stop║   ║                                ║  │
│  ╚════════════════════════╝   ╚════════════════════════════════╝   │
│  G  FOOTER — Provably Fair • Version 1.0.0 • client clock          │
└─────────────────────────────────────────────────────────────────────┘
```

| Region | What it is | What it controls |
| --- | --- | --- |
| **A** | Header bar | Skin identity, current time, player balance, menu |
| **B** | Mode tabs | Switches between Manual and Auto play |
| **C** | Bet configuration panel | All round inputs: stake, grid, mines, (auto-only) advanced rules |
| **D** | Primary action button | Single, state-changing CTA; label/colour depend on game state |
| **E** | Multiplier ladder | Read-only preview of the next 7 multipliers given the configuration |
| **F** | Play board | The grid of crates the player interacts with |
| **G** | Footer strip | Provably-fair badge, version, client clock |

The two default-state captures (`aviator-minescape-default-screen.png` and `default-state.png`) show the screen pre-input. They are visually identical because the screen is stateless until the user starts interacting.

---

## 4. The Header Bar

### Logo

![Aviator skin — header reading 17:21, balance 20000 GEL](/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png)

Far left. Indicates skin (Minescape or Aviator). No interactive behaviour on the logo itself.

### Clock

A four-digit `HH:MM` reading sits next to the logo (`17:21`, `17:23`, `17:37`, `18:09`, `18:14`, `18:15`, `18:32` observed across captures). It tracks the **client clock**. It is not a countdown, not a round timer, not a session timer. The same time is mirrored in the footer.

### Balance

`XXXX GEL`. This is the canonical source of truth for the player's available funds on the platform.

- Captures on the Minescape skin show `1000 GEL` and `999 GEL` (after a 1 GEL bet is placed).
- Captures on the Aviator skin show `20000 GEL`.

Balance updates **on stake** (decrements when bet is placed) and **on resolution** (increments on Cashout or autobet payout). It does not update on each reveal.

### Burger menu (`☰`)

Far right. Opens the slide-in menu — see §13.

---

## 5. Mode Selector — Manual vs Auto

A two-button segmented control sits at the top of the bet configuration panel. The unselected option is dimmed; the selected option has a brighter background.

**Manual** — the player clicks each crate and presses Cashout themselves.

**Auto** — the engine plays rounds on a loop using the player's pre-selected tiles and configured rules (see §10–§12).

The mode tabs are **locked** while:

- A Manual bet is staked (round in progress).
- An autobet loop is running.

Switching modes preserves Bet Amount, Grid Size, and Number of Mines.

---

## 6. The Bet Amount Field

The Bet Amount field is the first input in the bet configuration panel. It controls the only money at risk in the round.

### Format

Field reads `GEL X,XX`. The decimal separator is a **comma** (European/Georgian convention). So `GEL 1,00` is one Lari, not one hundred.

### Direct evidence (Aviator skin, 25/1 default, 20,000 GEL balance)

| Bet field | Potential Win | Ratio | Modifier used | Screenshot |
| --- | --- | --- | --- | --- |
| `GEL 5,00` | `GEL 121.25` | 24.25× | `½` | `aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png` |
| `GEL 10,00` | `GEL 242.50` | 24.25× | (typed) | `aviator-minescape-bet-10-gel-potential-win-242-50.png` |
| `GEL 100,00` | `GEL 2425.00` | 24.25× | (typed) | `aviator-minescape-bet-100-gel-potential-win-2425.png` |
| `GEL 400,00` | `GEL 9700.00` | 24.25× | `Max` | `aviator-minescape-max-bet-selected-400-gel.png` |

This is direct evidence that the Potential Win is `bet × ceiling multiplier`, where the ceiling multiplier is a property of the grid+mines configuration alone (here 24.25× for 25/1).

### How to change it

1. Tap the field and type. Numeric keyboard on mobile; physical keyboard on desktop.
2. Use a quick-modifier chip: `½`, `2X`, `Max` (see §7).
3. The bet does not lock in until the green CTA is pressed; until then it is freely editable.

### Minimum bet

The smallest stake captured anywhere in the evidence is `GEL 1,00`. The engine-side hard minimum is operator-configured. ⚠ Confirm with engineering.

### Maximum bet

The `Max` chip on the Aviator skin (20,000 GEL balance) caps at `GEL 400,00`. This is **not** a balance dump and **not** the engine maximum — it is an operator-configured per-bet ceiling. See §7 for the full breakdown.

---

## 7. Quick Modifier Chips — ½ / 2X / Max

To the right of the Bet Amount field sit three modifier chips. They are the fastest way to adjust the stake between rounds.

### `½` halves the current bet

![½ chip outlined in blue after being tapped — bet field reads 5,00](/images/minescape/aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png)

Tap once: value halves. Tap again: halves again. The chip outlines in blue to confirm it was the last input.

### `2X` doubles the current bet

Mirror of `½`. No standalone capture exists for the post-2X state, but the linear behaviour is confirmed by the bet/Potential-Win evidence in §6.

### `Max` clamps to the operator ceiling — NOT the balance

![Max chip outlined in blue — bet field reads 400,00 against a 20000 GEL balance](/images/minescape/aviator-minescape-max-bet-selected-400-gel.png)

This single screenshot is the most important Max-button evidence in the asset folder. The balance reads `20000 GEL`. The Bet Amount field after pressing Max reads `GEL 400,00`. If Max meant "all-in," the field would read `GEL 20000,00`. It does not.

**Operator/account-manager rule:** Never describe Max as "all-in" or "your full balance." It is the **operator-configured per-bet ceiling** and is a player-safety feature.

To bet above the Max ceiling, the player must type the amount manually, and the engine may still refuse it if it exceeds a hard limit. ⚠ Confirm exact source of the cap with engineering (operator config, VIP tier, regulator floor, or game engine).

---

## 8. The Potential Win Helper Bar

Immediately below the Bet Amount row sits a thin blue informational bar with an `ⓘ` icon and the text `Potential Win: GEL X.XX`.

### What it tells the player

The maximum payout the current configuration can produce, assuming the player reveals **every** safe tile without hitting a mine. It is the absolute ceiling — the best possible outcome for this round.

### What it does **not** tell the player

- It is **not** the payout of the next click.
- It is **not** an expected value. The probability of reaching the ceiling falls off steeply with each safe reveal.
- It is **not** the cashout multiplier — that is shown on the Cashout button during a live round.

### Formula

From the §6 evidence: `Potential Win = Bet Amount × Ceiling Multiplier`, where Ceiling Multiplier depends only on Grid Size and Number of Mines. The stake never affects probability — it is a linear payout multiplier.

### Recomputation

The bar updates instantly when **any** of Bet Amount, Grid Size, or Number of Mines changes. Captures across all four grid sizes confirm this.

---

## 9. Grid Size

The Grid Size row offers four chips: `25`, `36`, `49`, `64`.

| Chip | Board shape | Total crates | Screenshot |
| --- | --- | --- | --- |
| `25` | 5 × 5 | 25 | `aviator-minescape-grid-size-25-mines-3.png` |
| `36` | 6 × 6 | 36 | `aviator-minescape-grid-size-36-mines-2.png` |
| `49` | 7 × 7 | 49 | `aviator-minescape-grid-size-49-mines-3.png` |
| `64` | 8 × 8 | 64 | `aviator-minescape-grid-size-64-mines-4.png` |

Tap any chip and the board re-renders to that grid immediately. There is no commit step. **Switching the grid also changes the Number-of-Mines preset row** (see §10).

### Grid 25 — 5×5

![Grid 25 with 3 mines preset selected — 5×5 board](/images/minescape/aviator-minescape-grid-size-25-mines-3.png)

### Grid 36 — 6×6

![Grid 36 with 2 mines preset — 6×6 board](/images/minescape/aviator-minescape-grid-size-36-mines-2.png)

### Grid 49 — 7×7

![Grid 49 with 3 mines preset — 7×7 board](/images/minescape/aviator-minescape-grid-size-49-mines-3.png)

### Grid 64 — 8×8

![Grid 64 with 4 mines preset — 8×8 board](/images/minescape/aviator-minescape-grid-size-64-mines-4.png)

---

## 10. Number of Mines

Below Grid Size sits the Number of Mines row. It contains four preset chips plus a `Custom` chip. **The preset chips change every time the grid changes** — they are hand-picked per grid by the designers.

### Preset chips by grid (directly observed)

| Grid | Preset chips offered | Custom max placeholder seen |
| --- | --- | --- |
| 25 | `1` · `3` · `5` · `10` · `Custom` | `24` |
| 36 | `2` · `5` · `10` · `15` · `Custom` | `35` |
| 49 | `3` · `10` · `15` · `30` · `Custom` | ⚠ Not captured |
| 64 | `4` · `15` · `25` · `35` · `Custom` | ⚠ Not captured |

The `Custom` field placeholder is `grid − 1` on the grids we observed (24 on 25, 35 on 36). This is consistent with "at least one tile must remain safe." ⚠ Confirm with engineering for grids 49 and 64.

### Grid 25 — mine variants

| Mines | Multiplier ladder (first 6 values) | Screenshot |
| --- | --- | --- |
| 1 (default) | x1.01, x1.05, x1.10, x1.15, x1.21, x1.28 | `aviator-minescape-default-screen.png` |
| 3 | x1.10, x1.26, x1.45, x1.68, x1.96, x2.30 | `aviator-minescape-grid-size-25-mines-3.png` |
| 5 | x1.21, x1.53, x1.96, x2.53, x3.32, x4.43 | `aviator-minescape-grid-size-25-mines-5.png` |
| 10 | x1.62, x2.77, x4.90, x8.99, x17.16, x34.32 | `aviator-minescape-grid-size-25-mines-10.png` |
| 24 (custom) | (ladder did not refresh — see §11 note) | `aviator-minescape-grid-size-25-mines-custom-placeholder-24.png` |

### Grid 36 — mine variants

| Mines | Multiplier ladder (first 6 values) | Screenshot |
| --- | --- | --- |
| 2 | x1.03, x1.09, x1.16, x1.23, x1.31, x1.40 | `aviator-minescape-grid-size-36-mines-2.png` |
| 5 | x1.13, x1.31, x1.54, x1.82, x2.15, x2.57 | `aviator-minescape-grid-size-36-mines-5.png` |
| 10 | x1.34, x1.88, x2.66, x3.82, x5.56, x8.21 | `aviator-minescape-grid-size-36-mines-10.png` |
| 15 | x1.66, x2.91, x5.21, x9.55, x17.97, x34.82 | `aviator-minescape-grid-size-36-mines-15.png` |
| 35 (custom) | (ladder did not refresh — see §11 note) | `aviator-minescape-grid-size-36-mines-custom-placeholder-35.png` |

### Grid 49 — observed only at 3 mines

| Mines | Multiplier ladder (first 6 values) |
| --- | --- |
| 3 | x1.03, x1.10, x1.18, x1.26, x1.35, x1.45 |

### Grid 64 — observed only at 4 mines

| Mines | Multiplier ladder (first 6 values) |
| --- | --- |
| 4 | x1.03, x1.10, x1.18, x1.26, x1.35, x1.45 |

> The 49/3 and 64/4 ladders are essentially identical to six decimal places. This is consistent with both configurations having a near-identical safe-tile ratio (46/49 ≈ 0.939 vs 60/64 = 0.9375). It is **not** a bug.

### Operator/account-manager rule

The mine presets are a design choice, not a player limit. The `Custom` field always exists as the escape valve. Never tell an operator "you only get four mine counts per grid."

---

## 11. The Multiplier Ladder

The horizontal row of chips at the very top of the play board is the multiplier ladder.

### Anatomy

- **Seven visible chips** on every capture.
- Each chip reads `x N.NN` (or `X N` when truncated at the right edge — a UI concern, see below).
- Chips are read **left-to-right** in the order safe reveals will award them.

### Behaviour during a round

The chip representing the current multiplier highlights yellow:

![First safe reveal — chip x1.01 lit yellow, Cashout reads GEL 1.01](/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png)

- Leftmost chip (`x1.01`) is highlighted yellow.
- One crate is revealed as safe (small green icon).
- The Cashout button now reads `GEL 1.01` for a 1.00 GEL stake.

### Ladder values are configuration-dependent

Compare the leftmost chip across configurations:

- `25 / 1` → x1.01 (gentle)
- `25 / 10` → x1.62 (explosive)
- `36 / 15` → x1.66 (explosive)
- `49 / 3` → x1.03 (gentle)

The ladder reshapes itself instantly when grid or mines change. The Potential Win bar recomputes alongside.

### Known UI observations to surface to engineering

1. **The 7th chip clips on the right.** In several captures it reads `X 1`, `X 2`, `X 3`, `X 6`, `X 7` (no decimals visible). ⚠ Confirm whether the value is truncated only visually or actually rounded; confirm pagination/scroll behaviour past chip 7 on long rounds.
2. **The ladder appears stale on the Custom captures (`25 / Custom = 24` and `36 / Custom = 35`).** Both show the ladder of the previously-selected preset. This is likely a render lag where the ladder updates only after the Custom value is committed (focus lost, Enter pressed, etc.). ⚠ Confirm with engineering whether this is intended.

---

## 12. The Primary Action CTA (one button, six labels)

The wide button at the bottom of the side panel is the only button that ever drives the round forward.

| Game state | Button label | Colour | Evidence |
| --- | --- | --- | --- |
| Default — Manual (Minescape skin) | `Start Mission` | Green | `aviator-minescape-default-screen.png` |
| Default — Manual (Aviator skin) | `Start Bet` | Green | `aviator-minescape-bet-10-gel-potential-win-242-50.png` |
| Bet placed, no reveals | `Cashout GEL 0.00` + dice ◇ | Yellow | `aviator-minescape-bet-placed-hover-tile.png` |
| Bet placed, reveals in progress | `Cashout GEL X.XX` + dice ◇ | Yellow | `aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png` |
| Default — Auto | `Start Autobet` | Green | `aviator-minescape-auto-mode-selected-tiles-start-autobet.png` |
| Autobet running | `Stop Autobet` (+ counter) | Red | `aviator-minescape-auto-mode-win-state-infinite-rounds.png` |

**Reading the button before tapping is the single most important player habit.** Tapping `Cashout` in a Manual round ends it in a win; tapping `Stop Autobet` halts the loop.

---

## 13. The Burger Menu

Tap the `☰` icon to open a slide-over panel that overlays the bet configuration. The full menu requires scrolling.

### Top half

![Burger menu open — username T*****E with edit pencil, Sound / Music / Dark mode toggles, My Bets link](/images/minescape/aviator-minescape-burger-menu-open.png)

From top to bottom of the visible area:

- Skin logo (`Aviator` in this capture).
- Time and balance preserved.
- Mode tabs (still visible behind the menu).
- Bet/Grid/Mine controls (preserved behind the menu).
- A profile row: avatar + `T*****E` (masked username) + pencil edit icon.
- Toggle: **Sound** (on, green track).
- Toggle: **Music** (on, green track).
- Toggle: **Dark mode** (on, green track).
- Link row: **My Bets** with a chevron `›`.
- `X` close affordance in the top-right of the menu.

### Bottom half (after scrolling)

![Burger menu scrolled — reveals Rules and Limits below My Bets](/images/minescape/aviator-minescape-burger-menu-scrolled.png)

- `Music` and `Dark mode` toggles still visible.
- Link row: **My Bets**.
- Link row: **Rules**.
- Link row: **Limits**.

### Complete menu order (top → bottom)

1. Profile (username + edit)
2. Sound (toggle)
3. Music (toggle)
4. Dark mode (toggle)
5. My Bets (link)
6. Rules (link)
7. Limits (link)

### Toggle behaviour

All three toggles default to **on** in the captured state. Persistence scope (per session / per device / per account) is not visible from the captures. ⚠ Confirm with engineering.

### Link destinations

- **My Bets** — round-by-round bet history.
- **Rules** — operator-published canonical game rules. Authoritative over any player-facing copy.
- **Limits** — responsible-play limits (daily/weekly/monthly caps, session-time limits, self-exclusion). ⚠ Confirm regulator-required additions per market.

---

## 14. Footer Strip — Provably Fair / Version / Clock

The bottom strip of the bet panel contains three pieces of information:

- **Green shield icon** + text `Provably Fair Game`.
- **Version number** `Version 1.0.0` (engine build).
- **Client clock** mirroring the header.

### Provably Fair — what it actually means

The engine uses a cryptographic commit-reveal protocol for round outcomes. Before the round, the engine commits (publishes a hash). After the round, the engine reveals the inputs and the player can independently verify the hash matches. Mine positions cannot retroactively change.

The badge is the entry point to the verification page. Destination URL is operator-configured and must be live before a launch. ⚠ Confirm destination URL with the operator before publishing player-facing copy that links to it.

---

## 15. Manual Mode — End-to-End Round Flow

### 15.1 The Loading Screen (asset: `loading-screen.mov`)

The game opens with a short animated loader (a video file, not a still frame). There is no interaction during loading. The loader plays once per session and the player drops into the Default Screen with Manual pre-selected. ⚠ Confirm low-bandwidth fallback behaviour with engineering.

### 15.2 Default Screen → Setup

Player sets Bet Amount, Grid Size, Number of Mines. The Potential Win bar updates with every change.

### 15.3 Pressing Start Bet / Start Mission

At the moment the CTA is pressed:

1. The bet amount is **debited immediately** from the balance (header shows the new total).
2. The bet/grid/mines controls **lock and dim**.
3. The green CTA is replaced by a **yellow Cashout button** reading `Cashout GEL 0.00`, with a **small dice icon `◇`** to its right.
4. The board becomes interactive.

### 15.4 Bet-placed state

![Bet placed — balance dropped to 999, controls dimmed, yellow Cashout 0.00 with dice icon, cursor hovering a crate (yellow highlight)](/images/minescape/aviator-minescape-bet-placed-hover-tile.png)

What is observable in this single capture:

- Header balance is `999 GEL` (down from `1000` — a `1.00 GEL` bet was staked).
- Bet/Grid/Mine controls are dimmed (visual lock).
- Yellow `Cashout GEL 0.00` button with dice `◇` icon at the right.
- One crate on the board has a **yellow glow** indicating cursor hover.

A second capture, `bet-placed-hover-on-a-box.png`, shows the same state with a different crate hovered.

### 15.5 Pre-bet click is a no-op (GIF evidence)

`clicking-on-box-while-bet-isn-t-placed.gif` shows what happens if the player taps a crate **before** placing a bet: nothing. Crates are non-interactive until the bet is staked. This is the engine's protection against accidental clicks being misread as commits.

### 15.6 First safe reveal

![First safe reveal — small green money-bag icon, x1.01 chip lit yellow, Cashout GEL 1.01](/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png)

- Crate opens to show a **small green money-bag icon**.
- First multiplier chip (`x1.01`) highlights yellow.
- Cashout button updates from `GEL 0.00` → `GEL 1.01` (live, equal to `bet × current multiplier`).
- Header balance is **unchanged** (`999 GEL`). The balance only updates on round resolution.

### 15.7 Multiple safe reveals

![Multiple tiles open — multiple green crates, more ladder chips lit, Cashout amount higher](/images/minescape/aviator-minescape-multiple-tiles-open-cashout-active.png)

- Several crates open with green icons.
- The lit chip on the ladder advances by one position per safe reveal.
- The Cashout amount climbs.
- The number of open crates **equals** the index of the lit chip (1 crate ↔ chip 1, 2 ↔ chip 2, etc.).

### 15.8 The dice button during a round

A small dice icon `◇` sits to the right of the live Cashout button. Tapping it instructs the engine to reveal **one** tile chosen at random. The result is treated identically to a hand-clicked reveal — safe = advance, mine = end round. The dice does **not** cash out and does **not** reveal multiple tiles per tap.

### 15.9 Pressing Cashout (the win path)

When the player taps the yellow Cashout button:

1. The round ends.
2. The amount shown on the button is credited to the balance immediately.
3. The bet/grid/mine controls re-enable.
4. The green `Start Bet` / `Start Mission` button returns.

The Cashout button is **available the moment the bet is staked** — even when it reads `GEL 0.00`. Pressing it before any reveal forfeits the stake with no payout, which is a strange thing to do but is not prevented.

### 15.10 Hitting a mine (the loss path)

![Lose state — red bomb revealed on the board, panel returned to default, green Start Mission visible](/images/minescape/aviator-minescape-lose-state-mine-revealed.png)

- A clicked crate opens to show a **red mine icon**.
- The round ends instantly. The stake (already debited) is forfeited.
- The bet panel **snaps back to default** — the green `Start Mission` / `Start Bet` button is back, controls re-enable.
- Previously revealed safe crates and the mine remain on display behind the panel during the brief reset.

There is no "continue," no "save my round," no "mark-the-mine" mechanic. A new round re-randomises mine positions on the next Start press.

---

## 16. Auto Mode — End-to-End Loop Flow

Switching to Auto reshapes the configuration panel: an `Advanced Settings` row appears between the Mines row and the CTA, and the CTA changes to green `Start Autobet`.

![Auto mode setup — Advanced Settings row visible, green Start Autobet CTA](/images/minescape/screenshot-2026-05-29-at-18-30-03.png)

### 16.1 Tile pre-selection (manual)

In Auto, the player marks which crates the engine should open on every round. Tap a crate to mark it (small green icon appears, crate stays closed). Tap again to unmark.

![Auto mode — multiple tiles marked, green Start Autobet ready](/images/minescape/aviator-minescape-auto-mode-selected-tiles-start-autobet.png)

- Several crates show a green money-bag icon **while still appearing closed** (this is the "marked" state).
- The Advanced Settings row sits above the green `Start Autobet` CTA.

### 16.2 Tile pre-selection (dice randomize)

Tap the dice icon in the CTA area to let the engine pick the marks for you.

![Auto mode — random tile selection produced by the dice button, Advanced Settings panel expanded](/images/minescape/aviator-minescape-auto-mode-random-tile-selection.png)

- The board now shows a random spread of green-marked crates.
- Re-tapping the dice rerolls the selection.

⚠ The exact count of crates the dice marks (fixed share of the grid, configurable, weighted by mines, etc.) is not directly inferable from the captures. Confirm with engineering.

### 16.3 The Advanced Settings panel

Tap the `Advanced Settings` row to expand it:

![Advanced Settings panel — six fields visible, green Start Autobet at bottom](/images/minescape/aviator-minescape-auto-mode-advanced-settings.png)

Six fields arranged in three rows of two:

| Row | Left | Right |
| --- | --- | --- |
| 1 | **Payout On Win** (multiplier target) | **Number Of Bets** (round counter, `∞` available) |
| 2 | **On Win** (Reset / Increase by %) | **On Loss** (Reset / Increase by %) |
| 3 | **Stop On Profit** (GEL) | **Stop On Loss** (GEL) |

Other captures of the same panel:

- `advance-settings.png` and `advanced-settings.png` — alternate captures of the panel mid-configuration.

### 16.4 Payout On Win

The multiplier at which a round auto-cashes out. Format `N.NNx`. As soon as the engine has revealed enough safe crates to reach the target multiplier, the round closes for the win and the next round begins.

⚠ Confirm with engineering whether Payout On Win is:

- a **floor** (cash out at first multiplier ≥ target), or
- a **ceiling** (never exceed target even if the player marked more crates), or
- both (and how it interacts with the pre-selected tile count).

### 16.5 Number Of Bets

How many rounds the loop will play before ending naturally. Accepts a whole number or `∞`.

Counter format observed on the red Stop Autobet button: `remaining` / `total` (for example `2/8`, `2/10`, `2`, `0`). The button always shows the remaining-rounds count while the loop is live.

### 16.6 On Win — Reset / Increase by X%

What to do with the next round's stake **after a winning round**.

- **Reset** — next bet returns to the original starting bet.
- **Increase by X%** — next bet becomes `current × (100 + X) / 100`.

![On Win = Increase by 5%, Number Of Bets = 10, mid-session win popup on board, red Stop Autobet button shows remaining counter](/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png)

- `On Win` reads `Increase by 5%`.
- `Number Of Bets` reads `10`.
- A floating green payout popup is visible on the board (`GEL 1.91 +1.926` style).
- The CTA is red `Stop Autobet` with the remaining-rounds counter on the right.

**Strategic note (for account managers):** Increase-on-Win is a trend-following pattern. It is not a guaranteed strategy. There is no system-side enforcement that the percentage is "safe" — it is the player's choice.

### 16.7 On Loss — Reset / Increase by X%

What to do with the next round's stake **after a losing round**.

- **Reset** — next bet returns to the original starting bet.
- **Increase by X%** — next bet becomes `current × (100 + X) / 100`.

![On Loss = Increase by 20%, autobet not yet started, green Start Autobet CTA visible](/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png)

- `On Loss` reads `Increase by 20%`.
- The CTA is still the green `Start Autobet` — the loop has been configured but not yet started.

**Risk note (must surface to operators and to account managers):** Increase-on-Loss is the classic Martingale pattern. Consecutive losses compound the stake rapidly. The captures show the engine does not prevent the player from configuring this; the only safety net is **Stop On Loss** (next section). When discussing Auto Mode with a client, account managers must not present Increase-on-Loss as a "recovery system" or imply it is risk-free.

### 16.8 Stop On Profit / Stop On Loss

Two GEL thresholds that bound the session.

![Stop On Profit = 10 GEL, Stop On Loss = 20 GEL, green Start Autobet CTA](/images/minescape/aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png)

- `Stop On Profit` = `10` (GEL).
- `Stop On Loss` = `20` (GEL).

Both are measured against **cumulative session profit/loss** — the net change since the player pressed `Start Autobet`. They reset to zero every time a new autobet session begins. ⚠ Confirm with engineering: are these strict floors, or do they trigger at the next round boundary? The captures imply round-boundary checks (the round in flight finishes, then the loop halts).

### 16.9 Pressing Start Autobet — the loop is live

The moment the green CTA is tapped:

- The green button is replaced by a **red `Stop Autobet`** with the remaining-rounds counter.
- Bet/Grid/Mine/Tile-selection controls all lock.
- The engine begins playing rounds in sequence.

### 16.10 A winning round inside autobet

![Autobet win state — green payout popup on the board (GEL 122.80 +1.526 style), red Stop Autobet still live](/images/minescape/aviator-minescape-auto-mode-win-state-infinite-rounds.png)

A floating popup on the board shows the round's result. The popup typically contains two numbers:

- The **payout** (total GEL credited).
- The **profit** (payout minus stake), prefixed `+`.

Second confirming capture: `screenshot-2026-05-29-at-18-28-59.png`, showing a similar popup format `GEL 30.30 +2.928`.

After a winning round the engine immediately continues with the next round, applying the `On Win` rule to compute the next stake and decrementing the bet counter.

### 16.11 A losing round inside autobet — loop continues

![Autobet lose state — red bomb visible on the board, red Stop Autobet button still live and counter still running](/images/minescape/aviator-minescape-auto-mode-lose-state-continues.png)

This is the single most important Auto-mode capture. A losing round does **not** halt the loop. The engine moves on, applies the `On Loss` rule to compute the next stake, and starts the next round.

The only things that halt the loop are the four conditions in §16.12.

### 16.12 The exactly four ways autobet ends

1. **Player taps `Stop Autobet`** — engine finishes the current in-flight round and halts.
2. **Stop On Profit threshold met** — cumulative session profit ≥ configured GEL.
3. **Stop On Loss threshold met** — cumulative session loss ≥ configured GEL.
4. **Number Of Bets counter hits zero** — last configured round finishes and the loop halts naturally.

A single losing round is **not** a halt condition — this is explicitly confirmed by `aviator-minescape-auto-mode-lose-state-continues.png`.

When the session ends, the panel returns to its Auto setup state with the green `Start Autobet` CTA ready for the next session. The player's configured rules **persist** — they don't have to be re-entered.

---

## 17. Operator Reference Matrix

A compact, evidence-bound table. Every "✅ Confirmed" row is directly visible in a screenshot.

| Topic | Status | What's visible / required | Source |
| --- | --- | --- | --- |
| Currency | ✅ Confirmed | `GEL` (Georgian Lari) | All captures |
| Decimal format | ✅ Confirmed | Comma decimal, `GEL X,XX` in bet field; period in helper bars (`GEL X.XX`) | Multiple captures |
| Min bet observed | ✅ Confirmed at `GEL 1,00` | Lowest stake in any capture | Default-screen Minescape skin |
| Max-button cap observed | ✅ Confirmed at `GEL 400,00` on 20,000 balance | Max chip clamps to operator ceiling | `aviator-minescape-max-bet-selected-400-gel.png` |
| Grid sizes | ✅ Confirmed | 25, 36, 49, 64 | Four grid captures |
| Mine presets per grid | ✅ Confirmed for 25, 36, 49, 64 | See §10 table | Four grid captures |
| Custom max placeholder | ✅ Confirmed `24` on 25, `35` on 36 | "Grid − 1" pattern | Custom captures |
| Custom max for 49 and 64 | ⚠ Not captured | Likely 48 and 63 | Confirm with engineering |
| Multiplier ladder | ✅ Confirmed 7 chips | 7th chip clips visually on the right | All ladder captures |
| Ladder pagination/scroll past chip 7 | ⚠ Not captured | Behaviour on long rounds unknown | Confirm with engineering |
| Ladder refresh on Custom | ⚠ Bug suspected | Custom captures show stale ladder | Confirm with engineering |
| Potential Win formula | ✅ Confirmed | `bet × ceiling multiplier`, linear in stake | Four bet captures at 25/1 |
| Round commit timing | ✅ Confirmed | Stake debits on Start, balance updates on resolution | Bet-placed captures |
| Bet-placed lock | ✅ Confirmed | Bet/grid/mine controls disabled while live | Bet-placed and live captures |
| Pre-bet click no-op | ✅ Confirmed | Crates non-interactive without bet | `clicking-on-box-while-bet-isn-t-placed.gif` |
| Cashout always available | ✅ Confirmed | Available even at `GEL 0.00` | Bet-placed captures |
| Dice button (Manual) | ✅ Confirmed exists | Reveals one tile at random | Bet-placed captures |
| Dice button (Auto) | ✅ Confirmed exists | Randomizes tile selection | Auto-random capture |
| Dice tile-count rule (Auto) | ⚠ Not captured | Fixed share / configurable? | Confirm with engineering |
| Skins | ✅ Confirmed | Minescape (`Start Mission`) · Aviator (`Start Bet`) | Two-skin captures |
| Full approved-skin list | ⚠ Not in evidence | Only two skins observed | Confirm with engineering |
| Auto modes — Payout On Win | ✅ Confirmed exists | Numeric `N.NNx` field | Advanced Settings captures |
| Payout On Win interpretation | ⚠ Not captured | Floor / ceiling / both? | Confirm with engineering |
| Auto — Number Of Bets | ✅ Confirmed | Integer or `∞` | Advanced Settings captures |
| Auto — On Win | ✅ Confirmed | Reset / Increase by % | Captures show 5% example |
| Auto — On Loss | ✅ Confirmed | Reset / Increase by % | Captures show 20% example |
| Auto — Stop On Profit / Loss | ✅ Confirmed | GEL thresholds | Stop-condition capture |
| Halt conditions | ✅ Confirmed | Exactly four (see §16.12) | Multiple captures |
| Loss-does-not-halt-loop | ✅ Confirmed | Direct evidence | `auto-mode-lose-state-continues.png` |
| Menu items | ✅ Confirmed | Profile, Sound, Music, Dark mode, My Bets, Rules, Limits | Two burger captures |
| Toggle persistence scope | ⚠ Not captured | Per-session / device / account? | Confirm with engineering |
| Provably Fair badge | ✅ Confirmed | Footer badge, clickable affordance | All captures |
| Provably Fair URL | ⚠ Not captured | Operator-configured destination | Confirm with operator |
| Version | ✅ Confirmed | `Version 1.0.0` | All captures |
| Disconnect/resume behaviour | ⚠ Not captured | Round-seed binding implies safety | Confirm with engineering |
| Reveal-all-mines after loss | ⚠ Partial evidence | Some skins reveal, behaviour varies | Confirm with engineering |
| Sound/Music/Dark default state | ✅ Confirmed | All ON in captures | Burger captures |
| Mobile / touch parity | ⚠ Not captured | Captures are desktop only | Confirm with engineering |

---

## 18. Open Engineering Questions

In priority order, the questions a launching operator must have answered before signing off:

1. **What is the engine-side minimum bet?** Captures show `GEL 1,00` but the engine minimum is not stated.
2. **Where does the Max-button cap come from?** Operator config, VIP tier, regulator floor, or engine constant?
3. **What is the Custom-mines upper bound on grids 49 and 64?** (Likely 48 and 63 by the `grid − 1` pattern, but unconfirmed.)
4. **How does the ladder behave past chip 7 on long rounds?** Scroll, paginate, freeze, hide?
5. **Why does the ladder appear stale on Custom captures?** Render lag, intentional delay, or bug?
6. **Payout On Win — floor, ceiling, or both?** And how does it interact with the pre-selected tile count?
7. **How does the dice button pick the Auto tile selection?** Fixed share, configurable, weighted by mine count?
8. **Do Stop On Profit / Loss check mid-round or at round boundary?** (Round-boundary is implied by the captures.)
9. **Sound / Music / Dark mode persistence scope.** Per session, device, or account?
10. **Disconnect recovery.** Does a dropped connection auto-cashout, resume the round on reconnect, or void the round?
11. **Post-mine reveal behaviour.** Do all unopened crates reveal after a loss, or only on certain skins?
12. **Full approved-skin list.** Are there skins beyond Minescape and Aviator?
13. **Provably Fair verification URL** — where is it hosted per operator? Is it live on every launched skin?
14. **Mobile/touch parity.** Captures are desktop-only. Confirm gestures and viewport scaling.
15. **Localization.** Are all UI strings flagged for translation (especially the Auto labels)?
16. **Limits page contents.** Which responsible-gaming controls are exposed per regulator market?

---

## 19. Account-Manager Talking Points (CAN / CANNOT)

Account managers must avoid making promises the engine does not back. The captures support a precise list.

### ✅ You CAN say

- "Minescape is a crash-and-hold mines game with player-controlled grid size, mine count, and cashout timing."
- "Four grid sizes are available: 5×5, 6×6, 7×7, 8×8."
- "Mine counts are presets per grid plus a Custom field — the player can configure any whole number from at least 1 up to grid − 1." (Confirmed for grids 25 and 36; safe assumption for 49 and 64 pending §18 #3.)
- "The engine is Provably Fair — round results commit before the player interacts."
- "Manual mode is fully player-driven; Auto mode plays a configurable loop with four halt conditions: manual stop, Number Of Bets exhausted, Stop On Profit hit, Stop On Loss hit."
- "Two skins ship today: Minescape (`Start Mission` CTA) and Aviator (`Start Bet` CTA). The engine is identical underneath."
- "Currency in the evidence is GEL; per-locale currency is operator-configurable." (Pending engineering confirmation for full locale list.)
- "The Max button is an operator-configurable per-bet ceiling, not a balance dump." Use the §7 capture as the visual proof.

### ❌ You CANNOT say (without engineering sign-off)

- ❌ "Players win 50%–65% of the time." (No evidence — invented in the older player-guide.)
- ❌ "RTP is X%." (No RTP figure appears in the captures.)
- ❌ "Auto cash-out at 2.0× has an X% win rate." (No engine-side win-rate evidence.)
- ❌ "Max means all-in." (Directly contradicted by `aviator-minescape-max-bet-selected-400-gel.png`.)
- ❌ "Stop after first loss is an Auto stop condition." (Not visible in evidence; the four halt conditions are the only ones.)
- ❌ "AutoBet doubles your bet after a loss by default." (Increase-on-Loss is a player choice; default is Reset behaviour pending engineering confirmation.)
- ❌ "Mines are placed after each click." (Mines are committed at the moment Start is pressed and locked for the round.)
- ❌ "The dice button auto-cashes-out on safe reveals." (It does not; it reveals one tile per tap.)
- ❌ "Players can cancel a bet after pressing Start." (No evidence of cancel — the round is committed.)

### Phrasing to prefer

- Instead of "AutoBet is a strategy that makes you money," say "AutoBet automates the reveal-and-cashout loop and adds hard stop conditions so the player can bound a session."
- Instead of "There is a 1-mine 24-multiplier ceiling," say "On a 25-grid with 1 mine, a perfect run reveals all 24 safe tiles and the ceiling multiplier is 24.25× (evidence: §6 table)."
- Instead of "The game is fair because we say so," say "Each round is provably fair — the engine commits to the result before play and the player can independently verify it."

---

## 20. Canonical String Inventory (for Localization)

Strings that must round-trip cleanly through translation. Preserve technical operators (`x`, `%`, `∞`, `½`) and the comma/period decimal split.

**Identity**

- `Minescape` (Minescape skin wordmark)
- `Aviator` (Aviator skin wordmark)
- `Provably Fair Game`
- `Version 1.0.0`

**Modes**

- `Manual`
- `Auto`

**Bet configuration**

- `Bet Amount`
- `GEL`
- `½`
- `2X`
- `Max`
- `Potential Win`

**Grid & mines**

- `Grid Size`
- `Number of Mines`
- `Custom`

**Primary CTAs**

- `Start Bet` (Aviator skin, Manual)
- `Start Mission` (Minescape skin, Manual)
- `Start Autobet` (Auto)
- `Cashout`
- `Stop Autobet`

**Advanced settings**

- `Advanced Settings`
- `Payout On Win`
- `Number Of Bets`
- `On Win`
- `On Loss`
- `Reset`
- `Increase by`
- `Stop On Profit`
- `Stop On Loss`

**Menu**

- `Sound`
- `Music`
- `Dark mode`
- `My Bets`
- `Rules`
- `Limits`

**Round popups (observed)**

- `GEL X.XX +X.XXX` (payout + profit on the board)

⚠ Georgian, Russian, and Turkish translations require a native Georgian speaker review (per project standards). Do not machine-translate the Auto-mode strings; they are technical and easy to mis-render.

---

## 21. Audit of Prior Docs (for the internal team)

The DocPilot folder already contains three Minescape documents. This master document supersedes the player-guide and complete-guide as the canonical evidence-bound reference. The earlier docs remain useful as drafts, but the following claims **must not** be repeated externally without correction:

### `minescape-player-guide.md` — problems to fix or strip

| Section | Problem | Fix |
| --- | --- | --- |
| §3 Quick Preset Buttons | Describes `Max` as "Go all-in with your entire balance" | False. `Max` is an operator-configured per-bet ceiling. Use §7 capture. |
| §5 Cashing Out — "Confirm your intention" | Implies a confirmation dialog | No confirmation step is visible in the captures. A Cashout tap commits instantly. |
| §6 AutoBet — "Stop on first loss" | Listed as a stop condition | Not in evidence. The four halt conditions are listed in §16.12. |
| §7 Mathematics Behind the Game — "Probability of mine on first reveal: 3/25 = 12%" | Mathematically sound but presented as engine truth | Add caveat: the engine guarantees commit-reveal fairness but never publishes per-reveal probabilities in the UI. |
| §9 Pattern Recognition / Optimal Stopping | EV formulas and "stop here" recommendations | Useful as advice but must not be presented as engine math. |
| §10 The House Edge — "Player Win Rate: Roughly 50–65%" | Invented | Strike. There is no evidence-backed win-rate figure. |
| §10 "Average Multiplier on Winning Rounds: 1.5x–3.0x" | Invented | Strike. |
| Appendix — Recommended Bet Sizes / Multiplier Targets tables | Player-advice that resembles official guidance | Reframe as "example bankroll discipline frameworks" and never as engine recommendations. |

### `minescape-complete-guide.md` — generally accurate, minor flags

| Section | Note |
| --- | --- |
| §11 Multiplier Ladder | Mentions "ladder values may paginate past chip 7" — leave as is, but cross-reference §18 #4 in this document. |
| §22 Auto Mode pre-selection | "Order matters" claim about reveal order — not directly confirmed by captures. Soften to "may affect visual rhythm but does not change odds." |
| §38 Provably Fair clickable affordance | Claims the badge is clickable. The captures don't directly prove this. Soften to "is intended as a verification entry point." |
| §44 Glossary entry "AAAK" | Internal noise — remove from any externally-facing version. |

### `minescape-interface-description.md`

A clean, scoped interface description. No corrections needed. Use it as the short-form companion to this master doc.

### `minescape-media-manifest.json`

Several `alt` values are still filename-style (e.g. `"Screenshot 2026 05 29 at 18.28.59"`). Replace with descriptive alt text taken from §22 (Evidence Index) of this document before public publishing.

---

## 22. Evidence Index — Per-Screenshot Descriptions

Every asset in `public/images/minescape/` with a one-paragraph description of what it shows. Filenames are the canonical reference.

### Setup / default state

- **`aviator-minescape-default-screen.png`** — Minescape skin, balance `1000 GEL`, Manual tab selected, Bet Amount empty, Grid Size `25`, Number of Mines `1`. Ladder shows `x1.01, x1.05, x1.10, x1.15, x1.21, x1.28, X 1[clipped]`. CTA: green `Start Mission`. Footer: `Provably Fair Game · Version 1.0.0 · 17:14`.

- **`default-state.png`** — Visually identical to the default-screen capture above. Minescape skin. Used to confirm the screen is stateless pre-input.

- **`default-screen-with-1000-bet-amount.png`** — Same as default-state, second capture. Filename refers to the 1000-GEL starting balance, not a 1000-GEL bet. Confirms the default-screen layout.

### Bet amount evidence (Aviator skin, 20,000 GEL balance, 25/1)

- **`aviator-minescape-bet-10-gel-potential-win-242-50.png`** — Aviator skin, Bet `GEL 10,00`, Potential Win `GEL 242.50`. Grid `25`, Mines `1`. Ladder: `x1.01, x1.05, x1.1, x1.15, x1.21, x1.28, X 1`. CTA: green `Start Bet`.

- **`aviator-minescape-bet-100-gel-potential-win-2425.png`** — Aviator skin, Bet `GEL 100,00`, Potential Win `GEL 2425.00`. Confirms linear scaling vs the 10 GEL capture.

- **`aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png`** — Aviator skin, Bet `GEL 5,00` (down from 10), Potential Win `GEL 121.25`. The `½` chip is outlined in blue confirming it was the last input.

- **`aviator-minescape-max-bet-selected-400-gel.png`** — Aviator skin, Bet `GEL 400,00`, Potential Win `GEL 9700.00`. The `Max` chip is outlined in blue. Balance is `20000 GEL`, which proves Max ≠ all-in.

### Grid / mines evidence

- **`aviator-minescape-grid-size-25-mines-3.png`** — Grid `25`, Mines `3` selected. Ladder `x1.1, x1.26, x1.45, x1.68, x1.96, x2.3, X 2`. Minescape skin, Bet `GEL 1,00`, Potential Win `GEL 222.05` (≈ 22.2× ceiling; per the capture).

- **`aviator-minescape-grid-size-25-mines-5.png`** — Grid `25`, Mines `5`. Ladder `x1.21, x1.53, x1.96, x2.53, x3.32, x4.43, X 6`.

- **`aviator-minescape-grid-size-25-mines-10.png`** — Grid `25`, Mines `10`. Ladder `x1.62, x2.77, x4.9, x8.99, x17.16, x34.32, X 7`. Most volatile preset on the 25 grid.

- **`aviator-minescape-grid-size-25-mines-custom-placeholder-24.png`** — Grid `25`, Custom field placeholder `24`. Ladder appears unchanged from the previous selection (likely the 25/1 ladder is still displayed) — UI render-lag observation flagged in §11.

- **`aviator-minescape-grid-size-36-mines-2.png`** — Grid `36`, Mines `2`. Ladder `x1.03, x1.09, x1.16, x1.23, x1.31, x1.4, X 1`. Gentlest preset on 36.

- **`aviator-minescape-grid-size-36-mines-2-4916ef.png`** — Duplicate of the 36/2 capture (different filename suffix); same content.

- **`aviator-minescape-grid-size-36-mines-5.png`** — Grid `36`, Mines `5`. Ladder `x1.13, x1.31, x1.54, x1.82, x2.15, x2.57, X 3`.

- **`aviator-minescape-grid-size-36-mines-10.png`** — Grid `36`, Mines `10`. Ladder `x1.34, x1.88, x2.66, x3.82, x5.56, x8.21, X 1[clipped]`.

- **`aviator-minescape-grid-size-36-mines-15.png`** — Grid `36`, Mines `15`. Ladder `x1.66, x2.91, x5.21, x9.55, x17.97, x34.82, X 6[clipped]`. Most volatile preset on 36.

- **`aviator-minescape-grid-size-36-mines-custom-placeholder-35.png`** — Grid `36`, Custom field placeholder `35`. Ladder appears stale (still showing the 36/15 ladder) — same render-lag observation as the 25-Custom capture.

- **`aviator-minescape-grid-size-49-mines-3.png`** — Grid `49`, Mines `3`. Ladder `x1.03, x1.1, x1.18, x1.26, x1.35, x1.45, X 1[clipped]`. Mine presets row reads `3 · 10 · 15 · 30 · Custom`.

- **`aviator-minescape-grid-size-64-mines-4.png`** — Grid `64`, Mines `4`. Ladder near-identical to 49/3 (consistent with safe-ratio parity). Mine presets row reads `4 · 15 · 25 · 35 · Custom`.

### Bet-placed state

- **`aviator-minescape-bet-placed-hover-tile.png`** — Minescape skin, balance `999 GEL` (1 GEL bet staked). Yellow `Cashout GEL 0.00` button with dice `◇` to its right. Bet/grid/mine controls dimmed. One crate yellow-highlighted from cursor hover.

- **`bet-placed-hover-on-a-box.png`** — Same state as above, different crate under hover. Confirms layout.

### Active round — safe reveals

- **`aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png`** — Minescape skin, one crate open showing a small green money-bag icon. Ladder chip `x1.01` highlighted yellow. Cashout button reads `GEL 1.01`. Balance still `999`.

- **`aviator-minescape-multiple-tiles-open-cashout-active.png`** — Multiple green crates open, multiple ladder chips advanced, higher Cashout amount. Confirms multi-reveal progression.

### Manual mode loss

- **`aviator-minescape-lose-state-mine-revealed.png`** — A clicked crate shows a red bomb icon. Panel returned to default with green `Start Mission` CTA. Some previously-safe green crates still visible. Confirms the instant snap-back behaviour.

### Auto mode setup

- **`screenshot-2026-05-29-at-18-30-03.png`** — Auto tab active, collapsed `Advanced Settings` row visible above the green `Start Autobet` CTA. Confirms the Auto layout differs from Manual by exactly two things: the extra row and the CTA label.

- **`aviator-minescape-auto-mode-selected-tiles-start-autobet.png`** — Auto tab, several crates marked with green icons (still closed). Green `Start Autobet` CTA. Demonstrates the hand-tap selection mechanic.

- **`aviator-minescape-auto-mode-random-tile-selection.png`** — Auto tab, dice-randomized selection (random spread of green-marked crates). Advanced Settings panel visible expanded. Green `Start Autobet`.

### Advanced Settings panel

- **`aviator-minescape-auto-mode-advanced-settings.png`** — Expanded panel showing all six fields (Payout On Win, Number Of Bets, On Win, On Loss, Stop On Profit, Stop On Loss). All fields empty/default. Green `Start Autobet` CTA at bottom.

- **`advance-settings.png`** — Auto skin Advanced Settings, mid-configuration. Red `Stop Autobet 4/2` (or similar counter) suggests this was captured after Start was pressed.

- **`advanced-settings.png`** — Companion capture to the above. Same panel layout.

### Advanced settings — On Win rule

- **`aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png`** — `On Win = Increase by 5%`, `Number Of Bets = 10`. Mid-session win popup on the board (`GEL 1.91 +1.926` style). Red `Stop Autobet` with the remaining counter showing.

### Advanced settings — On Loss rule

- **`aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png`** — `On Loss = Increase by 20%`. Green `Start Autobet` CTA (loop not yet started).

### Advanced settings — stop conditions

- **`aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png`** — `Stop On Profit = 10`, `Stop On Loss = 20`. Green `Start Autobet` CTA.

### Autobet runtime

- **`aviator-minescape-auto-mode-win-state-infinite-rounds.png`** — Autobet running, winning round, green payout popup on the board. Red `Stop Autobet` CTA still active. Demonstrates the visual state of an in-flight loop.

- **`screenshot-2026-05-29-at-18-28-59.png`** — Autobet mid-session. Another winning-round popup `GEL 30.30 +2.928` style. Red `Stop Autobet` with counter at the bottom.

- **`aviator-minescape-auto-mode-lose-state-continues.png`** — Autobet, losing round. Red bombs visible on the board. Red `Stop Autobet` button **still active** (loop continues). Single most important capture for the "loss does not halt loop" rule.

### Burger menu

- **`aviator-minescape-burger-menu-open.png`** — Slide-over menu open, Aviator skin. Top half visible: username `T*****E` with edit pencil; Sound, Music, Dark mode toggles all ON; My Bets link below.

- **`aviator-minescape-burger-menu-scrolled.png`** — Same menu scrolled down. Reveals `Rules` and `Limits` link rows below `My Bets`.

### Loaders & GIFs

- **`loading-screen.mov`** — Animated loader, single MOV file. Plays once per session (per the current evidence).

- **`clicking-on-box-while-bet-isn-t-placed.gif`** — Demonstrates that crates are non-interactive before a bet is staked. Tap → no reveal, no state change. Crucial proof of the "pre-bet click is a no-op" rule.

---

## 23. Document Metadata

| Field | Value |
| --- | --- |
| Workspace | Aviator Studio |
| Product | Minescape |
| Document | Minescape Master Documentation |
| Audience | Internal teams, casino operators, aggregators, account managers |
| Status | Authoritative |
| Supersedes | `minescape-player-guide.md` (claims tagged in §21 must not be repeated externally) |
| Companion | `minescape-complete-guide.md` (long-form player narrative; minor flags in §21) |
| Companion | `minescape-interface-description.md` (short-form interface description) |
| Companion | `minescape-media-manifest.json` (alt text needs refresh per §21) |
| Evidence base | `public/images/minescape/` — 37 PNG + 1 GIF + 1 MOV |
| Author | Product |
| Last review | 2026-06-03 |
| Next review | 2026-09-03 |

---

## Appendix A — Quick-reference checklist for account managers

Before every operator/aggregator call, scan this list. If you cannot answer any item, route to engineering before the call.

- [ ] Which skin is the operator branding under (Minescape, Aviator, other)?
- [ ] What is the operator's per-bet ceiling configured for the `Max` button?
- [ ] What is the operator's verified Provably-Fair URL?
- [ ] Which markets / regulators apply, and what changes to the Limits page do they require?
- [ ] Is the operator using GEL only, or other currencies/locales?
- [ ] Has engineering confirmed Payout On Win semantics for this deployment?
- [ ] Has the operator been briefed that `Increase by X%` on Loss compounds and that Stop On Loss is the only engine-side safety net?
- [ ] Has the operator been briefed that the Cashout button is available at `GEL 0.00` (i.e. a player can tap-forfeit)?
- [ ] Has the operator confirmed the disconnect-recovery behaviour they expect?
- [ ] Are mobile/touch parity acceptance criteria signed off?

If every box is ticked, the operator conversation can be evidence-bound and risk-managed.

---

## Appendix B — One-sentence answer to "What is Minescape?"

> Minescape is a player-paced mines game where the player stakes GEL, chooses a 25/36/49/64 grid and a mine count, opens crates one at a time to climb a configuration-determined multiplier ladder, and cashes out at any moment before hitting a mine — with an Auto mode that runs the same loop on rules (Payout On Win, Number Of Bets, On Win, On Loss, Stop On Profit, Stop On Loss) and a Provably-Fair commit-reveal protocol underneath.

Account managers can paste this sentence verbatim into operator decks.
