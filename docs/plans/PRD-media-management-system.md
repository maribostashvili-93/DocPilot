# PRD: DocPilot Media Management System

**Author:** Nukri Tusishvili (PM)  
**Date:** 2026-05-25 (Monday)  
**Release target:** 2026-05-30 (Friday)  
**Product:** DocPilot  
**Scope:** Media Management + Week Release Plan  
**Trace:** DSC-06 (Media Library), EPIC 1 (Authoring Core), bat-1055

---

## 1. Executive Summary

### The Product Today

DocPilot is a documentation builder CMS for Aviator Studio game products. It has:
- 9,114-line monolithic React SPA (`App.tsx`)
- Custom Node.js persistence API (JSON file-based)
- WYSIWYG content editor with rich components (accordion, tabs, callouts, tables)
- Interactive screenshot marker/annotation system (shapes, links, pointers)
- 26-figure Aviator manual with 18 sections
- 37-language translation workflow
- Snapshot-based release management
- Prototype RBAC (7 roles, hardcoded auth)
- A basic `MediaLibraryPicker` component — images only, base64 storage, no dedicated page, no file type support beyond images

### The Problem

The current media handling is a sidebar picker embedded inside the section editor. It cannot:
- Manage documents (PRDs, Word, Excel, PDFs)
- Handle video content
- Organize assets across the whole documentation system
- Provide bulk operations (upload, tag, delete)
- Filter/search across asset types
- Track storage usage or asset metadata at scale
- Serve as a standalone content operations surface

Content editors must leave DocPilot to manage non-image files. There is no central asset inventory. This blocks the goal of shipping comprehensive, media-rich Aviator documentation this week.

### The Vision (3-6 months)

DocPilot transforms from documentation-only to a **client area platform**:
- Jira Service Desk integration (feature requests, bug reports)
- Client-facing feature roadmap and release updates
- Suggestion/feedback system
- Game and back-office status pages
- Partner/client self-service portal

The media management system is the first foundational step — without robust asset management, none of the above surfaces can include rich content.

---

## 2. This Week's Release Goal

**By Friday 2026-05-30, DocPilot must have:**

1. A well-styled, comprehensive Aviator Crash game manual (18 sections, all figures, polished reader experience)
2. A complete Aviator integration document (API, webhooks, game flow, configuration)
3. A dedicated Media Management page in the admin dashboard
4. Support for all file types: images, videos, PDFs, Word, Excel, presentations
5. WordPress-level media library UX: grid/list views, filters, bulk operations, drag-and-drop upload

### Week Plan (day-by-day)

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Mon** | PRD + UX design + data model | This document + wireframes + type definitions |
| **Tue** | Backend: file storage API + media CRUD endpoints | Server-side upload, storage, metadata, retrieval |
| **Wed** | Frontend: Media Management page + upload flows | Dedicated admin page with grid/list, filters, bulk ops |
| **Thu** | Integration: wire media page into editor + content polish | Section editor uses new media system; Aviator content reviewed |
| **Fri** | Styling pass + reader experience + release | Polish, test all flows, ship |

---

## 3. User Personas & Use Cases

### Primary Users

| Persona | Role | Media needs |
|---------|------|-------------|
| **Content Editor** | Writes/updates documentation | Upload screenshots, embed videos, attach PDFs, organize by doc/section |
| **Product Admin** | Manages structure and releases | Bulk upload assets, enforce tagging, monitor storage, audit usage |
| **Integration Partner** | Consumes published docs | Download attached files (API specs, SDKs, sample code) |
| **Reviewer/QA** | Validates content quality | View asset usage, check alt text, verify file integrity |

### Core Use Cases

| # | Use Case | Priority |
|---|----------|----------|
| UC-1 | Upload image files (PNG, JPG, SVG, WebP, GIF) | Must |
| UC-2 | Upload document files (PDF, DOCX, XLSX, PPTX) | Must |
| UC-3 | Upload video files (MP4, WebM) or embed video URLs | Must |
| UC-4 | Browse all assets in a dedicated Media page with grid/list toggle | Must |
| UC-5 | Filter assets by type (image/document/video), tags, owner, date | Must |
| UC-6 | Search assets by name, alt text, tags | Must |
| UC-7 | Bulk upload via drag-and-drop zone | Must |
| UC-8 | Edit asset metadata (alt text, tags, owner, description) | Must |
| UC-9 | Delete assets with usage-guard warning | Must |
| UC-10 | View asset usage across sections/documents | Must |
| UC-11 | Insert media assets from the section editor (existing picker upgraded) | Must |
| UC-12 | Preview assets inline (images render, PDFs show first page, videos play) | Should |
| UC-13 | Bulk tag/re-tag selected assets | Should |
| UC-14 | Asset version history (replace file, keep previous) | Could |
| UC-15 | Storage usage dashboard (total size, by type) | Could |

---

## 4. Information Architecture

### New Admin Navigation

Current admin pages: `dashboard | documents | sections | translations | publishing | users`

New: `dashboard | documents | sections | **media** | translations | publishing | users`

The **Media** page sits between Sections and Translations — content editors work left-to-right: structure docs → write sections → manage media → translate → publish.

### Media Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  MEDIA LIBRARY                              [Upload ▲]  │
│─────────────────────────────────────────────────────────│
│  ┌─────────────────────────────────────────────────────┐│
│  │  ◀ Drop files here or click to upload               ││
│  │     Supports: images, videos, PDF, Word, Excel      ││
│  └─────────────────────────────────────────────────────┘│
│─────────────────────────────────────────────────────────│
│  [All] [Images] [Documents] [Videos]    🔍 Search...    │
│  Tags: [manual ×] [integration ×] [+]   View: ▦ ≡     │
│  Sort: [Recent ▼]  Owner: [All ▼]       48 assets      │
│─────────────────────────────────────────────────────────│
│  ☐ Select all  |  [Tag] [Delete] [Download]   bulk ops │
│─────────────────────────────────────────────────────────│
│                                                         │
│  GRID VIEW (default):                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ 🖼️   │ │ 📄   │ │ 🎬   │ │ 📊   │ │ 🖼️   │         │
│  │thumb │ │ PDF  │ │video │ │ XLS  │ │thumb │         │
│  │      │ │ icon │ │thumb │ │ icon │ │      │         │
│  ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤         │
│  │name  │ │name  │ │name  │ │name  │ │name  │         │
│  │2.1MB │ │1.4MB │ │24MB  │ │340KB │ │890KB │         │
│  │☐     │ │☐     │ │☐     │ │☐     │ │☐     │         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                         │
│  LIST VIEW (toggle):                                    │
│  ☐ │ 🖼️ │ fig-02.png      │ manual,game │ Product│2.1MB│
│  ☐ │ 📄 │ aviator-prd.pdf │ prd,specs   │ PM     │1.4MB│
│  ☐ │ 🎬 │ demo-reel.mp4   │ marketing   │ Sales  │24MB │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Asset Detail Panel (click asset → slide-in panel)

```
┌───────────────────────────────────┐
│  ← Back to library                │
│                                   │
│  ┌─────────────────────────────┐  │
│  │                             │  │
│  │     [Preview / Thumbnail]   │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                                   │
│  Filename: fig-02.png             │
│  Type: image/png                  │
│  Size: 2.1 MB                     │
│  Dimensions: 1920 × 1080         │
│  Uploaded: 2026-05-25             │
│  Owner: Product                   │
│                                   │
│  Alt text: [________________]     │
│  Description: [______________]    │
│  Tags: [manual] [game] [+add]    │
│                                   │
│  ── Usage (3 references) ──       │
│  • Manual · 2.0 Screen Anatomy   │
│  • Manual · 3.0 Round Lifecycle  │
│  • Integration · API Overview     │
│                                   │
│  [Replace File] [Download] [Delete]│
│                                   │
└───────────────────────────────────┘
```

---

## 5. Data Model

### Extended MediaAsset Type

```typescript
// Current (limited)
type MediaAsset = {
  id: string;
  src: string;        // base64 data URL — doesn't scale
  alt: string;
  tags: string[];
  owner: string;
  updatedAt: string;
  usageRefs: string[];
};

// New (full media management)
type MediaAssetKind = 'image' | 'document' | 'video';

type MediaAsset = {
  id: string;
  filename: string;           // original filename
  kind: MediaAssetKind;       // derived from MIME type
  mimeType: string;           // e.g. 'image/png', 'application/pdf'
  src: string;                // file URL path (served from /uploads/)
  thumbnailSrc?: string;      // auto-generated thumbnail for non-images
  alt: string;
  description?: string;       // longer description for documents
  tags: string[];
  owner: string;
  size: number;               // bytes
  dimensions?: {              // images and videos only
    width: number;
    height: number;
  };
  duration?: number;          // videos only, seconds
  uploadedAt: string;
  updatedAt: string;
  usageRefs: string[];
  uploadedBy: string;         // user who uploaded
  version: number;            // increments on file replacement
};
```

### MIME Type → Kind Mapping

| Kind | Accepted MIME types | Max size |
|------|-------------------|----------|
| `image` | image/png, image/jpeg, image/svg+xml, image/webp, image/gif | 10 MB |
| `document` | application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation | 50 MB |
| `video` | video/mp4, video/webm | 200 MB |

### File Storage

**Current:** base64 encoded in JSON state → bloats CMS state file, no streaming, no CDN path.

**New:** files stored on disk at `.docpilot-data/uploads/` with metadata in CMS state.

```
.docpilot-data/
├── cms-state.json          # existing — media metadata lives here
├── mutations.jsonl         # existing — audit log
└── uploads/                # NEW — actual file storage
    ├── images/
    │   ├── fig-02-abc123.png
    │   └── fig-03-def456.png
    ├── documents/
    │   ├── aviator-prd-ghi789.pdf
    │   └── integration-spec-jkl012.docx
    └── videos/
        └── demo-reel-mno345.mp4
```

---

## 6. API Design

### New Endpoints (added to docpilot-server.mjs)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/docpilot/media/upload` | Upload file(s), return metadata | content:write |
| `GET` | `/api/docpilot/media` | List all assets (with query filters) | any authenticated |
| `GET` | `/api/docpilot/media/:id` | Get single asset metadata | any authenticated |
| `PUT` | `/api/docpilot/media/:id` | Update asset metadata | content:write |
| `PUT` | `/api/docpilot/media/:id/replace` | Replace file, bump version | content:write |
| `DELETE` | `/api/docpilot/media/:id` | Delete asset (usage-guard) | content:write |
| `POST` | `/api/docpilot/media/bulk-tag` | Add/remove tags on multiple assets | content:write |
| `POST` | `/api/docpilot/media/bulk-delete` | Delete multiple assets | content:write |
| `GET` | `/api/docpilot/uploads/*` | Serve uploaded files (static) | public |

### Upload Flow

```
Client                          Server
  │                               │
  │  POST /media/upload           │
  │  Content-Type: multipart      │
  │  x-docpilot-user: admin       │
  │  x-docpilot-role: admin       │
  │  ──────────────────────────►  │
  │                               │  1. Validate MIME type + size
  │                               │  2. Generate unique filename
  │                               │  3. Write to uploads/{kind}/
  │                               │  4. Generate thumbnail if needed
  │                               │  5. Create metadata entry
  │                               │  6. Append audit event
  │  ◄──────────────────────────  │
  │  { asset: MediaAsset }        │
  │                               │
```

### Migration: Base64 → File Storage

Existing 3 seeded assets use `/images/manual/` paths (already file-based). New uploads go to `/uploads/`. The MediaLibraryPicker continues to work with both URL patterns — no migration needed for existing assets.

---

## 7. Frontend Components

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MediaPage` | Top-level admin page | Full media management dashboard |
| `MediaGrid` | Inside MediaPage | Grid view of asset cards |
| `MediaList` | Inside MediaPage | Table/list view of assets |
| `MediaDetailPanel` | Slide-in panel | Asset detail view with edit form |
| `MediaUploadZone` | Top of MediaPage | Drag-and-drop multi-file upload area |
| `MediaFilterBar` | Below upload zone | Type tabs, search, tag filter, sort, view toggle |
| `MediaBulkActions` | Below filter bar | Contextual bulk operations when items selected |
| `FileTypeIcon` | Shared | Renders appropriate icon per MIME type |
| `AssetPreview` | Detail panel | Renders image, PDF first page, or video player |

### Updated Components

| Component | Change |
|-----------|--------|
| `MediaLibraryPicker` | Add document/video tabs, connect to new API instead of state-only |
| `SectionsPage` | Pass document/video insert capability alongside images |
| `EditableSectionPreview` | Support embedding document download links and video players in section HTML |
| `SectionInlineEditor` | Support document/video insertion from media library |
| Admin navigation | Add "Media" tab between "Sections" and "Translations" |

### Responsive Behavior

- **≥1200px:** 5-column grid, side panel slides in without pushing grid
- **≥768px:** 3-column grid, panel overlays
- **320-767px:** 2-column grid, panel is full-screen modal
- Upload zone collapses to a button on mobile

---

## 8. UX Specifications

### Upload Experience

1. **Drag-and-drop zone** at the top of the Media page — always visible, highlights on dragover
2. **Click-to-browse** fallback button within the zone
3. **Multi-file support** — select or drop up to 20 files at once
4. **Progress indicators** — per-file progress bar during upload
5. **Auto-categorization** — files automatically sorted into image/document/video by MIME type
6. **Inline metadata prompt** — after upload, each new asset shows a compact form for alt text and tags
7. **Validation feedback** — rejected files (wrong type, too large) show clear error with reason

### Browse & Filter Experience

1. **Type tabs** — All | Images | Documents | Videos — with count badges
2. **Search** — real-time filter by filename, alt text, tags, description
3. **Tag filter** — clickable tag chips, multi-select, shows intersection
4. **Sort** — Recent (default), Name A-Z, Size, Most Used
5. **View toggle** — Grid (visual) vs List (data-dense)
6. **Pagination** — infinite scroll in grid, paginated table in list (50 per page)

### Selection & Bulk Operations

1. **Checkbox on each card** — appears on hover in grid, always visible in list
2. **Select all** checkbox in toolbar
3. **Bulk actions bar** appears when ≥1 item selected: Tag, Delete, Download
4. **Bulk delete** requires confirmation modal with usage warning
5. **Bulk tag** opens a tag editor that adds/removes tags from all selected

### Asset Detail

1. **Click asset** → detail panel slides in from right
2. **Preview** — images render full-width, PDFs show embedded viewer, videos show player, documents show icon + download button
3. **Editable fields** — alt text, description, tags, owner
4. **Usage references** — clickable links to sections where asset is used
5. **Replace file** — uploads new file, increments version, keeps metadata and usage refs
6. **Delete** — warns if asset has usage references, requires confirmation
7. **Download** — direct download link for the original file

### Editor Integration

1. **Section editor** media picker gains type tabs (Images | Documents | Videos)
2. **Image insert** — works as before (sets screenshot src)
3. **Document insert** — inserts a styled download card component into section HTML
4. **Video insert** — inserts an embedded video player component into section HTML
5. **New component blocks**: `download-card` and `video-embed` join existing accordion/tabs/callout/etc.

---

## 9. Styling Direction

Follows existing DocPilot visual language:
- Dark admin theme with high-contrast cards
- Consistent with existing `.media-library-panel`, `.media-asset-card`, `.media-asset-grid` classes
- Upload zone: dashed border, subtle gradient background, clear drop state
- Asset cards: rounded corners, soft shadow, hover lift effect
- Type badges: color-coded pills (blue=image, amber=document, purple=video)
- File type icons: clean SVG icons matching the existing `icons.svg` sprite approach
- Detail panel: slide-in with backdrop blur, same form field styling as sections editor

---

## 10. Technical Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File storage | Local disk (`uploads/`) | Matches current prototype scope; CDN/S3 is a future migration |
| Upload parsing | Node.js built-in (no multer) | Server uses raw `http` module, keep it dependency-free |
| Thumbnail generation | Client-side canvas for images; type icons for documents | No server-side image processing dependency |
| Video thumbnails | First-frame capture via `<video>` + canvas on client | Avoids ffmpeg server dependency |
| Max upload size | 200MB (video), 50MB (docs), 10MB (images) | Reasonable for documentation assets |
| Concurrent uploads | Max 3 parallel | Prevent server overload |
| Base64 migration | Not needed | Existing 3 assets already use file paths |
| State sync | Upload writes file + updates CMS state atomically | Same mutation.jsonl audit pattern |

---

## 11. Implementation Plan

### Phase 1: Backend (Tuesday)

```
1. Extend docpilot-server.mjs
   → Add multipart form-data parsing (no dependencies)
   → Create uploads/ directory structure on startup
   → POST /api/docpilot/media/upload endpoint
   → GET /api/docpilot/uploads/* static file serving
   → PUT /api/docpilot/media/:id metadata update
   → DELETE /api/docpilot/media/:id with usage guard
   → Bulk endpoints (tag, delete)
   verify: curl upload a PNG, PDF, MP4 → files on disk + metadata in state

2. Update vite.config.ts proxy
   → Add /api/docpilot/media and /api/docpilot/uploads proxy rules
   verify: dev server proxies upload requests correctly

3. Extend MediaAsset type
   → Add filename, kind, mimeType, size, dimensions, description, etc.
   → Add MIME-to-kind mapping utility
   → Add file size formatting utility
   verify: TypeScript compiles with new type
```

### Phase 2: Media Management Page (Wednesday)

```
4. Add "media" to ADMIN_PAGES constant and routing
   → New MediaPage component
   → Admin nav shows Media tab
   verify: /admin/media loads without errors

5. MediaUploadZone component
   → Drag-and-drop area with visual feedback
   → Multi-file selection
   → Upload progress bars
   → Auto-metadata form after upload
   verify: drag files → upload → appear in grid

6. MediaFilterBar component
   → Type tabs with counts
   → Search input with debounce
   → Tag filter chips
   → Sort dropdown
   → Grid/list view toggle
   verify: filter combinations narrow results correctly

7. MediaGrid + MediaList components
   → Card layout with thumbnails and type icons
   → List layout with sortable columns
   → Checkbox selection
   → Responsive column count
   verify: both views render all asset types

8. MediaBulkActions component
   → Tag, delete, download actions
   → Confirmation modals
   verify: bulk delete with usage guard shows warning

9. MediaDetailPanel component
   → Slide-in panel with preview
   → Editable metadata form
   → Usage reference list
   → Replace file flow
   → Delete with confirmation
   verify: edit metadata → save → refreshes in grid
```

### Phase 3: Editor Integration (Thursday)

```
10. Upgrade MediaLibraryPicker
    → Add document/video tabs
    → Connect to new upload API
    → Insert document cards and video embeds
    verify: section editor can insert PDF download card

11. New DocComponent blocks
    → download-card: renders file icon, name, size, download button
    → video-embed: renders video player with controls
    verify: components render in both editor and reader views

12. Content polish
    → Review all 18 Aviator manual sections for completeness
    → Ensure all 26 figures are properly referenced
    → Review integration document content
    → Upload any missing media assets
    verify: reader view of manual is comprehensive and visually complete
```

### Phase 4: Polish & Release (Friday)

```
13. Styling pass
    → Consistent dark theme across all new components
    → Responsive testing at 320px, 768px, 1200px
    → Upload zone animation and states
    → Loading states and empty states
    verify: no style regressions on existing pages

14. Edge case testing
    → Upload oversized file → clear error
    → Upload unsupported type → clear error
    → Delete asset in use → warning modal
    → Replace file → version bumps, usage preserved
    → Empty state (no assets) → helpful prompt
    verify: smoke test passes on all admin + reader routes

15. Release
    → Build production bundle
    → Verify reader experience is polished
    → Tag release snapshot in publishing page
    verify: vite build succeeds, preview serves correctly
```

---

## 12. Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| SC-1 | Media page loads and shows all asset types | Manual verification |
| SC-2 | Upload works for images, PDFs, Word, Excel, videos | Upload one of each type |
| SC-3 | Drag-and-drop uploads 5+ files at once | Batch upload test |
| SC-4 | Filter by type, search, and tags all work | Filter down to 1 asset |
| SC-5 | Bulk tag and bulk delete work with confirmations | Select 3+ and operate |
| SC-6 | Asset detail panel shows preview and editable metadata | Click through 3 assets |
| SC-7 | Section editor can insert images, documents, and videos | Insert one of each |
| SC-8 | Aviator manual reader view is comprehensive and polished | Full read-through |
| SC-9 | Integration docs are complete and well-structured | Full read-through |
| SC-10 | No console errors on any admin or reader route | Smoke test |
| SC-11 | Responsive at 320px minimum | Mobile viewport test |

---

## 13. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Monolithic App.tsx makes changes risky | High | High | Surgical changes only; test after each component |
| File upload parsing without dependencies | Medium | Medium | Use well-tested Node.js stream patterns; fallback to formidable if needed |
| Large video uploads may timeout | Medium | Low | Chunked upload or increased timeout; 200MB limit |
| Base64 → file URL migration breaks existing assets | Medium | Low | Existing assets already use file paths; no migration needed |
| Week timeline is tight for full scope | High | Medium | Cut UC-12 (advanced preview), UC-14 (versioning), UC-15 (storage dashboard) if behind |

### Cut Line (if behind schedule)

**Must ship (non-negotiable):**
- Media page with upload, browse, filter, delete
- Image/document/video type support
- Grid view
- Section editor integration
- Polished Aviator docs

**Can defer to next week:**
- List view
- Bulk operations
- Asset version history
- Storage dashboard
- Advanced preview (PDF embed, video player in detail)
- Asset detail replace-file flow

---

## 14. Future Considerations (Post-Release)

These are explicitly out of scope for this week but inform the design:

1. **Client Area Transformation**
   - Media page becomes the asset hub for client-facing content too
   - Jira Service Desk attachments flow into the media library
   - Feature request screenshots are auto-catalogued

2. **CDN/S3 Migration**
   - File storage moves from local disk to S3 + CloudFront
   - Upload endpoint becomes a pre-signed URL generator
   - Media asset URLs become CDN paths

3. **Advanced Media Features**
   - Image editing (crop, resize, watermark)
   - Video transcoding and adaptive streaming
   - OCR/text extraction from documents
   - AI-powered auto-tagging and alt text generation

4. **Status Page Integration**
   - Media assets referenced from status page incidents
   - Branded media kits per game product

---

## Appendix A: File Type Icon Reference

| Kind | Extensions | Icon | Color |
|------|-----------|------|-------|
| Image | .png .jpg .svg .webp .gif | Camera/image | `#3b82f6` (blue) |
| PDF | .pdf | Document | `#ef4444` (red) |
| Word | .doc .docx | Document W | `#2563eb` (blue) |
| Excel | .xls .xlsx | Table/grid | `#16a34a` (green) |
| PowerPoint | .ppt .pptx | Slides | `#ea580c` (orange) |
| Video | .mp4 .webm | Play/film | `#8b5cf6` (purple) |

## Appendix B: Keyboard Shortcuts (Media Page)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `G` then `L` | Toggle grid/list |
| `Esc` | Close detail panel / deselect all |
| `Delete` | Delete selected (with confirmation) |
| `↑ ↓ ← →` | Navigate grid |
| `Space` | Toggle selection on focused card |
| `Enter` | Open detail panel for focused card |
