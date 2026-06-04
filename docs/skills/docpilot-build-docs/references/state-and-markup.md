# DocPilot State And Markup Reference

Use this reference when an agent needs to write directly into DocPilot state or produce HTML that the content editor can continue editing.

## Persistence API

Default local API base:

```text
/api/docpilot
```

Common local URL:

```text
http://127.0.0.1:4179/api/docpilot
```

Endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check server persistence and state location. |
| `GET` | `/state/<key>` | Read a persisted state key. |
| `PUT` | `/state/<key>` | Replace a persisted state key value and append mutation metadata. |
| `POST` | `/media/upload` | Upload one or more media files. |
| `GET` | `/media/files/<filename>` | Serve an uploaded media file. |
| `DELETE` | `/media/files/<filename>` | Delete an uploaded media file. |

Write headers:

```text
x-docpilot-user: agent
x-docpilot-role: admin
content-type: application/json
```

PUT body:

```json
{
  "value": {},
  "operation": "agent_update_sections",
  "target_entity": "cms_custom_sections_v1",
  "actor": "agent"
}
```

## State Keys

| Key | Purpose |
| --- | --- |
| `cms_games_v1` | Product/game catalog records. |
| `cms_docs_v2` | Document metadata records. |
| `cms_selected_product_v1` | Active product context. |
| `cms_sections_v2` | Default game manual sections. |
| `cms_backoffice_sections_v1` | Back-office document sections. |
| `cms_integration_sections_v1` | Integration document sections. |
| `cms_custom_sections_v1` | Sections for custom/imported documents, usually keyed by document ID. |
| `cms_translations_v2` | Translation language rows and localized values. |
| `cms_releases_v2` | Publishing snapshots/releases. |
| `cms_audit_events_v1` | App-level audit events. |
| `cms_media_assets_v1` | Media library asset metadata. |
| `cms_doc_revision_history_v1` | Document/section revision history. |
| `cms_marker_color_presets_v1` | Saved marker color presets. |
| `cms_api_keys_v1` | Integration API keys. |
| `cms_webhook_endpoints_v1` | Webhook endpoints. |
| `cms_external_references_v1` | External references linked to docs. |
| `cms_theme_presets_v1` | Theme presets. |
| `cms_active_theme_preset_v1` | Active theme preset. |

## Entity Shapes

Document:

```json
{
  "id": "doc-minescape-player-guide",
  "gameId": "game-minescape",
  "title": "Minescape Player Guide",
  "slug": "minescape-player-guide",
  "type": "game",
  "description": "Player-facing guide for Minescape controls, states, and outcomes.",
  "version": "0.1.0",
  "status": "review",
  "owner": "Docs",
  "reviewer": "Product",
  "audience": "Players, Support, Product Operations",
  "taxonomy": "gameplay, ui, mines, autobet",
  "navPlacement": "primary",
  "navOrder": 1,
  "templateId": "game-manual",
  "updatedAt": "2026-05-30",
  "sections": 12
}
```

Section:

```json
{
  "id": "doc-minescape-player-guide-s1",
  "number": "1.0",
  "slug": "overview",
  "title": "Overview",
  "summary": "Explains the game purpose, screen layout, and core loop.",
  "status": "review",
  "owner": "Docs",
  "reviewer": "Product",
  "updatedAt": "2026-05-30",
  "html": "<div class=\"section-banner\" id=\"doc-minescape-player-guide-s1\">...</section>"
}
```

Media asset:

```json
{
  "id": "media-minescape-default-screen",
  "src": "/images/minescape/default-screen.png",
  "fileName": "default-screen.png",
  "originalName": "default-screen.png",
  "mimeType": "image/png",
  "sizeBytes": 123456,
  "createdAt": "2026-05-30T00:00:00.000Z",
  "alt": "Minescape default manual betting screen with unopened crate grid",
  "tags": ["minescape", "default-screen", "manual-mode", "bet-setup"],
  "owner": "Docs",
  "updatedAt": "2026-05-30",
  "usageRefs": ["Minescape Player Guide · 2.0 Screen Layout"]
}
```

## Section HTML Wrapper

Every imported section should use DocPilot’s editable wrapper:

```html
<div class="section-banner" id="doc-example-s1">
  <div class="container">
    <div class="num">1.0</div>
    <h2>Section Title</h2>
  </div>
</div>
<section class="content">
  <div class="container">
    <p>Editable paragraph text.</p>
  </div>
</section>
```

Use `section-banner alt` for alternating visual rhythm if desired. Keep the wrapper ID equal to the section ID so marker anchors and TOC links stay stable.

## Editable Inline Targets

The rendered inline editor can edit:

- Section title in `.section-banner h2`
- Headings `h3`, `h4`, `h5`
- Paragraphs
- List items
- Definition terms/descriptions
- Table header/data cells
- Figure captions
- Callout titles

Agents should therefore use semantic HTML, not opaque custom layouts, for text that humans need to edit.

## Basic Figure Markup

Use this for screenshots and media evidence:

```html
<figure>
  <img src="/images/minescape/default-screen.png" alt="Minescape default manual betting screen" loading="lazy">
  <figcaption>Default manual setup screen with bet amount, grid size, mine count, and unopened crate grid.</figcaption>
</figure>
```

Figures are discoverable by the screenshot editor. Include real alt text and a caption that explains why the image belongs in the doc.

## Managed Component Markup

DocPilot recognizes managed components through `data-doc-component`, `data-component-id`, `data-variant`, and `data-ordered`.

Supported kinds:

```text
callout, accordion, tabs, list, table, regions, steps, carousel
```

Supported variants:

```text
info, success, warning, danger, note
```

### Callout

```html
<div class="doc-component doc-component-callout doc-component-variant-warning callout important" data-doc-component="callout" data-component-id="component-warning-1" data-variant="warning" data-ordered="false">
  <span class="callout-title doc-component-title">Observed value, not a rule</span>
  <p class="doc-component-body">Treat balances, payouts, and potential wins from screenshots as examples unless product specs confirm them.</p>
</div>
```

### Table

```html
<div class="doc-component doc-component-table doc-component-variant-info" data-doc-component="table" data-component-id="component-controls-table" data-variant="info" data-ordered="false">
  <h4 class="doc-component-title">Control Reference</h4>
  <table>
    <thead><tr><th>Control</th><th>Purpose</th><th>Editable Note</th></tr></thead>
    <tbody>
      <tr data-component-row-id="row-1"><td>Bet Amount</td><td>Sets the wager.</td><td>Supports half, double, and max shortcuts.</td></tr>
    </tbody>
  </table>
</div>
```

### Steps

```html
<div class="doc-component doc-component-steps doc-component-variant-success" data-doc-component="steps" data-component-id="component-play-flow" data-variant="success" data-ordered="false">
  <h4 class="doc-component-title">Manual Round Flow</h4>
  <ol class="steps">
    <li data-component-item-id="step-1"><strong class="doc-component-item-title">Set the bet</strong><p class="doc-component-item-body">Enter an amount or use 1/2, 2X, or Max.</p></li>
    <li data-component-item-id="step-2"><strong class="doc-component-item-title">Start the bet</strong><p class="doc-component-item-body">The grid locks and tiles become selectable.</p></li>
  </ol>
</div>
```

### Region List

```html
<dl class="doc-component doc-component-regions doc-component-variant-info ui-list" data-doc-component="regions" data-component-id="component-screen-regions" data-variant="info" data-ordered="false">
  <dt class="doc-component-title">Screen Regions</dt>
  <div class="doc-region-row" data-component-item-id="region-1">
    <dt class="doc-component-item-title">Control panel</dt>
    <dd class="doc-component-item-body">Contains mode tabs, bet amount, grid size, mine count, and start/cashout controls.</dd>
  </div>
</dl>
```

### Image Carousel

```html
<div class="doc-component doc-component-carousel doc-component-variant-info" data-doc-component="carousel" data-component-id="component-state-carousel" data-variant="info" data-ordered="false">
  <h4 class="doc-component-title">Round States</h4>
  <div class="doc-carousel" data-doc-carousel>
    <button type="button" class="doc-carousel-nav prev" data-carousel-prev aria-label="Previous slide">‹</button>
    <div class="doc-carousel-viewport">
      <div class="doc-carousel-track">
        <figure class="doc-carousel-slide" data-component-item-id="slide-1" data-slide-index="0">
          <img src="/images/minescape/default-screen.png" alt="Minescape default screen" loading="lazy" draggable="false">
          <figcaption class="doc-component-item-title">Default setup</figcaption>
          <p class="doc-component-item-body doc-carousel-slide-src">/images/minescape/default-screen.png</p>
        </figure>
      </div>
    </div>
    <button type="button" class="doc-carousel-nav next" data-carousel-next aria-label="Next slide">›</button>
    <div class="doc-carousel-dots">
      <button type="button" class="doc-carousel-dot active" data-carousel-dot="0" aria-label="Go to Default setup" aria-pressed="true"></button>
    </div>
  </div>
</div>
```

## Optional Annotated Figure Pattern

Use the UI screenshot editor when possible for marker-heavy screenshots. If generating markup directly, keep marker coordinates percentage-based and validate in the browser.

Minimum pattern:

```html
<figure class="annotated-figure">
  <div class="annotated-image">
    <img src="/images/minescape/default-screen.png" alt="Minescape default screen">
    <button class="doc-marker marker-shape" style="left:22%;top:34%;width:14%;height:8%;" data-description="Bet amount input and quick controls."><b>Bet</b></button>
  </div>
  <figcaption>Default setup screen with marker over the bet controls.</figcaption>
</figure>
```

Marker kinds:

- `shape` — rectangular highlight with longer labels.
- `link` — marker that links to a section or external URL; labels are normalized to short CTA text.
- `pointer` — directional pointer with target/destination behavior.

Validate marker targets:

- Internal anchors must match an existing section ID, for example `#doc-minescape-player-guide-s2`.
- External URLs must be complete and safe.

## Import Algorithm

1. Read `cms_docs_v2`, target section key, `cms_media_assets_v1`, `cms_translations_v2`, and `cms_releases_v2`.
2. Find or create the product in `cms_games_v1`.
3. Find or create the document in `cms_docs_v2` using a stable `id` and `slug`.
4. Import or reference media assets before section generation.
5. Build the section array with wrapper HTML, figures, and managed components.
6. Write sections to the right key:
   - default game manual: `cms_sections_v2`
   - back-office docs: `cms_backoffice_sections_v1`
   - integration docs: `cms_integration_sections_v1`
   - custom/imported docs: `cms_custom_sections_v1`, keyed by document ID when the current state shape is an object.
7. Update the document’s `sections` count and `updatedAt`.
8. Update media `usageRefs` so humans can see where assets are used.
9. Add or update translation rows only when localization is requested; otherwise leave source discoverable for the Translations page.
10. PUT changed keys with explicit operation names.
11. Render-check the reader and admin content editor.

## Safety Checks

- No `<script>`, unsafe event handlers, or `javascript:` links.
- No broken media `src`.
- No duplicate document IDs, section IDs, or slugs.
- No invented rules: screenshot-derived values must be labeled as examples/observations.
- No overly custom HTML that blocks inline editability.
- Every interactive marker has an accessible label/description and valid destination.
