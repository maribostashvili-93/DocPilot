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

**http://localhost:5173/c/aviator**

Log in with:

- **Email:** `admin@aviator-studio.local`
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

DocPilot ships with a Dockerfile and a step-by-step EC2 playbook.

- **AWS EC2 (recommended for first deploy):** see [DEPLOY-AWS.md](DEPLOY-AWS.md). Walks you through launching an instance, building the container, and reaching the site at `http://<your-ec2-ip>`.
- **Fly.io / Railway / Render / DigitalOcean App Platform:** same Docker image works. You need (a) a persistent disk mounted at `/app/.docpilot-data` and (b) the `ADMIN_PASSWORD` env var set.
- **Bare metal / your own VM:** `docker build -t docpilot . && docker run -d -p 80:4179 -v docpilot-data:/app/.docpilot-data --env-file .env docpilot`.

The volume at `/app/.docpilot-data` holds your SQLite database, uploaded media, and audit log — back it up the same way you'd back up any database.

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

Bug reports and improvements welcome: [issues](https://github.com/EarendilM83/DocPilot/issues).

The platform is content-agnostic by design — your tenant data lives in your own deployment's database. The repo only ships generic platform code plus a self-documenting demo dataset.

---

## License

This project is provided as-is for evaluation and self-hosted use. See [LICENSE](LICENSE) if present, otherwise contact the maintainer before redistributing.
