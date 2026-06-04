# Dev server restart guide (offline-safe)

Both the API (`:4179`) and Vite (`:5173`) are spawned by one command.

## TL;DR

```bash
cd "/Users/nukritusishvili/Desktop/Claude Projects/AviatorDocs"
npm run dev
```

That's it. `concurrently` starts both the API and the web dev server. Logs print to stdout.

## If the servers are already running and acting up

Stop them all in one shot, then start fresh:

```bash
# Kill anything on the dev ports
lsof -ti :4179 -ti :5173 | xargs kill 2>/dev/null

# Or kill by process name
pkill -f docpilot-server
pkill -f "concurrently.*npm:dev"

# Wait a sec, then start
sleep 1
cd "/Users/nukritusishvili/Desktop/Claude Projects/AviatorDocs"
npm run dev
```

## Verify they're alive

```bash
curl -s -o /dev/null -w "API:%{http_code}\n" http://localhost:4179/api/v2/auth/me   # expect 401 (route exists, no session)
curl -s -o /dev/null -w "Vite:%{http_code}\n" http://localhost:5173/                # expect 200
```

- `API: 401` = good (auth required, no session cookie).
- `Vite: 200` = good.
- `000` on either = nothing listening; run `npm run dev` again.

## If the API boot crashes

Check the terminal output. Most likely causes:

- **`SqliteError: no such column: ...`** — the SQLite file has an older schema and the new column migration in `server/db.mjs` hit a CREATE INDEX before the ALTER. We patched this once; if it recurs, look at `server/db.mjs` `ensureColumn()` calls and `server/schema.sql` for any index that references a column not in the base CREATE TABLE.
- **Port already in use** — `lsof -ti :4179 | xargs kill` then retry.
- **bcrypt or better-sqlite3 native module** — rare; rebuild with `npm rebuild`.

## If the page is white

Open DevTools → Console. If you see:

- **`QuotaExceededError`** on `localStorage.setItem` — the translations blob has grown past the browser cap again. Run this once in the console:
  ```js
  localStorage.removeItem('docpilot:aviator_admin_cms_translations_v2');
  location.reload();
  ```
  (Prefix is `docpilot:` per `src/storage.ts`.)
- **React error about hooks / undefined**  — the HMR couldn't apply a change. Full reload (Cmd+Shift+R) usually fixes it.

## Default credentials (if you need them)

The credentials for the local dev DB are stored only in
`.docpilot-data/migration-credentials.txt` (gitignored). Read that file
locally — never paste live credentials into committed docs.

| Role | Email | Password |
|---|---|---|
| Superadmin | `admin@docpilot.local` | *(see migration-credentials.txt)* |
| Company admin (Aviator) | `admin@aviator-studio.local` | *(see migration-credentials.txt)* |

## What goes where

| Port | What | File entry-point |
|---|---|---|
| `4179` | DocPilot persistence + multi-tenant API | `server/docpilot-server.mjs` (which imports `server/api-v2.mjs`) |
| `5173` | Vite dev (React + HMR) | `vite.config.ts` + `src/main.tsx` |

Vite proxies any `/api/*` request to `127.0.0.1:4179` via the config — if you see `ECONNRESET` errors in the Vite log, the API died; restart with `npm run dev`.

## Reseed Minescape markers

The marker reseed is **idempotent**. If something goes wrong, restore first then reseed.

```bash
cd "/Users/nukritusishvili/Desktop/Claude Projects/AviatorDocs"

# (Optional) Restore original section HTML from the pre-migration JSON.
# Use this if a prior reseed went wrong and stripped figures.
node scripts/seed-minescape/restore-sections.mjs

# Apply the marker plan: ≤2 markers per figure, dashed red border,
# transparent inner background.
node scripts/seed-minescape/reseed-markers.mjs
```

The marker plan is the `PLAN` array at the top of `reseed-markers.mjs`. Each
section is a list of `{ imageSrc, imageAlt, caption, markers[1..2] }` — same
image can be reused across multiple figures.

Style is hardcoded in `buildMarkerSpan()`:
- `border-style: dashed`
- `border-color: #ff1b23` (brand red)
- `background-opacity: 0` (fully transparent)
- `text-color: #ffffff`
- `animated: false`

If you change the brand color or want a different border style, edit the
constants `BORDER_COLOR` / `BORDER_STYLE` / `TEXT_COLOR` at the top.

## Tenant URLs

| URL | What |
|---|---|
| `http://localhost:5173/c/aviator` | Aviator client area (login → client area when authed) |
| `http://localhost:5173/c/aviator/admin` | Company-admin tab (users / branding / audit) |
| `http://localhost:5173/c/aviator/admin/cms` | Legacy CMS with marker editor |
| `http://localhost:5173/admin/v2/login` | Superadmin login |
| `http://localhost:5173/admin/v2/` | Superadmin shell (post-login) |
