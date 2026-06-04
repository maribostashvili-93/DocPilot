"""
Section content for the Minescape — Complete Player & Operator Guide.

Each section returns:
    {
        "number": "1.0",
        "slug": "welcome",
        "title": "Welcome And How To Read This Manual",
        "summary": "...",
        "status": "review",
        "owner": "Product",
        "body_html": "<p>...</p><figure>...</figure>"
    }

The seed script wraps every section in DocPilot's section-banner + section.content
container before writing into cms-state.json. The body HTML uses DocPilot's
content classes (.callout, .ui, .ui-list, table, ol.steps, figure annotated-figure)
so the rendered look matches the existing Minescape Interface Description.
"""

from textwrap import dedent


def img(src, alt, caption):
    return dedent(f"""
    <figure class="figure">
      <img src="{src}" alt="{alt}">
      <figcaption><em>{caption}</em></figcaption>
    </figure>
    """).strip()


def annotated_img(src, alt, caption, markers):
    """Build an annotated figure with simple shape/hotspot markers.

    markers: list of dicts with keys: kind, label, description, x, y, w, h, color_role
    color_role maps to one of the marker presets via the seed defaults below.
    """
    marker_html_blocks = []
    description_blocks = []

    palette = {
        "blue":   {"border": "#7aa3d6", "bg": "#7aa3d6", "text": "#ffffff"},
        "green":  {"border": "#5cc081", "bg": "#5cc081", "text": "#0b1d12"},
        "yellow": {"border": "#e8b54e", "bg": "#e8b54e", "text": "#1b1503"},
        "red":    {"border": "#d65a5a", "bg": "#d65a5a", "text": "#ffffff"},
        "gray":   {"border": "#8a98a8", "bg": "#8a98a8", "text": "#ffffff"},
    }

    for idx, m in enumerate(markers, 1):
        c = palette.get(m.get("color_role", "blue"), palette["blue"])
        kind = m.get("kind", "shape")
        label = m["label"]
        description = m.get("description", "")
        x = m["x"]
        y = m["y"]
        w = m["w"]
        h = m["h"]

        style = (
            f"left:{x}%; top:{y}%; width:{w}%; height:{h}%; "
            f"border-color:{c['border']}; "
            f"background-color:{c['bg']}; "
            f"color:{c['text']};"
        )

        marker_html_blocks.append(
            f'<span class="doc-marker marker-{kind}" data-kind="{kind}" '
            f'data-marker-id="m-{idx}" data-label="{label}" '
            f'style="{style}">'
            f'<b class="doc-marker-chip">{label}</b>'
            f"</span>"
        )

        if description:
            description_blocks.append(
                f'<div class="marker-description" data-marker-description-index="{idx}">'
                f"<strong>{label}</strong>"
                f"<p>{description}</p>"
                f"</div>"
            )

    markers_html = "\n      ".join(marker_html_blocks)
    descriptions_html = (
        '<div class="marker-description-list">\n  '
        + "\n  ".join(description_blocks)
        + "\n</div>"
        if description_blocks
        else ""
    )

    return dedent(f"""
    <figure class="figure annotated-figure">
      <div class="annotated-image">
        <img src="{src}" alt="{alt}">
        {markers_html}
      </div>
      {descriptions_html}
      <figcaption><em>{caption}</em></figcaption>
    </figure>
    """).strip()


# -------------------------------------------------------------------------
# Section 1 — Welcome
# -------------------------------------------------------------------------

S1 = {
    "number": "1.0",
    "slug": "welcome",
    "title": "Welcome And How To Read This Manual",
    "summary": "What Minescape is, who this manual is for, and how to navigate the chapters.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>Minescape is a <strong>crash-and-hold mining game</strong>. You stake a bet, configure a hidden minefield, and reveal wooden crates one at a time. Every safe reveal lifts a multiplier; one mine ends the round. You decide when to cash out — and that single decision is the whole game.</p>

    <div class="callout info">
      <span class="callout-title">In one sentence</span>
      <p>Click crates to grow a multiplier. Take the win whenever you want. Or push your luck — but hit a mine and the round is over.</p>
    </div>

    <h3>1.1 Who this manual is for</h3>
    <p>This is a single guide written for two audiences at once:</p>
    <ul>
      <li><strong>External readers (players).</strong> Every section is written in plain English and assumes no platform literacy. If you have never opened a casino game before, you can read this top to bottom.</li>
      <li><strong>Internal readers (operators, QA, support, localisation).</strong> Operator-relevant detail is flagged with a yellow callout titled <em>Operator note</em>. Glossary, verification checklist, and translation-stable strings are at the back.</li>
    </ul>

    <h3>1.2 How the manual is structured</h3>
    <ol class="steps">
      <li><strong>Sections 2 to 4</strong> introduce the screen and the two modes. Read these once and the rest of the controls will make sense in place.</li>
      <li><strong>Sections 5 to 9</strong> cover Manual play end-to-end: setting the bet, choosing the board, revealing crates, cashing out, and losing.</li>
      <li><strong>Sections 10 to 12</strong> cover Auto mode: tile pre-selection, Advanced Settings rules, and how the loop behaves.</li>
      <li><strong>Sections 13 to 15</strong> finish with menu, footer, worked examples, glossary, and the operator reference sheet.</li>
    </ol>

    <h3>1.3 Source of truth</h3>
    <p>Every claim in this manual is supported by a real in-game screenshot in <code>public/images/minescape/</code>. Where a behaviour is plausibly inferred but not directly captured, the text says so and the operator reference sheet (Section 15) lists it as something to confirm with engineering before publish.</p>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 2 — Loading And Screen Anatomy
# -------------------------------------------------------------------------

S2_MARKERS_DEFAULT = [
    {"kind": "shape", "label": "A — Header",            "color_role": "blue",   "x": 4,  "y": 1,  "w": 36, "h": 7,  "description": "Logo, time, balance, burger menu — every header element lives here."},
    {"kind": "shape", "label": "B — Mode Tabs",         "color_role": "blue",   "x": 4,  "y": 9,  "w": 36, "h": 8,  "description": "Switch between Manual and Auto play. Locked during an active round."},
    {"kind": "shape", "label": "C — Bet Setup",         "color_role": "blue",   "x": 4,  "y": 18, "w": 36, "h": 50, "description": "Bet Amount, quick modifiers, Potential Win, Grid Size, Number of Mines."},
    {"kind": "shape", "label": "D — Action Button",     "color_role": "green",  "x": 4,  "y": 70, "w": 36, "h": 9,  "description": "The single button that drives the round (label depends on state)."},
    {"kind": "shape", "label": "E — Multiplier Ladder", "color_role": "yellow", "x": 42, "y": 1,  "w": 56, "h": 7,  "description": "Seven chips previewing your upcoming multipliers per safe reveal."},
    {"kind": "shape", "label": "F — Play Board",        "color_role": "blue",   "x": 42, "y": 9,  "w": 56, "h": 86, "description": "The crate grid. Clicked once per reveal."},
    {"kind": "shape", "label": "G — Footer",            "color_role": "gray",   "x": 4,  "y": 82, "w": 36, "h": 13, "description": "Provably Fair badge, version, client clock."},
]

S2 = {
    "number": "2.0",
    "slug": "loading-and-screen-anatomy",
    "title": "Loading And Screen Anatomy",
    "summary": "What happens during loading and the seven named regions of the play screen.",
    "status": "published",
    "owner": "UX",
    "body_html": dedent("""
    <h3>2.1 The loading screen</h3>
    <p>Minescape opens with a brief animated loader (asset <code>loading-screen.mov</code>). During loading the client authenticates your session, fetches the round configuration, and renders the play surface in the background. <strong>You do nothing during loading.</strong> When it clears, you drop straight into the Default Screen with the Manual tab pre-selected and a fresh, empty board on the right.</p>

    <div class="callout warn">
      <span class="callout-title">Operator note — loader on slow networks</span>
      <p>Because the loader is a video file, low-bandwidth devices may take longer than expected. Confirm whether the loader auto-skips on slow connections or whether a CSS-only fallback is wired up.</p>
    </div>

    <h3>2.2 The seven regions of the screen</h3>
    <p>The entire game lives on one screen. Nothing is hidden behind tabs you have not opened, and there is no scrolling required to play. The screen breaks into the seven regions labelled below.</p>

    """).strip()
    + "\n\n    "
    + annotated_img(
        "/images/minescape/aviator-minescape-default-screen.png",
        "Minescape default screen with the seven named regions overlaid.",
        "Region map. Read the rest of this manual with these labels in mind — every later section refers back to them.",
        S2_MARKERS_DEFAULT,
    )
    + dedent("""

    <table>
      <thead><tr><th>Region</th><th>Plain-English name</th><th>What it does</th></tr></thead>
      <tbody>
        <tr><td class="col-key">A</td><td>Header bar</td><td>Shows the logo, the current time, your money, and the menu icon.</td></tr>
        <tr><td class="col-key">B</td><td>Mode tabs</td><td>A two-button switch between <span class="ui">Manual</span> play and <span class="ui">Auto</span> play.</td></tr>
        <tr><td class="col-key">C</td><td>Bet configuration panel</td><td>Where you set how much to bet, how big the board is, and how many mines to hide.</td></tr>
        <tr><td class="col-key">D</td><td>Primary action button</td><td>The one button that drives the round forward — its label changes with state.</td></tr>
        <tr><td class="col-key">E</td><td>Multiplier ladder</td><td>Seven chips showing what your multiplier will be at the next few safe reveals.</td></tr>
        <tr><td class="col-key">F</td><td>Play board</td><td>The grid of crates you click on.</td></tr>
        <tr><td class="col-key">G</td><td>Footer</td><td>"Provably Fair Game" badge, version number, and a small clock.</td></tr>
      </tbody>
    </table>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 3 — The Header Bar
# -------------------------------------------------------------------------

S3 = {
    "number": "3.0",
    "slug": "the-header-bar",
    "title": "The Header Bar — Logo, Time, Balance, Menu",
    "summary": "Reading the four small but important pieces of information at the top of the panel.",
    "status": "published",
    "owner": "UX",
    "body_html": dedent("""
    <p>The header bar runs across the top of the bet panel. From left to right it shows the game logo, the client clock, your balance in GEL, and the burger menu icon.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png",
        "Header detail showing 17:21 clock, 20000 GEL balance, and burger menu.",
        "Aviator-skin header. The wordmark on the far left tells you which skin you are playing on; the rest of the header is identical across skins.",
    )
    + dedent("""

    <dl class="ui-list">
      <dt>The logo</dt>
      <dd>The screenshots in the asset folder show two skins of the same engine: a green <strong>MINESCAPE</strong> wordmark and a red script <em>Aviator</em> wordmark. They are the same game with different branding (see Section 13 for the full skin comparison).</dd>
      <dt>The clock</dt>
      <dd>The small four-digit time (e.g. <code>17:21</code>) is the <strong>client clock</strong> — your local browser time. It updates while the game runs. It is <em>not</em> a countdown and there is no round timer; Minescape has no time pressure.</dd>
      <dt>The balance</dt>
      <dd>To the right of the clock is your money on the platform, formatted as <code>X GEL</code>. This is the single most important number for any returning player. It updates <strong>the moment a bet is staked</strong> (deducted) and again <strong>when you cash out or finish a round in profit</strong> (added).</dd>
      <dt>The burger menu</dt>
      <dd>The three-line <code>☰</code> icon on the far right opens a slide-in menu containing your account, in-game preference toggles, bet history, the rules page, and your responsible-play limits. See Section 13.</dd>
    </dl>

    <div class="callout info">
      <span class="callout-title">Why the balance is the canonical source</span>
      <p>Every other money display on the screen — Potential Win, Cashout amount, payout popups — is derived from the balance and the current configuration. If anything looks inconsistent, the header balance is the authoritative number.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 4 — Manual Vs Auto
# -------------------------------------------------------------------------

S4 = {
    "number": "4.0",
    "slug": "manual-vs-auto",
    "title": "Choosing A Mode — Manual Vs Auto",
    "summary": "Side-by-side comparison of the two play modes and when to use each.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>Directly under the header is a segmented control with two buttons labelled <span class="ui">Manual</span> and <span class="ui">Auto</span>. This is how you choose which of the two play styles you want. You can switch between them at any time when no round is active. While a round is running, the tabs are locked.</p>

    <h3>4.1 Manual mode</h3>
    <p>Manual mode is the default Minescape experience and the one most beginners should start with.</p>
    <ul>
      <li>You set the bet, choose grid size, choose mines, and tap the green CTA to start a round.</li>
      <li>The board becomes interactive and <strong>you personally click each crate</strong> one at a time.</li>
      <li>The round ends when you either hit a mine (lose) or tap Cashout (win).</li>
    </ul>

    <h3>4.2 Auto mode</h3>
    <p>Auto mode runs the game on a loop, using rules you configure in advance.</p>
    <ul>
      <li>You pre-select which tiles the engine should open each round.</li>
      <li>You configure rules in an <span class="ui">Advanced Settings</span> panel: target multiplier, number of rounds, what to do after a win or loss, and when to stop.</li>
      <li>The engine then plays round after round without you having to click anything per-reveal.</li>
    </ul>

    <h3>4.3 Side-by-side comparison</h3>
    <table>
      <thead><tr><th>Feature</th><th>Manual</th><th>Auto</th></tr></thead>
      <tbody>
        <tr><td class="col-key">Per-tile clicking</td><td>You do it</td><td>Engine does it from your selection</td></tr>
        <tr><td class="col-key">Cashout decision</td><td>You press Cashout</td><td>Triggered by Payout On Win</td></tr>
        <tr><td class="col-key">Number of rounds</td><td>One at a time</td><td>Configurable, including unlimited</td></tr>
        <tr><td class="col-key">Bet changes between rounds</td><td>Manual</td><td>Rules-based (Reset or Increase by X%)</td></tr>
        <tr><td class="col-key">Stop conditions</td><td>None — you're in charge</td><td>Stop On Profit / Stop On Loss / counter / manual</td></tr>
        <tr><td class="col-key">Best for</td><td>Learning the game, careful play</td><td>Disciplined, hands-off sessions</td></tr>
      </tbody>
    </table>

    <div class="callout info">
      <span class="callout-title">Beginner advice</span>
      <p>Play five to ten Manual rounds before you ever touch Auto. You need to feel how the multiplier climbs before you can confidently tell Auto what to chase.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 5 — Configuring Your Bet
# -------------------------------------------------------------------------

S5 = {
    "number": "5.0",
    "slug": "configuring-your-bet",
    "title": "Configuring Your Bet — Amount, Modifiers, Potential Win",
    "summary": "Reading the bet field, using the 1/2 / 2X / Max chips, and understanding Potential Win.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <h3>5.1 The Bet Amount field</h3>
    <p>The Bet Amount field is the first input inside the bet configuration panel. It controls the only money actually at risk during the round. The format is <code>GEL X,XX</code> using a comma decimal separator — so <code>GEL 1,00</code> reads as "one Georgian Lari, zero tetri" (not "one hundred Lari").</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png",
        "Bet of 10 GEL with Potential Win 242.50 on a 25/1 configuration.",
        "Bet GEL 10,00 — Potential Win recalculates to GEL 242.50 (24.25× ceiling).",
    )
    + dedent("""

    <h3>5.2 The quick modifier chips</h3>
    <p>Three small buttons next to the Bet field let you adjust the stake without typing.</p>
    <dl class="ui-list">
      <dt><span class="ui">1/2</span></dt>
      <dd>Halves the current bet. Tap it twice to halve twice.</dd>
      <dt><span class="ui">2X</span></dt>
      <dd>Doubles the current bet. Tap it twice to double twice.</dd>
      <dt><span class="ui">Max</span></dt>
      <dd>Clamps the bet to the <strong>operator's per-bet ceiling</strong>. This is <em>not</em> "all of your balance" — see the gotcha below.</dd>
    </dl>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png",
        "1/2 chip pressed — bet halved from 10 to 5 GEL.",
        "The 1/2 chip is outlined in blue to confirm it was the last input. Bet halved, Potential Win recalculated.",
    )
    + dedent("""

    <div class="callout warn">
      <span class="callout-title">Operator note — Max does NOT mean "all-in"</span>
      <p>Across the captured evidence the balance is <code>20000 GEL</code> but the <span class="ui">Max</span> button only filled <code>400 GEL</code>. <span class="ui">Max</span> resolves to the operator-configured per-bet ceiling. Players who expect Max to bet everything will be confused — document this behaviour clearly in player-facing help and support scripts.</p>
    </div>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-max-bet-selected-400-gel.png",
        "Max button highlighted — bet set to 400 GEL on a 20,000 GEL balance.",
        "Proof. Balance reads 20000 GEL, Max only filled 400 GEL — the operator's per-bet cap. Players cannot single-tap to all-in.",
    )
    + dedent("""

    <h3>5.3 Reading the Potential Win bar</h3>
    <p>Directly underneath the Bet Amount row sits a thin blue informational bar reading <strong>"Potential Win: GEL X.XX"</strong>. It shows the <strong>best-case payout</strong> for the current configuration — your bet multiplied by the ceiling multiplier, assuming you reveal every safe tile. It updates instantly when you change the bet, grid, or mines.</p>

    <p>The bar is a ceiling, not a forecast. It tells you "if I have a perfect run, this is the most I can possibly walk away with." Confirm this is the case by comparing four bet captures on the same 25/1 configuration:</p>

    <table>
      <thead><tr><th>Bet</th><th>Potential Win</th><th>Implied ceiling multiplier</th></tr></thead>
      <tbody>
        <tr><td><code>GEL 5,00</code></td><td><code>GEL 121.25</code></td><td>24.25×</td></tr>
        <tr><td><code>GEL 10,00</code></td><td><code>GEL 242.50</code></td><td>24.25×</td></tr>
        <tr><td><code>GEL 100,00</code></td><td><code>GEL 2,425.00</code></td><td>24.25×</td></tr>
        <tr><td><code>GEL 400,00</code></td><td><code>GEL 9,700.00</code></td><td>24.25×</td></tr>
      </tbody>
    </table>

    <div class="callout info">
      <span class="callout-title">What this proves</span>
      <p>The ceiling multiplier depends on the <strong>grid + mine configuration</strong>, not on the stake size. Potential Win is a pure display calculation: <code>bet × ceiling</code>.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 6 — Choosing Grid Size And Mines
# -------------------------------------------------------------------------

S6 = {
    "number": "6.0",
    "slug": "grid-size-and-mines",
    "title": "Choosing Grid Size And Number Of Mines",
    "summary": "Four grid sizes, mine presets that adapt per grid, and the Custom field.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <h3>6.1 The four grid sizes</h3>
    <p>Grid Size offers four preset chips, mapping directly to the N×N play board.</p>
    <table>
      <thead><tr><th>Chip</th><th>Board</th><th>Total crates</th></tr></thead>
      <tbody>
        <tr><td><span class="ui">25</span></td><td>5×5</td><td>25</td></tr>
        <tr><td><span class="ui">36</span></td><td>6×6</td><td>36</td></tr>
        <tr><td><span class="ui">49</span></td><td>7×7</td><td>49</td></tr>
        <tr><td><span class="ui">64</span></td><td>8×8</td><td>64</td></tr>
      </tbody>
    </table>
    <p>Tap any chip and the board re-renders to that grid immediately — there is no commit step.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-grid-size-25-mines-3.png",
        "25-tile board with 3 mines selected.",
        "5×5 layout. Mine presets show 1 / 3 / 5 / 10 / Custom.",
    )
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-grid-size-36-mines-2.png",
        "36-tile board with 2 mines selected.",
        "6×6 layout. Mine presets shift to 2 / 5 / 10 / 15 / Custom.",
    )
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-grid-size-49-mines-3.png",
        "49-tile board with 3 mines selected.",
        "7×7 layout. Mine presets become 3 / 10 / 15 / 30 / Custom.",
    )
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-grid-size-64-mines-4.png",
        "64-tile board with 4 mines selected.",
        "8×8 layout — the largest available. Mine presets are 4 / 15 / 25 / 35 / Custom.",
    )
    + dedent("""

    <h3>6.2 Mine presets adapt to the grid</h3>
    <p>The Number of Mines row redraws itself when you switch grid size. The presets are hand-picked by the game designers per grid.</p>
    <table>
      <thead><tr><th>Grid</th><th>Preset chips</th></tr></thead>
      <tbody>
        <tr><td><span class="ui">25</span></td><td><code>1 · 3 · 5 · 10 · Custom</code></td></tr>
        <tr><td><span class="ui">36</span></td><td><code>2 · 5 · 10 · 15 · Custom</code></td></tr>
        <tr><td><span class="ui">49</span></td><td><code>3 · 10 · 15 · 30 · Custom</code></td></tr>
        <tr><td><span class="ui">64</span></td><td><code>4 · 15 · 25 · 35 · Custom</code></td></tr>
      </tbody>
    </table>

    <h3>6.3 The Custom field</h3>
    <p>Tap <span class="ui">Custom</span> and the chip becomes a numeric input. Enter any whole number the engine accepts. The placeholders observed in the captures suggest the upper limit is <code>grid - 1</code> (24 on a 25-grid, 35 on a 36-grid).</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-grid-size-25-mines-custom-placeholder-24.png",
        "25-tile board with Custom = 24 mines.",
        "The most extreme legal config on the smallest board: one safe crate among twenty-four mines. Potential Win is still GEL 24.25 — same 24.25× ceiling as the 1-mine config, just inverted.",
    )
    + dedent("""

    <h3>6.4 How mine count reshapes the multiplier curve (25-grid)</h3>
    <table>
      <thead><tr><th>Mines</th><th>First six multiplier chips</th><th>Character</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>1.01 · 1.05 · 1.10 · 1.15 · 1.21 · 1.28</td><td>Gentle, very safe</td></tr>
        <tr><td>3</td><td>1.10 · 1.26 · 1.45 · 1.68 · 1.96 · 2.30</td><td>Moderate</td></tr>
        <tr><td>5</td><td>1.21 · 1.31 · 1.53 · 1.96 · 2.53 · 3.32</td><td>Steep</td></tr>
        <tr><td>10</td><td>1.62 · 2.77 · 4.90 · 8.99 · 17.16 · 34.32</td><td>Explosive — most rounds die early</td></tr>
      </tbody>
    </table>

    <div class="callout warn">
      <span class="callout-title">Operator observation — symmetric endpoints</span>
      <p><code>25 / 1 mine</code> and <code>25 / 24 mines</code> both produce a <code>24.25×</code> ceiling. Consistent with a flat 3% engine cut at the all-reveal endpoint (24.25 ÷ 25 ≈ 0.97). Stated as an observation, not a published RTP figure.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 7 — Multiplier Ladder
# -------------------------------------------------------------------------

S7 = {
    "number": "7.0",
    "slug": "multiplier-ladder",
    "title": "Reading The Multiplier Ladder",
    "summary": "The seven chips at the top of the board, what they mean, and how they animate.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>Across the very top of the play board is a horizontal row of seven small chips. This is the <strong>multiplier ladder</strong>. Each chip shows the multiplier your stake will be at after the next safe reveal.</p>

    <h3>7.1 What the chips show</h3>
    <ul>
      <li>The first chip is the multiplier after your <strong>first</strong> safe reveal.</li>
      <li>The second chip is the multiplier after your <strong>second</strong> safe reveal.</li>
      <li>...and so on for seven steps.</li>
    </ul>

    <h3>7.2 The active chip lights up</h3>
    <p>During a live round, the chip representing your current multiplier highlights in yellow. This is the simplest "where am I on the curve?" indicator the game gives you.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png",
        "Multiplier ladder with x1.01 chip lit yellow after the first reveal.",
        "First chip x1.01 is now highlighted. The other six chips preview upcoming steps.",
    )
    + dedent("""

    <h3>7.3 Why the values change between rounds</h3>
    <p>The seven values you see depend entirely on the current grid + mine configuration. They re-render every time you change either setting, <em>before</em> you start the round. Compare:</p>
    <ul>
      <li><strong>25/1</strong> starts at <code>x1.01</code> — a gentle climb.</li>
      <li><strong>25/10</strong> starts at <code>x1.62</code> — a near-vertical climb.</li>
      <li><strong>49/3</strong> starts at <code>x1.03</code> — a very gentle climb because there are 46 safe tiles out of 49.</li>
    </ul>

    <div class="callout warn">
      <span class="callout-title">Operator note — ladder length</span>
      <p>Only seven chips are visible at any time. For configurations with many safe tiles (e.g. 25/1 has 24 safe tiles) the player will clear all seven visible chips and keep playing — the Cashout button amount is then the source of truth. Confirm with engineering whether the ladder paginates, scrolls, or simply stops updating past chip 7.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 8 — Playing A Manual Round
# -------------------------------------------------------------------------

S8 = {
    "number": "8.0",
    "slug": "playing-a-manual-round",
    "title": "Playing A Manual Round — Start, Hover, Reveal, Dice",
    "summary": "Walk through the bet-staked state, the dice, and what happens between clicks.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <h3>8.1 Pressing Start</h3>
    <p>With your bet, grid, and mines configured, tap the big green button at the bottom of the side-panel. On the Minescape skin it reads <span class="ui green">Start Mission</span>; on the Aviator skin it reads <span class="ui green">Start Bet</span>. Either way, the moment you press it:</p>
    <ol class="steps">
      <li>The bet amount is deducted from your balance immediately.</li>
      <li>The bet, grid, and mine controls grey out and lock.</li>
      <li>The green CTA is replaced by a yellow <span class="ui">Cashout</span> button showing <code>GEL 0.00</code>.</li>
      <li>A small dice icon appears beside the Cashout button.</li>
      <li>The board on the right becomes interactive.</li>
    </ol>

    <h3>8.2 The bet-placed state</h3>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-bet-placed-hover-tile.png",
        "Bet placed — controls locked, Cashout button visible, hovering a closed crate shows a yellow glow.",
        "Bet-placed state. Balance dropped (1000 → 999), controls are dim, Cashout reads GEL 0.00, and the hovered crate glows yellow.",
    )
    + dedent("""

    <p>From here you can:</p>
    <ul>
      <li><strong>Hover</strong> any closed crate to see it glow yellow (purely visual, commits nothing).</li>
      <li><strong>Click</strong> any closed crate to reveal it.</li>
      <li><strong>Tap the dice</strong> to have the engine reveal one random crate for you.</li>
      <li><strong>Tap Cashout</strong> at any time to end the round in a win (though pressing it at <code>GEL 0.00</code> would forfeit the stake with no payout).</li>
    </ul>

    <h3>8.3 What you cannot do</h3>
    <p>Once the bet is staked, the following are locked until the round ends (cashout or mine):</p>
    <ul>
      <li>Change the Bet Amount.</li>
      <li>Change the Grid Size or Number of Mines.</li>
      <li>Switch between Manual and Auto tabs.</li>
      <li>Open the Advanced Settings panel.</li>
    </ul>

    <div class="callout info">
      <span class="callout-title">Pre-bet click protection</span>
      <p>The asset <code>clicking-on-box-while-bet-isn-t-placed.gif</code> proves it: tapping a crate <em>before</em> staking a bet does nothing. The board is intentionally inert until a bet exists.</p>
    </div>

    <h3>8.4 The dice (randomize) button</h3>
    <p>The dice icon next to Cashout reveals one tile, chosen by the engine. It is one click per press — it does not auto-cash-out and it does not reveal multiple tiles. It exists for two reasons:</p>
    <ul>
      <li><strong>Momentum</strong> — players who do not want to overthink can mash the dice.</li>
      <li><strong>Auto-mode parity</strong> — the same icon is used in Auto Mode to randomize tile selection (see Section 10).</li>
    </ul>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 9 — Winning And Losing
# -------------------------------------------------------------------------

S9 = {
    "number": "9.0",
    "slug": "winning-and-losing",
    "title": "Winning And Losing A Round",
    "summary": "What changes on a safe reveal, on a cashout, and on a mine hit.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <h3>9.1 A safe reveal</h3>
    <p>The clicked crate opens to show a green icon (money-bag / dollar / gem). The multiplier ladder advances by one step. The Cashout button amount updates to <code>bet × current multiplier</code>. The balance in the header does <em>not</em> change yet — it only changes when the round resolves.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png",
        "One safe tile open at x1.01 — Cashout button reads GEL 1.01.",
        "First safe reveal: green icon, x1.01 chip lit yellow, Cashout button now shows 1.01 GEL — exactly bet (1.00) × multiplier (1.01).",
    )
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-multiple-tiles-open-cashout-active.png",
        "Multiple safe tiles open — Cashout amount has climbed.",
        "Several reveals later. The Cashout amount on the button is always the live source of truth for the next moment's payout.",
    )
    + dedent("""

    <h3>9.2 Cashing out</h3>
    <p>The yellow Cashout button is how you turn an unfinished round into a real win. The label is always <code>Cashout GEL X.XX</code> where <code>X.XX</code> is the exact GEL you will receive if you tap it right now.</p>
    <p>The moment you tap Cashout:</p>
    <ol class="steps">
      <li>The round ends.</li>
      <li>The GEL amount shown on the button is added to your balance — the header balance updates.</li>
      <li>The panel returns to its default state. Bet, grid, and mine controls become editable again.</li>
      <li>You can start a new round immediately.</li>
    </ol>

    <div class="callout info">
      <span class="callout-title">The discipline test</span>
      <p>If you would not press Start Bet for the amount the Cashout button currently shows, press Cashout. That gut-check is the single best filter against "one more click" regret.</p>
    </div>

    <h3>9.3 Hitting a mine</h3>
    <p>If a click lands on a mine, the round ends instantly, the staked bet is forfeited, and the panel snaps back to setup. There is no continue, no second chance, no save-with-payment mechanic.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-lose-state-mine-revealed.png",
        "Lose state — mine revealed on the board, panel reset to default.",
        "Mine revealed in red. The bet panel has already snapped back to Setup with Start Mission re-enabled. Behind the panel you can see previously revealed safe tiles and the now-revealed mine.",
    )
    + dedent("""

    <div class="callout warn">
      <span class="callout-title">Emotional traps after a loss</span>
      <ul>
        <li><em>"I should chase it back with a bigger bet."</em> The next round has no memory of the last round.</li>
        <li><em>"I had a bad pattern."</em> There is no pattern. Mines are randomised every round.</li>
        <li><em>"I should switch to a higher-mine config to make up for it."</em> More mines means more rounds end in mines. It compounds the bad feeling.</li>
      </ul>
      <p>If you feel any of these, step away for a minute.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 10 — Auto Mode Tile Selection
# -------------------------------------------------------------------------

S10 = {
    "number": "10.0",
    "slug": "auto-mode-tile-selection",
    "title": "Auto Mode — Pre-Selecting Tiles",
    "summary": "Why Auto Mode needs pre-selected tiles and how the dice randomizes them.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>Tapping the <span class="ui">Auto</span> tab in Region B switches the panel into autoplay configuration. The bet, grid, and mines controls are unchanged, but two things appear: an <span class="ui">Advanced Settings</span> strip (Section 11) and a requirement to <strong>pre-select which crates the engine should open</strong> on each automated round.</p>

    <h3>10.1 Manual tile selection</h3>
    <p>Tap any closed crate on the board. It marks the crate with a green icon while leaving it closed. Each marked crate becomes a tile the engine will open during each round, in tap order.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-selected-tiles-start-autobet.png",
        "Auto mode — several crates pre-selected, Start Autobet enabled.",
        "Marked crates carry a green icon while still closed. The Start Autobet CTA is enabled because the selection is valid and the bet config is complete.",
    )
    + dedent("""

    <h3>10.2 The number of marked tiles is your round-length target</h3>
    <ul>
      <li><strong>Mark 1 crate</strong> → each round ends after a single safe reveal at the first ladder multiplier.</li>
      <li><strong>Mark 6 crates</strong> → each round ends after six safe reveals (assuming none are a mine), cashing out at the sixth ladder multiplier.</li>
      <li><strong>Mark every safe crate</strong> → you are betting for the maximum potential win every round.</li>
    </ul>

    <h3>10.3 Random tile selection (dice)</h3>
    <p>The dice icon picks a set of crates for you. Tap it again to roll a new random selection. Useful for hands-off, no-decision sessions.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-random-tile-selection.png",
        "Auto mode — dice has randomised the tile selection.",
        "Dice-chosen crates marked. Press the dice again for a fresh random pattern. Hand-tapping a crate after a dice roll just adds it to the selection.",
    )
    + dedent("""

    <div class="callout warn">
      <span class="callout-title">Operator note — tile-count rules</span>
      <p>The number of crates the dice marks is not directly captured in the screenshots. Confirm with engineering whether it is a fixed share of the grid, a configurable preference, or random within a range.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 11 — Auto Mode Advanced Settings
# -------------------------------------------------------------------------

S11_MARKERS_ADV = [
    {"kind": "shape", "label": "Payout On Win",     "color_role": "blue",  "x": 7,  "y": 14, "w": 16, "h": 7,  "description": "Target multiplier — engine auto-cashes-out when reached."},
    {"kind": "shape", "label": "Number Of Bets",    "color_role": "blue",  "x": 24, "y": 14, "w": 16, "h": 7,  "description": "How many rounds to run. Infinity icon = unlimited."},
    {"kind": "shape", "label": "On Win",            "color_role": "blue",  "x": 7,  "y": 24, "w": 16, "h": 10, "description": "After a winning round: Reset stake or Increase by X%."},
    {"kind": "shape", "label": "On Loss",           "color_role": "blue",  "x": 24, "y": 24, "w": 16, "h": 10, "description": "After a losing round: Reset stake or Increase by X%."},
    {"kind": "shape", "label": "Stop On Profit",    "color_role": "green", "x": 7,  "y": 36, "w": 16, "h": 7,  "description": "Halt loop when cumulative profit ≥ this GEL value."},
    {"kind": "shape", "label": "Stop On Loss",      "color_role": "red",   "x": 24, "y": 36, "w": 16, "h": 7,  "description": "Halt loop when cumulative loss ≥ this GEL value."},
    {"kind": "shape", "label": "Start Autobet",     "color_role": "green", "x": 7,  "y": 75, "w": 28, "h": 7,  "description": "Commits the configuration and starts the loop."},
]

S11 = {
    "number": "11.0",
    "slug": "auto-mode-advanced-settings",
    "title": "Auto Mode — Advanced Settings",
    "summary": "Six configurable fields that define the autobet loop, explained one at a time.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>Tap the <span class="ui">Advanced Settings</span> strip in the Auto-mode panel and it expands into a configuration panel with six fields plus the green <span class="ui green">Start Autobet</span> CTA.</p>

    """).strip()
    + "\n\n    "
    + annotated_img(
        "/images/minescape/aviator-minescape-auto-mode-advanced-settings.png",
        "Advanced Settings panel with all six fields labelled.",
        "All six fields are configured once and persist until you change them.",
        S11_MARKERS_ADV,
    )
    + dedent("""

    <h3>11.1 Payout On Win</h3>
    <p>The target multiplier at which a round automatically cashes out. Format: a number with an <code>x</code> prefix, e.g. <code>2.00x</code>. Lower values cash out quickly and often; higher values aim for bigger payouts but more rounds end in mines first.</p>

    <h3>11.2 Number Of Bets</h3>
    <p>How many rounds the loop will play. Either a whole number (e.g. <code>10</code>) or an infinity icon (<code>∞</code>) for unlimited. The Stop Autobet button while running shows the remaining/total counter (e.g. <code>2/10</code>).</p>

    <h3>11.3 On Win</h3>
    <p>What to do with the stake after a winning round. Two choices:</p>
    <ul>
      <li><strong>Reset</strong> — return the next round's bet to the original starting bet.</li>
      <li><strong>Increase by X%</strong> — multiply the next round's bet by <code>(100 + X) / 100</code>.</li>
    </ul>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png",
        "On Win set to Increase by 5%, 10 bets queued, 2 remaining, a win has just occurred.",
        "On Win: Increase by 5%. 8 of 10 rounds played, 2 remain. A green payout popup on the board shows the round outcome.",
    )
    + dedent("""

    <h3>11.4 On Loss</h3>
    <p>What to do with the stake after a losing round. Same choices: Reset or Increase by X%. <code>Increase by 20%</code> is a classic Martingale-style setting — it recovers prior losses if a win lands, but compounds quickly without a Stop On Loss safety net.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png",
        "On Loss set to Increase by 20%, autobet not yet started.",
        "On Loss: Increase by 20%. Start Autobet still green because the loop has not yet been started.",
    )
    + dedent("""

    <h3>11.5 Stop On Profit and Stop On Loss</h3>
    <p>Two boundary conditions that protect you from runaway sessions. Both are measured against <strong>cumulative profit/loss since pressing Start Autobet</strong>, not against your overall balance.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png",
        "Stop On Profit 10 GEL, Stop On Loss 20 GEL — a 2:1 risk:reward guard.",
        "Concrete stops: take 10 GEL of profit and stop, or stop at 20 GEL of loss. A 2:1 risk:reward configuration.",
    )
    + dedent("""

    <div class="callout warn">
      <span class="callout-title">Operator note — validate ranges</span>
      <p>Confirm the allowed ranges for: Payout On Win (min/max multiplier), Number Of Bets (max value), On Win / On Loss percentage step and ceiling, Stop On Profit / Loss (min/max GEL). Document each in the operator reference so support can answer "why won't it accept my value?" first time.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 12 — Autobet Running, Winning, Losing, Stopping
# -------------------------------------------------------------------------

S12 = {
    "number": "12.0",
    "slug": "autobet-running-stopping",
    "title": "Autobet — Running, Winning, Losing, Stopping",
    "summary": "What the loop looks like in flight and the four ways it ends.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <h3>12.1 Starting the loop</h3>
    <p>Once everything is configured — bet amount, grid, mines, tile selection, Advanced Settings — tap <span class="ui green">Start Autobet</span>. Immediately:</p>
    <ul>
      <li>The green CTA flips to a red <span class="ui">Stop Autobet</span> with a remaining-bets counter.</li>
      <li>All configuration controls lock.</li>
      <li>The engine begins playing rounds in sequence.</li>
    </ul>

    <h3>12.2 A winning round</h3>
    <p>When a round cashes out successfully, a small green payout popup floats over the board.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-win-state-infinite-rounds.png",
        "Auto mode winning round — green payout popup on the board.",
        "Winning round inside an unlimited-rounds session. Popup shows GEL paid and profit (e.g. GEL 30.30 +2.928). Stop Autobet stays red; the loop continues.",
    )
    + "\n\n    "
    + img(
        "/images/minescape/screenshot-2026-05-29-at-18-28-59.png",
        "Mid-session autobet capture with a payout popup visible.",
        "Same idea from a different round. The fraction beside the Stop Autobet button shows how many rounds remain.",
    )
    + dedent("""

    <h3>12.3 A losing round — the loop does NOT stop</h3>
    <p>This is the most important thing to understand about Auto Mode: a single mine does not halt the loop. The engine resolves the round, marks it as a loss, applies the On Loss rule to the next stake, decrements the counter, and starts the next round.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-auto-mode-lose-state-continues.png",
        "Auto mode losing round — mine visible, Stop Autobet still red and live.",
        "Mine revealed inside autobet. The red Stop Autobet button is still live with its counter — the loop continues to the next round.",
    )
    + dedent("""

    <h3>12.4 The four halt conditions</h3>
    <p>There are exactly four ways for an autobet session to end:</p>
    <ol class="steps">
      <li><strong>Player taps Stop Autobet.</strong> The red button at the bottom. Instant halt — engine finishes the current in-flight round, then stops.</li>
      <li><strong>Stop On Profit fires.</strong> Cumulative session profit ≥ the configured threshold.</li>
      <li><strong>Stop On Loss fires.</strong> Cumulative session loss ≥ the configured threshold.</li>
      <li><strong>Number Of Bets counter reaches zero.</strong> Last configured round finishes; engine halts.</li>
    </ol>

    <div class="callout important">
      <span class="callout-title">A single losing round is NOT a halt condition</span>
      <p>If you want the loop to stop after one loss, set <code>Number Of Bets = 1</code>. There is no other affordance for it.</p>
    </div>

    <p>When the session ends, the panel returns to its Auto Setup state with the green Start Autobet CTA. Your configured rules persist; you do not have to re-enter them.</p>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 13 — Menu, Provably Fair, Versioning
# -------------------------------------------------------------------------

S13 = {
    "number": "13.0",
    "slug": "menu-provably-fair-versioning",
    "title": "Menu, Provably Fair, Versioning",
    "summary": "Burger menu entries, the Provably Fair badge, and the version footer.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <h3>13.1 The burger menu</h3>
    <p>The <code>☰</code> icon in the header opens a slide-in menu overlaying the bet panel. It is taller than a single screen — scroll to see the bottom entries.</p>

    """).strip()
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-burger-menu-open.png",
        "Burger menu — top half visible with username and three toggles.",
        "Top of the menu: masked username with edit pencil, Sound / Music / Dark mode toggles, My Bets link.",
    )
    + "\n\n    "
    + img(
        "/images/minescape/aviator-minescape-burger-menu-scrolled.png",
        "Burger menu — scrolled to reveal Rules and Limits entries.",
        "Scrolling down past Music and Dark mode reveals Rules and Limits.",
    )
    + dedent("""

    <table>
      <thead><tr><th>Entry</th><th>Type</th><th>What it does</th></tr></thead>
      <tbody>
        <tr><td class="col-key">Username + pencil</td><td>Link</td><td>Opens the platform's profile / account settings screen.</td></tr>
        <tr><td class="col-key">Sound</td><td>Toggle</td><td>SFX (clicks, chimes, mine boom).</td></tr>
        <tr><td class="col-key">Music</td><td>Toggle</td><td>Background music — independent of SFX.</td></tr>
        <tr><td class="col-key">Dark mode</td><td>Toggle</td><td>Theme switch. All captures show dark mode.</td></tr>
        <tr><td class="col-key">My Bets</td><td>Link</td><td>Bet history. Used by support for ticket reconciliation.</td></tr>
        <tr><td class="col-key">Rules</td><td>Link</td><td>Operator-published rules — authoritative if this guide disagrees.</td></tr>
        <tr><td class="col-key">Limits</td><td>Link</td><td>Responsible play — daily / weekly caps, session timer, self-exclusion.</td></tr>
      </tbody>
    </table>

    <div class="callout warn">
      <span class="callout-title">Operator note — toggle persistence</span>
      <p>All three toggles default to ON in the captured evidence. Persistence scope (per-session / per-device / per-account) is not directly visible from screenshots. Confirm with engineering before publishing player-facing copy on this.</p>
    </div>

    <h3>13.2 The Provably Fair badge</h3>
    <p>At the bottom of the side-panel sits a green shield with the text <strong>"Provably Fair Game"</strong>. It is a clickable affordance that opens a verification page where any past round can be independently validated.</p>
    <p><em>What that actually means for players:</em> before the round, the engine commits to the round's outcome (publishes a cryptographic hash). After the round, the engine reveals the inputs and you can recompute the hash to confirm the engine did not change the outcome retroactively.</p>

    <h3>13.3 The version footer</h3>
    <p>The footer also shows <code>Version 1.0.0</code> and the client clock. The version string is useful for support — quote it when reporting a bug.</p>

    <div class="callout important">
      <span class="callout-title">Operator note — Provably Fair URL must be live</span>
      <p>Before launching the game on any platform, confirm the verification URL behind the Provably Fair badge is wired up and returns sensible data. A broken Provably Fair link is a regulator-grade issue.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 14 — Worked Examples And Common Mistakes
# -------------------------------------------------------------------------

S14 = {
    "number": "14.0",
    "slug": "worked-examples-and-mistakes",
    "title": "Worked Examples And Common Mistakes",
    "summary": "Three example sessions and the eight most common beginner mistakes.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>Three example sessions to illustrate how Manual and Auto play actually feel in practice. The numbers are illustrative; the engine behaviour is exactly as the captures show.</p>

    <h3>14.1 A cautious Manual session</h3>
    <p><strong>Setup:</strong> Balance 1000 GEL, Bet 10 GEL, Grid 25, Mines 1, Mode Manual.</p>
    <p>You play five rounds at 10 GEL each. Three of them you cash out for small profits (1.50 / 2.50 / 4.00 GEL); two of them hit a mine after one reveal (losing 10 GEL each). Net: <code>+8 − 20 = −12 GEL</code>. You finish at 988 GEL.</p>
    <div class="callout info">
      <span class="callout-title">Lesson</span>
      <p>Even on the friendliest configuration in the game, the first click has a 1/25 chance of a mine. Small samples are unkind. This is a perfectly normal session — do not chase.</p>
    </div>

    <h3>14.2 An aggressive Manual session</h3>
    <p><strong>Setup:</strong> Same balance and stake, but Mines 10.</p>
    <p>Round 1 you survive two reveals (multiplier x2.77, Cashout 27.70) but go for a third and hit a mine. You try three more times: one cashout at x2.77 (+17.70 GEL), three mines (−30 GEL). Net: <code>+17.70 − 30 = −12.30 GEL</code>. You finish at 987.70 GEL.</p>
    <div class="callout warn">
      <span class="callout-title">Lesson</span>
      <p>At 10 mines on a 25 grid, after two safe reveals the probability of the third being a mine is roughly 10/23 ≈ 43%. Take the second-chip cashout — do not let the ladder tempt you.</p>
    </div>

    <h3>14.3 An Autobet session with stop conditions</h3>
    <p><strong>Setup:</strong> Bet 10 GEL, Grid 25, Mines 3, four tiles marked. Advanced Settings: Payout On Win 1.45x, Number Of Bets 20, On Win Reset, On Loss Reset, Stop On Profit 25 GEL, Stop On Loss 50 GEL.</p>
    <p>Press Start Autobet. The engine plays rounds at the same flat 10 GEL stake, cashing out winners at 14.50 GEL and losing 10 GEL on mine hits. The loop halts the first time cumulative profit hits +25 GEL <em>or</em> cumulative loss hits −50 GEL <em>or</em> the counter reaches zero.</p>
    <div class="callout info">
      <span class="callout-title">Lesson</span>
      <p>A flat-bet autobet with both stop conditions set is the closest Minescape has to a "sustainable session." Whatever the outcome, you have spent a fixed maximum (Stop On Loss) and aimed for a fixed target (Stop On Profit). That is a session you can repeat with discipline.</p>
    </div>

    <h3>14.4 Eight common beginner mistakes</h3>
    <ol class="steps">
      <li><strong>Confusing the Potential Win bar with the next-click payout.</strong> Potential Win is the all-reveals ceiling; the Cashout button is the live payout.</li>
      <li><strong>Assuming Max means "all-in."</strong> Max is the operator's per-bet ceiling, not your balance.</li>
      <li><strong>Misreading the comma decimal.</strong> <code>GEL 1,00</code> is one GEL, not one hundred.</li>
      <li><strong>Trying to switch modes mid-round.</strong> Tabs are locked while a bet is staked.</li>
      <li><strong>Believing in patterns.</strong> Mine positions are server-randomised every round.</li>
      <li><strong>Chasing losses with bigger bets.</strong> Each round is independent. The engine owes you nothing.</li>
      <li><strong>Forgetting Stop On Loss in Auto Mode.</strong> Without it, Increase on Loss can drain a session in a single bad streak.</li>
      <li><strong>Pressing Cashout when the button reads GEL 0.00.</strong> Forfeits the stake with no payout.</li>
    </ol>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 15 — Operator Reference And Glossary
# -------------------------------------------------------------------------

S15 = {
    "number": "15.0",
    "slug": "operator-reference",
    "title": "Operator Reference And Glossary",
    "summary": "Verify-with-engineering checklist, glossary, and frequently asked questions.",
    "status": "published",
    "owner": "Docs",
    "body_html": dedent("""
    <h3>15.1 Operator verification checklist</h3>
    <p>Confirm each row with engineering before treating this guide as authoritative.</p>
    <table>
      <thead><tr><th>Topic</th><th>What the captures show</th><th>Confirm with engineering</th></tr></thead>
      <tbody>
        <tr><td class="col-key">Currency</td><td>GEL (Georgian Lari)</td><td>Per-locale currency support</td></tr>
        <tr><td class="col-key">Decimal format</td><td><code>GEL X,XX</code> comma decimal</td><td>Per-locale formatting overrides</td></tr>
        <tr><td class="col-key">Smallest captured bet</td><td><code>GEL 1,00</code></td><td>Engine-side hard minimum</td></tr>
        <tr><td class="col-key">Max button ceiling</td><td><code>GEL 400,00</code> on a <code>20000 GEL</code> balance</td><td>Cap source (config / VIP tier / regulator)</td></tr>
        <tr><td class="col-key">Grid sizes</td><td>25, 36, 49, 64</td><td>All four supported on every skin</td></tr>
        <tr><td class="col-key">Mine presets per grid</td><td>25:1/3/5/10 · 36:2/5/10/15 · 49:3/10/15/30 · 64:4/15/25/35</td><td>Custom field allowed range per grid</td></tr>
        <tr><td class="col-key">Custom mine upper bound</td><td>Placeholder 24 on grid 25, 35 on grid 36</td><td>Same <code>grid − 1</code> rule on grids 49 and 64</td></tr>
        <tr><td class="col-key">Multiplier ladder length</td><td>7 visible chips</td><td>Scroll / paginate / freeze behaviour past chip 7</td></tr>
        <tr><td class="col-key">Pre-bet click on crate</td><td>No-op (confirmed by GIF)</td><td>Same on touch and mouse input</td></tr>
        <tr><td class="col-key">Auto stop conditions</td><td>4 (manual, profit, loss, counter)</td><td>No additional balance-floor halt</td></tr>
        <tr><td class="col-key">On Win / On Loss rules</td><td>Reset or Increase by X%</td><td>Allowed percentage range</td></tr>
        <tr><td class="col-key">Menu entries</td><td>Username · Sound · Music · Dark mode · My Bets · Rules · Limits</td><td>Regulator-required additions per market</td></tr>
        <tr><td class="col-key">Branding skins</td><td>Minescape (Start Mission) · Aviator (Start Bet)</td><td>Full approved-skin list</td></tr>
        <tr><td class="col-key">Provably Fair link</td><td>Footer badge</td><td>Live verification page before launch</td></tr>
        <tr><td class="col-key">Toggle persistence</td><td>All default ON</td><td>Persistence scope (account vs device)</td></tr>
      </tbody>
    </table>

    <h3>15.2 Glossary</h3>
    <dl class="ui-list">
      <dt>Auto / Autobet</dt><dd>The mode that runs rounds on a configured loop.</dd>
      <dt>Balance</dt><dd>Your available money on the platform, in GEL.</dd>
      <dt>Cashout</dt><dd>Lock in your current multiplier and end the round in profit.</dd>
      <dt>Crate</dt><dd>A closed tile on the play board. Click to reveal.</dd>
      <dt>Custom (mines)</dt><dd>A numeric input replacing the Custom preset chip.</dd>
      <dt>Dice icon</dt><dd>Reveals a random tile during a round; randomizes tile selection in Auto Mode.</dd>
      <dt>GEL</dt><dd>Georgian Lari — the currency used in the captures.</dd>
      <dt>Grid Size</dt><dd>The total number of crates on the board (25, 36, 49, 64).</dd>
      <dt>Manual</dt><dd>The mode where you personally click each crate.</dd>
      <dt>Marked crate</dt><dd>A crate the player (or dice) has tapped for Auto Mode to open.</dd>
      <dt>Mine</dt><dd>A hidden danger. Reveal one and the round ends in a loss.</dd>
      <dt>Multiplier ladder</dt><dd>The seven chips at the top of the board.</dd>
      <dt>Number Of Bets</dt><dd>Auto Mode: how many rounds to play.</dd>
      <dt>On Win / On Loss</dt><dd>Auto Mode rules for adjusting the next round's stake.</dd>
      <dt>Payout On Win</dt><dd>The multiplier at which Auto Mode auto-cashes-out.</dd>
      <dt>Potential Win</dt><dd>Bet × ceiling multiplier — the best case.</dd>
      <dt>Provably Fair</dt><dd>Cryptographic protocol committing to round outcomes before play.</dd>
      <dt>Safe tile</dt><dd>A crate that contains no mine.</dd>
      <dt>Skin</dt><dd>A branding variant (Minescape, Aviator). Same engine, different wordmark.</dd>
      <dt>Stop On Loss / Stop On Profit</dt><dd>Auto Mode boundary conditions that halt the loop.</dd>
    </dl>

    <h3>15.3 Frequently asked questions</h3>
    <dl class="ui-list">
      <dt>The header says Aviator on my screen but the docs say Minescape — which is right?</dt>
      <dd>Both. Same engine, different operator skin. The only differences are the wordmark and the setup CTA copy.</dd>
      <dt>I pressed Max and only got 400 GEL with a much higher balance — bug?</dt>
      <dd>No. Max clamps to the operator's per-bet ceiling, not your balance.</dd>
      <dt>What is the Potential Win bar actually telling me?</dt>
      <dd>Best-case payout — bet × ceiling multiplier — assuming every safe tile is revealed.</dd>
      <dt>Why do the mine-count chips change when I change grid size?</dt>
      <dd>The presets are hand-picked per grid by the game designers. Custom is always available.</dd>
      <dt>What does the dice do during a live round?</dt>
      <dd>Reveals one tile chosen by the engine. Not a multi-tile shortcut, not an auto-cashout.</dd>
      <dt>Why is Cashout available with GEL 0.00 on it?</dt>
      <dd>The engine allows you to abandon the round at any moment, even before any reveal. Pressing it forfeits your stake.</dd>
      <dt>Can I change my bet after pressing Start?</dt>
      <dd>No — bet, grid, and mines all lock until the round resolves.</dd>
      <dt>What stops the autobet loop?</dt>
      <dd>Exactly four things: manual Stop, Stop On Profit, Stop On Loss, or Number Of Bets counter at zero. A single losing round does not stop the loop.</dd>
      <dt>Do the menu toggles persist?</dt>
      <dd>Captures show them defaulting ON. Persistence scope not directly visible; confirm with engineering.</dd>
      <dt>What happens if I lose connection?</dt>
      <dd>Not visible in the captures. The engine is server-side and provably fair, so the round seed is already committed — but the recovery behaviour (auto-resume vs auto-cashout) needs to be confirmed before publishing player-facing copy.</dd>
    </dl>

    <div class="callout info">
      <span class="callout-title">Authority</span>
      <p>If anything in this manual contradicts the operator's <strong>Rules</strong> page (linked from the burger menu), the Rules page is authoritative.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 16 — Operator Reference Matrix (detailed, with confirmation status)
# -------------------------------------------------------------------------

S16 = {
    "number": "16.0",
    "slug": "operator-reference-matrix",
    "title": "Operator Reference Matrix — Confirmed Vs Needs Engineering",
    "summary": "Every player-visible behaviour, labelled ✅ Confirmed (directly visible in a screenshot) or ⚠ Confirm with engineering before public claims.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>This matrix is the authoritative status of every behavioural claim a casino operator or aggregator might ask about. Rows marked <strong>✅ Confirmed</strong> are anchored to a specific screenshot in <code>public/images/minescape/</code> and may be repeated externally. Rows marked <strong>⚠ Confirm with engineering</strong> are <em>not</em> directly visible in the captures and must not appear in operator decks, T&Cs, or account-manager statements until engineering signs off.</p>

    <div class="callout info">
      <span class="callout-title">How to use this matrix</span>
      <p>Before an operator/aggregator call, scan the ⚠ rows and triage which apply to the deployment. Anything that cannot be confirmed in time should be quoted from §17 (Open Engineering Questions) verbatim — never paraphrased.</p>
    </div>

    <h3>16.1 Status matrix</h3>
    <table>
      <thead><tr><th>Topic</th><th>Status</th><th>What the captures show</th></tr></thead>
      <tbody>
        <tr><td class="col-key">Currency</td><td>✅ Confirmed</td><td><code>GEL</code> (Georgian Lari) throughout.</td></tr>
        <tr><td class="col-key">Decimal format</td><td>✅ Confirmed</td><td>Bet field: comma decimal <code>GEL X,XX</code>. Helper bars: period decimal <code>GEL X.XX</code>.</td></tr>
        <tr><td class="col-key">Min bet observed</td><td>✅ Confirmed at <code>GEL 1,00</code></td><td>Lowest stake in any capture. Engine-side hard minimum unknown.</td></tr>
        <tr><td class="col-key">Max-button cap observed</td><td>✅ Confirmed at <code>GEL 400,00</code> on a 20,000 GEL balance</td><td>Max clamps to operator ceiling — direct proof Max ≠ all-in.</td></tr>
        <tr><td class="col-key">Grid sizes</td><td>✅ Confirmed</td><td>25 (5×5), 36 (6×6), 49 (7×7), 64 (8×8).</td></tr>
        <tr><td class="col-key">Mine presets per grid</td><td>✅ Confirmed</td><td>25:1/3/5/10/Custom · 36:2/5/10/15/Custom · 49:3/10/15/30/Custom · 64:4/15/25/35/Custom.</td></tr>
        <tr><td class="col-key">Custom upper bound (grid 25 / 36)</td><td>✅ Confirmed placeholder 24 and 35</td><td>Consistent with <code>grid − 1</code>.</td></tr>
        <tr><td class="col-key">Custom upper bound (grid 49 / 64)</td><td>⚠ Confirm with engineering</td><td>Likely 48 and 63 by the <code>grid − 1</code> pattern but not directly captured.</td></tr>
        <tr><td class="col-key">Multiplier ladder length</td><td>✅ Confirmed at 7 visible chips</td><td>7th chip clips visually on the right edge in some captures.</td></tr>
        <tr><td class="col-key">Ladder behaviour past chip 7</td><td>⚠ Confirm with engineering</td><td>Scroll, paginate, or freeze on long rounds?</td></tr>
        <tr><td class="col-key">Ladder refresh on Custom</td><td>⚠ Bug suspected</td><td>Captures of 25/24 and 36/35 Custom show stale ladder from previous selection.</td></tr>
        <tr><td class="col-key">Potential Win formula</td><td>✅ Confirmed</td><td><code>bet × ceiling multiplier</code>; ratio identical across 5/10/100/400 GEL bets at 25/1 (24.25×).</td></tr>
        <tr><td class="col-key">Round commit timing</td><td>✅ Confirmed</td><td>Stake debited on Start press; balance updates only on Cashout / autobet payout / loss.</td></tr>
        <tr><td class="col-key">Bet-placed control lock</td><td>✅ Confirmed</td><td>Bet, grid, mines, mode tabs all disabled while a round is live.</td></tr>
        <tr><td class="col-key">Pre-bet click on crate</td><td>✅ Confirmed no-op</td><td>Direct proof in <code>clicking-on-box-while-bet-isn-t-placed.gif</code>.</td></tr>
        <tr><td class="col-key">Cashout always available</td><td>✅ Confirmed</td><td>Available even at <code>GEL 0.00</code> (forfeit-without-payout is possible).</td></tr>
        <tr><td class="col-key">Dice button (Manual)</td><td>✅ Confirmed exists</td><td>Reveals one tile chosen at random.</td></tr>
        <tr><td class="col-key">Dice button (Auto)</td><td>✅ Confirmed exists</td><td>Randomizes tile selection.</td></tr>
        <tr><td class="col-key">Dice tile-count rule (Auto)</td><td>⚠ Confirm with engineering</td><td>Fixed share / configurable / weighted by mine count?</td></tr>
        <tr><td class="col-key">Skins shipped</td><td>✅ Confirmed</td><td>Minescape (<span class="ui">Start Mission</span>) and Aviator (<span class="ui">Start Bet</span>) — same engine.</td></tr>
        <tr><td class="col-key">Full approved-skin list</td><td>⚠ Confirm with engineering</td><td>Only two skins observed in the asset folder.</td></tr>
        <tr><td class="col-key">Auto — Payout On Win</td><td>✅ Confirmed exists</td><td>Numeric <code>N.NNx</code> field in Advanced Settings.</td></tr>
        <tr><td class="col-key">Payout On Win semantics</td><td>⚠ Confirm with engineering</td><td>Floor / ceiling / both? And how does it interact with the pre-selected tile count?</td></tr>
        <tr><td class="col-key">Auto — Number Of Bets</td><td>✅ Confirmed</td><td>Whole number or <code>∞</code>.</td></tr>
        <tr><td class="col-key">Auto — On Win rule</td><td>✅ Confirmed</td><td>Reset or Increase by % (captures show 5%).</td></tr>
        <tr><td class="col-key">Auto — On Loss rule</td><td>✅ Confirmed</td><td>Reset or Increase by % (captures show 20%).</td></tr>
        <tr><td class="col-key">Auto — Stop On Profit / Loss</td><td>✅ Confirmed</td><td>GEL thresholds.</td></tr>
        <tr><td class="col-key">Halt conditions</td><td>✅ Confirmed exactly 4</td><td>Manual Stop / Stop On Profit / Stop On Loss / Number Of Bets exhausted.</td></tr>
        <tr><td class="col-key">Single losing round halts loop</td><td>✅ Confirmed FALSE</td><td>Direct evidence: <code>aviator-minescape-auto-mode-lose-state-continues.png</code>.</td></tr>
        <tr><td class="col-key">Menu items</td><td>✅ Confirmed</td><td>Profile · Sound · Music · Dark mode · My Bets · Rules · Limits.</td></tr>
        <tr><td class="col-key">Toggle persistence scope</td><td>⚠ Confirm with engineering</td><td>Per session / per device / per account?</td></tr>
        <tr><td class="col-key">Provably Fair badge</td><td>✅ Confirmed</td><td>Footer badge with shield + label.</td></tr>
        <tr><td class="col-key">Provably Fair URL</td><td>⚠ Confirm per operator</td><td>Destination is operator-configured.</td></tr>
        <tr><td class="col-key">Version</td><td>✅ Confirmed</td><td><code>Version 1.0.0</code> in footer.</td></tr>
        <tr><td class="col-key">Disconnect / resume</td><td>⚠ Confirm with engineering</td><td>Not visible in captures. Round-seed binding implies safety but recovery flow unknown.</td></tr>
        <tr><td class="col-key">Reveal-all-mines after loss</td><td>⚠ Partial evidence</td><td>Behaviour varies by skin in the captures.</td></tr>
        <tr><td class="col-key">Sound / Music / Dark default</td><td>✅ Confirmed ON</td><td>All three toggles default green/on.</td></tr>
        <tr><td class="col-key">Mobile / touch parity</td><td>⚠ Confirm with engineering</td><td>Captures are desktop only.</td></tr>
      </tbody>
    </table>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 17 — Open Engineering Questions (16 prioritized items)
# -------------------------------------------------------------------------

S17 = {
    "number": "17.0",
    "slug": "open-engineering-questions",
    "title": "Open Engineering Questions — What Operators Need Answered Before Launch",
    "summary": "Sixteen prioritized items engineering must confirm before any launching operator can sign off on a deployment.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>The captures prove a great deal about how Minescape behaves, but they cannot prove everything. The list below is the prioritized backlog of questions engineering must answer before a launching operator can take responsibility for the game in their market. The order is roughly by blocking risk — items at the top are most likely to derail an operator conversation if unanswered.</p>

    <div class="callout warn">
      <span class="callout-title">Account-manager rule</span>
      <p>Until an item below is answered, do not state a position on it to an operator or aggregator. Quote the question verbatim and route to engineering instead.</p>
    </div>

    <h3>17.1 The backlog</h3>
    <ol class="steps">
      <li><strong>What is the engine-side minimum bet?</strong> The captures show <code>GEL 1,00</code> but the engine minimum is not stated.</li>
      <li><strong>Where does the Max-button cap come from?</strong> Operator config, VIP tier, regulator floor, or engine constant? The 400 GEL cap on a 20,000 GEL balance proves Max ≠ all-in but does not prove the cap's source.</li>
      <li><strong>What is the Custom-mines upper bound on grids 49 and 64?</strong> Likely 48 and 63 by the <code>grid − 1</code> pattern (confirmed on 25 and 36), but unconfirmed.</li>
      <li><strong>How does the ladder behave past chip 7 on long rounds?</strong> Scroll, paginate, freeze, hide?</li>
      <li><strong>Why does the ladder appear stale on Custom captures?</strong> Render lag, intentional delay until Enter / blur, or bug?</li>
      <li><strong>Payout On Win — floor, ceiling, or both?</strong> And how does it interact with the pre-selected tile count? Does it auto-cash at the first chip ≥ target, or refuse to cash above the target?</li>
      <li><strong>How does the dice button pick the Auto tile selection?</strong> Fixed share of the grid, configurable, weighted by mine count?</li>
      <li><strong>Do Stop On Profit / Loss check mid-round or at round boundary?</strong> Round-boundary is implied by the captures.</li>
      <li><strong>Sound / Music / Dark mode persistence scope.</strong> Per session, device, or account?</li>
      <li><strong>Disconnect recovery.</strong> Does a dropped connection auto-cashout, resume the round on reconnect, or void the round?</li>
      <li><strong>Post-mine reveal behaviour.</strong> Do all unopened crates reveal after a loss, or only on certain skins?</li>
      <li><strong>Full approved-skin list.</strong> Are there skins beyond Minescape and Aviator?</li>
      <li><strong>Provably Fair verification URL.</strong> Where is it hosted per operator? Is it live on every launched skin?</li>
      <li><strong>Mobile / touch parity.</strong> Captures are desktop only. Confirm gesture support, viewport scaling, and any UX differences (e.g. long-press vs hover).</li>
      <li><strong>Localization.</strong> Are all UI strings flagged for translation? In particular, the Auto-mode labels (<span class="ui">Payout On Win</span>, <span class="ui">Number Of Bets</span>, <span class="ui">On Win</span>, <span class="ui">On Loss</span>, <span class="ui">Stop On Profit</span>, <span class="ui">Stop On Loss</span>) must not be machine-translated for Georgian.</li>
      <li><strong>Limits page contents.</strong> Which responsible-gaming controls are exposed per regulator market?</li>
    </ol>

    <div class="callout info">
      <span class="callout-title">Routing</span>
      <p>Each item above should have a ticket in engineering's tracker by the time it appears in a public-facing operator deck. If no ticket exists yet, file one with this section number quoted.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 18 — Account Manager Talking Points (CAN / CANNOT)
# -------------------------------------------------------------------------

S18 = {
    "number": "18.0",
    "slug": "account-manager-talking-points",
    "title": "Account-Manager Talking Points — What You CAN And CANNOT Say",
    "summary": "Anchored phrasing for operator/aggregator calls so account managers stop short of any claim the engine doesn't back.",
    "status": "published",
    "owner": "Account Management",
    "body_html": dedent("""
    <p>The single biggest commercial risk on the Minescape rollout is an account manager making a claim the engine does not back. This section exists so that doesn't happen. Every <strong>CAN</strong> phrase below is anchored to evidence in this manual. Every <strong>CANNOT</strong> phrase is one that has previously appeared in player-facing drafts and is <em>not</em> supported by the captures.</p>

    <div class="callout warn">
      <span class="callout-title">Hard rule</span>
      <p>If a sentence is not in the CAN list, do not say it. If an operator pushes for a specific RTP, win-rate, or hit-frequency number, quote §17 (Open Engineering Questions) and route the request to engineering.</p>
    </div>

    <h3>18.1 You CAN say</h3>
    <ul>
      <li><strong>"Minescape is a crash-and-hold mines game with player-controlled grid size, mine count, and cashout timing."</strong> (One-sentence pitch; see §1.)</li>
      <li><strong>"Four grid sizes are available: 5×5, 6×6, 7×7, 8×8."</strong> (Direct evidence, §6.)</li>
      <li><strong>"Mine counts are presets per grid plus a Custom field — the player can configure any whole number from at least 1 up to <code>grid − 1</code>."</strong> (Confirmed for grids 25 and 36; safe assumption for 49 and 64 pending §17 #3.)</li>
      <li><strong>"The engine is Provably Fair — round results commit before the player interacts."</strong> (Footer badge; §13.)</li>
      <li><strong>"Manual mode is fully player-driven. Auto mode plays a configurable loop with exactly four halt conditions: manual Stop, Number Of Bets exhausted, Stop On Profit hit, Stop On Loss hit."</strong> (§12.)</li>
      <li><strong>"Two skins ship today — Minescape (<span class='ui'>Start Mission</span>) and Aviator (<span class='ui'>Start Bet</span>) — and the engine is identical underneath."</strong> (§3.)</li>
      <li><strong>"Currency in the evidence is GEL. Per-locale currency is operator-configurable."</strong> (Pending engineering confirmation of the locale list.)</li>
      <li><strong>"The Max button is an operator-configurable per-bet ceiling — it is not a balance dump."</strong> (Visual proof in <code>aviator-minescape-max-bet-selected-400-gel.png</code>; §5.)</li>
      <li><strong>"Potential Win is the maximum payout for the current configuration. It is <code>bet × ceiling multiplier</code> and scales linearly with the stake."</strong> (Confirmed across 5 / 10 / 100 / 400 GEL bets at 25/1, all at 24.25× ratio; §5.)</li>
      <li><strong>"A single losing round does not stop autobet — only the four explicit halt conditions do."</strong> (Direct evidence; §12.)</li>
    </ul>

    <h3>18.2 You CANNOT say (without engineering sign-off)</h3>
    <ul>
      <li><strong>❌ "Players win 50%–65% of the time."</strong> No engine-side evidence. Previously invented in an earlier draft; do not repeat.</li>
      <li><strong>❌ "RTP is X%."</strong> No RTP figure appears in any capture.</li>
      <li><strong>❌ "Auto cash-out at 2.0× has an X% win rate."</strong> No engine-side win-rate evidence.</li>
      <li><strong>❌ "Max means all-in."</strong> Directly contradicted by the Max-button capture.</li>
      <li><strong>❌ "Stop after first loss is an Auto stop condition."</strong> Not in evidence — there are exactly four halt conditions.</li>
      <li><strong>❌ "AutoBet doubles your bet after a loss by default."</strong> Increase-on-Loss is a player choice; the engine does not impose it.</li>
      <li><strong>❌ "Mines are placed after each click."</strong> Mines commit at the moment Start is pressed and lock for the round.</li>
      <li><strong>❌ "The dice button auto-cashes-out on safe reveals."</strong> It does not; it reveals one tile per tap.</li>
      <li><strong>❌ "Players can cancel a bet after pressing Start."</strong> No cancel mechanic appears in the captures — the round is committed.</li>
      <li><strong>❌ "The game pays out X on a typical session."</strong> Session payouts are highly variant; no "typical" claim can be made without engineering RTP numbers.</li>
    </ul>

    <h3>18.3 Phrasing pivots — replace the bad line with the good one</h3>
    <table>
      <thead><tr><th>Instead of</th><th>Say</th></tr></thead>
      <tbody>
        <tr>
          <td>"AutoBet is a winning strategy."</td>
          <td>"AutoBet automates the reveal-and-cashout loop and adds hard stop conditions so the player can bound a session."</td>
        </tr>
        <tr>
          <td>"There's a multiplier ceiling of 24×."</td>
          <td>"On a 25-grid with 1 mine, a perfect run reveals all 24 safe tiles and the ceiling multiplier is 24.25× — confirmed by the Potential Win values at 5, 10, 100, and 400 GEL stakes."</td>
        </tr>
        <tr>
          <td>"The game is fair because we say so."</td>
          <td>"Each round is provably fair — the engine commits to the result before play and the player can independently verify it."</td>
        </tr>
        <tr>
          <td>"Increase-on-Loss recovers your losses automatically."</td>
          <td>"Increase-on-Loss is a Martingale-style player choice. Stop On Loss is the only engine-side safety net against compounding."</td>
        </tr>
      </tbody>
    </table>

    <h3>18.4 Pre-call checklist</h3>
    <p>Run this list before every operator/aggregator call. If you cannot answer any item, route to engineering before the call.</p>
    <ul class="ui-list">
      <li>Which skin is the operator branding under (Minescape, Aviator, other)?</li>
      <li>What is the operator's per-bet ceiling configured for the Max button?</li>
      <li>What is the operator's verified Provably-Fair URL?</li>
      <li>Which markets / regulators apply, and what changes to the Limits page do they require?</li>
      <li>Is the operator using GEL only, or other currencies / locales?</li>
      <li>Has engineering confirmed Payout On Win semantics for this deployment?</li>
      <li>Has the operator been briefed that Increase-by-X% on Loss compounds and that Stop On Loss is the only engine-side safety net?</li>
      <li>Has the operator been briefed that the Cashout button is available at <code>GEL 0.00</code> (i.e. a player can tap-forfeit)?</li>
      <li>Has the operator confirmed the disconnect-recovery behaviour they expect?</li>
      <li>Are mobile / touch parity acceptance criteria signed off?</li>
    </ul>

    <div class="callout info">
      <span class="callout-title">Elevator pitch</span>
      <p>Minescape is a player-paced mines game where the player stakes GEL, chooses a 25/36/49/64 grid and a mine count, opens crates one at a time to climb a configuration-determined multiplier ladder, and cashes out at any moment before hitting a mine — with an Auto mode that runs the same loop on rules (Payout On Win, Number Of Bets, On Win, On Loss, Stop On Profit, Stop On Loss) and a Provably-Fair commit-reveal protocol underneath.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 19 — Localization String Inventory
# -------------------------------------------------------------------------

S19 = {
    "number": "19.0",
    "slug": "localization-string-inventory",
    "title": "Localization — Canonical String Inventory",
    "summary": "Every translatable UI string in Minescape, grouped by context, so localizers can round-trip the manual safely.",
    "status": "published",
    "owner": "Localization",
    "body_html": dedent("""
    <p>Preserve technical operators (<code>x</code>, <code>%</code>, <code>∞</code>, <code>½</code>) and the comma/period decimal convention. The bet field shows <code>GEL X,XX</code> (comma decimal). The Potential Win helper bar shows <code>GEL X.XX</code> (period decimal). This split is intentional in the engine and must be reproduced in every locale.</p>

    <div class="callout warn">
      <span class="callout-title">Georgian-language rule</span>
      <p>Do not machine-translate Auto-mode strings into Georgian. The labels are technical and easy to mis-render — a native Georgian speaker must review every Auto-mode translation before publish.</p>
    </div>

    <h3>19.1 Identity strings</h3>
    <ul class="ui-list">
      <li><span class="ui">Minescape</span> — Minescape skin wordmark.</li>
      <li><span class="ui">Aviator</span> — Aviator skin wordmark.</li>
      <li><span class="ui">Provably Fair Game</span> — footer badge.</li>
      <li><span class="ui">Version 1.0.0</span> — footer version.</li>
    </ul>

    <h3>19.2 Mode tabs</h3>
    <ul class="ui-list">
      <li><span class="ui">Manual</span></li>
      <li><span class="ui">Auto</span></li>
    </ul>

    <h3>19.3 Bet configuration</h3>
    <ul class="ui-list">
      <li><span class="ui">Bet Amount</span></li>
      <li><span class="ui">GEL</span> (currency prefix; replace per operator locale)</li>
      <li><span class="ui">½</span> (half-stake modifier — keep as glyph, not "1/2")</li>
      <li><span class="ui">2X</span></li>
      <li><span class="ui">Max</span></li>
      <li><span class="ui">Potential Win</span></li>
    </ul>

    <h3>19.4 Grid &amp; mines</h3>
    <ul class="ui-list">
      <li><span class="ui">Grid Size</span></li>
      <li><span class="ui">Number of Mines</span></li>
      <li><span class="ui">Custom</span></li>
    </ul>

    <h3>19.5 Primary CTAs</h3>
    <ul class="ui-list">
      <li><span class="ui">Start Bet</span> — Aviator skin, Manual mode.</li>
      <li><span class="ui">Start Mission</span> — Minescape skin, Manual mode.</li>
      <li><span class="ui">Start Autobet</span> — both skins, Auto mode.</li>
      <li><span class="ui">Cashout</span> — round in progress.</li>
      <li><span class="ui">Stop Autobet</span> — autobet running.</li>
    </ul>

    <h3>19.6 Advanced settings</h3>
    <ul class="ui-list">
      <li><span class="ui">Advanced Settings</span></li>
      <li><span class="ui">Payout On Win</span></li>
      <li><span class="ui">Number Of Bets</span></li>
      <li><span class="ui">On Win</span></li>
      <li><span class="ui">On Loss</span></li>
      <li><span class="ui">Reset</span></li>
      <li><span class="ui">Increase by</span></li>
      <li><span class="ui">Stop On Profit</span></li>
      <li><span class="ui">Stop On Loss</span></li>
    </ul>

    <h3>19.7 Menu items</h3>
    <ul class="ui-list">
      <li><span class="ui">Sound</span></li>
      <li><span class="ui">Music</span></li>
      <li><span class="ui">Dark mode</span></li>
      <li><span class="ui">My Bets</span></li>
      <li><span class="ui">Rules</span></li>
      <li><span class="ui">Limits</span></li>
    </ul>

    <h3>19.8 Round popups (observed format)</h3>
    <ul class="ui-list">
      <li><code>GEL X.XX  +X.XXX</code> — payout on top, profit below with <code>+</code> prefix.</li>
    </ul>

    <div class="callout info">
      <span class="callout-title">Format-stability rule</span>
      <p>The bet field's comma decimal and the helper bar's period decimal are <strong>not</strong> a localization choice — they are engine outputs. Translators must not "unify" the two formats.</p>
    </div>
    """).strip(),
}


# -------------------------------------------------------------------------
# Section 20 — Evidence Index (per-screenshot descriptions)
# -------------------------------------------------------------------------

S20 = {
    "number": "20.0",
    "slug": "evidence-index",
    "title": "Evidence Index — Every Screenshot, Described",
    "summary": "Per-asset description for every PNG / GIF / MOV in public/images/minescape/, so any claim in this manual can be traced back to a specific capture.",
    "status": "published",
    "owner": "Product",
    "body_html": dedent("""
    <p>This is the audit trail. Every section of this manual is anchored to one or more captures from the inventory below. If a claim cannot be traced to an asset here, it must not be repeated externally.</p>

    <h3>20.1 Setup / default state</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-default-screen.png</code> — Minescape skin, balance <code>1000 GEL</code>, Manual tab selected, Grid <code>25</code>, Mines <code>1</code>. Ladder: <code>x1.01, x1.05, x1.10, x1.15, x1.21, x1.28</code>. CTA: green <span class="ui">Start Mission</span>.</li>
      <li><code>default-state.png</code> — Visually identical to the default-screen capture. Confirms the screen is stateless pre-input.</li>
      <li><code>default-screen-with-1000-bet-amount.png</code> — Same default screen, third capture. Filename refers to the 1000-GEL starting balance, not a 1000-GEL bet.</li>
    </ul>

    <h3>20.2 Bet amount evidence (Aviator skin, 20,000 GEL balance, 25/1)</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-bet-10-gel-potential-win-242-50.png</code> — Bet <code>GEL 10,00</code> → Potential Win <code>GEL 242.50</code>. Ratio 24.25×.</li>
      <li><code>aviator-minescape-bet-100-gel-potential-win-2425.png</code> — Bet <code>GEL 100,00</code> → Potential Win <code>GEL 2425.00</code>. Ratio 24.25×.</li>
      <li><code>aviator-minescape-half-bet-button-bet-5-gel-potential-win-121-25.png</code> — Bet <code>GEL 5,00</code> (after <span class="ui">½</span> press) → Potential Win <code>GEL 121.25</code>. <span class="ui">½</span> chip outlined blue.</li>
      <li><code>aviator-minescape-max-bet-selected-400-gel.png</code> — Bet <code>GEL 400,00</code> (after <span class="ui">Max</span> press), balance <code>20000 GEL</code> → Potential Win <code>GEL 9700.00</code>. Direct proof Max ≠ all-in.</li>
    </ul>

    <h3>20.3 Grid / mines evidence</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-grid-size-25-mines-3.png</code> — Grid 25, Mines 3. Ladder <code>x1.1, x1.26, x1.45, x1.68, x1.96, x2.3</code>.</li>
      <li><code>aviator-minescape-grid-size-25-mines-5.png</code> — Grid 25, Mines 5. Ladder <code>x1.21, x1.53, x1.96, x2.53, x3.32, x4.43</code>.</li>
      <li><code>aviator-minescape-grid-size-25-mines-10.png</code> — Grid 25, Mines 10. Ladder <code>x1.62, x2.77, x4.9, x8.99, x17.16, x34.32</code>. Most volatile preset on grid 25.</li>
      <li><code>aviator-minescape-grid-size-25-mines-custom-placeholder-24.png</code> — Grid 25, Custom placeholder 24. Ladder appears stale (UI render-lag observation).</li>
      <li><code>aviator-minescape-grid-size-36-mines-2.png</code> — Grid 36, Mines 2. Ladder <code>x1.03, x1.09, x1.16, x1.23, x1.31, x1.4</code>. Gentlest preset on 36.</li>
      <li><code>aviator-minescape-grid-size-36-mines-2-4916ef.png</code> — Duplicate of the 36/2 capture (different filename suffix).</li>
      <li><code>aviator-minescape-grid-size-36-mines-5.png</code> — Grid 36, Mines 5. Ladder <code>x1.13, x1.31, x1.54, x1.82, x2.15, x2.57</code>.</li>
      <li><code>aviator-minescape-grid-size-36-mines-10.png</code> — Grid 36, Mines 10. Ladder <code>x1.34, x1.88, x2.66, x3.82, x5.56, x8.21</code>.</li>
      <li><code>aviator-minescape-grid-size-36-mines-15.png</code> — Grid 36, Mines 15. Ladder <code>x1.66, x2.91, x5.21, x9.55, x17.97, x34.82</code>. Most volatile preset on 36.</li>
      <li><code>aviator-minescape-grid-size-36-mines-custom-placeholder-35.png</code> — Grid 36, Custom placeholder 35. Ladder also stale (same UI observation as 25/24).</li>
      <li><code>aviator-minescape-grid-size-49-mines-3.png</code> — Grid 49, Mines 3. Ladder <code>x1.03, x1.1, x1.18, x1.26, x1.35, x1.45</code>. Preset row: <code>3 · 10 · 15 · 30 · Custom</code>.</li>
      <li><code>aviator-minescape-grid-size-64-mines-4.png</code> — Grid 64, Mines 4. Ladder near-identical to 49/3 (consistent with safe-ratio parity). Preset row: <code>4 · 15 · 25 · 35 · Custom</code>.</li>
    </ul>

    <h3>20.4 Bet-placed state</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-bet-placed-hover-tile.png</code> — Minescape skin, balance dropped from 1000 → 999 (1 GEL bet staked). Yellow <span class="ui">Cashout GEL 0.00</span> + dice ◇. Bet/grid/mines controls dimmed. One crate yellow-highlighted from cursor hover.</li>
      <li><code>bet-placed-hover-on-a-box.png</code> — Same state, different crate under hover.</li>
    </ul>

    <h3>20.5 Active round — safe reveals</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png</code> — Minescape skin, one crate open with small green money-bag icon. <code>x1.01</code> chip highlighted yellow. Cashout button reads <code>GEL 1.01</code>. Balance still 999 (does not update until resolution).</li>
      <li><code>aviator-minescape-multiple-tiles-open-cashout-active.png</code> — Multiple green crates open, multiple ladder chips advanced, higher Cashout amount.</li>
    </ul>

    <h3>20.6 Manual mode loss</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-lose-state-mine-revealed.png</code> — Red bomb icon on a clicked crate. Panel snaps back to default state with green <span class="ui">Start Mission</span> CTA. Some previously-safe green crates still visible.</li>
    </ul>

    <h3>20.7 Auto mode setup</h3>
    <ul class="ui-list">
      <li><code>screenshot-2026-05-29-at-18-30-03.png</code> — Auto tab, collapsed <span class="ui">Advanced Settings</span> row above green <span class="ui">Start Autobet</span> CTA.</li>
      <li><code>aviator-minescape-auto-mode-selected-tiles-start-autobet.png</code> — Auto tab, several crates hand-marked with green icons (still closed). Green <span class="ui">Start Autobet</span> ready.</li>
      <li><code>aviator-minescape-auto-mode-random-tile-selection.png</code> — Auto tab, dice-randomized selection. Advanced Settings panel expanded.</li>
    </ul>

    <h3>20.8 Advanced Settings panel</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-auto-mode-advanced-settings.png</code> — Expanded panel showing all six fields: Payout On Win / Number Of Bets / On Win / On Loss / Stop On Profit / Stop On Loss. Empty default state.</li>
      <li><code>advance-settings.png</code> — Mid-configuration capture; red Stop Autobet suggests captured after Start.</li>
      <li><code>advanced-settings.png</code> — Companion capture of the same panel.</li>
    </ul>

    <h3>20.9 Advanced settings — rules in action</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png</code> — <span class="ui">On Win = Increase by 5%</span>, <span class="ui">Number Of Bets = 10</span>. Mid-session win popup on the board. Red <span class="ui">Stop Autobet</span> with remaining counter.</li>
      <li><code>aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png</code> — <span class="ui">On Loss = Increase by 20%</span>. Green <span class="ui">Start Autobet</span> CTA (not started).</li>
      <li><code>aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png</code> — <span class="ui">Stop On Profit = 10</span>, <span class="ui">Stop On Loss = 20</span>. Green <span class="ui">Start Autobet</span>.</li>
    </ul>

    <h3>20.10 Autobet runtime</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-auto-mode-win-state-infinite-rounds.png</code> — Winning round, green payout popup on board. Red <span class="ui">Stop Autobet</span> still active.</li>
      <li><code>screenshot-2026-05-29-at-18-28-59.png</code> — Autobet mid-session, payout popup (e.g. <code>GEL 30.30 +2.928</code>).</li>
      <li><code>aviator-minescape-auto-mode-lose-state-continues.png</code> — <strong>Critical capture.</strong> Losing round, red bombs visible, red <span class="ui">Stop Autobet</span> still live. Single most important evidence that a losing round does not halt the loop.</li>
    </ul>

    <h3>20.11 Burger menu</h3>
    <ul class="ui-list">
      <li><code>aviator-minescape-burger-menu-open.png</code> — Aviator skin, top half: username <code>T*****E</code> + edit pencil; Sound / Music / Dark mode toggles all ON; My Bets link below.</li>
      <li><code>aviator-minescape-burger-menu-scrolled.png</code> — Scrolled view: reveals <span class="ui">Rules</span> and <span class="ui">Limits</span> link rows below <span class="ui">My Bets</span>.</li>
    </ul>

    <h3>20.12 Loaders and GIFs</h3>
    <ul class="ui-list">
      <li><code>loading-screen.mov</code> — Animated loader. Plays once per session (per current evidence).</li>
      <li><code>clicking-on-box-while-bet-isn-t-placed.gif</code> — Tap-on-crate before bet placed → no reveal, no state change. Direct proof that crates are non-interactive pre-bet.</li>
    </ul>

    <div class="callout info">
      <span class="callout-title">Audit policy</span>
      <p>If a screenshot is added to <code>public/images/minescape/</code> in the future, append it to this index with a one-paragraph description before referencing it in any other section. Sections must never cite an unindexed asset.</p>
    </div>
    """).strip(),
}


SECTIONS = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20]


def section_id(doc_id, index):
    return f"{doc_id}-s{index + 1}"


def build_section_html(section, doc_id, index):
    sid = section_id(doc_id, index)
    number = section["number"]
    title = section["title"]
    body = section["body_html"]
    alt_class = " alt" if int(number.split(".")[0]) % 2 == 0 else ""
    return dedent(f"""
    <div class="section-banner{alt_class}" id="{sid}">
      <div class="container">
        <div class="num">{number}</div>
        <h2>{title}</h2>
      </div>
    </div>
    <section class="content">
      <div class="container">
    {body}
      </div>
    </section>
    """).strip()
