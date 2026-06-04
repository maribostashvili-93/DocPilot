---
name: docpilot-build-docs
description: Build or update editable DocPilot documentation from regular docs, notes, screenshots, media manifests, product specs, or game-state labels. Use when an AI agent must turn source material into DocPilot documents, sections, managed components, media assets, translations, and publishing-ready drafts without asking the user to operate the UI manually.
---

# DocPilot Build Docs

## Overview

Use this skill to transform ordinary documentation into DocPilot-native content that remains editable through the DocPilot admin UI. The output should not be a static markdown dump: it should create or update document records, section records, media assets, managed component markup, translation scaffolding, and review/publishing metadata.

## Decision Tree

- **Bulk import or rebuild:** Use the DocPilot persistence API and state keys for documents, sections, media, translations, and releases.
- **Fine visual placement:** Use the DocPilot UI/browser for screenshot marker placement, drag/resize checks, and final rendering QA.
- **User wants a handoff file only:** Create markdown/JSON in `docs/content`, but still structure it so a later agent can import it to DocPilot.
- **User wants editable docs:** Persist the content in DocPilot state, not only in repository files.

## Required References

Load these only when needed:

- `references/content-editor-action-map.md` — complete map of editor, media, translation, and publishing actions an agent can automate or mirror.
- `references/state-and-markup.md` — DocPilot state keys, API calls, entity shapes, section wrappers, component markup, figures, and annotation conventions.
- `references/automation-workflow.md` — end-to-end conversion workflow from source docs/screenshots to editable DocPilot output.

## Agent Workflow

1. **Inventory the source material.** Identify product/game name, audience, desired doc type, screenshots/media, existing docs, UI states, labels, and uncertain claims.
2. **Choose DocPilot targets.** Decide whether to create a new document or update an existing one; choose `game`, `back-office`, `integration`, or `operations`.
3. **Import media first.** Use existing DocPilot media assets when present. Upload missing files through `/api/docpilot/media/upload` or create media records for public assets.
4. **Generate editable sections.** Split content into numbered `SectionEntry` records with stable IDs/slugs, concise summaries, workflow status, owner/reviewer, and DocPilot section wrapper HTML.
5. **Use managed elements.** Convert dense content into callouts, tables, steps, region lists, accordions, tabs, lists, and carousels using DocPilot component markup.
6. **Attach screenshots intentionally.** Use `<figure>` blocks for images; add captions and alt text. Use annotation markup or the UI screenshot editor only where markers are truly useful.
7. **Persist with audit context.** Update server state via `/api/docpilot/state/<key>` with `x-docpilot-role: admin`, `x-docpilot-user: agent`, and clear operation names.
8. **Validate.** Check rendered routes, media links, unsafe HTML, marker targets, translation coverage, and publishing readiness before claiming completion.

## Editing Principles

- Make content user-editable in DocPilot: prefer semantic HTML, managed component markup, figures, tables, and short paragraphs.
- Do not bury all content in one section; use sections that match the product narrative and the UI flow.
- Do not invent game rules, odds, limits, or payouts from screenshots. Mark observed values as examples unless the source says they are authoritative.
- Preserve user-provided names/tags/screenshots exactly when they are meant to be references for later agents.
- Keep source evidence traceable with media tags, usage references, section summaries, and review comments when helpful.
- Use stable kebab-case slugs and deterministic IDs so repeated agent runs update instead of duplicating content.

## Direct API Pattern

When a local DocPilot server is running, use this pattern for state reads and writes:

```bash
curl -sS http://127.0.0.1:4179/api/docpilot/health
curl -sS http://127.0.0.1:4179/api/docpilot/state/cms_docs_v2
curl -sS -X PUT http://127.0.0.1:4179/api/docpilot/state/cms_docs_v2 \
  -H 'content-type: application/json' \
  -H 'x-docpilot-user: agent' \
  -H 'x-docpilot-role: admin' \
  --data '{"value":[],"operation":"agent_update_docs","target_entity":"cms_docs_v2","actor":"agent"}'
```

If the server is not running, start the app using the repository’s documented command and never pretend local-only browser storage is durable.

## Completion Checklist

- Document metadata exists and points to the correct product, type, audience, taxonomy, navigation placement, owner, reviewer, version, and status.
- Every section has valid wrapper HTML, a unique number/slug/title, and content that can be edited through DocPilot.
- Media assets have `src`, `alt`, tags, owner, updated date, and usage references.
- Figures and components render in the reader and remain editable in the content editor.
- Translation and publishing surfaces can discover the new content.
- Changes are committed and pushed when the user asks other agents to consume them from GitHub.
