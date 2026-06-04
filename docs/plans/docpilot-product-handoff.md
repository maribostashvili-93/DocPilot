# DocPilot Product Handoff

Date: 2026-05-11

## Purpose

DocPilot is a documentation builder and CMS for software/product teams. The temporary repository and first demo content came from Aviator game documentation, but the product should be abstract and usable for any software product that needs internal and external documentation.

The primary user is a product manager or documentation owner who needs to create, maintain, translate, version, and publish comprehensive documentation without heavy developer involvement.

Batcave should control the development process for this repository. DocPilot should not become Batcave, and we are not introducing product-facing agents yet.

## Current Product Frame

DocPilot should let teams model:

- Workspaces
- Products
- Documentation spaces
- Documents
- Sections/content blocks
- Audiences and visibility
- Versions and releases
- Translation coverage
- Media and annotations

Aviator is the first example workspace/product. It has:

- Game presentation documentation for partners such as B2B aggregators and B2C casinos
- End-user/player-facing game explanation
- Back-office/internal system documentation for cross-functional teams
- Integration documentation for partner technical teams
- Some internal back-office content that may also need selective partner access

## Important Decisions

- Product name: DocPilot
- AviatorDocs is only the temporary repo/demo name.
- Batcave owns development workflow and planning.
- DocPilot product itself should remain a general-purpose documentation CMS.
- No new DocPilot product agents for now.
- The product should prioritize regular product/documentation users, not developers.
- UI must support readable, engaging documentation with rich media and visual annotations.

## Current Repository State

Repo path:

```text
/Users/nukritusishvili/Desktop/AviatorDocs
```

Stack:

- Vite
- React
- TypeScript
- Local browser storage persistence
- Static/manual assets under `public/images/manual`

Current important routes:

- `/`
- `/games/:gameId`
- `/manual/:slug`
- `/docs/:docId`
- `/admin/login`
- `/admin/dashboard`
- `/admin/documents`
- `/admin/sections`
- `/admin/translations`
- `/admin/publishing`
- `/admin/workflow`

Prototype login:

```text
admin / admin
```

## What Has Been Built

### Initial Docs Import

- Created Vite React app.
- Imported Aviator user manual from Claude handoff.
- Extracted manual images into `public/images/manual`.
- Rendered the manual as a public docs view.

### CMS Pivot

Originally the back-office drifted toward an Aviator game operator/admin panel. The direction was corrected: back-office means documentation CMS, translation tooling, publishing, and content management.

Built:

- Dashboard
- Documents library
- Content editor
- Translations
- Publishing/versioning
- Workflow view

### Inline Content Editing

The content editor renders real documentation content and lets editors hover sections, see an overlay, and open a pencil editor.

Built:

- Section hover highlight
- Pencil edit action
- Edit form with title, slug, owner, status
- Text editing mode
- HTML editing mode
- Text styling tools
- Add/reorder/duplicate/delete sections

### Translation Tooling

Built:

- 37 language entries
- Key/value translation model
- Per-language progress
- New language creation
- Missing-only filter
- Search across keys/source text
- Reviewer/status fields

Known gap: translation keys are generated from default sections and are not fully regenerated after custom section edits.

### Game-Aware Documentation

Built game profiles:

- Aviator Crash
- Mines
- Plinko
- Rubber Duck
- Tower

Aviator currently has three documentation streams:

- Game docs
- Back-office docs
- Integration docs

Other games currently show missing/empty documentation states.

### Integration Documentation

Uploaded file:

```text
/Users/nukritusishvili/Downloads/aviator-studio-docs.pdf
```

The PDF was inspected and seeded into integration documentation sections:

- Introduction
- Integration Sample App
- Launch Game
- Integration Endpoints
- Game Flow And Round Sequences
- Freebets And Webhooks
- Round History And Provider Configs
- Reconciliation And Fun Mode
- Debugging And FAQ

### Public Reader UX

Built:

- Game documentation library route
- Document type cards
- Sticky reader switcher between Game, Back-Office, Integration
- Back-to-top control
- Empty doc states for games without docs

### Versioning/Publishing Prototype

Built:

- Version entries
- Release table
- Readiness cards
- Disabled publish button when readiness gates fail

Known gap: versions are metadata only; immutable content snapshots are not implemented yet.

### Workflow Prototype

Built `/admin/workflow` inspired by Batcave workflow visibility.

Important correction: this is only a visual/product-planning prototype. Batcave itself should control the development process externally.

Workflow stages shown:

- Intake
- Information Architecture
- Content Build
- Translation Pass
- Reader QA
- Integration Safety
- Version Publish

Known gap: these stages are not persisted per document and are not real Batcave tickets/tasks yet.

### DocPilot Naming

Visible CMS language was shifted from AviatorDocs/Docs CMS toward DocPilot.

Known gap: repository/package still uses AviatorDocs naming in places. Product naming should be cleaned up intentionally later.

### Image Annotation Tool

Built first version of image annotation inside section editor:

- Image URL/path field
- Marker label
- Rectangle position as X/Y percentages
- Rectangle size as width/height percentages
- Live preview
- Insert annotated image into document HTML

Known gaps:

- No file upload or asset library yet
- Only one marker per insert
- Marker positioning is numeric, not drag-and-drop
- No marker color/style picker yet
- No annotation editing UI after insertion except HTML mode

## Current Commit History

Recent commits:

```text
d99f3d2 feat: add DocPilot image annotations
50f000a feat: add docs workflow map
02ade0b feat: improve end-to-end docs UX
fb735c4 feat: improve docs CMS workflow
db739c3 feat: add game-aware docs CMS
1d7aa58 feat: improve editor and localization CMS
6e10852 feat: add text and html edit modes
ef26b2c feat: edit live manual content from CMS
d52647e feat: add inline manual section editing
d083548 refactor: pivot admin to docs CMS
9f54892 chore: scaffold AviatorDocs
```

## Core Product Requirements For PM Agent

The PM agent should turn this into a proper PRD and roadmap for a documentation builder platform.

MVP should likely include:

- Workspace/product model
- Product documentation spaces
- Documents and nested sections
- Rich content editor
- Image/media insertion
- Annotation tools for screenshots
- Audience/visibility model
- Public/private docs portal
- Version snapshots
- Basic publishing workflow
- Basic translation management
- Templates for common documentation types

Post-MVP:

- Drag-and-drop annotation editor
- Asset library
- Comments/review suggestions
- Real auth and roles
- Server persistence
- PDF/DOCX/Markdown/HTML imports
- OpenAPI/API docs generator
- Export to static docs/PDF/DOCX
- Link checker
- Content quality/readability checks
- AI-assisted documentation helpers, if/when appropriate

## Audience Model To Explore

DocPilot needs audience-aware publishing.

Likely built-in audiences:

- Public/end users
- Partners
- Internal teams
- Developers
- Support
- Compliance
- Custom audience groups

Each document and section should support visibility rules:

- Public
- Partner
- Internal
- Restricted/custom
- Hidden/draft

This is essential for the Aviator use case because back-office documentation can have both internal-only and partner-visible sections.

## Questions For PM Agent

- What is the exact MVP boundary for DocPilot?
- Should the first release remain local-only or introduce backend persistence immediately?
- What is the minimal audience/permission model?
- What content block types are required for MVP?
- How should reusable blocks and variables work?
- What versioning guarantees are required for first release?
- What import/export formats matter first?
- What is the publishing workflow for PM-owned docs?
- How much of Batcave workflow should remain external versus visible inside DocPilot?

## Recommended Next Step

Use Batcave to create a PM intake/PRD task for DocPilot.

The next session should not start coding immediately. It should:

1. Read this handoff.
2. Inspect the current app briefly.
3. Draft a PRD for DocPilot.
4. Define MVP versus later scope.
5. Produce acceptance criteria.
6. Create a Batcave-compatible delivery plan/ticket breakdown.

