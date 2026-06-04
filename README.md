# DocPilot

A multi-tenant documentation platform for product teams. Ship the same reference material to internal staff, partners, and external customers — without spinning up a new site per audience.

🌐 **Live demo:** open the [`Welcome to DocPilot`](https://github.com/EarendilM83/DocPilot/blob/main/content/custom-sections.json) doc that ships with this repo, or run it locally below.

---

## What you get out of the box

- **Reader** — read-optimised view of your docs. Dark-mode toggle, hash-anchored sub-sections, side-rail TOC, full-text search (`⌘K`).
- **CMS** — authoring surface for documents, sections, media, translations, and releases. Role-based: admin / editor / reviewer / viewer / partner.
- **Multi-tenant** — every doc belongs to a *company*. Each company gets its own branded landing at `/c/<slug>` with assigned account managers, staging links, and per-user visibility toggles.
- **Single-process deploy** — one Node server serves the API + the built SPA from one port. SQLite-backed; ships with a Dockerfile.

---

## Quick start — run it on your laptop

You don't need to know TypeScript or Node to follow this. Copy-paste the commands.

### 1. Install prerequisites

You need:

- [**Node.js 20+**](https://nodejs.org/) (LTS) — includes npm.
- **Git** — pre-installed on macOS/Linux; on Windows install [Git for Windows](https://git-scm.com/download/win).

Check they're installed by opening a terminal and running:

```bash
node --version    # should print v20.x or higher
npm --version
git --version
```

### 2. Clone this repo and install dependencies

```bash
git clone https://github.com/EarendilM83/DocPilot.git
cd DocPilot
npm install
```

The `npm install` step downloads dependencies. First run takes 1–2 minutes.

### 3. Set an admin password

Create a file called `.env` in the project root with one line:

```env
ADMIN_PASSWORD=ChangeMeNow!Aa9
```

Pick your own strong password. This becomes the login for the first admin user.

> **macOS/Linux shortcut:** `echo 'ADMIN_PASSWORD=ChangeMeNow!Aa9' > .env`
> **Windows (PowerShell):** `Set-Content .env 'ADMIN_PASSWORD=ChangeMeNow!Aa9'`

### 4. Start it

```bash
npm run dev
```

Two services start in one terminal: the API on port `4179` and the web app on port `5173`. When you see `VITE … ready`, open:

**http://localhost:5173/c/demo**

Log in with:

- **Email:** `admin@example.com`
- **Password:** *(whatever you set in `.env`)*

You're in. Click into a doc to read it; the user-menu has a password-change form.

> Press `Ctrl+C` in the terminal to stop the server.

---

## Customize it for your own docs

The content you see in the demo lives in **just four files**. Edit them to make DocPilot yours.

| File | What's in it |
|---|---|
| `content/docs.json` | List of documents (id, title, slug, version, owner, audience) |
| `content/games.json` | List of products / games the docs are organised under |
| `content/custom-sections.json` | Section bodies (HTML) keyed by doc ID |
| `content/media-assets.json` | Media metadata (optional, used by the CMS) |

You can also drop your screenshots into `public/images/<your-folder>/` and reference them from section HTML as `/images/<your-folder>/foo.png`.

### Minimal example

Make `content/docs.json`:

```json
[
  {
    "id": "doc-handbook",
    "gameId": "my-product",
    "title": "Team Handbook",
    "slug": "handbook",
    "type": "manual",
    "version": "1.0.0",
    "status": "published",
    "description": "Everything new joiners need to know.",
    "audience": "Engineering",
    "owner": "Eng team",
    "navPlacement": "primary",
    "templateId": "manual",
    "updatedAt": "2026-06-04",
    "sections": 1
  }
]
```

Make `content/custom-sections.json`:

```json
{
  "doc-handbook": [
    {
      "id": "doc-handbook-s1",
      "number": "1.0",
      "slug": "welcome",
      "title": "Welcome",
      "summary": "Start here.",
      "status": "published",
      "owner": "Eng team",
      "reviewer": "Eng team",
      "updatedAt": "2026-06-04",
      "html": "<div class=\"section-banner\"><div class=\"container\"><div class=\"num\">1.0</div><h2>Welcome</h2></div></div><section class=\"content\"><div class=\"container\"><p>Hello from your own DocPilot deployment.</p></div></section>"
    }
  ]
}
```

Reload the page; your doc is live at `http://localhost:5173/docs/handbook`. The CMS at `/admin/v2/login` lets you edit through the UI from then on.

---

## Deploy to a real server

DocPilot ships as a single-process app, packaged in a Dockerfile in this repo. Anywhere that runs a Node 20 Docker container with a persistent disk will work.

**Requirements:**

- A host that can run a Docker container with a mounted volume.
- A persistent volume mounted at `/app/.docpilot-data` (holds the SQLite database, uploaded media, audit log, and CMS state file).
- An `.env` file (or host environment) with at minimum `ADMIN_PASSWORD` set — used on first boot to create the initial admin user.
- Port `4179` exposed publicly, or remapped to `80`/`443` if you're putting a reverse proxy in front.

**One-shot deploy command:**

```bash
docker build -t docpilot .
docker run -d \
  --name docpilot \
  --restart unless-stopped \
  --env-file .env \
  -p 80:4179 \
  -v docpilot-data:/app/.docpilot-data \
  docpilot
```

**Where to host:** Fly.io, Railway, Render, DigitalOcean App Platform, AWS EC2/ECS, GCP Cloud Run with a persistent disk, your own VM, or a Kubernetes cluster — all of them work the same way. The choice is about cost, your existing infrastructure, and how much you want to manage yourself.

**TLS:** the included server speaks plain HTTP. For HTTPS, put a reverse proxy in front (Caddy, nginx, Cloudflare Tunnel, your platform's load balancer) and set `DOCPILOT_COOKIE_SECURE=1` in the env so the session cookie carries the Secure flag.

**Backups:** the `/app/.docpilot-data` volume is your only stateful surface. Snapshot it the way you'd snapshot a Postgres data directory.

---

## What's in the repo

```
src/                    # React + TypeScript SPA (reader + CMS)
  reader/               # Read-only doc rendering
  multitenant/          # Company landings, user management
  admin/                # Superadmin tools
server/                 # Node HTTP server
  docpilot-server.mjs   # API + static file entry point
  api-v2.mjs            # Multi-tenant REST API (auth, RBAC, audit)
  auth.mjs              # bcrypt sessions
  db.mjs                # SQLite (better-sqlite3) + schema
  seed-on-boot.mjs      # Idempotent first-run tenant seed
  schema.sql            # Database schema
content/                # Tenant content — edit these to make DocPilot yours
  docs.json
  games.json
  custom-sections.json
  media-assets.json
public/                 # Static assets (favicons, demo images)
Dockerfile              # Multi-stage build, ships dist/ + server in one image
DEPLOY-AWS.md           # EC2 deploy playbook
```

---

## Useful commands

```bash
npm run dev              # Start API + web (port 5173 web, 4179 API)
npm run build            # Production build → dist/
npm run typecheck        # TypeScript check (no emit)
npm run lint             # ESLint
npm run test             # Vitest unit tests
npm run smoke            # End-to-end browser test
```

---

## Architecture in one diagram

```
                         ┌─────────────────────┐
                         │  Browser            │
                         │  /c/<tenant>        │
                         │  /docs/<slug>       │
                         │  /admin/v2/...      │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Node HTTP (4179)   │
                         │  ┌───────────────┐  │
                         │  │ Static (SPA)  │  │
                         │  │ from dist/    │  │
                         │  ├───────────────┤  │
                         │  │ /api/v2/*     │  │
                         │  │ /api/docpilot │  │
                         │  └───────┬───────┘  │
                         └──────────│──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  .docpilot-data/    │
                         │  ├─ docpilot.sqlite │
                         │  ├─ cms-state.json  │
                         │  └─ media/          │
                         └─────────────────────┘
```

One process, one port, one persistent directory. Easy to deploy, easy to back up.

---

## Roles & permissions

| Role | What they can do |
|---|---|
| `admin` | Platform-wide superadmin (manages tenants) |
| `company-admin` | Full control inside their company |
| `editor` | Write docs, sections, media, translations |
| `reviewer` | Translation review only |
| `viewer` | Read internal docs |
| `partner` / `tam` | External collaborators with scoped writes |

Default admin role assigned on first boot via `seed-on-boot.mjs` is `company-admin`.

---

## Contributing

DocPilot is built in the open. Three ways to help — pick the one that fits.

| You are a… | You probably want to… | Jump to |
|---|---|---|
| 🧑‍💻 **User** | Report a bug or request a feature | [As a user](#as-a-user) |
| 🛠 **Developer** | Submit a fix or build a feature | [As a developer](#as-a-developer) |
| 🎨 **Designer** | Suggest visual changes or new flows | [As a designer](#as-a-designer) |

### Before you file anything

Spend 60 seconds on these checks — they cut the back-and-forth dramatically:

1. **Search [existing issues](https://github.com/EarendilM83/DocPilot/issues?q=is%3Aissue)** for keywords from your problem. There's a good chance someone already raised it.
2. **Pull the latest `main`** and confirm the issue still reproduces. Bugs get fixed faster than READMEs get updated.
3. **Open DevTools** (Cmd/Ctrl + Opt + I → Console tab) — if anything is red, copy the message into your report.
4. **Note your environment**: browser + version, OS, whether you're in dark or light mode.

### As a user

You don't need to write code. Good bug reports and clear feature requests are some of the most valuable contributions to any project.

**Filing a bug report**

Open a [new issue](https://github.com/EarendilM83/DocPilot/issues/new?template=bug.yml) and use this template:

```markdown
**What happened**
One or two sentences describing what you saw.

**What I expected**
One sentence describing what you expected instead.

**Steps to reproduce**
1. Go to …
2. Click on …
3. Notice that …

**Screenshots / video**
(drag-drop into the issue text — GitHub uploads them automatically)

**Environment**
- DocPilot URL: (e.g., http://localhost:5173 or a deployed URL)
- Browser: (e.g., Chrome 142 on macOS 14.2)
- Theme: (light / dark)

**Console errors**
(paste anything red from DevTools → Console)
```

The most common mistake is "DocPilot is broken" without the steps to reproduce. Spend the extra 30 seconds — you'll get help faster.

**Requesting a feature**

Open a [new issue](https://github.com/EarendilM83/DocPilot/issues/new?template=feature.yml) using this template:

```markdown
**The problem this solves**
One or two sentences describing the situation you're in. Skip the proposed solution for now — describe the pain.

**Who experiences this**
e.g., "Tenant admins managing 50+ docs", "Reviewers checking translations", "New users on their first session"

**My ideal outcome**
What would a successful resolution look like? Describe the result, not the implementation.

**Alternatives I considered**
Existing workarounds, other tools that solve this differently, or "I don't know what would work" (totally fine).

**Extra context**
Links, screenshots from other tools, related docs, anything that helps a maintainer understand why this matters.
```

The strongest feature requests start with the user need ("I need to..."), not the solution ("Add a button that..."). The maintainers often see a better path once they understand the underlying need.

### As a developer

**Get a working local copy:**

```bash
git clone https://github.com/EarendilM83/DocPilot.git
cd DocPilot
npm ci
echo 'ADMIN_PASSWORD=DevPassword!1A' > .env
npm run dev   # API on :4179, web on :5173
```

**Code conventions:**

- TypeScript with the existing rules in `tsconfig.app.json` and `eslint.config.js`. No emoji output in code (the project's house style — emoji in chat / docs is fine).
- Prefer surgical edits over refactors. Touch only what your fix requires.
- New utilities go inside the existing file family (`src/multitenant/` for tenant features, `src/reader/` for the reading view, `src/admin/` for superadmin, `server/` for backend).
- Run `npm run typecheck && npm run lint && npm run build` before opening a PR.
- For UI changes: write a Playwright or Vitest test if there's a regression worth guarding. Manual screenshots in the PR description are also valuable.

**PR flow:**

1. Fork the repo, branch off `main` (e.g., `fix/sidebar-hover-contrast`).
2. Make small, focused commits with imperative subjects (`fix: sidebar hover text invisible in dark mode`, not `Fixed bug`).
3. Open the PR against `EarendilM83/DocPilot:main`. Use the PR template — describe **what**, **why**, and **how to test**.
4. Link the issue you're closing (`Closes #42`).
5. Be ready to iterate. Reviewers often have context the README doesn't capture.

**Good first issues:**

Look for the [`good-first-issue`](https://github.com/EarendilM83/DocPilot/labels/good-first-issue) label — these are scoped to be completable in a focused evening.

### As a designer

DocPilot has a deliberate visual language — clean, dense, dark-mode aware, no chrome that doesn't earn its space. If you'd like to push it forward:

**Suggesting a visual change**

Open a [discussion](https://github.com/EarendilM83/DocPilot/discussions) (preferred over issues for design conversations) using this shape:

```markdown
**The component / view**
e.g., "Reader's right-side TOC", "Recently-updated card on /c/<slug>", "Tab component in section bodies"

**What's awkward right now**
A specific moment where the current design gets in the user's way. Screenshot before/after if you can.

**What I'd try instead**
Sketch, Figma frame, hand-drawn screenshot annotation — anything visual.
Describe the principle behind your suggestion ("more visual hierarchy", "easier to scan at small sizes").

**Constraints to keep**
What should NOT change (the brand, an interaction pattern users have learned, a piece of accessibility behavior)?
```

**Sharing mockups**

GitHub Discussions and Issues both render dragged-in images at full width. Figma frames can be embedded via shareable links. For full mockups (multiple frames), a public Figma file beats a single screenshot.

**Reviewing existing UI**

The fastest way to surface friction is to record a short Loom or screen recording walking through a specific flow with audio: "I open this, click here, I expect X but get Y." 60–90 seconds is plenty.

**Design tokens**

Colors, type scale, spacing, and motion variables live in `src/styles.css`, `src/reader/reader.css`, and `src/multitenant/multitenant.css`. Changes that introduce new tokens should explain the reason in the PR description.

### Pull request expectations

Every PR should have:

- A **clear title** in imperative form.
- A **summary** of what changes and why (a paragraph, not a sentence).
- A **test plan** — bullet list of how a reviewer can verify your change works. Include console-error checks for anything UI-touching.
- **Screenshots** for visible changes (before + after if applicable).
- **A linked issue** when one exists.

Use the PR template — it captures all of the above.

### What we don't accept

A small list to save you time:

- PRs that bundle unrelated changes ("fix bug + refactor X + bump deps"). Split them.
- PRs that don't compile. `npm run build` must pass.
- Drive-by formatting changes to files you didn't otherwise touch.
- Adding telemetry, analytics, or third-party network requests without prior discussion.
- Sensitive data in test fixtures (credentials, real names, internal URLs).

### Community norms

- Be specific. "It's broken" is hard to act on; "Clicking Save on the section editor returns a 401 silently" is gold.
- Be patient. Maintainers triage in batches.
- Be kind. Everyone here is volunteering their time.

---

## License

This project is provided as-is for evaluation and self-hosted use. See [LICENSE](LICENSE) if present, otherwise contact the maintainer before redistributing.
