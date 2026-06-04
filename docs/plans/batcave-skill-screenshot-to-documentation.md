# Batcave Skill: Screenshot-to-Documentation Automation

**Document Type:** Feature Specification  
**Product:** DocPilot + Batcave Integration  
**Audience:** Product Operations, Engineering  
**Status:** Planned  
**Target Release:** 2026-06-30  
**Trace:** BAT-SKILL-001, DSC-07

---

## 1.0 Executive Summary

### The Opportunity

The Minescape Player Guide demonstrates what human-authored, comprehensive game documentation looks like: storytelling-driven, strategically layered, packed with examples and tables, localization-ready, and formatted for immediate publication in DocPilot.

**Current bottleneck:** Creating this documentation manually takes 8–12 hours of skilled writing per game.

### The Vision

**Batcave Skill: `screenshot-to-documentation`**

A Claude-powered automation skill that:
1. **Ingests labeled game screenshots** from DocPilot Media Library
2. **Analyzes visual elements** (UI, states, interactions, flows)
3. **Generates comprehensive documentation** using narrative templates
4. **Auto-builds DocPilot documents** with integrated media, sections, and markers
5. **Localizes ready** (templates for 37 languages)
6. **Requires minimal human review** (90% automation, 10% polish)

### The Payoff

- **Time savings:** 8–12 hours → 1–2 hours (review only)
- **Consistency:** All game guides follow the same narrative structure
- **Speed to market:** New games documented in days, not weeks
- **Scalability:** Once the skill is live, any Batcave user can document any game

---

## 2.0 The Skill Interface

### Input: Game Documentation Request

```yaml
game_title: "Minescape"
game_type: "crash_and_hold"  # or "slot", "crash", "table", etc.
screenshots:
  - id: "fig-01"
    label: "Main game screen with 25-tile grid, 1 mine"
    url: "/images/manual/fig-01.png"
  - id: "fig-02"
    label: "Auto settings panel with multiplier targets"
    url: "/images/manual/fig-02.png"
  # ... up to 25 labeled screenshots
tone: "storytelling"  # or "technical", "casual"
audience: ["players", "operators"]
languages: ["en", "ka", "ru"]  # English, Georgian, Russian (etc.)
target_sections: 12  # Expected doc sections
```

### Output: Publication-Ready Documentation

```yaml
format: "docpilot_bundle"
contents:
  - type: "markdown"
    file: "minescape-player-guide.md"
    size: 600+ lines
    sections: 12
    tables: 8
    code_examples: 15
    
  - type: "docpilot_document"
    file: "minescape-document.json"
    sections: 12
    markers: 24  # Annotated screenshots
    translations: 3
    
  - type: "media_manifest"
    file: "media-references.json"
    images: 25
    videos: 0
    embeddings: "ready"

quality_metrics:
  readability_score: 92
  coverage: 100  # All UI elements documented
  localization_readiness: 100
  screenshot_integration: 100
```

---

## 3.0 Skill Architecture

### Phase 1: Image Analysis (10–15 seconds)

**Input:** Labeled screenshots from DocPilot Media Library

**Process:**

1. **Visual Understanding**
   - Claude Vision analyzes each screenshot
   - Identifies UI components (buttons, inputs, grids, displays)
   - Maps screen states (setup, playing, win, loss, loading)
   - Detects interactive regions (clickable zones, inputs, modals)

2. **Game Flow Reconstruction**
   - Cross-references labels to infer game progression
   - Maps state transitions (e.g., "setup" → "playing" → "cashing out")
   - Identifies loops and branching (autoplay, manual, menu)
   - Notes edge cases (insufficient funds, invalid input, network error)

3. **Structured Output**
   ```json
   {
     "screens": [
       {
         "id": "fig-01",
         "state": "setup",
         "components": [
           {"type": "input", "label": "Bet Amount", "example_value": "500"},
           {"type": "selector", "label": "Grid Size", "options": ["25", "36", "49", "64"]},
           {"type": "button", "label": "Start Autobet", "state": "enabled"}
         ],
         "interactions": ["enter_bet", "select_grid", "click_start"],
         "notes": "Main game setup interface"
       }
     ],
     "state_machine": {
       "setup": {"next": "playing", "trigger": "start_button"},
       "playing": {"next": ["cashing_out", "mine_hit"], "trigger": "user_action"}
     }
   }
   ```

### Phase 2: Documentation Generation (30–45 seconds)

**Input:** Structured game analysis + Brand/style guide

**Process:**

1. **Template Selection**
   - Match game_type to documentation template
   - Minescape → "Crash & Hold Game Template"
   - Templates include: structure, narrative tone, section headers, table schemas

2. **Content Generation**
   - **Section 1:** Welcome & Core Loop (3 paragraphs, 200 words)
   - **Section 2:** Getting Started (screenshot walkthrough, 300 words)
   - **Section 3:** Game Controls & Setup (reference tables, 400 words)
   - **Section 4:** Core Gameplay (step-by-step flow, 500 words)
   - **Section 5:** Advanced Strategies (math, edge cases, 600 words)
   - **Section 6–12:** Feature-specific deep dives
   
   Each section:
   - Integrates relevant screenshots (with captions)
   - Uses storytelling language ("Your instinct against the odds...")
   - Includes practical examples (with real numbers)
   - Provides reference tables for quick lookups

3. **Example Generation**
   - Extracts values from screenshots (e.g., "Bet Amount: 500.00 GEL")
   - Creates walkthrough narratives with exact UI states
   - Generates realistic player scenarios ("You're at 2.5x multiplier...")
   - Builds reference tables (Grid × Mines → Difficulty matrix)

4. **Quality Checks**
   - Readability score (Flesch-Kincaid)
   - Coverage verification (all UI elements mentioned)
   - Consistency checks (terminology, styling)
   - Screenshot integration (captions, markers align)

### Phase 3: DocPilot Integration (15–20 seconds)

**Input:** Generated markdown + Screenshot metadata

**Process:**

1. **Document Creation**
   - Create DocPilot document entity: "Minescape Player Guide"
   - Set metadata (title, version, audience, status, owner)
   - Import markdown as sections (preserving headers)

2. **Section Management**
   - Split markdown into 12 DocPilot sections (1.0–12.0)
   - Assign section IDs (s1, s2, s3, ...)
   - Set reading order and nesting

3. **Screenshot Embedding**
   - Import each labeled screenshot to DocPilot Media Library
   - Link images to relevant sections
   - Auto-generate caption text ("Figure 1: Main game screen...")
   - Position inline (before/after paragraphs) per template

4. **Marker Creation**
   - Add interactive markers to annotate UI elements
   - Examples:
     - Point to "Bet Amount" input → explain functionality
     - Highlight "Grid Size" selector → show options
     - Outline "Start Button" → call-to-action link
   - Markers link to glossary or related sections

5. **Localization Scaffolding**
   - Create translation workflow rows (DocPilot admin)
   - Pre-fill with English source
   - Set target languages (ka, ru, tr, etc.)
   - Ready for translator assignment

### Phase 4: Quality Assurance (QA Loop)

**Automated Checks:**
- ✅ All sections present (s1–s12)
- ✅ No broken image links
- ✅ Marker targets valid
- ✅ Localization strings escaped
- ✅ Tables render correctly
- ✅ No unsafe HTML patterns
- ✅ Readability > 80

**Human Review (Minimal):**
- Spot-check 2–3 sections for narrative flow
- Verify technical accuracy (game rules, multiplier math)
- Confirm tone matches brand (storytelling, not technical)
- Approve for publication

---

## 4.0 Skill Invocation

### Batcave Command

```bash
batcave skill run screenshot-to-documentation \
  --game "Minescape" \
  --type "crash_and_hold" \
  --screenshots "/media/manual/*.png" \
  --tone "storytelling" \
  --audience "players,operators" \
  --output-format "docpilot_bundle" \
  --publish-ready true
```

### Expected Output

```
✅ Image analysis complete (25 screenshots, 8 states identified)
✅ Documentation generated (624 lines, 12 sections, 8 tables)
✅ DocPilot document created (id: doc-minescape-001)
✅ Media library integrated (25 images, 3 markers per image)
✅ Localization scaffolded (37 languages, 4,200 strings)
✅ QA checks passed (8/8 ✓)
✅ Publication ready!

📊 Stats:
- Generate time: 2m 14s
- Screenshots analyzed: 25
- Sections created: 12
- Tables auto-built: 8
- Media integrated: 25
- Markers placed: 75
- Localization rows: 4,200
- Human review time required: 15–30 min

🚀 Next: batcave doc publish minescape-player-guide
```

---

## 5.0 Template System

### Game Type Templates

Each game type has a narrative template:

#### Crash & Hold (Aviator, Minescape)

```
1.0 Welcome: [Narrative Hook]
2.0 Getting Started: [First Round]
3.0 Core Gameplay: [Decision Points]
4.0 Advanced Strategies: [Math + Psychology]
5.0 AutoPlay Features: [Automation]
6.0 Risk Management: [Responsible Gaming]
7.0 Troubleshooting: [FAQ]
```

#### Slot Games

```
1.0 Welcome: [Theme Intro]
2.0 Symbols & Paylines: [Mechanics]
3.0 Placing Bets: [Configuration]
4.0 Spinning: [Core Loop]
5.0 Bonus Features: [Special Events]
6.0 Free Spins: [Extra Round]
7.0 Jackpots: [Big Wins]
8.0 Responsible Gaming: [Limits]
```

#### Table Games (Blackjack, Roulette)

```
1.0 Welcome: [Strategy Intro]
2.0 Rules: [Core Mechanics]
3.0 How to Play: [Step-by-Step]
4.0 Betting: [Strategy]
5.0 Special Bets: [Advanced]
6.0 House Rules: [Operator Config]
7.0 Responsible Gaming: [Limits]
```

### Narrative Voice

**Brand guidelines embedded in templates:**
- Tone: Confident, respectful, educational
- Perspective: "You" (second person) for players, "Your" for ownership
- Hook: Storytelling opening ("Your instinct against the odds...")
- Structure: Problem → Solution → Example → Deeper Dive
- Metaphors: Gaming metaphors (risk, reward, strategy)

---

## 6.0 Implementation Plan

### Phase 1: Proof of Concept (Week 1)
- [ ] Claude Vision integration for screenshot analysis
- [ ] Template system for "Crash & Hold" games
- [ ] Markdown generation with basic tables
- [ ] Manual testing with Minescape screenshots

### Phase 2: DocPilot Integration (Week 2)
- [ ] Document + Section creation API
- [ ] Media library integration
- [ ] Marker auto-placement
- [ ] Localization scaffolding

### Phase 3: Quality & Polish (Week 3)
- [ ] QA automation (readability, coverage, etc.)
- [ ] Human review workflow
- [ ] Publishing pipeline
- [ ] Error handling & logging

### Phase 4: Rollout (Week 4)
- [ ] Test with 2–3 other games (Aviator refresh, new game TBA)
- [ ] Gather feedback from content team
- [ ] Refinement based on real usage
- [ ] Launch Batcave skill publicly

---

## 7.0 Success Metrics

| Metric | Target | Definition |
|--------|--------|-----------|
| **Automation Rate** | 90% | % of content generated without manual revision |
| **Time Savings** | 85% | Reduction from 8h to 1–2h per game |
| **Readability** | >85 | Flesch-Kincaid Grade Level |
| **Coverage** | 100% | All visible UI elements documented |
| **Screenshot Integration** | 100% | All media linked and positioned |
| **Localization Readiness** | 100% | All strings escaped for translation |
| **QA Pass Rate** | 95% | Automated checks passing |
| **Human Review Time** | <30 min | Time required for final polish |

---

## 8.0 Known Limitations & Future Work

### Phase 1 Limitations

- **No video support** — Future: auto-caption video clips
- **Manual gameplay unavailable** — Analyzed mode from screenshots only
- **No A/B testing** — Can't optimize variant docs
- **No feedback loop** — Player-reported issues not factored into future docs
- **Single language output** — Translated via existing workflow, not auto-translated

### Future Enhancements

- **Interactive demo builder** — Auto-generate playable tutorials
- **Video generation** — Screencast walkthroughs from game API
- **Operator docs** — Parallel doc for backend setup, configuration, reporting
- **FAQ mining** — Extract support tickets to auto-populate "Common Questions"
- **Multi-game docs** — Cross-game comparison guides (e.g., "Choosing Your Game")
- **Feedback synthesis** — Incorporate player feedback into doc revisions

---

## 9.0 Cost & Resource Impact

### Computational Cost

- Claude Vision calls: ~1 per screenshot = 25 calls per game
- Claude Document generation: 3–4 calls (stages: analysis, draft, refinement)
- Estimated API cost: $15–25 per game guide

### Resource Impact

- **Engineering:** 60 hours (4 weeks, 1 engineer)
- **Product:** 10 hours (requirements, review, launch)
- **QA:** 20 hours (testing, edge cases)
- **Ops:** Ongoing (running skill, monitoring, feedback)

### ROI

Assuming:
- 12 game guides/year needed
- 8 hours saved per guide = 96 engineering hours saved
- 1 engineer @ $50/hour = $4,800 saved/year
- Skill build cost: ~$10,000 (70h × $143/h blended rate)

**Payback period:** ~2 years, then pure savings.

---

## 10.0 Integration Points

### With DocPilot

- **Media Library:** Skill imports labeled screenshots
- **Document API:** Creates doc, sections, markers, translations
- **Publishing:** Skill output flows directly to publish workflow

### With Batcave

- **Task creation:** Trigger skill from Batcave task (e.g., BAT-1200)
- **Status updates:** Skill reports progress back to task
- **Evidence attachment:** Generated docs linked in task completion
- **Audit trail:** All generations logged (who, when, what)

### With Game Operations

- **Screenshots come from:** QA team's labeled manual screenshots
- **Review happens in:** DocPilot admin (content team)
- **Publication:** DocPilot publishing workflow (already exists)
- **Localization:** Existing 37-language translation team

---

## 11.0 Example: Minescape Skill Run

### Input

```bash
batcave skill run screenshot-to-documentation \
  --game "Minescape" \
  --type "crash_and_hold" \
  --screenshots "/docpilot/media/minescape/*.png" \
  --tone "storytelling" \
  --audience "players" \
  --primary-language "en"
```

### Processing

```
[1/4] Analyzing 25 screenshots with Claude Vision...
  ✓ fig-01: Setup screen detected
  ✓ fig-02: Playing state detected
  ✓ fig-03: Win state detected
  ✓ fig-04: Loss state detected
  ... (21 more)
  ✓ Game state machine reconstructed (5 states, 7 transitions)

[2/4] Generating documentation from Crash & Hold template...
  ✓ Section 1.0: Welcome (320 words)
  ✓ Section 2.0: Getting Started (410 words)
  ✓ Section 3.0: Game Controls (520 words)
  ✓ Section 4.0: Core Gameplay (680 words)
  ✓ Section 5.0: Strategy (750 words)
  ✓ Section 6.0: AutoPlay (390 words)
  ✓ Section 7.0: Advanced Play (620 words)
  ✓ Section 8.0: Visual Walkthrough (480 words)
  ✓ Section 9.0: Risk Management (460 words)
  ✓ Section 10.0: Troubleshooting (380 words)
  ✓ Section 11.0: Philosophy (210 words)
  ✓ Appendix: Quick Reference (200 words)
  ✓ Total: 6,020 words across 12 sections

[3/4] Integrating with DocPilot...
  ✓ Document created: minescape-player-guide (doc-001)
  ✓ Sections imported: 12 (s1–s12)
  ✓ Media linked: 25 screenshots
  ✓ Markers placed: 75 (3 per image average)
  ✓ Localization scaffolded: 37 languages
  ✓ QA checks: 8/8 passed
    ✓ Readability: 92/100
    ✓ Coverage: 100% (all UI elements)
    ✓ Link validity: 100%
    ✓ HTML safety: ✓
    ✓ Screenshot integration: ✓
    ✓ Marker validity: ✓
    ✓ Localization strings: ✓

[4/4] Finalizing...
  ✓ Publication bundle created
  ✓ Ready for content review

📊 Summary:
  Time elapsed: 2m 43s
  Sections: 12
  Screenshots: 25
  Tables: 8
  Code examples: 15
  Markers: 75
  Translation rows: 4,200
  Status: Ready for review

🎯 Next steps:
  1. Review 2–3 sections for quality
  2. Publish via: batcave doc publish minescape-player-guide
```

---

## 12.0 Success Criteria for Launch

- ✅ Skill generates documentation in <5 minutes
- ✅ QA automation passes all checks consistently
- ✅ Human review time <30 minutes per game
- ✅ Generated docs match brand tone and narrative structure
- ✅ Screenshot integration seamless (captions, positioning, markers)
- ✅ Localization scaffolding 100% ready
- ✅ DocPilot publishing workflow accepts skill output without modification
- ✅ Content team confirms time savings of 80%+
- ✅ Batcave integration logs all generations with full audit trail
- ✅ Documentation for the skill itself is complete and accessible

---

**Document Owner:** Product Team  
**Last Updated:** 2026-05-29  
**Status:** Specification Complete, Ready for Engineering Planning  
**Approval:** Pending CPO Review
