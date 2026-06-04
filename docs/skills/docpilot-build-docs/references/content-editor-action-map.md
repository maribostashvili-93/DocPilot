# DocPilot Content Editor Action Map

This map tells an AI agent which DocPilot actions exist, what surface owns them, and how to automate or emulate them when building editable documentation.

## Operating Rule

Use direct state/API updates for bulk creation and repeatable transformations. Use the UI/browser when the task depends on spatial interactions, visual QA, hover states, marker placement, or confirming that editors remain usable by humans.

## Document And Library Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| D-01 | Browse product catalog | Public product cards | Use to understand product/game scope and available documents before creating duplicates. |
| D-02 | Open product documentation library | Public product page | Verify that a document appears in the correct product library and navigation placement. |
| D-03 | Read document | Public reader | Use reader route for final render QA and table-of-contents checks. |
| D-04 | Navigate TOC/back-to-top | Public reader | Confirm section IDs and headings are discoverable in long docs. |
| D-05 | Sign in/out | Admin login/shell | For UI automation, log in as an admin/editor; for state API, use write headers. |
| D-06 | Navigate admin modules | Admin shell | Main modules: Dashboard, Documents, Sections, Media, Translations, Publishing, Integrations, Users. |
| D-07 | Select active product | Dashboard/Documents | Ensure the active product matches the target document’s `gameId`. |
| D-08 | Inspect dashboard health | Dashboard | Check review/status counts after large imports. |
| D-09 | Create document | Documents / `DocumentForm` | Create `DocEntry` with title, slug, product, type, version, owner, reviewer, status, audience, taxonomy, nav placement/order, template. |
| D-10 | Edit document settings | Documents / `DocumentForm` | Update metadata without changing section bodies. |
| D-11 | Delete document | Documents / confirm modal | Avoid destructive deletion unless explicitly requested; deletion cascades section/revision/release/translation cleanup. |
| D-12 | Preview/open document | Documents/public reader | Verify draft/published perception and all content blocks after import. |

## Section Authoring Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| S-01 | Select document in editor | Sections tabs | Always target the intended document before editing; unsaved UI state can reset on document switch. |
| S-02 | Search/find section | Sections search | Search by title/summary for manual QA; API workflows should use section IDs/slugs. |
| S-03 | Select/collapse/expand section | Section controller/action bar | Useful for visual QA of long docs; does not affect persisted content. |
| S-04 | Add section | `SectionCreateForm` | Create `SectionEntry` with ID, number, slug, title, summary, status, owner, reviewer, updatedAt, html. |
| S-05 | Full section edit | `SectionInlineEditor` | Edit raw text/HTML and metadata. Use when HTML wrappers/components need direct control. |
| S-06 | Text styling tools | Text toolbar | Supports H3, H4, bold, italic, inline code, bulleted list, quote, link, info callout, annotated image. |
| S-07 | Inline edit rendered element | Rendered preview | Human-friendly quick edits for titles, headings, paragraphs, list items, definitions, table cells, captions, callout titles. |
| S-08 | Delete inline element | Inline editor | Can remove non-heading elements; agents should prefer editing source HTML for controlled deletes. |
| S-09 | Undo/redo/restore revisions | Section/editor panels | UI has local revision stacks; API imports should create intentional commits and avoid relying on local undo. |
| S-10 | Drag/reorder sections | Section list/drag handles | Update section array order directly for bulk work; verify visual ordering after. |
| S-11 | Publish/update/save draft section | Section controls | Set `status` intentionally. Use `draft` during generation, `review` when ready for human review, `published` only when asked. |
| S-12 | Duplicate/delete section | Section controls | Duplicate by copying section content with new ID/slug; delete only when explicitly requested. |

## Managed Component Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| C-01 | Open elements library | Sections / Elements Library | Available component kinds: callout, accordion, tabs, list, table, region list, steps, image carousel. |
| C-02 | Insert component | Component insert mode | Use `data-doc-component` markup for API imports; use UI insert mode for visual placement testing. |
| C-03 | Edit component | Component builder | Component controls support edit, move up/down, duplicate, and delete. |
| C-04 | Callout | Component builder | Use for notes, warnings, success tips, danger states, and important implementation caveats. |
| C-05 | Accordion | Component builder | Use for optional explanations, FAQs, hidden detail, or per-state notes. |
| C-06 | Tabs | Component builder | Use for mutually exclusive modes such as Manual vs Auto or Player vs Operator. |
| C-07 | List | Component builder | Use for checklist/reference bullets; supports ordered/unordered mode. |
| C-08 | Table | Component builder | Use for controls, state matrices, media inventories, limits, data dictionaries, and examples. |
| C-09 | Region list | Component builder | Use for screen-region descriptions: header, control panel, grid, footer, overlays. |
| C-10 | Steps | Component builder | Use for procedures: place bet, reveal tile, cash out, start autobet, review translations. |
| C-11 | Image carousel | Component builder/media picker | Use for sequences of screenshots with captions; each slide needs image URL and title/caption. |
| C-12 | Item/row/slide operations | Component builder | Add, move, duplicate, and delete rows/items/slides through builder or deterministic markup edits. |

## Media And Screenshot Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| M-01 | Open Media Library | Media module | Inventory existing assets before uploading duplicates. |
| M-02 | Upload media | Media Library / picker | Upload up to 25 files per request; fill alt text, tags, owner, usage refs. |
| M-03 | Filter/search media | Media Library | Search by filename, tags, owner, MIME type, and kind. |
| M-04 | Edit media metadata | Media Library | Update display name, alt, tags, owner, video loop setting, usage refs. |
| M-05 | Preview media | Media Library | Use image lightbox/video preview to verify asset quality. |
| M-06 | Delete media | Media Library/API | Delete only unused assets or when explicitly requested. |
| M-07 | Use media picker | Section editor | Select/upload images from within section editing. Picker is image-focused. |
| M-08 | Insert figure | Section HTML | Use semantic `<figure><img><figcaption>` for screenshots so the screenshot editor can find them. |
| M-09 | Edit screenshot metadata | Screenshot modal | Fields include image URL, alt, and caption. Prefer media library assets over raw external URLs. |
| M-10 | Add marker | Screenshot modal | Marker kinds are shape, link, and pointer. |
| M-11 | Place marker | Screenshot modal | Drag, resize, rotate pointer, move popover, or set numeric X/Y/W/H values. |
| M-12 | Configure marker text/type | Marker inspector | Set label/CTA, description, type, alignment, target section/external URL. |
| M-13 | Configure marker style | Marker inspector | Use presets first; advanced color, opacity, dialog, CTA, and pointer controls are available. |
| M-14 | Configure marker destination | Marker inspector | Validate `#section-id` anchors and external URLs. |
| M-15 | Save/discard screenshot edits | Screenshot modal | Dirty close should save, discard, or keep editing; do not lose marker work. |

## Translation Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| T-01 | Select translation product/document | Translations | Ensure language work is scoped to the intended document. |
| T-02 | Select language | Language rail | Use existing language entries or create new ones. |
| T-03 | Search/filter missing | Translations | Use for QA after import to locate empty target strings. |
| T-04 | Edit strings | Translation rows | Preserve source meaning; row state can be dirty/saved/review. |
| T-05 | Add language | Language form | Prevent duplicate codes; set owner/reviewer/due date/status. |
| T-06 | Review localization readiness | Publishing/readiness | Check whether missing strings block release. |

## Publishing And Governance Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| P-01 | Create version snapshot | Publishing / `ReleaseForm` | Capture document, version, label, notes, environment, readiness, and snapshot content. |
| P-02 | Review readiness | Publishing readiness cards | Resolve missing metadata, unsafe HTML, broken markers, translation gaps, and unpublished sections. |
| P-03 | Publish version | Publishing | Only publish when requested and readiness passes; otherwise leave as draft/review. |
| P-04 | Roll back version | Publishing | Treat rollback as a restorative snapshot, not silent mutation. |
| P-05 | Audit persistence | Server mutations | Every API write should have actor, operation, target entity, revision chain, and timestamp. |

## Role And Persistence Actions

| ID | Action | Surface | Agent behavior |
| --- | --- | --- | --- |
| R-01 | Use server persistence | Whole app/API | Durable state is `.docpilot-data/cms-state.json`; browser storage is only cache. |
| R-02 | Respect RBAC | UI and API | Server rejects writes without matching role/permission. Use `admin` for agent imports unless testing RBAC. |
| R-03 | Handle write denial | API/UI | If denied, report required permission instead of retrying blindly. |
| R-04 | Manage users | Users | Only admins manage users; this is separate from documentation import. |
| R-05 | Keep manual editability | All authoring surfaces | Build content so a human can adjust it later through Documents, Sections, Media, Translations, and Publishing. |
