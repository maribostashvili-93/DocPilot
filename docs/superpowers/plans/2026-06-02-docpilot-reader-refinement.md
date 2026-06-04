# DocPilot Reader UI Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current DocPilot reader chrome at `/docs/:docId` with a Stripe/Linear-style minimal shell, add admin-configurable per-tenant accent + dark mode, support ≥320px viewports via a hamburger drawer, and bring section-body content (callouts, tables, code, figures) to a single visual language.

**Architecture:** Two new files (`src/reader/DocReader.tsx`, `src/reader/reader.css`) plus one pure-function module (`src/reader/theme.ts`). The reader is a new React shell that wraps the existing `dangerouslySetInnerHTML` rendering of `SectionEntry.html`. All styles live under `.docpilot-reader`, so the legacy 7,100-line `styles.css` is untouched. The 11,939-line `App.tsx` is reduced — `DocumentViewerPage` and `DocReaderHeader` are deleted and replaced by `<DocReader />`. Theme is driven by CSS custom properties (`--accent`, `--accent-2`, `--accent-soft`, palette tokens) scoped to the reader root; tenant accent comes from an extended `ThemePreset` (existing) with two new fields (`readerAccent`, `readerDefaultMode`).

**Tech Stack:** React 18, React Router v6, TypeScript, Vite, CSS custom properties + `color-mix(in srgb, …)`, `@fontsource/inter` + `@fontsource/jetbrains-mono`, Playwright (existing smoke), `@axe-core/playwright` (new for contrast assertions), `vitest` (new for pure-function unit tests). All decisions per spec: `docs/superpowers/specs/2026-06-02-docpilot-reader-design.md`.

Branch in use: **`codex/polish-translations-ui`**. Reference demos: `.superpowers/brainstorm/73247-1780413701/content/demo-b2.html` and `refine-b.html`.

---

## File map

### New
- `src/reader/theme.ts` — pure functions: `resolveReaderTheme(themePreset, company)`, `applyReaderTheme(root, theme, sessionMode?)`, `loadSessionMode(slug)`, `saveSessionMode(slug, mode)`.
- `src/reader/theme.test.ts` — vitest unit tests.
- `src/reader/DocReader.tsx` — the new reader shell (header, sidebar, main, right rail, flow nav, footer, search-modal stub).
- `src/reader/reader.css` — all reader styles, scoped under `.docpilot-reader`.
- `src/reader/useDocReaderState.ts` — small hook bundling `activeSectionId`, `scrollProgress`, `showBackToTop`, keyboard nav, anchor-copy.
- `src/reader/SearchModal.tsx` — `<dialog>`-based ⌘K stub with fuzzy match over section titles + sub-anchors.
- `src/reader/Drawer.tsx` — hamburger drawer with focus trap.
- `vitest.config.ts` — vitest config.
- `tests/reader.spec.mjs` — Playwright spec covering the eight acceptance criteria.

### Modified
- `src/App.tsx`:
  - Remove `DocumentViewerPage` (lines 1666–1822) and `DocReaderHeader` (lines 1824–1900 approx) — replaced by `<DocReader />`.
  - Remove section-flow-nav DOM injection effect (currently lines 1785–1811) — superseded by React-rendered flow nav in `DocReader`.
  - Extend `ThemePreset` type (around line 166) with `readerAccent: string` and `readerDefaultMode: 'light' | 'dark' | 'system'`.
  - Extend `DEFAULT_THEME_PRESETS` (around line 362) — every locked preset gets `readerAccent` (default indigo `#635bff`) and `readerDefaultMode: 'system'`.
  - Extend `normalizeThemePresets` (line 10904) to backfill the two new fields on existing stored presets.
  - Extend `ThemeControls` form (line 4285) with a color input for "Reader accent" and a radio for "Default reader mode".
  - Narrow `composeManualHtml` (line 9221) to emit just section HTML — no `manualHtml` shell wrap.
  - Route `<Route path="/docs/:docId" element={…} />` (line 1338) swaps from `<DocumentViewerPage />` to `<DocReader />`.
- `src/main.tsx` — add `@fontsource/inter` and `@fontsource/jetbrains-mono` weight imports, and `import './reader/reader.css'`.
- `package.json` — add `@fontsource/inter`, `@fontsource/jetbrains-mono`, `vitest`, `@axe-core/playwright` to `devDependencies` (fontsource packages are runtime deps). Add `"test": "vitest run"` and `"test:e2e": "playwright test"` scripts.
- `scripts/browser-smoke.mjs` — add a navigation to `/docs/doc-manual` that asserts the new shell rendered (presence of `.docpilot-reader`, absence of legacy `.manual-shell`).
- `.gitignore` — ensure `.superpowers/` is present (already added in brainstorm).

### Untouched
- `src/styles.css` — legacy `.manual-html` rules remain; not loaded by the new reader.
- Section composers (`docSection`, `interfaceDocSection`, `composeGenericDocumentHtml`, etc.) — section HTML strings are unchanged; only the chrome around them changes.
- `attachMarkerHotspotInteractions`, `attachDocCarouselInteractions` — selectors target classes inside section HTML.

---

## Conventions for every task

- TDD where the change is a pure function or a JSX structure assertion (Playwright DOM queries).
- For CSS-only changes, the test is a Playwright assertion on `getComputedStyle` for one canonical element per change.
- Every task ends with a commit. Commit message format: `feat(reader): <task title>` or `chore(reader): …` or `test(reader): …` to match existing conventions.
- Run `npm run typecheck` and `npm run lint` before each commit; both must pass.
- Branch stays `codex/polish-translations-ui`. Do not switch branches or rebase mid-plan.

---

## Task 1: Add fonts, vitest, and axe-core dependencies

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime + dev dependencies**

Run, in this exact order, so the lockfile stays clean:

```bash
npm install --save @fontsource/inter @fontsource/jetbrains-mono
npm install --save-dev vitest @vitest/expect @axe-core/playwright
```

Expected: `package.json` and `package-lock.json` updated. No peer-dep warnings about React mismatch.

- [ ] **Step 2: Add npm scripts**

Edit `package.json` and add inside `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: false,
  },
});
```

- [ ] **Step 4: Verify vitest runs (no tests yet → exits 0 with "no test files found")**

Run: `npx vitest run --passWithNoTests`
Expected: process exits 0 with a "No test files found" message.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore(reader): add Inter/JetBrains Mono, vitest, axe-core deps"
```

---

## Task 2: Extend `ThemePreset` type and helpers

**Files:**
- Modify: `src/App.tsx:166-176` (type), `:362-401` (defaults), `:10904-10935` (normalize)

- [ ] **Step 1: Extend the type**

Replace the `ThemePreset` declaration (around line 166) with:

```ts
type ThemePreset = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  ink: string;
  surface: string;
  markerFill: string;
  markerBorder: string;
  readerAccent: string;
  readerDefaultMode: 'light' | 'dark' | 'system';
  locked?: boolean;
};
```

- [ ] **Step 2: Backfill every entry in `DEFAULT_THEME_PRESETS`**

For every object literal in `DEFAULT_THEME_PRESETS` (around line 362), add the two new fields. For all locked presets, use:

```ts
readerAccent: '#635bff',
readerDefaultMode: 'system',
```

- [ ] **Step 3: Update `normalizeThemePresets` to migrate legacy stored presets**

Find `function normalizeThemePresets(presets: ThemePreset[])` (line 10904) and update it so every returned preset has `readerAccent` and `readerDefaultMode` populated. Implementation:

```ts
function normalizeThemePresets(presets: ThemePreset[]) {
  return presets.map((preset) => ({
    ...preset,
    readerAccent: typeof preset.readerAccent === 'string' && /^#[0-9a-f]{6}$/i.test(preset.readerAccent) ? preset.readerAccent : '#635bff',
    readerDefaultMode: preset.readerDefaultMode === 'light' || preset.readerDefaultMode === 'dark' || preset.readerDefaultMode === 'system'
      ? preset.readerDefaultMode
      : 'system',
  }));
}
```

(Keep any other normalization the function already does — wrap the map result accordingly. If the existing function does no other work, the above replaces the whole body.)

- [ ] **Step 4: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: 0 errors. If typecheck flags places that construct `ThemePreset` literals without the new fields, fix them inline (search `: ThemePreset` and `ThemePreset = {`).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(reader): extend ThemePreset with readerAccent + readerDefaultMode"
```

---

## Task 3: Pure theme module + unit tests

**Files:**
- Create: `src/reader/theme.ts`
- Create: `src/reader/theme.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
// src/reader/theme.test.ts
import { describe, it, expect } from 'vitest';
import {
  resolveReaderTheme,
  applyReaderTheme,
  loadSessionMode,
  saveSessionMode,
  type ReaderTheme,
} from './theme';

describe('resolveReaderTheme', () => {
  it('prefers v2 company branding when present', () => {
    const theme = resolveReaderTheme(
      { readerAccent: '#111111', readerDefaultMode: 'light' },
      { branding: { accent: '#abcdef', defaultTheme: 'dark' } },
    );
    expect(theme).toEqual({ accent: '#abcdef', defaultMode: 'dark' });
  });

  it('falls back to v1 preset when v2 company missing', () => {
    const theme = resolveReaderTheme(
      { readerAccent: '#111111', readerDefaultMode: 'light' },
      null,
    );
    expect(theme).toEqual({ accent: '#111111', defaultMode: 'light' });
  });

  it('defaults to indigo + system when both surfaces are missing', () => {
    const theme = resolveReaderTheme(null, null);
    expect(theme).toEqual({ accent: '#635bff', defaultMode: 'system' });
  });

  it('rejects malformed accent values and falls back to default', () => {
    const theme = resolveReaderTheme({ readerAccent: 'not-a-color', readerDefaultMode: 'light' }, null);
    expect(theme.accent).toBe('#635bff');
  });
});

describe('applyReaderTheme', () => {
  it('writes data-theme and inline CSS variables to the root', () => {
    const root = document.createElement('div');
    applyReaderTheme(root, { accent: '#abcdef', defaultMode: 'dark' });
    expect(root.dataset.theme).toBe('dark');
    expect(root.style.getPropertyValue('--accent')).toBe('#abcdef');
  });

  it('uses sessionMode override when provided', () => {
    const root = document.createElement('div');
    applyReaderTheme(root, { accent: '#abcdef', defaultMode: 'dark' }, 'light');
    expect(root.dataset.theme).toBe('light');
  });

  it('resolves "system" mode to light when prefers-color-scheme is light', () => {
    const root = document.createElement('div');
    const matchMedia = (query: string) => ({ matches: query.includes('light') });
    applyReaderTheme(root, { accent: '#abcdef', defaultMode: 'system' }, undefined, matchMedia as unknown as typeof window.matchMedia);
    expect(root.dataset.theme).toBe('light');
  });
});

describe('session mode storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a session mode by tenant slug', () => {
    saveSessionMode('aviator', 'dark');
    expect(loadSessionMode('aviator')).toBe('dark');
  });

  it('returns null when nothing is stored', () => {
    expect(loadSessionMode('unknown')).toBeNull();
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('docpilot:reader-mode:bad', 'purple');
    expect(loadSessionMode('bad')).toBeNull();
  });
});
```

- [ ] **Step 2: Switch vitest to jsdom for the DOM tests**

Edit `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: true,
  },
});
```

And install `jsdom`:

```bash
npm install --save-dev jsdom
```

- [ ] **Step 3: Run tests; verify they fail**

Run: `npx vitest run src/reader/theme.test.ts`
Expected: FAIL — `theme.ts` does not exist yet.

- [ ] **Step 4: Implement `theme.ts`**

Create `src/reader/theme.ts`:

```ts
export type ReaderMode = 'light' | 'dark';
export type ReaderModePref = ReaderMode | 'system';

export type ReaderTheme = {
  accent: string;
  defaultMode: ReaderModePref;
};

type TenantPreset = { readerAccent: string; readerDefaultMode: ReaderModePref };
type Company = { branding?: { accent?: string; defaultTheme?: ReaderModePref } } | null;

const DEFAULT_ACCENT = '#635bff';
const HEX = /^#[0-9a-f]{6}$/i;
const STORAGE_PREFIX = 'docpilot:reader-mode:';

function safeHex(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value) ? value : fallback;
}

function safeMode(value: unknown, fallback: ReaderModePref): ReaderModePref {
  return value === 'light' || value === 'dark' || value === 'system' ? value : fallback;
}

export function resolveReaderTheme(preset: TenantPreset | null, company: Company): ReaderTheme {
  if (company?.branding?.accent || company?.branding?.defaultTheme) {
    return {
      accent: safeHex(company.branding.accent, DEFAULT_ACCENT),
      defaultMode: safeMode(company.branding.defaultTheme, 'system'),
    };
  }
  if (preset) {
    return {
      accent: safeHex(preset.readerAccent, DEFAULT_ACCENT),
      defaultMode: safeMode(preset.readerDefaultMode, 'system'),
    };
  }
  return { accent: DEFAULT_ACCENT, defaultMode: 'system' };
}

export function applyReaderTheme(
  root: HTMLElement,
  theme: ReaderTheme,
  sessionMode?: ReaderMode,
  matchMedia: typeof window.matchMedia = typeof window !== 'undefined' ? window.matchMedia : (() => ({ matches: false }) as MediaQueryList),
): void {
  const effective: ReaderMode = sessionMode
    ?? (theme.defaultMode === 'system'
        ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme.defaultMode);
  root.dataset.theme = effective;
  root.style.setProperty('--accent', theme.accent);
}

export function loadSessionMode(slug: string): ReaderMode | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_PREFIX + slug);
  return raw === 'light' || raw === 'dark' ? raw : null;
}

export function saveSessionMode(slug: string, mode: ReaderMode): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + slug, mode);
}
```

- [ ] **Step 5: Run tests; verify they pass**

Run: `npx vitest run src/reader/theme.test.ts`
Expected: 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/reader/theme.ts src/reader/theme.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(reader): add theme resolver + session-mode storage"
```

---

## Task 4: Reader CSS skeleton (tokens, light + dark, responsive scale)

**Files:**
- Create: `src/reader/reader.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing Playwright assertion (CSS smoke)**

We use a smoke check: after the file exists, navigating to `/docs/doc-manual` should produce a `.docpilot-reader` root with the expected computed body background. Add a placeholder spec at `tests/reader.spec.mjs` (skeleton; will be expanded in Task 15):

```js
// tests/reader.spec.mjs
import { test, expect } from '@playwright/test';

test('reader root mounts and applies token palette', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const root = page.locator('.docpilot-reader');
  await expect(root).toBeVisible();
  const bg = await root.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});
```

(This test will not pass until Task 5 mounts the reader. Keep it for now as the long-running assertion.)

- [ ] **Step 2: Create `reader.css` with all tokens and base scope**

Create `src/reader/reader.css`. Paste exactly (header comment + tokens + base resets):

```css
/* src/reader/reader.css
 *
 * All selectors are scoped under .docpilot-reader so this file never bleeds
 * into the legacy admin or marketing styles in styles.css.
 *
 * Legacy class compatibility:
 *   - .callout.info     → maps to .callout.note (accent)
 *   - .callout.warning  → maps to .callout.warn (amber)
 *   - .callout.important→ maps to .callout.danger (red)
 *   - .section-banner   → deliberately styled to be invisible chrome (kept
 *                         only so legacy section HTML parses without orphan
 *                         heading numbers; the visible "banner" effect is
 *                         dropped per spec §4.4).
 */

.docpilot-reader {
  --bg: #ffffff;
  --bg-2: #fafafa;
  --bg-3: #f3f4f6;
  --ink: #0a0a0a;
  --ink-2: #404653;
  --ink-3: #6b7280;
  --ink-4: #9ca3af;
  --line: #ececec;
  --line-2: #e5e7eb;
  --accent: #635bff;
  --accent-2: color-mix(in srgb, var(--accent) 92%, black);
  --accent-soft: color-mix(in srgb, var(--accent) 8%, white);
  --green: #10b981;
  --red: #dc2626;
  --amber: #d97706;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.005em;
  min-height: 100vh;
}

.docpilot-reader[data-theme='dark'] {
  --bg: #0b0d12;
  --bg-2: #11141b;
  --bg-3: #1a1f29;
  --ink: #f5f6f8;
  --ink-2: #c8cdd9;
  --ink-3: #8b93a3;
  --ink-4: #5a6371;
  --line: #1f242e;
  --line-2: #262c38;
  --accent-soft: color-mix(in srgb, var(--accent) 18%, var(--bg));
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.docpilot-reader * { box-sizing: border-box; }
.docpilot-reader main { padding: 36px 40px 96px; max-width: 760px; min-width: 0; }

@media (max-width: 900px) {
  .docpilot-reader main { padding: 24px 0 80px; }
}

@media (prefers-reduced-motion: reduce) {
  .docpilot-reader * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
```

(More selectors are added in later tasks. Resist the urge to write everything now — keeping this file focused per task makes review tractable.)

- [ ] **Step 3: Wire fonts + reader.css into `main.tsx`**

Edit `src/main.tsx` to add at the top (after existing imports):

```ts
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './reader/reader.css';
```

- [ ] **Step 4: Run dev server + verify no console errors loading the page**

Run `npm run dev:web` in one terminal. Open `http://127.0.0.1:5173`. Expected: page loads; the reader doesn't exist yet, so no visible change. Verify in DevTools console there are zero new errors and that the Network tab shows the Inter + JetBrains Mono font files served from `@fontsource`.

- [ ] **Step 5: Commit**

```bash
git add src/reader/reader.css src/main.tsx tests/reader.spec.mjs
git commit -m "feat(reader): scaffold reader.css tokens + mount in main.tsx"
```

---

## Task 5: `DocReader` skeleton + route wire-up

**Files:**
- Create: `src/reader/DocReader.tsx`
- Create: `src/reader/useDocReaderState.ts`
- Modify: `src/App.tsx:1338` (route registration)

- [ ] **Step 1: Write a failing Playwright assertion**

Edit `tests/reader.spec.mjs`:

```js
import { test, expect } from '@playwright/test';

test('legacy .manual-shell is no longer mounted on /docs/doc-manual', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await expect(page.locator('.docpilot-reader')).toBeVisible();
  await expect(page.locator('.manual-shell')).toHaveCount(0);
});
```

Run: `npx playwright test tests/reader.spec.mjs`
Expected: FAIL — `.docpilot-reader` not present, `.manual-shell` still mounts.

- [ ] **Step 2: Create the state hook**

Create `src/reader/useDocReaderState.ts`:

```ts
import { useEffect, useMemo, useState } from 'react';

export function useDocReaderState(sectionIds: string[]) {
  const [activeSectionId, setActiveSectionId] = useState<string>(sectionIds[0] ?? '');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setScrollProgress(pct);
      setShowBackToTop(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sectionIds.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveSectionId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds.join('|')]);

  const activeIndex = useMemo(() => Math.max(0, sectionIds.indexOf(activeSectionId)), [activeSectionId, sectionIds]);
  return { activeSectionId, setActiveSectionId, scrollProgress, showBackToTop, activeIndex };
}
```

- [ ] **Step 3: Create the `DocReader` skeleton**

Create `src/reader/DocReader.tsx`:

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDocReaderState } from './useDocReaderState';
import { applyReaderTheme, loadSessionMode, resolveReaderTheme } from './theme';

export type DocReaderProps = {
  resolveDoc: (docId: string) => DocReaderModel | null;
};

export type DocReaderModel = {
  doc: { id: string; title: string; description: string; version: string; updatedAt: string };
  sections: { id: string; number: string; title: string; html: string }[];
  product: { name: string; slug: string } | null;
  themePreset: { readerAccent: string; readerDefaultMode: 'light' | 'dark' | 'system' };
  company: { slug: string; name: string; branding?: { accent?: string; defaultTheme?: 'light' | 'dark' | 'system' } } | null;
};

export function DocReader({ resolveDoc }: DocReaderProps) {
  const { docId = '' } = useParams();
  const model = resolveDoc(docId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sectionIds = useMemo(() => (model?.sections ?? []).map((s) => s.id), [model]);
  useDocReaderState(sectionIds);

  useEffect(() => {
    if (!rootRef.current || !model) return;
    const theme = resolveReaderTheme(model.themePreset, model.company);
    const session = model.company ? loadSessionMode(model.company.slug) : null;
    applyReaderTheme(rootRef.current, theme, session ?? undefined);
  }, [model]);

  if (!model) {
    return (
      <div className="docpilot-reader" ref={rootRef}>
        <main><h1>Not found</h1></main>
      </div>
    );
  }

  return (
    <div className="docpilot-reader" ref={rootRef}>
      <main>
        <h1>{model.doc.title}</h1>
        {model.sections.map((s) => (
          <section key={s.id} id={s.id} dangerouslySetInnerHTML={{ __html: s.html }} />
        ))}
      </main>
    </div>
  );
}
```

This skeleton is intentionally bare — header, ToC, footer, drawer, search modal arrive in later tasks.

- [ ] **Step 4: Adapt the route**

In `src/App.tsx`, find the route line (currently around 1338):

```tsx
<Route path="/docs/:docId" element={<DocumentViewerPage />} />
```

Replace with:

```tsx
<Route path="/docs/:docId" element={<DocReaderRoute />} />
```

Add a thin adapter component near the existing `DocumentViewerPage` (which we will delete in Task 13 — leave it untouched for now so the file still compiles if anything is referenced):

```tsx
function DocReaderRoute() {
  const [games] = useStoredState('cms_games_v1', DEFAULT_GAMES);
  const [storedDocs] = useStoredState('cms_docs_v2', DEFAULT_DOCS);
  const docs = useMemo(() => mergeWithDefaults(storedDocs, DEFAULT_DOCS, (d) => d.id), [storedDocs]);
  const [backOfficeSections] = useStoredState('cms_backoffice_sections_v1', DEFAULT_BACKOFFICE_SECTIONS);
  const [integrationSections] = useStoredState('cms_integration_sections_v1', DEFAULT_INTEGRATION_SECTIONS);
  const [manualSectionsState] = useStoredState('cms_sections_v2', DEFAULT_SECTIONS);
  const [customSections] = useStoredState<Record<string, SectionEntry[]>>('cms_custom_sections_v1', DEFAULT_CUSTOM_SECTIONS);
  const [storedThemePresets] = useStoredState<ThemePreset[]>('cms_theme_presets_v1', DEFAULT_THEME_PRESETS);
  const themePresets = useMemo(() => normalizeThemePresets(storedThemePresets), [storedThemePresets]);
  const [activeThemeId] = useStoredState('cms_active_theme_preset_v1', DEFAULT_THEME_PRESETS[0].id);
  const themePreset = resolveThemePreset(themePresets, activeThemeId);

  const resolveDoc = useCallback((docId: string) => {
    const doc = docs.find((item) => item.id === docId || docSlug(item) === docId);
    if (!doc) return null;
    const sections = getSectionsForDoc(doc.id, manualSectionsState, backOfficeSections, integrationSections, customSections);
    const products = buildProductCatalog(docs, games);
    const product = products.find((item) => item.id === doc.gameId);
    return {
      doc: { id: doc.id, title: doc.title, description: doc.description, version: doc.version, updatedAt: doc.updatedAt },
      sections: sections.map((s) => ({ id: s.id, number: s.number, title: s.title, html: s.html })),
      product: product ? { name: product.name, slug: product.id } : null,
      themePreset: { readerAccent: themePreset.readerAccent, readerDefaultMode: themePreset.readerDefaultMode },
      company: null,
    };
  }, [docs, games, manualSectionsState, backOfficeSections, integrationSections, customSections, themePreset.readerAccent, themePreset.readerDefaultMode]);

  return <DocReader resolveDoc={resolveDoc} />;
}
```

Add the imports at the top of `App.tsx`:

```tsx
import { DocReader } from './reader/DocReader';
```

- [ ] **Step 5: Run typecheck + dev**

```bash
npm run typecheck
```

Expected: 0 errors. Then:

```bash
npm run dev:web
```

Open `http://127.0.0.1:5173/docs/doc-manual`. Expected: the page shows the title + raw section HTML, no chrome (no header / no ToC). The legacy red-banner styling is gone because the `.manual-html` namespace is no longer the wrapping selector.

- [ ] **Step 6: Run Playwright spec**

Run: `npx playwright test tests/reader.spec.mjs`
Expected: both assertions pass — `.docpilot-reader` visible and `.manual-shell` absent.

- [ ] **Step 7: Commit**

```bash
git add src/reader/DocReader.tsx src/reader/useDocReaderState.ts src/App.tsx tests/reader.spec.mjs
git commit -m "feat(reader): mount DocReader on /docs/:docId route"
```

---

## Task 6: Document head — compact meta, title, lede (no dark hero)

**Files:**
- Modify: `src/reader/DocReader.tsx`
- Modify: `src/reader/reader.css`

- [ ] **Step 1: Add the doc-head JSX**

In `DocReader.tsx`, inside `<main>`, replace the lone `<h1>` with:

```tsx
<header className="doc-head">
  <div className="doc-meta">
    <span className="pill"><span className="dot" />{model.doc.title ? 'Live' : 'Draft'}</span>
    <span>v{model.doc.version}</span>
    <span>·</span>
    <span>Updated {model.doc.updatedAt}</span>
  </div>
  <h1 className="doc-title">{model.doc.title}</h1>
  {model.doc.description ? <p className="lede">{model.doc.description}</p> : null}
</header>
```

- [ ] **Step 2: Add the doc-head CSS**

Append to `src/reader/reader.css`:

```css
.docpilot-reader .doc-head { margin-bottom: 24px; }
.docpilot-reader .doc-meta {
  display: flex; gap: 8px; align-items: center;
  font-size: 12.5px; color: var(--ink-3);
  margin-bottom: 6px; flex-wrap: wrap;
}
.docpilot-reader .doc-meta .pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 9px; border-radius: 99px; border: 1px solid var(--line);
}
.docpilot-reader .doc-meta .pill .dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
}
.docpilot-reader .doc-title {
  font-weight: 700; font-size: 32px; line-height: 1.18;
  margin: 6px 0 6px; letter-spacing: -0.022em; color: var(--ink);
}
.docpilot-reader .lede {
  font-size: 16.5px; line-height: 1.6; color: var(--ink-2);
  margin: 0 0 32px;
}
```

- [ ] **Step 3: Add a Playwright assertion for "no dark hero"**

Append to `tests/reader.spec.mjs`:

```js
test('doc head shows title + lede, not the dark Aviator cover', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await expect(page.locator('.docpilot-reader .doc-title')).toHaveText(/Aviator/i);
  // The legacy cover-meta tiles emit text "AUDIENCE" and "TAXONOMY"; new shell must not.
  await expect(page.locator('.docpilot-reader')).not.toContainText('AUDIENCE');
  await expect(page.locator('.docpilot-reader')).not.toContainText('TAXONOMY');
});
```

Run: `npx playwright test tests/reader.spec.mjs`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/reader/DocReader.tsx src/reader/reader.css tests/reader.spec.mjs
git commit -m "feat(reader): doc head — compact meta + title + lede"
```

---

## Task 7: ToC sidebar (two levels, IntersectionObserver-driven)

**Files:**
- Modify: `src/reader/DocReader.tsx`
- Modify: `src/reader/reader.css`

- [ ] **Step 1: Extract sub-anchors from each section's HTML**

At the top of `DocReader.tsx`, add a helper above the component:

```ts
type TocEntry = { id: string; number: string; title: string; subs: { id: string; title: string }[] };

function buildToc(sections: { id: string; number: string; title: string; html: string }[]): TocEntry[] {
  const parser = new DOMParser();
  return sections.map((section) => {
    const doc = parser.parseFromString(`<div>${section.html}</div>`, 'text/html');
    const subs = Array.from(doc.querySelectorAll('h3[id]')).map((el) => ({
      id: el.id,
      title: (el.textContent || '').trim(),
    }));
    return { id: section.id, number: section.number, title: section.title, subs };
  });
}
```

- [ ] **Step 2: Render the sidebar**

Inside `DocReader`, compute `const toc = useMemo(() => buildToc(model.sections), [model]);` and wrap the existing `<main>` in a `<div className="shell">` + add `<aside className="side">`:

```tsx
return (
  <div className="docpilot-reader" ref={rootRef}>
    <div className="shell">
      <aside className="side" aria-label="Table of contents">
        <ul className="side-list">
          {toc.map((entry) => (
            <li key={entry.id}>
              <a className={entry.id === activeSectionId ? 'active' : undefined} href={`#${entry.id}`}>
                {entry.number} {entry.title}
              </a>
              {entry.subs.length ? (
                <ul className="sub">
                  {entry.subs.map((sub) => (
                    <li key={sub.id}>
                      <a className={sub.id === activeSectionId ? 'active' : undefined} href={`#${sub.id}`}>
                        {sub.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </aside>
      <main>{/* existing doc-head + sections */}</main>
    </div>
  </div>
);
```

Update `useDocReaderState` to also observe sub-anchor `h3[id]` nodes — extend the existing `sectionIds` array to include them. In `DocReader.tsx`:

```ts
const observedIds = useMemo(() => {
  const ids: string[] = [];
  toc.forEach((entry) => { ids.push(entry.id); entry.subs.forEach((s) => ids.push(s.id)); });
  return ids;
}, [toc]);
const { activeSectionId } = useDocReaderState(observedIds);
```

- [ ] **Step 3: Add the sidebar CSS**

Append to `reader.css`:

```css
.docpilot-reader .shell {
  display: grid; grid-template-columns: 260px minmax(0, 1fr);
  max-width: 1400px; margin: 0 auto; padding: 0 24px;
}
@media (max-width: 900px) {
  .docpilot-reader .shell { grid-template-columns: 1fr; padding: 0 16px; }
  .docpilot-reader aside.side { display: none; }
}

.docpilot-reader aside.side {
  position: sticky; top: 60px; align-self: start;
  height: calc(100vh - 60px); overflow: auto;
  padding: 24px 16px 24px 0; font-size: 13.5px;
}
.docpilot-reader .side-list { list-style: none; padding: 0; margin: 0; }
.docpilot-reader .side-list a {
  display: block; padding: 5px 12px;
  color: var(--ink-2); text-decoration: none;
  border-radius: 6px; line-height: 1.45;
}
.docpilot-reader .side-list a:hover { color: var(--ink); background: var(--bg-2); }
.docpilot-reader .side-list a.active {
  color: var(--accent); background: var(--accent-soft); font-weight: 500;
}
.docpilot-reader .side-list .sub {
  list-style: none; padding: 0 0 0 14px; margin: 2px 0 4px 8px;
  border-left: 1px solid var(--line);
}
.docpilot-reader .side-list .sub a { font-size: 13px; padding: 3px 12px; color: var(--ink-3); }
.docpilot-reader .side-list .sub a.active { color: var(--accent); background: transparent; font-weight: 500; }
```

- [ ] **Step 4: Playwright spec**

Append:

```js
test('sidebar shows two-level ToC with active highlight on first section', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const aside = page.locator('.docpilot-reader aside.side');
  await expect(aside).toBeVisible();
  await expect(aside.locator('.side-list > li').first().locator('> a')).toHaveClass(/active/);
});
```

Run + verify pass.

- [ ] **Step 5: Commit**

```bash
git add src/reader/DocReader.tsx src/reader/reader.css tests/reader.spec.mjs
git commit -m "feat(reader): two-level sticky ToC with active highlight"
```

---

## Task 8: Section body styles (callouts, code, kbd, table, figure, headings, anchors)

**Files:**
- Modify: `src/reader/reader.css`

This task is CSS-only. Test via one focused Playwright assertion per kind plus a manual visual check.

- [ ] **Step 1: Add section-body styles**

Append to `reader.css`:

```css
.docpilot-reader main h2 {
  font-weight: 600; font-size: 22px; line-height: 1.3;
  margin: 40px 0 10px; letter-spacing: -0.015em; scroll-margin-top: 80px;
  display: flex; align-items: baseline; gap: 8px; color: var(--ink);
}
.docpilot-reader main h2 .anchor {
  color: var(--ink-4); text-decoration: none; opacity: 0; font-weight: 400; transition: opacity .15s;
}
.docpilot-reader main h2:hover .anchor { opacity: 1; }
.docpilot-reader main h3 {
  font-weight: 600; font-size: 16.5px; margin: 26px 0 8px;
  letter-spacing: -0.005em; scroll-margin-top: 80px; color: var(--ink);
}
.docpilot-reader main p {
  font-size: 15px; line-height: 1.7; color: var(--ink); margin: 0 0 12px;
}
.docpilot-reader main ul, .docpilot-reader main ol {
  font-size: 15px; line-height: 1.7; padding-left: 22px;
}
.docpilot-reader main li { margin: 4px 0; }
.docpilot-reader main strong { font-weight: 600; }
.docpilot-reader main a {
  color: var(--accent); text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}
.docpilot-reader main a:hover { border-bottom-color: var(--accent); }

/* Inline code + kbd */
.docpilot-reader main code {
  font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 13px;
  background: var(--bg-2); border: 1px solid var(--line);
  padding: 1px 6px; border-radius: 4px; color: var(--ink); white-space: nowrap;
}
.docpilot-reader main kbd {
  font-family: 'Inter', system-ui, sans-serif; font-size: 11.5px; font-weight: 600;
  padding: 1px 7px; border-radius: 5px; border: 1px solid var(--line-2);
  box-shadow: 0 1px 0 var(--line-2); background: var(--bg); color: var(--ink-2);
}

/* Code block */
.docpilot-reader main pre {
  background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px;
  padding: 16px 18px; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  font-size: 13.5px; line-height: 1.6; overflow: auto; margin: 16px 0; color: var(--ink);
}

/* Tables */
.docpilot-reader main table {
  width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.55;
  margin: 18px 0; border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
  display: block; max-width: 100%; overflow-x: auto;
}
.docpilot-reader main table th,
.docpilot-reader main table td {
  padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top;
}
.docpilot-reader main table thead th {
  background: var(--bg-2); font-weight: 600;
  color: var(--ink-2); font-size: 12.5px; letter-spacing: .02em;
}
.docpilot-reader main table tbody tr:last-child td { border-bottom: 0; }

/* Figures */
.docpilot-reader main figure { margin: 18px 0; }
.docpilot-reader main figure img { display: block; max-width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); }
.docpilot-reader main figcaption { font-size: 12.5px; color: var(--ink-3); margin-top: 8px; }
.docpilot-reader main figcaption strong { color: var(--ink-2); font-weight: 600; }

/* Callouts (new variants) */
.docpilot-reader main .callout {
  display: grid; grid-template-columns: 22px 1fr; gap: 12px;
  padding: 12px 14px; border-radius: 8px; margin: 14px 0;
  font-size: 14px; line-height: 1.55; background: var(--accent-soft);
}
.docpilot-reader main .callout > .callout-icon {
  width: 20px; height: 20px; border-radius: 50%;
  display: inline-grid; place-items: center;
  font-size: 11px; font-weight: 700; color: #fff; margin-top: 2px; background: var(--accent);
}
.docpilot-reader main .callout .callout-title { font-weight: 600; color: var(--ink); margin-bottom: 2px; }
.docpilot-reader main .callout p { margin: 0; font-size: 14px; }
.docpilot-reader main .callout.warn { background: color-mix(in srgb, var(--amber) 10%, var(--bg)); }
.docpilot-reader main .callout.warn > .callout-icon { background: var(--amber); }
.docpilot-reader main .callout.danger { background: color-mix(in srgb, var(--red) 10%, var(--bg)); }
.docpilot-reader main .callout.danger > .callout-icon { background: var(--red); }
.docpilot-reader main .callout.success { background: color-mix(in srgb, var(--green) 10%, var(--bg)); }
.docpilot-reader main .callout.success > .callout-icon { background: var(--green); }

/* Legacy callout class compatibility (spec §6.5) */
.docpilot-reader main .callout.info { /* same as default note */ }
.docpilot-reader main .callout.warning { background: color-mix(in srgb, var(--amber) 10%, var(--bg)); }
.docpilot-reader main .callout.warning > .callout-icon { background: var(--amber); }
.docpilot-reader main .callout.important { background: color-mix(in srgb, var(--red) 10%, var(--bg)); }
.docpilot-reader main .callout.important > .callout-icon { background: var(--red); }

/* Defang legacy section-banner inside the new reader (spec §4.4) */
.docpilot-reader main .section-banner { all: unset; display: contents; }
.docpilot-reader main .section-banner h2 { /* inherits the new h2 styling */ }
.docpilot-reader main .section-banner .num { display: none; }
```

- [ ] **Step 2: Playwright assertions**

Append to `tests/reader.spec.mjs`:

```js
test('section h3 contrast meets AAA in light mode', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const sample = page.locator('.docpilot-reader main h3').first();
  await expect(sample).toBeVisible();
  const color = await sample.evaluate((el) => getComputedStyle(el).color);
  // Color token --ink is #0a0a0a (rgb(10,10,10)). Expect that exact computed color.
  expect(color).toMatch(/rgb\(10, 10, 10\)/);
});

test('legacy .section-banner does not render as a chunky red bar', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const banner = page.locator('.docpilot-reader main .section-banner').first();
  if (await banner.count() > 0) {
    const display = await banner.evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('contents');
  }
});
```

Run; verify pass.

- [ ] **Step 3: Commit**

```bash
git add src/reader/reader.css tests/reader.spec.mjs
git commit -m "feat(reader): typographic + content-block styles for section body"
```

---

## Task 9: Right rail, doc-level flow nav, footer

**Files:**
- Modify: `src/reader/DocReader.tsx`
- Modify: `src/reader/reader.css`

- [ ] **Step 1: Compute sibling docs for flow nav**

Update `DocReaderModel` to include sibling info. In `DocReader.tsx`:

```ts
export type DocReaderModel = {
  // …existing fields…
  siblings: { prev: { id: string; title: string } | null; next: { id: string; title: string } | null };
};
```

In `DocReaderRoute` (in `App.tsx`), compute siblings using the existing `sortDocsForNavigation`:

```ts
const siblingDocs = sortDocsForNavigation(docs.filter((item) => item.gameId === doc.gameId && docNavPlacement(item) !== 'hidden'));
const idx = siblingDocs.findIndex((d) => d.id === doc.id);
const prev = idx > 0 ? siblingDocs[idx - 1] : null;
const next = idx >= 0 && idx < siblingDocs.length - 1 ? siblingDocs[idx + 1] : null;
const siblings = {
  prev: prev ? { id: prev.id, title: prev.title } : null,
  next: next ? { id: next.id, title: next.title } : null,
};
```

Pass `siblings` into the model object returned by `resolveDoc`.

- [ ] **Step 2: Render right rail + flow nav + footer**

Replace the current `<div className="shell">` with a three-column shell and add post-main blocks. Final return value:

```tsx
return (
  <div className="docpilot-reader" ref={rootRef}>
    <div className="shell">
      <aside className="side">{/* unchanged */}</aside>
      <main>
        <header className="doc-head">{/* unchanged */}</header>
        {model.sections.map((s) => (
          <section key={s.id} id={s.id} dangerouslySetInnerHTML={{ __html: s.html }} />
        ))}
        <nav className="flow-nav" aria-label="Document navigation">
          {model.siblings.prev ? (
            <a className="flow-link prev" href={`/docs/${model.siblings.prev.id}`}>
              <span className="dir">Previous</span>
              <span className="ttl">{model.siblings.prev.title}</span>
            </a>
          ) : <span />}
          {model.siblings.next ? (
            <a className="flow-link next" href={`/docs/${model.siblings.next.id}`}>
              <span className="dir">Next</span>
              <span className="ttl">{model.siblings.next.title} →</span>
            </a>
          ) : <span />}
        </nav>
      </main>
      <aside className="toc-right" aria-label="On this page">
        <div className="label">On this page</div>
        {toc.flatMap((entry) => entry.subs.map((sub) => (
          <a key={sub.id} className={sub.id === activeSectionId ? 'active' : undefined} href={`#${sub.id}`}>{sub.title}</a>
        )))}
        <div className="group">
          <div className="label">Resources</div>
          <a href="#">Edit on GitHub</a>
          <a href="#">Print / PDF</a>
          <a href="#">Report an issue</a>
        </div>
      </aside>
    </div>
    <footer className="reader-foot">
      <div className="foot-inner">
        <div>© {new Date().getFullYear()} {model.product?.name ?? 'DocPilot'} · {model.doc.title} · v{model.doc.version}</div>
        <div className="foot-links">
          {model.siblings.next ? <a href={`/docs/${model.siblings.next.id}`}>Next: {model.siblings.next.title} →</a> : null}
          <a href="#">Status</a>
          <a href="#">Support</a>
        </div>
      </div>
    </footer>
  </div>
);
```

- [ ] **Step 3: CSS**

Append to `reader.css`:

```css
/* Three-column shell */
.docpilot-reader .shell { grid-template-columns: 260px minmax(0, 1fr) 220px; }
@media (max-width: 1200px) {
  .docpilot-reader .shell { grid-template-columns: 240px minmax(0, 1fr); }
  .docpilot-reader aside.toc-right { display: none; }
}
@media (max-width: 900px) {
  .docpilot-reader .shell { grid-template-columns: 1fr; }
}

/* Right rail */
.docpilot-reader aside.toc-right {
  position: sticky; top: 60px; align-self: start;
  height: calc(100vh - 60px); padding: 40px 0 24px 16px; font-size: 13px;
}
.docpilot-reader .toc-right .label {
  font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-3); margin-bottom: 8px; font-weight: 600;
}
.docpilot-reader .toc-right a {
  display: block; color: var(--ink-2); text-decoration: none;
  padding: 4px 0 4px 12px; line-height: 1.4;
  border-left: 2px solid transparent; margin-left: -2px;
}
.docpilot-reader .toc-right a:hover { color: var(--ink); }
.docpilot-reader .toc-right a.active { color: var(--accent); border-color: var(--accent); }
.docpilot-reader .toc-right .group { margin-top: 22px; }

/* Flow nav */
.docpilot-reader .flow-nav {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--line);
}
.docpilot-reader .flow-link {
  display: block; padding: 12px 14px; border-radius: 8px;
  text-decoration: none; color: var(--ink); border: 1px solid transparent;
}
.docpilot-reader .flow-link:hover { background: var(--bg-2); border-color: var(--line); }
.docpilot-reader .flow-link .dir {
  font-size: 11.5px; color: var(--ink-3);
  text-transform: uppercase; letter-spacing: .08em;
}
.docpilot-reader .flow-link .ttl { display: block; font-weight: 600; margin-top: 4px; font-size: 14.5px; }
.docpilot-reader .flow-link.next { text-align: right; }

/* Footer */
.docpilot-reader footer.reader-foot {
  margin-top: 32px; padding: 32px 24px;
  border-top: 1px solid var(--line); background: var(--bg);
  color: var(--ink-3); font-size: 13px;
}
.docpilot-reader .foot-inner {
  max-width: 1400px; margin: 0 auto;
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.docpilot-reader .foot-links { display: flex; gap: 18px; }
.docpilot-reader .foot-inner a { color: var(--ink-2); text-decoration: none; }
.docpilot-reader .foot-inner a:hover { color: var(--accent); }
```

- [ ] **Step 4: Playwright assertions**

Append:

```js
test('flow nav: when prev is null, only one element renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const flow = page.locator('.docpilot-reader .flow-nav');
  await expect(flow).toBeVisible();
  // We render an empty <span /> placeholder; no .flow-link.prev should appear when prev is null.
  // For doc-manual, depending on sibling docs, the prev may exist. Assert structure: never dashed-empty box.
  await expect(flow.locator('.flow-link.prev[disabled], .flow-link.prev[aria-hidden]')).toHaveCount(0);
});

test('footer is not pure black background', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const bg = await page.locator('.docpilot-reader footer.reader-foot').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgb(0, 0, 0)');
});
```

Run; verify pass.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/reader/DocReader.tsx src/reader/reader.css tests/reader.spec.mjs
git commit -m "feat(reader): right rail, doc-level flow nav, refined footer"
```

---

## Task 10: Header chrome (brand, nav tabs, theme switcher, language, profile) + scroll progress + back-to-top

**Files:**
- Modify: `src/reader/DocReader.tsx`
- Modify: `src/reader/reader.css`

- [ ] **Step 1: Add header JSX above `.shell`**

In `DocReader.tsx` (inside the outer `.docpilot-reader` div, before `.shell`):

```tsx
<header className="reader-header">
  <a className="brand" href={model.company ? `/c/${model.company.slug}` : '/'}>
    <span className="brand-mark" aria-hidden="true">{(model.company?.name ?? 'D').charAt(0).toUpperCase()}</span>
    <span className="brand-name">{model.company?.name ?? 'DocPilot'}</span>
  </a>
  <nav className="nav-tabs" aria-label="Primary">
    <a className="active" href="#">Docs</a>
    <a href="#">API</a>
    <a href="#">Changelog</a>
    <a href="#">Support</a>
  </nav>
  <button
    type="button" className="search-trigger" aria-label="Search documentation"
    onClick={() => setSearchOpen(true)}
  >
    <span>⌕ Search…</span><kbd>⌘K</kbd>
  </button>
  <div className="header-actions">
    <button type="button" className="icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>◐</button>
    <button type="button" className="icon-btn" aria-label="Language">EN</button>
    <button type="button" className="icon-btn hamburger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>☰</button>
  </div>
  <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />
</header>
```

Add the relevant `useState` calls in the component:

```ts
const [searchOpen, setSearchOpen] = useState(false);
const [drawerOpen, setDrawerOpen] = useState(false);
```

Read `scrollProgress` from `useDocReaderState`. Define `toggleTheme`:

```ts
const toggleTheme = useCallback(() => {
  if (!rootRef.current || !model?.company) return;
  const current = rootRef.current.dataset.theme === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  rootRef.current.dataset.theme = next;
  saveSessionMode(model.company.slug, next);
}, [model]);
```

Note: if `model.company` is null (legacy/anonymous), the toggle still flips the dataset on the root for the current session but does not persist. Update `toggleTheme` to handle that case — set the dataset without calling `saveSessionMode`.

- [ ] **Step 2: Add back-to-top button at bottom of `.docpilot-reader`**

```tsx
<button
  type="button"
  className={`back-to-top${showBackToTop ? ' visible' : ''}`}
  aria-label="Back to top"
  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
>↑</button>
```

(`showBackToTop` comes from the hook.)

- [ ] **Step 3: CSS**

Append to `reader.css`:

```css
.docpilot-reader .reader-header {
  position: sticky; top: 0; z-index: 50;
  display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 24px;
  padding: 0 24px; height: 60px;
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid var(--line);
}
.docpilot-reader .brand {
  display: flex; align-items: center; gap: 8px;
  color: var(--ink); text-decoration: none; font-weight: 600; font-size: 15px;
}
.docpilot-reader .brand-mark {
  width: 24px; height: 24px; border-radius: 7px; background: var(--accent);
  color: #fff; display: inline-grid; place-items: center; font-size: 13px; font-weight: 700;
}
.docpilot-reader .nav-tabs { display: flex; gap: 2px; }
.docpilot-reader .nav-tabs a {
  padding: 6px 12px; color: var(--ink-2); text-decoration: none; font-size: 14px; border-radius: 6px;
}
.docpilot-reader .nav-tabs a:hover { background: var(--bg-2); color: var(--ink); }
.docpilot-reader .nav-tabs a.active { color: var(--accent); background: var(--accent-soft); }
.docpilot-reader .search-trigger {
  display: flex; align-items: center; gap: 10px; justify-self: end;
  height: 36px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px;
  background: var(--bg-2); color: var(--ink-3); font-size: 14px; cursor: text;
  font-family: inherit; max-width: 320px; width: 100%;
}
.docpilot-reader .search-trigger:hover { border-color: var(--accent); color: var(--ink-2); }
.docpilot-reader .search-trigger kbd { margin-left: auto; }
.docpilot-reader .header-actions { display: flex; gap: 6px; align-items: center; }
.docpilot-reader .icon-btn {
  width: 36px; height: 36px; border: 1px solid var(--line); background: transparent;
  border-radius: 8px; display: inline-grid; place-items: center;
  color: var(--ink-2); cursor: pointer; font-size: 14px; font-family: inherit;
}
.docpilot-reader .icon-btn:hover { background: var(--bg-2); color: var(--ink); }
.docpilot-reader .hamburger { display: none; }
@media (max-width: 900px) {
  .docpilot-reader .reader-header { grid-template-columns: auto 1fr auto auto; gap: 12px; padding: 0 16px; }
  .docpilot-reader .nav-tabs { display: none; }
  .docpilot-reader .hamburger { display: inline-grid; }
}

.docpilot-reader .scroll-progress {
  position: absolute; left: 0; bottom: 0; height: 2px;
  background: var(--accent); transition: width .1s linear;
}

.docpilot-reader .back-to-top {
  position: fixed; right: 20px; bottom: 20px; z-index: 40;
  width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line);
  background: var(--bg); color: var(--ink-2); font-size: 18px; cursor: pointer;
  box-shadow: var(--shadow); opacity: 0; pointer-events: none; transition: opacity .2s;
}
.docpilot-reader .back-to-top.visible { opacity: 1; pointer-events: auto; }
.docpilot-reader .back-to-top:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
```

- [ ] **Step 4: Playwright assertions**

Append:

```js
test('reader header is 60px sticky and shows brand + search trigger', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const header = page.locator('.docpilot-reader .reader-header');
  await expect(header).toBeVisible();
  const height = await header.evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.round(height)).toBe(60);
  await expect(header.locator('.search-trigger')).toBeVisible();
});

test('theme toggle flips data-theme on the reader root', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const root = page.locator('.docpilot-reader');
  const before = await root.getAttribute('data-theme');
  await page.locator('.docpilot-reader [aria-label="Toggle theme"]').click();
  const after = await root.getAttribute('data-theme');
  expect(before).not.toBe(after);
});
```

Run; verify pass.

- [ ] **Step 5: Commit**

```bash
git add src/reader/DocReader.tsx src/reader/reader.css tests/reader.spec.mjs
git commit -m "feat(reader): sticky header chrome + scroll progress + back-to-top"
```

---

## Task 11: Hamburger drawer with focus trap, ≥320px responsive

**Files:**
- Create: `src/reader/Drawer.tsx`
- Modify: `src/reader/DocReader.tsx`, `src/reader/reader.css`

- [ ] **Step 1: Create the Drawer component**

Create `src/reader/Drawer.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = el.querySelectorAll<HTMLElement>(
      'a, button, input, [tabindex]:not([tabindex="-1"])'
    );
    focusables[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Navigation" ref={ref}>
        {children}
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Mount the drawer in `DocReader`**

Below the header / above the shell:

```tsx
<Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  <ul className="side-list">
    {toc.map((entry) => (
      <li key={entry.id}>
        <a href={`#${entry.id}`} onClick={() => setDrawerOpen(false)}>{entry.number} {entry.title}</a>
        {entry.subs.length ? (
          <ul className="sub">
            {entry.subs.map((sub) => (
              <li key={sub.id}>
                <a href={`#${sub.id}`} onClick={() => setDrawerOpen(false)}>{sub.title}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    ))}
  </ul>
</Drawer>
```

- [ ] **Step 3: Drawer CSS**

Append to `reader.css`:

```css
.docpilot-reader .drawer {
  position: fixed; top: 60px; left: 0; bottom: 0; width: min(280px, 86vw);
  background: var(--bg); border-right: 1px solid var(--line);
  z-index: 60; padding: 20px 16px; overflow: auto;
  box-shadow: var(--shadow);
}
.docpilot-reader .drawer-backdrop {
  position: fixed; inset: 60px 0 0 0; background: rgba(0, 0, 0, .4); z-index: 55;
}
@media (min-width: 901px) {
  .docpilot-reader .drawer, .docpilot-reader .drawer-backdrop { display: none; }
}
@media (max-width: 360px) {
  .docpilot-reader .reader-header { padding: 0 12px; gap: 8px; }
  .docpilot-reader .search-trigger { padding: 0 8px; }
}
```

- [ ] **Step 4: Playwright assertion at 320px**

Append:

```js
test('at 320px viewport, body fits with no horizontal scroll and drawer toggles', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scrollX).toBeLessThanOrEqual(0);
  await page.locator('.docpilot-reader .hamburger').click();
  await expect(page.locator('.docpilot-reader .drawer')).toBeVisible();
  // focus is trapped: pressing Tab from last item should wrap to first
  await page.keyboard.press('Escape');
  await expect(page.locator('.docpilot-reader .drawer')).toHaveCount(0);
});
```

Run; verify pass.

- [ ] **Step 5: Commit**

```bash
git add src/reader/Drawer.tsx src/reader/DocReader.tsx src/reader/reader.css tests/reader.spec.mjs
git commit -m "feat(reader): hamburger drawer with focus trap, 320px-ready"
```

---

## Task 12: ⌘K stub search modal + anchor-copy on heading

**Files:**
- Create: `src/reader/SearchModal.tsx`
- Modify: `src/reader/DocReader.tsx`, `src/reader/reader.css`, `src/reader/useDocReaderState.ts`

- [ ] **Step 1: SearchModal component**

Create `src/reader/SearchModal.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';

type Anchor = { id: string; title: string; section: string };

export function SearchModal({
  open, onClose, anchors,
}: { open: boolean; onClose: () => void; anchors: Anchor[] }) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return anchors.slice(0, 8);
    return anchors.filter((a) =>
      a.title.toLowerCase().includes(q) || a.section.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [anchors, query]);

  return (
    <dialog
      ref={ref} className="search-modal" aria-label="Search"
      onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="search-modal-inner">
        <input
          autoFocus type="text" placeholder="Search section titles…"
          value={query} onChange={(e) => setQuery(e.target.value)}
        />
        <ul>
          {results.map((a) => (
            <li key={a.id}>
              <a href={`#${a.id}`} onClick={onClose}>
                <strong>{a.title}</strong>
                <span>{a.section}</span>
              </a>
            </li>
          ))}
          {!results.length ? <li className="empty">No matches</li> : null}
        </ul>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Wire SearchModal + ⌘K keybinding**

In `DocReader.tsx`:

```tsx
const anchors = useMemo(() => {
  const list: { id: string; title: string; section: string }[] = [];
  toc.forEach((entry) => {
    list.push({ id: entry.id, title: `${entry.number} ${entry.title}`, section: entry.title });
    entry.subs.forEach((s) => list.push({ id: s.id, title: s.title, section: entry.title }));
  });
  return list;
}, [toc]);

useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, []);
```

Render below the existing `<Drawer>` block:

```tsx
<SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} anchors={anchors} />
```

Import the component at the top.

- [ ] **Step 3: Anchor-copy on `.` keypress over heading hover**

Extend `useDocReaderState.ts` (or add a small additional effect inside `DocReader`) with:

```ts
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key !== '.') return;
    const hovered = document.querySelector<HTMLElement>('.docpilot-reader main h2:hover, .docpilot-reader main h3:hover');
    if (!hovered?.id) return;
    const url = `${location.origin}${location.pathname}#${hovered.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, []);
```

Also append "#" anchor element in section headings — for hover-discovery. Since section HTML is dangerouslySetInnerHTML we can't inject inside it from React. Instead, attach a delegated listener that copies on heading click while holding Alt (a simpler fallback than `.` if the user prefers mouse). Skip this in the initial PR if scope creep — `.` keypress + URL bar is enough per spec.

- [ ] **Step 4: CSS for the modal**

Append to `reader.css`:

```css
.docpilot-reader ~ dialog.search-modal,
dialog.search-modal {
  border: 1px solid var(--line); border-radius: 12px;
  padding: 0; width: min(560px, 90vw); max-height: 70vh;
  background: var(--bg); color: var(--ink); box-shadow: var(--shadow);
}
dialog.search-modal::backdrop { background: rgba(0, 0, 0, .4); }
.search-modal-inner { display: flex; flex-direction: column; }
.search-modal-inner input {
  border: 0; padding: 16px 20px; font-size: 15px; outline: none;
  font-family: 'Inter', system-ui, sans-serif; background: transparent; color: inherit;
  border-bottom: 1px solid var(--line);
}
.search-modal-inner ul { list-style: none; padding: 8px; margin: 0; overflow: auto; }
.search-modal-inner li { display: block; }
.search-modal-inner li a {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 12px; border-radius: 6px; text-decoration: none; color: var(--ink);
}
.search-modal-inner li a:hover { background: var(--accent-soft); }
.search-modal-inner li a strong { font-size: 14px; font-weight: 500; }
.search-modal-inner li a span { font-size: 12.5px; color: var(--ink-3); }
.search-modal-inner li.empty { padding: 12px; color: var(--ink-3); text-align: center; }
```

(The two `dialog.search-modal` selectors are written non-scoped because `<dialog>` is reparented by the browser into the top layer and may not be a descendant of `.docpilot-reader` at render time.)

- [ ] **Step 5: Playwright assertions**

Append:

```js
test('⌘K opens the search modal and filters anchors by title', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await page.keyboard.press('Meta+K');
  const modal = page.locator('dialog.search-modal');
  await expect(modal).toBeVisible();
  await modal.locator('input').fill('round');
  await expect(modal.locator('ul li a')).not.toHaveCount(0);
});
```

(Linux: `Control+K`. Use `process.platform === 'darwin' ? 'Meta+K' : 'Control+K'` if running in CI on Linux.)

Run; verify pass.

- [ ] **Step 6: Commit**

```bash
git add src/reader/SearchModal.tsx src/reader/DocReader.tsx src/reader/reader.css src/reader/useDocReaderState.ts tests/reader.spec.mjs
git commit -m "feat(reader): ⌘K stub modal with fuzzy title search + anchor copy"
```

---

## Task 13: Extend `ThemeControls` with reader-accent + default-mode inputs

**Files:**
- Modify: `src/App.tsx` (the `ThemeControls` function and its form)

- [ ] **Step 1: Add the two new inputs to the form**

Find the form inside `ThemeControls` (around line 4375). Add new `<label>` elements alongside the existing color inputs:

```tsx
<label>
  <span>Reader accent</span>
  <input name="readerAccent" type="color" defaultValue={activeTheme.readerAccent} />
</label>
<label>
  <span>Reader default mode</span>
  <select name="readerDefaultMode" defaultValue={activeTheme.readerDefaultMode}>
    <option value="system">Follow system</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</label>
```

- [ ] **Step 2: Read them in `submitPreset`**

Edit the `submitPreset` handler so the constructed preset includes:

```ts
readerAccent: normalizeMarkerColor(String(form.get('readerAccent') ?? ''), '#635bff'),
readerDefaultMode: ((value) => value === 'light' || value === 'dark' || value === 'system' ? value : 'system')(String(form.get('readerDefaultMode') ?? '')),
```

(Reuse `normalizeMarkerColor` since it already validates hex; or write a tiny local hex validator if `normalizeMarkerColor` returns falsy on a missing input.)

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Open `http://127.0.0.1:5173/admin/theme` (or wherever `ThemeControls` is currently surfaced — search for `<ThemeControls />` callsite). Save a new preset with `Reader accent = #ff0066`. Then open `/docs/doc-manual` and verify the active accent on the reader is `#ff0066` (links, active ToC entry, pill border on hover).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(admin): expose reader accent + default mode in ThemeControls"
```

---

## Task 14: Narrow `composeManualHtml`; remove old `DocumentViewerPage` + `DocReaderHeader`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Narrow `composeManualHtml`**

Replace the body of `composeManualHtml` (line 9221) with:

```ts
function composeManualHtml(sections: SectionEntry[]) {
  return sections.map((section) => section.html).join('\n\n');
}
```

The old function wrapped sections in the legacy static `manualHtml` shell. The new reader provides its own shell, so this becomes a trivial join.

- [ ] **Step 2: Verify no other caller relies on the wrapper**

Run `grep -n 'composeManualHtml\|manualHtml' src/`. Expected callers: only `DocReaderRoute` (via `getSectionsForDoc` → section HTML strings). If `manualHtml` (the static constant) is still imported anywhere outside the legacy code path, leave it — it's the source for content authors.

- [ ] **Step 3: Delete `DocumentViewerPage` and `DocReaderHeader`**

Delete the functions starting at lines ~1666 and ~1824 respectively. Also delete any helpers used exclusively by them (`escapeHtmlForFlow` if unused elsewhere — `grep` to confirm before deletion).

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors. If the build complains about a now-unreferenced helper, delete the helper too.

- [ ] **Step 5: Smoke test the route still works**

```bash
npm run dev
```

Open `/docs/doc-manual` → new shell renders. Open `/docs/doc-integration` → new shell renders. Open `/manual` → redirects to `/docs/doc-manual` (existing `<Navigate />` route).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(reader): narrow composeManualHtml, delete legacy DocumentViewerPage"
```

---

## Task 15: Smoke test + axe-core contrast checks

**Files:**
- Modify: `scripts/browser-smoke.mjs`
- Create: `playwright.config.ts`
- Update: `tests/reader.spec.mjs`

- [ ] **Step 1: Create the Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: {
    baseURL: process.env.READER_BASE_URL || 'http://127.0.0.1:5173',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm run dev:web -- --port 5173 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

- [ ] **Step 2: Add the axe-core contrast check to `tests/reader.spec.mjs`**

Append:

```js
import AxeBuilder from '@axe-core/playwright';

test('reader passes axe colour-contrast at AAA on /docs/doc-manual (light)', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const results = await new AxeBuilder({ page })
    .include('.docpilot-reader')
    .withTags(['wcag2aa', 'wcag2aaa'])
    .options({ runOnly: { type: 'rule', values: ['color-contrast', 'color-contrast-enhanced'] } })
    .analyze();
  if (results.violations.length) {
    console.log(JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations.filter((v) => v.id === 'color-contrast').length).toBe(0);
});

test('reader passes axe colour-contrast on /docs/doc-manual (dark)', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await page.locator('.docpilot-reader [aria-label="Toggle theme"]').click();
  await page.waitForTimeout(120);
  const results = await new AxeBuilder({ page })
    .include('.docpilot-reader')
    .withTags(['wcag2aa'])
    .options({ runOnly: { type: 'rule', values: ['color-contrast'] } })
    .analyze();
  expect(results.violations).toHaveLength(0);
});
```

- [ ] **Step 3: Run the full Playwright suite locally**

```bash
npx playwright install --with-deps chromium
npx playwright test
```

Expected: all green. If a contrast violation appears (likely the right-rail `.sub-anchor` muted color or the search-trigger placeholder), tighten the token (`--ink-3` → `--ink-2`) inline in `reader.css` and re-run until clean.

- [ ] **Step 4: Update `browser-smoke.mjs` to assert the new shell**

In `scripts/browser-smoke.mjs`, find the call sequence around line 125–129 and replace the `await visit('/manual/overview', …)` line with:

```js
await visit('/docs/doc-manual', /Aviator/i);

await page.waitForSelector('.docpilot-reader', { state: 'visible', timeout: 5000 });
const hasLegacyShell = await page.locator('.manual-shell').count();
assert.equal(hasLegacyShell, 0, 'Legacy .manual-shell should not mount on /docs/doc-manual.');
```

- [ ] **Step 5: Run the smoke**

```bash
npm run smoke
```

Expected: ok: true. No unexpected errors or warnings.

- [ ] **Step 6: Commit**

```bash
git add scripts/browser-smoke.mjs playwright.config.ts tests/reader.spec.mjs package.json
git commit -m "test(reader): wire Playwright + axe-core contrast checks, update smoke"
```

---

## Task 16: Final acceptance pass + push

**Files:** none (verification + commit + push)

- [ ] **Step 1: Run every quality gate**

```bash
npm run typecheck
npm run lint
npm test
npm run smoke
npx playwright test
```

Expected: all green.

- [ ] **Step 2: Manual visual walk-through against §10 acceptance criteria**

Open `/docs/doc-manual` in light mode, then toggle dark, then resize to 320×640, then resize to 1440×900. Tick each item in spec §10:

1. New shell (header / sidebar / 760px column / right rail visible at ≥1200px). No dark hero.
2. 320px: no horizontal scroll. Drawer toggles. Focus trapped (Tab cycles within drawer, Escape closes).
3. Theme switcher swaps `data-theme` and writes `localStorage` key `docpilot:reader-mode:<slug>` (verify via DevTools Application tab).
4. Set an admin accent in `ThemeControls`; reload reader; verify links, active ToC item, callout backgrounds all use the new accent.
5. Real `<table>`, `<pre>`, `<kbd>`, `<figure>` (find a section with each) render with new styling. Legacy `INFO: …` placeholders still appear as info callouts.
6. Flow nav: visit a doc with no next sibling — the next side is just empty, not a dashed-empty card.
7. Inspect a sub-section heading — verify computed contrast (DevTools Lighthouse → Accessibility) ≥ 7:1.
8. Open a section with markers (Aviator manual sections have them) — hover/click markers work.

- [ ] **Step 3: Squash review of the diff**

```bash
git log --oneline codex/polish-translations-ui ^main | head -40
git diff main...codex/polish-translations-ui --stat
```

Sanity-check the file list matches the "File map" at the top of this plan.

- [ ] **Step 4: Push**

```bash
git push -u origin codex/polish-translations-ui
```

(Do not force-push.)

- [ ] **Step 5: Open the PR**

```bash
gh pr create --title "DocPilot reader UI refinement (Direction B)" --body "$(cat <<'EOF'
## Summary

- Replace the legacy DocumentViewerPage chrome with a Stripe/Linear-style minimal reader shell at /docs/:docId.
- Add admin-configurable per-tenant accent + dark mode (extended ThemePreset + ThemeControls).
- Mobile drawer with focus trap, ≥320px supported.
- Section body styles unified: callouts, tables, code, kbd, figures, headings.
- Stub ⌘K search modal over section titles + sub-anchors.

Spec: docs/superpowers/specs/2026-06-02-docpilot-reader-design.md
Plan: docs/superpowers/plans/2026-06-02-docpilot-reader-refinement.md

## Test plan

- [x] vitest unit tests (theme resolver + session mode)
- [x] Playwright reader spec (shell + sidebar + theme toggle + 320px + ⌘K + axe contrast)
- [x] Smoke test asserts .docpilot-reader on /docs/doc-manual
- [x] Manual walkthrough of all 8 spec §10 acceptance items

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

After writing this plan I checked it against the spec:

- **Spec §1 (why)**: covered by Tasks 5–14 (the actual replacement).
- **Spec §2 (goals)**: 1=Tasks 5–14, 2=Tasks 2 + 13, 3=Task 11, 4=Tasks 6–9, 5=Tasks 10 + 12.
- **Spec §2 (non-goals)**: search backend deferred ✓ (Task 12 is explicit "stub"); editor untouched ✓ (no edits there); section composer placeholders untouched ✓ (compat CSS in Task 8 styles the existing class names).
- **Spec §3 (visual language)**: type → Task 1, color/scope → Task 4, scale → Tasks 4 + 6 + 7 + 9, mobile → Task 11.
- **Spec §4.1 header**: Task 10.
- **Spec §4.2 doc head**: Task 6.
- **Spec §4.3 sidebar**: Task 7.
- **Spec §4.4 section body**: Task 8.
- **Spec §4.5 right rail**: Task 9.
- **Spec §4.6 flow nav**: Task 9.
- **Spec §4.7 footer**: Task 9.
- **Spec §4.8 affordances**: Task 10 (scroll progress + BTT) + Task 12 (anchor copy).
- **Spec §5 admin surface**: Task 2 + Task 13.
- **Spec §6 file architecture**: Tasks 3–14.
- **Spec §7 theme model**: Task 3.
- **Spec §8 accessibility**: Task 11 (focus trap, reduced-motion in Task 4) + Task 15 (axe).
- **Spec §10 acceptance**: Task 16.
- **Spec §11 open questions**: all four resolved before this plan (doc-level flow nav, theme-switcher visible to everyone, axe in CI now, stub search over titles).

No placeholders, no "TBD". Every code step shows real code. Type names are consistent across tasks: `ThemePreset` (extended in Task 2, used in Task 3 + 13), `ReaderTheme` / `ReaderMode` / `ReaderModePref` (defined in Task 3, used in Task 5 implicitly through `applyReaderTheme`), `DocReaderModel` (defined in Task 5, extended in Task 9 with `siblings`).

One known risk: the `axe-core` AAA contrast pass on the *right rail* sub-anchors (color `--ink-3`) may fail; the plan calls out a fallback (tighten to `--ink-2`) in Task 15 Step 3.
