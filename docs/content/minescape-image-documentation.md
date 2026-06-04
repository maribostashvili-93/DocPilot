# Minescape Image Documentation

**Document Type:** Visual Assets Reference  
**Product:** Minescape  
**Audience:** Documentation Authors, Content Creators, Localization Teams  
**Version:** 1.0  
**Last Updated:** 2026-05-30  
**Status:** Ready for Publication

---

## Overview

This document provides detailed descriptions and contextual information for all Minescape game interface screenshots. Each image is cataloged with:

- **Figure ID** — Unique identifier matching the media manifest
- **Filename** — File path in the public assets directory
- **Visual Description** — What the player sees on screen
- **UI Elements** — Interactive components visible
- **Game State** — Current gameplay status and conditions
- **Use Case** — Where this image appears in documentation
- **Key Details** — Important information or values shown

---

## Part 1: Default States & Setup

### Figure 1: Default Game Screen (Baseline Setup)

**ID:** media-1780067775886-29769d  
**Filename:** `aviator-minescape-default-screen.png`

**Visual Description:**
The initial Minescape interface when a player first loads the game. A clean, uncluttered screen showing the complete setup workflow.

**UI Elements Present:**
- Top bar: Player balance display (prominently positioned)
- Menu icon (hamburger) in top-right
- Bet amount input field (currently blank or default value)
- Quick bet buttons: ÷2, 2X, Max
- Grid size selector with visual buttons (25, 36, 49, 64)
- Mine count selector with buttons (1, 3, 5, 10, Custom)
- Large game board area showing empty 5×5 grid (default view)
- Green "Start Autobet" button (enabled/ready state)
- "Provably Fair" indicator at bottom

**Game State:**
- No active round
- No bet placed
- Grid not populated
- Mines not placed
- Awaiting player configuration

**Use Case:**
- Section 2.0 (Getting Started)
- Tutorial introduction
- Visual reference for interface layout
- Player onboarding guide

**Key Details:**
- Shows default 25-tile grid (5×5)
- Shows all control elements and their positions
- Demonstrates clean, user-friendly interface design
- No active gameplay elements visible

---

### Figure 2: Default State (Alternative View)

**ID:** media-1780070218080-555b83  
**Filename:** `default-state.png`

**Visual Description:**
A simplified default state view, focusing on the game board and bet setup panel.

**UI Elements Present:**
- Clean grid view with unopened tiles
- Bet configuration section
- Start button ready
- Game board takes up majority of screen real estate

**Game State:**
- Ready for bet placement
- No active round
- Grid visible but inactive

**Use Case:**
- Alternative view of starting interface
- Mobile or compact layout reference
- Grid visualization without full UI

---

### Figure 3: Default Screen with 1000 GEL Bet

**ID:** media-1780065670756-f2545a  
**Filename:** `default-screen-with-1000-bet-amount.png`

**Visual Description:**
Demonstrates the default interface with a specific bet amount (1000 GEL) already entered in the bet field.

**UI Elements Present:**
- Bet field showing "1000"
- Potential win calculation updated accordingly
- All setup controls visible
- Grid ready for play

**Game State:**
- Bet configured but not placed
- Potential winnings calculated (1000 GEL × 1.0x = 1000 GEL)
- Ready to start round

**Use Case:**
- Section 3.0 (Placing Your Bet)
- Example of bet amount entry
- Demonstration of potential win calculation
- Shows numeric input capability

**Key Details:**
- Shows 1000 GEL bet amount clearly
- Demonstrates automatic calculation of potential winnings
- Shows "Ready to Start" state

---

## Part 2: Bet Configuration & Amounts

### Figure 4: Bet Placement - Half Bet Button (5 GEL)

**ID:** media-1780065656736-496633  
**Filename:** `aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png`

**Visual Description:**
Shows the result of clicking the ÷2 (Half Bet) button, reducing a previous bet to half its amount.

**UI Elements Present:**
- Bet amount: 5 GEL (displayed in bet field)
- Potential win: 121.25 GEL (calculated at current multiplier)
- Half bet button (÷2) visually highlighted or recently used
- 2X and Max buttons available
- Grid configuration options

**Game State:**
- Bet configured at reduced amount
- Shows 1.00x multiplier (no round active)
- Status: Ready to place bet and start

**Use Case:**
- Section 3.0 (Placing Your Bet) - Quick Preset Buttons subsection
- Demonstrates bet halving functionality
- Recovery round strategy example
- Shows calculation accuracy

**Key Details:**
- 5 GEL bet results in 121.25 GEL potential win (likely from previous round's multiplier context)
- Demonstrates quick adjustment tools
- Useful for bankroll management examples

---

### Figure 5: Bet - 10 GEL (Potential Win 242.50)

**ID:** media-1780065655978-bc6f0b  
**Filename:** `aviator-minescape-bet-10-gel-potential-win-242-50.png`

**Visual Description:**
Standard bet configuration with 10 GEL wager and calculated potential winnings.

**UI Elements Present:**
- Bet amount field: "10 GEL"
- Potential win display: "242.50 GEL"
- All betting preset buttons (÷2, 2X, Max)
- Grid size and mine configuration controls

**Game State:**
- Bet ready to place
- Potential multiplier: 24.25x (calculated from 242.50 ÷ 10)
- Not yet in active round

**Use Case:**
- Section 3.0 (Placing Your Bet) - Example math
- Low-bet conservative strategy
- Demonstrates bet calculation mechanics
- Risk management examples

**Key Details:**
- Shows conservative bet amount (10 GEL)
- High potential multiplier (24.25x) suggests this might be showing a completed round or calculated from game state
- Demonstrates UI clarity for small monetary amounts

---

### Figure 6: Bet - 100 GEL (Potential Win 2425)

**ID:** media-1780065653573-f09200  
**Filename:** `aviator-minescape-bet-100-gel-potential-win-2425.png`

**Visual Description:**
Mid-range bet configuration demonstrating standard play with 100 GEL wager.

**UI Elements Present:**
- Bet amount: "100 GEL"
- Potential win: "2425 GEL"
- Bet preset buttons
- Grid configuration area
- Start button

**Game State:**
- Configured and ready to begin
- Potential multiplier: 24.25x
- No active round

**Use Case:**
- Section 3.0 (Placing Your Bet) - Core example
- Example Math subsection
- Mid-range bankroll strategy
- Standard play demonstration

**Key Details:**
- 100 GEL is a common "standard" bet amount
- 2425 GEL potential win shows the power of multipliers
- Clear example for players calculating their own wins

---

### Figure 7: Maximum Bet - 400 GEL

**ID:** media-1780065658357-8ef3cb  
**Filename:** `aviator-minescape-max-bet-selected-400-gel.png`

**Visual Description:**
Shows the maximum allowable bet being selected, with all controls in place.

**UI Elements Present:**
- Bet amount field: "400 GEL"
- Max button visually highlighted/selected
- Potential win calculation updated
- All configuration controls accessible

**Game State:**
- Maximum bet configured
- Ready to start high-stakes round
- Potential win calculated accordingly

**Use Case:**
- Section 3.0 (Placing Your Bet) - Max bet option
- Risk management and aggressive play examples
- Shows bankroll at its limit
- Demonstrates preset button functionality

**Key Details:**
- 400 GEL is the maximum allowable bet in this game
- Shows successful activation of "Max" button
- Important for demonstrating risk parameters

---

## Part 3: Grid & Mine Configurations

### Figure 8: Grid Size 25 (5×5) - 3 Mines

**ID:** media-1780065661793-005897  
**Filename:** `aviator-minescape-grid-size-25-mines-3.png`

**Visual Description:**
The 5×5 grid (25 tiles) with 3 mines configured. Tiles are unopened, showing as crate icons.

**UI Elements Present:**
- 5×5 grid layout clearly visible
- All 25 tiles in closed/unopened state
- Mine count indicator: "3 Mines"
- Grid size indicator: "25 Tiles"
- Bet configuration panel
- Start button ready

**Game State:**
- Pre-round setup
- Mines placed but hidden
- Board ready for first click

**Use Case:**
- Section 2.0 (Getting Started) - Choose Your Grid subsection
- Grid Size Reference Table visual
- Standard beginner configuration
- Mine Configuration Guide reference

**Key Details:**
- 3 mines = 22 safe tiles
- Balanced difficulty for new players
- Visual representation of 25-tile layout

---

### Figure 9: Grid Size 25 (5×5) - 5 Mines

**ID:** media-1780065662612-6f233c  
**Filename:** `aviator-minescape-grid-size-25-mines-5.png`

**Visual Description:**
5×5 grid with 5 mines configured, showing increased difficulty within the 25-tile format.

**UI Elements Present:**
- Complete 5×5 grid (25 tiles)
- Mine count set to 5
- All controls visible
- Unopened tile state

**Game State:**
- Setup phase
- Medium difficulty on 25-tile grid
- Ready to play

**Use Case:**
- Grid configuration examples
- Mine count variations demonstration
- Medium difficulty guide
- Strategy examples

**Key Details:**
- 5 mines = 20 safe tiles
- Demonstrates medium difficulty setting
- Good middle-ground for strategy learning

---

### Figure 10: Grid Size 25 (5×5) - 10 Mines

**ID:** media-1780065663345-1ba8ae  
**Filename:** `aviator-minescape-grid-size-25-mines-10.png`

**Visual Description:**
25-tile grid with maximum mines (10) for this size, showing hardest difficulty configuration.

**UI Elements Present:**
- 5×5 grid fully displayed
- Mine count: "10 Mines"
- All setup controls
- Unopened tiles

**Game State:**
- High difficulty setup
- Only 15 safe tiles available
- Setup phase

**Use Case:**
- Mine Configuration Guide table
- Risk/difficulty examples
- Advanced player configuration
- High-variance strategy section

**Key Details:**
- 10 mines = 15 safe tiles (60% mines)
- Extremely risky but high multiplier potential
- For experienced players only

---

### Figure 11: Grid Size 25 - Custom Mine Input

**ID:** media-1780065664155-c6d9a7  
**Filename:** `aviator-minescape-grid-size-25-mines-custom-placeholder-24.png`

**Visual Description:**
The custom mine input field for 25-tile grids, showing a placeholder value during input.

**UI Elements Present:**
- Mine selector showing "Custom" option selected
- Input field with placeholder text "24"
- Grid size still set to 25
- Input validation state visible

**Game State:**
- Custom configuration mode active
- Input awaiting final value
- Grid size fixed at 25

**Use Case:**
- Advanced configuration section
- Custom mine selection feature
- Input field demonstration
- Flexibility in game setup

**Key Details:**
- Placeholder shows "24" (maximum for 25-tile grid)
- Demonstrates custom input capability
- Advanced players can fine-tune difficulty

---

### Figure 12: Grid Size 36 (6×6) - 2 Mines

**ID:** media-1780065659155-e135c8  
**Filename:** `aviator-minescape-grid-size-36-mines-2.png`

**Visual Description:**
The 6×6 grid (36 tiles) with only 2 mines, showing an easy difficulty configuration on a larger board.

**UI Elements Present:**
- 6×6 grid layout (36 tiles visible)
- Mine count: 2
- All tiles unopened
- Standard controls visible

**Game State:**
- Setup phase, larger board
- Easy difficulty
- Many safe tiles available

**Use Case:**
- Grid Size Reference Table
- Easy difficulty demonstration
- Larger grid strategy section
- New player guidance

**Key Details:**
- 36 tiles = more play time before hitting mine
- 2 mines = 34 safe tiles
- Very forgiving for learning gameplay

---

### Figure 13: Grid Size 36 (6×6) - 5 Mines

**ID:** media-1780065665726-1122bb  
**Filename:** `aviator-minescape-grid-size-36-mines-5.png`

**Visual Description:**
6×6 grid with 5 mines configured, balanced difficulty on medium-sized board.

**UI Elements Present:**
- 6×6 grid (36 tiles) fully displayed
- Mine count: 5
- Setup controls
- Unopened tiles

**Game State:**
- Medium difficulty on larger board
- 31 safe tiles available
- Ready for play

**Use Case:**
- Standard configuration demonstration
- Balanced play examples
- Intermediate player setup

---

### Figure 14: Grid Size 36 (6×6) - 10 Mines

**ID:** media-1780065667395-9ff724  
**Filename:** `aviator-minescape-grid-size-36-mines-15.png`

**Visual Description:**
6×6 grid with 15 mines (maximum for this size), showing highest difficulty on medium board.

**UI Elements Present:**
- 6×6 grid (36 tiles)
- Mine count: 15
- All controls visible
- Unopened tile state

**Game State:**
- Maximum difficulty on 36-tile grid
- Only 21 safe tiles
- Challenging configuration

**Use Case:**
- Maximum difficulty examples
- Risk/reward balance section
- Advanced strategy demonstrations

**Key Details:**
- 15 mines = 21 safe tiles (41.6% safe)
- Extreme difficulty and variance
- Highest multiplier potential

---

### Figure 15: Grid Size 36 (6×6) - 10 Mines (Variant)

**ID:** media-1780065666538-d61e91  
**Filename:** `aviator-minescape-grid-size-36-mines-10.png`

**Visual Description:**
6×6 grid with 10 mines, medium-hard difficulty configuration.

**UI Elements Present:**
- 6×6 grid layout
- Mine count: 10
- All setup elements
- Unopened tiles

**Game State:**
- Hard difficulty on 36-tile board
- 26 safe tiles available
- Setup phase

**Use Case:**
- Hard difficulty examples
- Configuration variety
- Strategy section reference

---

### Figure 16: Grid Size 36 - Custom Mine Input

**ID:** media-1780065668202-75032e  
**Filename:** `aviator-minescape-grid-size-36-mines-custom-placeholder-35.png`

**Visual Description:**
The custom mine input field for 36-tile grids showing maximum possible value.

**UI Elements Present:**
- Mine selector: "Custom"
- Input field with placeholder: "35"
- Grid size: 36
- Input validation state

**Game State:**
- Custom configuration mode
- Maximum input value shown (35 of 36 tiles)
- Input processing state

**Use Case:**
- Custom configuration feature
- Advanced player customization
- Input field demonstration

**Key Details:**
- Placeholder shows "35" (nearly all tiles as mines)
- Demonstrates extreme custom configuration
- Very high difficulty mode

---

### Figure 17: Grid Size 49 (7×7) - 3 Mines

**ID:** media-1780065659940-bbd3b7  
**Filename:** `aviator-minescape-grid-size-49-mines-3.png`

**Visual Description:**
7×7 grid (49 tiles) with 3 mines, showing easy difficulty on largest standard board.

**UI Elements Present:**
- 7×7 grid (49 tiles) visible
- Mine count: 3
- All setup controls
- Unopened tiles

**Game State:**
- Large board setup
- Easy difficulty
- 46 safe tiles available

**Use Case:**
- Large board demonstration
- Easy difficulty on expanded board
- Extended gameplay examples

**Key Details:**
- 49 tiles = longest potential gameplay
- 3 mines = very forgiving
- Allows maximum multiplier growth potential

---

### Figure 18: Grid Size 64 (8×8) - 4 Mines

**ID:** media-1780065660760-1b991e  
**Filename:** `aviator-minescape-grid-size-64-mines-4.png`

**Visual Description:**
The largest standard grid (8×8, 64 tiles) with 4 mines, showing maximum board size with manageable difficulty.

**UI Elements Present:**
- 8×8 grid (64 tiles) fully displayed
- Mine count: 4
- All controls visible
- Unopened tile state

**Game State:**
- Maximum board size
- Easy difficulty for board size
- 60 safe tiles available

**Use Case:**
- Largest board demonstration
- Maximum play potential reference
- Extended round examples
- Grid Size Reference Table

**Key Details:**
- 64 tiles = maximum board size
- Smallest relative mine density (4/64 = 6.25%)
- Allows longest gameplay and highest multiplier potential

---

## Part 4: Active Gameplay

### Figure 19: Bet Placed - Hover on Unopened Tile

**ID:** media-1780070218083-95c078  
**Filename:** `bet-placed-hover-on-a-box.png`

**Visual Description:**
Shows the board state after a bet is placed, with the player's cursor hovering over an unopened tile to reveal the interactive state.

**UI Elements Present:**
- Game board with mixed tile states
- Unopened tiles with hover effect (highlighted/glowing)
- Cursor indication showing interactivity
- Active CASH OUT button visible
- Multiplier display
- Current potential win amount

**Game State:**
- Active round in progress
- Bet placed
- Board populated with tiles
- Awaiting player's first click or further reveals
- No tiles opened yet (hover state)

**Use Case:**
- Section 4.0 (Core Gameplay) - How a Round Works
- Interactive element demonstration
- Board interaction mechanics
- Visual feedback for player actions

**Key Details:**
- Shows hover effect on unopened tiles
- Demonstrates interactive state
- CASH OUT button ready for use
- Multiplier at baseline (1.0x or close to it)

---

### Figure 20: Bet Placed - Hover Tile (Alternative)

**ID:** media-1780065668997-2be9b4  
**Filename:** `aviator-minescape-bet-placed-hover-tile.png`

**Visual Description:**
Alternative view of bet placement with hover state on an unopened tile.

**UI Elements Present:**
- Board with unopened tiles
- Hover state on one tile
- Bet configuration showing bet is active
- CASH OUT button
- Potential win calculation
- Grid and multiplier information

**Game State:**
- Active round
- Mission started (round in progress)
- No tiles opened yet
- Awaiting click

**Use Case:**
- Bet placement confirmation
- Hover interaction mechanics
- Board state after bet
- Interactive feedback examples

**Key Details:**
- Shows clear hover feedback
- Demonstrates "mission started" state
- Ready for first reveal

---

### Figure 21: First Tile Opened - Multiplier x1.01

**ID:** media-1780065669871-2be9b4  
**Filename:** `aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png`

**Visual Description:**
Minimal reveal showing one safe tile opened with the resulting small multiplier increase.

**UI Elements Present:**
- Board with one opened tile (showing checkmark)
- 24 unopened tiles (on 25-tile grid)
- Multiplier display: "x1.01"
- Potential win updated (approximately 1.01 GEL profit per 100 GEL bet)
- CASH OUT button now prominently active in orange/yellow
- Risk indicator

**Game State:**
- One tile safely revealed
- Very early in round
- Low multiplier but growing potential
- Ready to reveal another tile or cash out

**Use Case:**
- Section 4.0 (Core Gameplay) - Moment 3: Growing Your Multiplier
- Minimal win example
- Early-round decision point
- Shows that even small reveals generate multipliers

**Key Details:**
- x1.01 is the smallest typical multiplier jump
- Shows conservative cash-out option available
- Demonstrates CASH OUT button activation
- Good example of the "hold or fold" decision

---

### Figure 22: Multiple Tiles Opened - Multiplier Growing

**ID:** media-1780070218300-930258  
**Filename:** `aviator-minescape-multiple-tiles-open-cashout-active.png`

**Visual Description:**
Shows multiple safe tiles revealed with a growing multiplier, demonstrating mid-round escalation.

**UI Elements Present:**
- Board with multiple opened tiles (green checkmarks)
- Several unopened tiles remaining
- Multiplier display (higher than x1.01)
- Potential win amount substantially increased
- Orange CASH OUT button prominent
- Provably Fair indicator
- Grid and game stats

**Game State:**
- Mission in progress
- Multiple tiles revealed successfully
- Multiplier climbing
- Significant potential winnings accumulated
- Risk increasing with each unopened tile

**Use Case:**
- Section 4.0 (Core Gameplay) - The Crucial Decision
- Mid-round decision point example
- Escalation demonstration
- Risk/reward tension example

**Key Details:**
- Shows several (likely 5-10) opened tiles
- Multiplier substantial enough to create tension
- Demonstrates the growing dilemma (cash out or continue)
- Clear visualization of profit potential

---

### Figure 23: Lose State - Mine Revealed

**ID:** media-1780070218812-a3cec5  
**Filename:** `aviator-minescape-lose-state-mine-revealed.png`

**Visual Description:**
The end state when a player hits a mine, showing the mine revealed with a bomb/mine icon.

**UI Elements Present:**
- Board displaying a mine that was hit (shown as bomb icon or different tile)
- Mix of opened safe tiles and the revealed mine
- Unopened tiles (game ended)
- Game Over or Loss notification
- Round summary stats
- Balance update showing loss
- Restart/Next Round button

**Game State:**
- Round lost
- Game over
- Bet forfeited
- Mine encountered
- No cash out possible (too late)
- Ready for next round

**Use Case:**
- Section 4.0 (Core Gameplay) - Moment 2: Outcomes
- Loss scenario demonstration
- Risk visualization
- Important for managing expectations

**Key Details:**
- Shows the mine that ended the game
- Demonstrates failed mission
- Clear visual of "game over" state
- Shows balance reduction from bet loss

---

## Part 5: Winning & Cashing Out

### Figure 24: Round Summary - Win State

**ID:** media-1780070219312-058d73  
**Filename:** `screenshot-2026-05-29-at-18-28-59.png`

**Visual Description:**
A screenshot showing the round summary after a successful cash-out, with all game statistics displayed.

**UI Elements Present:**
- Round summary header
- Final multiplier
- Total payout amount
- Profit calculation
- Balance update
- Tiles opened count
- Time duration
- Play again or navigate buttons

**Game State:**
- Round completed successfully
- Cash-out locked in
- Results displayed
- Ready for next round

**Use Case:**
- Section 5.0 (Cashing Out)
- Results screen demonstration
- Summary statistics display
- Successful outcome example

**Key Details:**
- Shows clear profit amount
- Displays multiplier achieved
- Shows balance update
- Summary of round performance

---

### Figure 25: Win State Results Display

**ID:** media-1780070219555-8ed7cf  
**Filename:** `screenshot-2026-05-29-at-18-30-03.png`

**Visual Description:**
Alternative view of a successful round results screen with complete game statistics.

**UI Elements Present:**
- Results header
- Payout amount prominently displayed
- Multiplier achieved
- Tiles revealed count
- Balance changes
- Continue/Next Round buttons

**Game State:**
- Successful round conclusion
- Results confirmed
- Ready for next action

**Use Case:**
- Section 5.0 (Cashing Out) - The Payout
- Results confirmation screen
- Statistics summary
- Next round transition

---

## Part 6: Auto Mode & Advanced Features

### Figure 26: AutoBet Setup - Basic Configuration

**ID:** media-1780070220044-2c76ac  
**Filename:** `aviator-minescape-auto-mode-advanced-settings.png`

**Visual Description:**
The Advanced Settings panel for AutoBet configuration, showing all available automation options.

**UI Elements Present:**
- Advanced Settings header
- Number of bets input field
- "On Win" behavior selector (multiple options)
- "On Loss" behavior selector (multiple options)
- Stop on Profit input (amount/percentage)
- Stop on Loss input (amount/percentage)
- Auto Cash-Out multiplier target
- START AUTOBET button
- Provably Fair indicator

**Game State:**
- AutoBet configuration mode
- Not in active round
- Settings awaiting finalization
- Ready to start automated play

**Use Case:**
- Section 6.0 (Auto Mode) - Setting Up AutoBet
- Advanced Settings subsection
- Smart AutoBet Strategies
- Configuration reference

**Key Details:**
- Shows all available automation options
- Demonstrates win/loss response strategies
- Shows profit/loss limit setting
- Complete control panel for automated play

---

### Figure 27: Advanced Settings (Alt View)

**ID:** media-1780070220277-48dbd9  
**Filename:** `advanced-settings.png`

**Visual Description:**
Alternative view of the advanced settings interface with full configuration options visible.

**UI Elements Present:**
- Settings panel with all controls
- Input fields and selectors
- Button states and options
- Configuration overview

**Game State:**
- Configuration phase
- AutoBet setup

**Use Case:**
- Advanced settings reference
- Configuration UI demonstration

---

### Figure 28: Advanced Settings (Variant 2)

**ID:** media-1780070221272-a84615  
**Filename:** `advance-settings.png`

**Visual Description:**
Another variant of the advanced settings view showing the complete control panel.

**UI Elements Present:**
- Full settings interface
- All configuration options
- Control buttons and fields

**Game State:**
- Setup mode

**Use Case:**
- Settings documentation
- Configuration reference

---

### Figure 29: AutoBet - Random Tile Selection

**ID:** media-1780070220531-c4ebc9  
**Filename:** `aviator-minescape-auto-mode-random-tile-selection.png`

**Visual Description:**
AutoBet mode with random tile selection strategy. Shows the board with randomly marked tiles for automatic play.

**UI Elements Present:**
- Board with randomly marked/selected tiles (highlighted)
- AutoBet status indicator showing "Auto Mode Active"
- Random selection pattern visible
- Control buttons for stopping autobet
- Multiplier and potential win display
- Provably Fair indicator

**Game State:**
- AutoBet active
- Round in progress with automated tile selection
- Tiles being revealed automatically based on random selection
- Game executing pre-configured strategy

**Use Case:**
- Section 6.0 (Auto Mode) - AutoBet in Action
- Random tile selection strategy demonstration
- Automated gameplay example

**Key Details:**
- Shows random tile markers
- Demonstrates automated selection
- Board in active autobet state
- Strategy visualization

---

### Figure 30: AutoBet - Selected Tiles for AutoBet

**ID:** media-1780070219066-49ef76  
**Filename:** `aviator-minescape-auto-mode-selected-tiles-start-autobet.png`

**Visual Description:**
Manual tile selection phase before starting AutoBet. Player has marked specific tiles that the autobot will click during automated play.

**UI Elements Present:**
- Board with manually selected tiles (marked/highlighted)
- Selected tiles clearly distinguishable
- START AUTOBET button ready
- Tile count of selections displayed
- Advanced settings visible
- Bet configuration

**Game State:**
- Pre-autobet setup
- Tiles selected but automation not started
- Ready to begin automated round with selected tiles
- Configuration complete

**Use Case:**
- Section 6.0 (Auto Mode) - Setting Up AutoBet
- Tile selection workflow
- Manual strategy configuration
- Pre-autobet state

**Key Details:**
- Shows multiple marked tiles
- Demonstrates player control over tile selection
- Marks are clearly visible on board
- Ready-to-start state

---

### Figure 31: AutoBet Win State - Results Popup

**ID:** media-1780070218543-bff45b  
**Filename:** `aviator-minescape-auto-mode-win-state-infinite-rounds.png`

**Visual Description:**
AutoBet round that won, showing the results popup overlaid on the board with continued autobet ready to play more rounds.

**UI Elements Present:**
- Results popup showing payout and multiplier
- Winning round summary
- Balance update displayed
- "Play Again" or "Continue AutoBet" button
- Board visible behind popup
- Provably Fair indicator
- Stop AutoBet button visible

**Game State:**
- AutoBet round won
- Results popup active
- Balance increased
- Ready to continue automation or stop
- Infinite rounds mode (can continue indefinitely)

**Use Case:**
- Section 6.0 (Auto Mode) - AutoBet in Action
- Win state during automation
- Continuous play demonstration
- Results handling in AutoBet

**Key Details:**
- Shows win state handling in autoplay
- Popup displays results clearly
- Option to continue or stop
- Balance confirmation visible

---

### Figure 32: AutoBet with On-Win Increase (5% - Bets 10, Remaining 2)

**ID:** media-1780070220777-c1e806  
**Filename:** `aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png`

**Visual Description:**
AutoBet in progress showing the results of the "on win increase by 5%" strategy, with round counter showing bets placed and remaining.

**UI Elements Present:**
- Results popup from a winning round
- Payout amount displayed
- Multiplier achieved (appears to be strong win)
- Counter showing "Bets: 10"
- Remaining counter showing "2"
- Advanced settings panel visible showing "On Win: Increase by 5%"
- Stop AutoBet button
- Provably Fair indicator

**Game State:**
- AutoBet active
- Just completed a winning round
- Strategy: increase bet by 5% on each win
- 10 bets completed, 2 remaining
- Will stop after 12 total bets

**Use Case:**
- Section 6.0 (Auto Mode) - Smart AutoBet Strategies
- On-Win increase strategy demonstration
- Positive progression example
- Strategy execution in progress

**Key Details:**
- Shows the "increase on win" strategy
- Displays round counter (10/12)
- Shows results of winning strategy
- Clear outcome visualization

---

### Figure 33: AutoBet with On-Loss Increase (20% - Not Started)

**ID:** media-1780070221031-868ec9  
**Filename:** `aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png`

**Visual Description:**
AutoBet configuration screen showing the "on loss increase by 20%" strategy, with selected tiles ready but autobet not yet started.

**UI Elements Present:**
- Board with selected tiles (marked for autobet)
- Advanced Settings panel showing "On Loss: Increase by 20%"
- Number of bets counter showing the planned amount
- START AUTOBET button ready to click
- Bet configuration visible
- Provably Fair indicator

**Game State:**
- AutoBet not yet started
- Configuration complete with loss recovery strategy
- Tiles selected for automated clicking
- Ready to begin

**Use Case:**
- Section 6.0 (Auto Mode) - Smart AutoBet Strategies
- Loss Recovery strategy setup
- On-Loss increase demonstration
- Pre-autobet configuration state

**Key Details:**
- Shows 20% increase on loss strategy
- Demonstrates loss recovery approach
- Configuration state before execution
- Ready to start button visible

---

### Figure 34: AutoBet - Stop on Profit/Loss Limits

**ID:** media-1780070221549-a0fbc1  
**Filename:** `aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png`

**Visual Description:**
AutoBet configuration displaying profit and loss stopping conditions (Stop on Profit: 10 GEL, Stop on Loss: 20 GEL).

**UI Elements Present:**
- Advanced Settings panel open
- "Stop on Profit" field showing "10 GEL"
- "Stop on Loss" field showing "20 GEL"
- Selected tiles on board
- Number of bets configuration
- START AUTOBET button
- Clear indication of stopping conditions

**Game State:**
- Configuration phase
- Stop conditions set
- AutoBet ready to start with safety limits
- Awaiting START AUTOBET click

**Use Case:**
- Section 6.0 (Auto Mode) - Setting Up AutoBet
- Stop Conditions subsection
- Bankroll protection demonstration
- Risk management in automation

**Key Details:**
- Shows profit target: 10 GEL
- Shows loss limit: 20 GEL
- Demonstrates defensive automation
- Clear stopping criteria set

---

### Figure 35: AutoBet Lose State - Continues

**ID:** media-1780070219815-d2fcec  
**Filename:** `aviator-minescape-auto-mode-lose-state-continues.png`

**Visual Description:**
AutoBet encountered a loss (mine hit) but continues to the next round according to settings, showing the loss results.

**UI Elements Present:**
- Results popup showing loss (no payout)
- Mine revealed on board
- Round summary (Bets completed, Remaining)
- Balance update showing loss
- "Continue AutoBet" button
- Stop AutoBet option
- Provably Fair indicator

**Game State:**
- AutoBet round lost
- Results displayed
- Automated strategy continues (loss recovery will apply to next round)
- More rounds remaining
- Ready to continue or stop

**Use Case:**
- Section 6.0 (Auto Mode) - AutoBet in Action
- Loss handling during automation
- Loss recovery strategy trigger
- Continuous autoplay demonstration

**Key Details:**
- Shows loss is handled automatically
- Results clearly displayed
- Next round will apply loss recovery rules
- Can continue or stop at any time

---

## Part 7: Menu & Settings

### Figure 36: Burger Menu - Open State

**ID:** media-1780065654396-0322df  
**Filename:** `aviator-minescape-burger-menu-open.png`

**Visual Description:**
The hamburger menu opened, showing game settings and options including sound control.

**UI Elements Present:**
- Burger menu (hamburger icon) opened
- Menu overlay/dropdown visible
- Sound settings toggle
- Music control options
- Game settings items
- Account/profile options
- Close menu button or overlay

**Game State:**
- Menu open
- No active gameplay
- Settings accessible
- Game paused or interrupted

**Use Case:**
- Section 2.0 (Getting Started) - Understanding the Play Screen
- Settings access documentation
- Menu structure overview
- Account settings reference

**Key Details:**
- Shows menu structure
- Demonstrates settings location
- Sound controls visible
- Complete menu access

---

### Figure 37: Burger Menu - Scrolled View

**ID:** media-1780065655200-2cbc43  
**Filename:** `aviator-minescape-burger-menu-scrolled.png`

**Visual Description:**
The menu after scrolling, revealing additional options including music settings and other menu items.

**UI Elements Present:**
- Menu overlay still open
- Scrolled content showing music controls
- Additional settings options
- Navigation items
- Close/back options

**Game State:**
- Menu open and scrolled
- Additional settings visible

**Use Case:**
- Complete menu documentation
- Settings overview
- Menu navigation

---

## Part 8: Click Mechanics & Startup

### Figure 38: Clicking on Box While Bet Isn't Placed (GIF)

**ID:** media-1780059894870-fdbb5a  
**Filename:** `clicking-on-box-while-bet-isn-t-placed.gif`

**Visual Description:**
Animated GIF demonstrating what happens when a player tries to click a tile before placing a bet. Shows error state or "not available" feedback.

**Media Type:** Animated GIF

**UI Elements Present:**
- Board with unopened tiles
- Animation showing click attempt
- Error or "bet required" indication
- Disabled state feedback

**Game State:**
- Pre-bet state
- Click attempt on inactive board
- Animation showing system response

**Use Case:**
- Section 4.0 (Core Gameplay)
- Interactive mechanics demonstration
- Error handling documentation
- Player onboarding

**Key Details:**
- Shows game prevents clicking before bet
- Animated for clarity
- Demonstrates required bet placement

---

## Part 9: Loading & Initialization

### Figure 39: Loading Screen (Video)

**ID:** media-1780061968243-443d96  
**Filename:** `loading-screen.mov`

**Visual Description:**
Video showing the game loading animation/screen that appears when the game initializes.

**Media Type:** Video (.mov)

**UI Elements Present:**
- Loading screen design
- Animated loader/spinner
- Game branding
- Loading progress indication

**Game State:**
- Initialization phase
- Game loading

**Use Case:**
- App loading documentation
- Visual feedback during startup
- Game initialization reference

**Key Details:**
- Animated loading sequence
- Game branding visible
- Loading state feedback

---

## Usage Matrix

This matrix shows which images correspond to which sections of the Minescape Player Guide:

| Guide Section | Key Images | Purpose |
|---------------|-----------|---------|
| 2.0 Getting Started | 1, 2, 3, 8, 36 | Interface overview, grid selection |
| 3.0 Placing Your Bet | 4, 5, 6, 7 | Bet amounts, preset buttons, calculations |
| 4.0 Core Gameplay | 19, 20, 21, 22, 23 | Active play, reveals, loss states |
| 5.0 Cashing Out | 24, 25 | Results screens, payouts |
| 6.0 Auto Mode | 26, 27, 28, 29, 30, 31, 32, 33, 34, 35 | AutoBet setup, strategies, execution |
| 7.0 Understanding the Board | 8-18 | Grid sizes, mine counts, configurations |
| 11.0 Troubleshooting | 36-38 | Menu, settings, error states |

---

## Image Organization by Game State

### Setup Phase
- Figures 1-18: Configuration and setup states
- Focus: Board selection, difficulty choice, bet placement

### Active Gameplay
- Figures 19-23: Playing states
- Focus: Tile reveals, multiplier growth, outcomes

### AutoBet Modes
- Figures 26-35: Automated play
- Focus: Strategy configuration, execution, results

### Navigation & Settings
- Figures 36-39: Game infrastructure
- Focus: Menu access, settings, loading

---

## Technical Notes for Documentation Builders

### Image Resolution & Scaling
- All PNG images are optimized for web at standard resolution
- GIF and MOV files are animation/video assets
- Responsive display expected (fits to container)

### Color & Visual Design
- Game uses consistent color palette (greens for safe/win, reds for loss/danger)
- UI follows modern flat design principles
- High contrast for accessibility

### Markup Integration
The media manifest JSON provides machine-readable metadata for each image:
- `id`: Unique identifier for database/CMS tracking
- `alt`: Descriptive alt text for accessibility
- `tags`: Searchable keywords and categorization
- `path`: Asset location for linking

### Localization Considerations
- Images show game UI in English
- Text in images will require localization (retake screenshots or use image translations)
- Currency (GEL) is Georgia-specific
- Numbers/formatting may need region-specific updates

---

## Document Maintenance

**Next Update:** 2026-08-30  
**Responsible Party:** Game Operations / Documentation Team  
**Version History:**
- v1.0 (2026-05-30) — Initial comprehensive image documentation

**Change Log:**
- Created detailed descriptions for all 39 minescape images
- Organized by gameplay phase and use case
- Added usage matrix for documentation mapping
- Included technical notes for builders

---

## Appendix: Quick Image Reference by Filename

| Filename | ID | Figure | State |
|----------|-----|--------|-------|
| aviator-minescape-default-screen.png | media-1780067775886-29769d | 1 | Setup |
| default-state.png | media-1780070218080-555b83 | 2 | Setup |
| default-screen-with-1000-bet-amount.png | media-1780065670756-f2545a | 3 | Setup |
| aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png | media-1780065656736-496633 | 4 | Bet |
| aviator-minescape-bet-10-gel-potential-win-242-50.png | media-1780065655978-bc6f0b | 5 | Bet |
| aviator-minescape-bet-100-gel-potential-win-2425.png | media-1780065653573-f09200 | 6 | Bet |
| aviator-minescape-max-bet-selected-400-gel.png | media-1780065658357-8ef3cb | 7 | Bet |
| aviator-minescape-grid-size-25-mines-3.png | media-1780065661793-005897 | 8 | Grid |
| aviator-minescape-grid-size-25-mines-5.png | media-1780065662612-6f233c | 9 | Grid |
| aviator-minescape-grid-size-25-mines-10.png | media-1780065663345-1ba8ae | 10 | Grid |
| aviator-minescape-grid-size-25-mines-custom-placeholder-24.png | media-1780065664155-c6d9a7 | 11 | Grid |
| aviator-minescape-grid-size-36-mines-2.png | media-1780065659155-e135c8 | 12 | Grid |
| aviator-minescape-grid-size-36-mines-5.png | media-1780065665726-1122bb | 13 | Grid |
| aviator-minescape-grid-size-36-mines-15.png | media-1780065667395-9ff724 | 14 | Grid |
| aviator-minescape-grid-size-36-mines-10.png | media-1780065666538-d61e91 | 15 | Grid |
| aviator-minescape-grid-size-36-mines-custom-placeholder-35.png | media-1780065668202-75032e | 16 | Grid |
| aviator-minescape-grid-size-49-mines-3.png | media-1780065659940-bbd3b7 | 17 | Grid |
| aviator-minescape-grid-size-64-mines-4.png | media-1780065660760-1b991e | 18 | Grid |
| bet-placed-hover-on-a-box.png | media-1780070218083-95c078 | 19 | Play |
| aviator-minescape-bet-placed-hover-tile.png | media-1780065668997-2be9b4 | 20 | Play |
| aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png | media-1780065669871-2be9b4 | 21 | Play |
| aviator-minescape-multiple-tiles-open-cashout-active.png | media-1780070218300-930258 | 22 | Play |
| aviator-minescape-lose-state-mine-revealed.png | media-1780070218812-a3cec5 | 23 | Play |
| screenshot-2026-05-29-at-18-28-59.png | media-1780070219312-058d73 | 24 | Results |
| screenshot-2026-05-29-at-18-30-03.png | media-1780070219555-8ed7cf | 25 | Results |
| aviator-minescape-auto-mode-advanced-settings.png | media-1780070220044-2c76ac | 26 | AutoBet |
| advanced-settings.png | media-1780070220277-48dbd9 | 27 | AutoBet |
| advance-settings.png | media-1780070221272-a84615 | 28 | AutoBet |
| aviator-minescape-auto-mode-random-tile-selection.png | media-1780070220531-c4ebc9 | 29 | AutoBet |
| aviator-minescape-auto-mode-selected-tiles-start-autobet.png | media-1780070219066-49ef76 | 30 | AutoBet |
| aviator-minescape-auto-mode-win-state-infinite-rounds.png | media-1780070218543-bff45b | 31 | AutoBet |
| aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png | media-1780070220777-c1e806 | 32 | AutoBet |
| aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png | media-1780070221031-868ec9 | 33 | AutoBet |
| aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png | media-1780070221549-a0fbc1 | 34 | AutoBet |
| aviator-minescape-auto-mode-lose-state-continues.png | media-1780070219815-d2fcec | 35 | AutoBet |
| aviator-minescape-burger-menu-open.png | media-1780065654396-0322df | 36 | Menu |
| aviator-minescape-burger-menu-scrolled.png | media-1780065655200-2cbc43 | 37 | Menu |
| clicking-on-box-while-bet-isn-t-placed.gif | media-1780059894870-fdbb5a | 38 | Mechanics |
| loading-screen.mov | media-1780061968243-443d96 | 39 | Loading |

---

**End of Document**

*This documentation is complete and ready for publication in DocPilot. All 39 minescape images have been comprehensively documented with visual descriptions, UI elements, game states, use cases, and contextual information.*
