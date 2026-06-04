# Minescape Interface Description

Date: 2026-05-28
Product: Minescape
DocPilot document type: Game interface description
Status: Review draft
Owner: Product
Audience: Product, UI/UX, QA, support, localization, and operator documentation teams
Taxonomy: gameplay, ui, interface-description, mines, autobet

## 1.0 DocPilot Content Frame

This document describes the desktop Minescape play interface from the supplied screen evidence. It follows DocPilot content architecture: product scoped, document typed, section based, audience tagged, localization ready, and prepared for CMS review.

| Field | Value |
| --- | --- |
| Workspace | Aviator Studio |
| Product | Minescape |
| Document | Minescape Interface Description |
| Evidence | Desktop screenshot showing the manual/auto configuration panel and 25-tile board. |
| Scope | Interface description only. Gameplay math, RTP, advanced settings, and outcome states require product confirmation. |

## 2.0 Screen Anatomy

| Region | Description |
| --- | --- |
| Header shell | MINESCAPE logo, player balance `960873.84 GEL`, and menu icon. |
| Mode selector | Segmented control for `Manual` and `Auto`; screenshot implies Auto because the primary CTA says `Start Autobet`. |
| Bet configuration | Currency/amount input, quick modifiers `1/2`, `2X`, `Max`, and potential win helper. |
| Game setup | Grid Size presets `25`, `36`, `49`, `64`; Number of Mines presets `1`, `3`, `5`, `10`, `Custom`. |
| Advanced settings | Collapsed row for secondary autobet rules. |
| Primary action row | Green `Start Autobet` button plus compact randomize/dice control. |
| Play board | 5 by 5 crate grid for Grid Size 25; green symbol indicates revealed safe tiles. |

## 3.0 Control Reference

| Control | Observed value/state | Documentation note |
| --- | --- | --- |
| Bet Amount | `GEL 500,00` | Confirm currency precision, min/max, and locale formatting. |
| Potential Win | `GEL 3005.00` | Formula is not inferable from screenshot. |
| Grid Size | `25` selected | Maps to 5 by 5 board. Confirm layouts for 36, 49, and 64. |
| Number of Mines | `1` selected | Confirm allowed custom range per grid size. |
| Advanced Settings | Collapsed | Capture expanded state before final publish. |
| Start Autobet | Enabled | Need stop, pause, failed-start, and completed-sequence states. |
| Randomize | Dice icon | Confirm whether it randomizes tile picks, setup values, or both. |
| Menu | Hamburger icon | Capture entries for account/game-level options. |

## 4.0 Interaction States

1. Setup state: player configures stake, grid size, and mine count.
2. Autobet-ready state: configuration is valid and `Start Autobet` is enabled.
3. Board reveal state: unopened tiles show crates; safe revealed tiles show a green symbol.
4. Boundary states to capture: insufficient balance, invalid bet, invalid custom mine count, stopped autobet, network interruption, mine reveal, win/collect, and loss.

## 5.0 QA And Localization Notes

Localization strings to preserve: `Manual`, `Auto`, `Bet Amount`, `Grid Size`, `Number of Mines`, `Custom`, `Advanced Settings`, `Start Autobet`, `Potential Win`.

Screenshot annotation backlog:

- Add source image asset for the desktop screen.
- Annotate the seven screen regions named in Section 2.
- Add separate captures for Advanced Settings, menu, manual mode, active autobet, mine reveal, win/collect, and loss states.
- Confirm accessibility labels for icon-only menu and randomize controls.

Open product questions:

1. What is the exact potential win formula for each grid and mine count?
2. What does the randomize/dice control randomize?
3. Which autobet stop conditions exist?
4. What are the custom mine-count ranges?
5. What are the final visual states for successful cashout, mine hit, and interrupted session?
