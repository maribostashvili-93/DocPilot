# Next Chat Prompt

You are continuing work on the DocPilot project in:

```text
/Users/nukritusishvili/Desktop/AviatorDocs
```

Batcave should control the development workflow for this repository. Do not turn DocPilot into Batcave, and do not introduce new product-facing agents yet.

First read:

```text
docs/plans/docpilot-product-handoff.md
```

Context:

- Product name is DocPilot.
- Current repo name is still AviatorDocs because Aviator was the first demo/use case.
- DocPilot is a general-purpose documentation builder/CMS for software product teams.
- The primary user is a product manager or documentation owner, not a developer.
- Goal: allow regular users to create, maintain, translate, version, and publish internal/external documentation end-to-end with minimal developer involvement.
- Aviator is only the first use case: game provider docs, partner docs, integration docs, and internal/back-office docs.

Important product direction:

- Build a documentation builder platform, not an Aviator-specific docs app.
- Support products, documentation spaces, documents, sections, audiences, versions, translations, media, and publishing workflows.
- Audience/visibility is crucial: sections may be public, partner-facing, internal-only, or restricted.
- Rich media is crucial: users must add images/screenshots and create customizable annotations/rectangle pointers to improve readability.
- Batcave should be used to plan and control development work externally.

Current app already has:

- Vite React/TypeScript app
- Public docs reader
- Game/product selection for Aviator, Mines, Plinko, Rubber Duck, Tower
- Documents library
- Inline section editor
- Text/HTML editor modes
- Basic text styling tools
- Basic image annotation insertion
- Translation key/value tool with 37 languages
- Basic version/publishing readiness UI
- Batcave-inspired workflow view

Known gaps:

- No real backend persistence yet
- No real auth/roles
- Versioning is metadata only, not immutable content snapshots
- Custom documents have starter sections but the data model is still prototype-grade
- Translation keys do not dynamically regenerate from all custom edits
- Image annotation is numeric and single-marker; no drag/drop or asset library yet
- Product naming cleanup is incomplete
- Navigation and app shell still need a product-grade redesign

Your job in the next session:

1. Act as the PM agent starting Batcave workflow intake for DocPilot.
2. Do not start coding immediately.
3. Produce a proper PRD/product plan for DocPilot.
4. Define MVP scope versus post-MVP.
5. Define information architecture and user workflows.
6. Define acceptance criteria.
7. Define the first delivery slice/ticket breakdown for implementation.
8. Keep DocPilot abstract and reusable for many software products.

Recommended output:

- Product vision
- Target users
- Core use cases
- Information architecture
- Content model
- Audience/visibility model
- Versioning model
- Translation model
- Media/annotation model
- Publishing workflow
- MVP scope
- Out of scope for MVP
- Acceptance criteria
- Delivery plan
- Open questions

