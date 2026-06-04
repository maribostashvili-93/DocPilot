# DocPilot Documentation Automation Workflow

This workflow converts source documentation, screenshots, labels, and product notes into a DocPilot build that humans can later edit manually.

## 1. Source Intake

Collect:

- Product/game name and canonical slug.
- Existing DocPilot product ID and document ID if present.
- Source docs, markdown, screenshots, videos, media manifests, UI labels, user descriptions, and comments.
- Audience: players, operators, support, partners, developers, translators, or internal product.
- Required tone: player guide, operator manual, technical reference, release note, integration guide, or troubleshooting article.
- Known uncertainties: values shown only in screenshots, missing specs, unconfirmed max limits, or inferred behavior.

Output an internal evidence inventory before writing:

```json
{
  "product": "Minescape",
  "doc": "Minescape Player Guide",
  "audience": ["players", "support"],
  "screens": [
    {
      "id": "media-minescape-default-screen",
      "name": "Default manual setup screen",
      "tags": ["minescape", "manual-mode", "default-screen"],
      "observations": ["Bet amount is editable", "Grid tiles are closed", "Start Bet is available"]
    }
  ],
  "uncertainClaims": ["Potential win values are examples unless product confirms formula"]
}
```

## 2. Content Architecture

Choose a section structure before writing. A strong game/interface guide usually contains:

1. Overview and scope
2. Screen layout
3. Controls and setup
4. Manual play flow
5. Tile/grid states
6. Win, lose, and cashout states
7. Auto mode setup
8. Auto mode advanced settings
9. Menu/settings
10. Media inventory or screenshot reference
11. Support/troubleshooting notes
12. Review notes and open questions

For technical/operator docs, replace gameplay flow with configuration, data, API, operations, and governance sections.

## 3. Media Preparation

For each image/video:

- Give it a stable human-readable name.
- Preserve user-provided tags as comma-separated values, then normalize to DocPilot tag arrays.
- Add alt text that describes the actual visual state.
- Add usage references in the form `<Document Title> · <Section Number> <Section Title>`.
- Upload missing local files through `/api/docpilot/media/upload` or reference existing public assets.
- Do not embed base64 in section HTML unless there is no file-based alternative.

Recommended screenshot naming:

```text
<product>-<mode-or-area>-<state-or-action>.png
```

Examples:

```text
minescape-manual-default-screen.png
minescape-manual-half-bet-selected.png
minescape-auto-advanced-settings-expanded.png
```

## 4. Draft Generation

Convert source text into DocPilot sections:

- Use one `SectionEntry` per conceptual topic.
- Keep paragraphs short and editable.
- Use `h3`/`h4` headings for subsections inside a section.
- Use tables for reference data.
- Use steps for workflows.
- Use callouts for caveats, limits, and product-review warnings.
- Use region lists for UI anatomy.
- Use carousels for screenshot sequences.
- Use figures for individual screenshots.

Do not use markdown-only syntax inside persisted HTML. Convert it to semantic HTML or managed component markup.

## 5. Component Selection Guide

| Source pattern | DocPilot element |
| --- | --- |
| Warning, caveat, observed-only value | Callout `warning` or `note` |
| Success state or user tip | Callout `success` |
| Control reference, limits, media inventory | Table |
| Step-by-step user action | Steps |
| Screen anatomy | Region list |
| Optional detail/FAQ | Accordion |
| Compare modes | Tabs |
| Screenshot sequence | Image carousel |
| Single screenshot with explanation | Figure |
| Screenshot with UI hotspots | Annotated figure/screenshot editor |

## 6. Build In DocPilot

For API builds:

1. Read current state keys.
2. Upsert media assets.
3. Upsert document metadata.
4. Upsert section records.
5. Update section count and document timestamp.
6. Update usage references and optional translations.
7. PUT state keys with `agent_*` operation names.

For UI builds:

1. Log in as admin/editor.
2. Create or select document.
3. Add sections.
4. Paste/import HTML through full section editor.
5. Insert managed elements through Elements Library.
6. Upload/select images through Media Library.
7. Use screenshot editor for marker placement.
8. Save sections as draft/review.

Prefer API for repeatable bulk work and UI for final visual/marker checks.

## 7. Translation Scaffolding

If localization is requested:

- Keep English/source text clean and explicit.
- Avoid idioms in technical instructions.
- Use stable section IDs so localization keys do not churn.
- Create language rows with code, language, native name, owner, reviewer, due date, status, and empty or machine-drafted `values`.
- Mark incomplete rows as `not-started` or `in-progress`, not `published`.

## 8. Publishing Readiness

Before publishing or handing to reviewers:

- Document metadata is complete.
- Sections are ordered and have meaningful summaries.
- No section is accidentally empty.
- Media links resolve.
- Marker targets resolve.
- Unsafe HTML checks pass.
- Translation rows exist if required.
- Release snapshot is created only when the user asks or when the workflow explicitly requires it.

## 9. Human Editability Review

After building, check that a human can still:

- Edit document settings from Documents.
- Select and edit each section in Sections.
- Inline-edit headings, paragraphs, table cells, captions, and callout titles.
- Edit managed components through the component builder.
- Replace/edit media through Media Library.
- Open screenshot figures in the screenshot editor.
- Continue translations from Translations.
- Create snapshots and publish from Publishing.

If any generated block is not editable through these surfaces, simplify its HTML or convert it to a managed component.

## 10. Handoff Format

When reporting completion to a user or another agent, include:

- Branch and commit/push status.
- Document ID/title/slug.
- State keys changed.
- Media assets created/updated.
- Validation commands run.
- Any remaining product questions.

Keep the report short but precise so another agent can resume without re-discovering the build.
