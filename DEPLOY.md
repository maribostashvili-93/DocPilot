# Deploying DocPilot to AWS EC2

## What ships and what gets created on first boot

The repo ships everything needed for parity with your local dev instance **except** the per-deploy SQLite database. On first start the server:

1. Creates `/app/.docpilot-data/docpilot.sqlite` and applies `server/schema.sql`.
2. Runs `server/seed-on-boot.mjs` — idempotent. Creates the Aviator company + company-admin user from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
3. Serves the Vite build at `/`, the API at `/api/docpilot/*` and `/api/v2/*`, all from a single Node process on port 4179.

The Minescape doc + back-office doc + all images are baked into the repo (App.tsx defaults + `public/images/`). The legacy `cms-state.json` is *not* required for fresh deploys — `mergeWithDefaults` falls back to App.tsx defaults until the admin edits something via the CMS.

If you want the Minescape doc with section content seeded into the SQLite DB on first boot (instead of localStorage-only via legacy reader), run `python3 scripts/seed-minescape/seed.py` once after first boot inside the container.

## EC2 setup (mirrors the StrayMap.ge pattern)

### 1. Provision

- **Instance:** t3.small or t3.medium (1–2 GB RAM enough; SQLite + Node fits easily).
- **AMI:** Amazon Linux 2023 or Ubuntu 22.04.
- **Storage:** 16 GB gp3 root volume. SQLite + media uploads live on this disk.
- **Security group:**
  - Inbound 22 (SSH) from your IP only.
  - Inbound 443 / 80 from Cloudflare IP ranges if you front it with Cloudflare (recommended).
- **Elastic IP** so the public IP doesn't change.

### 2. Install Docker

```bash
# Amazon Linux 2023
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# log out + back in for group to take effect
```

### 3. Clone + build

```bash
git clone https://github.com/EarendilM83/DocPilot.git
cd DocPilot
docker build --network=host -t docpilot .
```

`--network=host` avoids Alpine/Debian TLS hiccups during `npm ci` — same flag you use for StrayMap.

### 4. Create a `.env` file

```bash
cat > .env <<'EOF'
ADMIN_EMAIL=admin@aviator-studio.local
ADMIN_PASSWORD=<paste-a-strong-password-here>
ADMIN_NAME=Aviator Admin
COMPANY_SLUG=aviator
COMPANY_NAME=Aviator Studio
EOF
chmod 600 .env
```

The `ADMIN_PASSWORD` is only read on first boot — once the user exists, the seed step is a no-op.

### 5. Run

```bash
docker run -d \
  --name docpilot \
  --restart unless-stopped \
  --env-file .env \
  -p 4179:4179 \
  -v docpilot-data:/app/.docpilot-data \
  docpilot
```

The named volume `docpilot-data` is what persists your SQLite DB, media uploads, and audit log between container restarts and re-deploys.

### 6. Verify

```bash
curl -fsS http://127.0.0.1:4179/api/docpilot/health
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4179/   # → 200 with the SPA
```

Open `http://<ec2-public-ip>:4179/c/aviator` and log in with the email/password from your `.env`.

### 7. TLS (recommended)

Same pattern as StrayMap.ge: put Cloudflare in front of the EC2 IP with **Flexible SSL** (Cloudflare ↔ user is HTTPS, Cloudflare ↔ origin is HTTP on port 80). Then add an HTTP listener on the host:

```bash
docker run -d --name docpilot-http \
  --restart unless-stopped \
  -p 80:4179 \
  --link docpilot \
  alpine sh -c "apk add socat && socat TCP-LISTEN:4179,fork,reuseaddr TCP:docpilot:4179"
```

(Or simpler — change `-p 4179:4179` to `-p 80:4179` on the main container.)

Lock the SG inbound 80/443 to Cloudflare IP ranges (https://www.cloudflare.com/ips/) so the origin is only reachable via CF.

### 8. Re-deploy on push

```bash
ssh -i ~/.ssh/docpilot.pem ec2-user@<ip> "
  cd ~/DocPilot &&
  git fetch origin &&
  git reset --hard origin/main &&
  docker build --network=host -t docpilot . &&
  docker stop docpilot && docker rm docpilot &&
  docker run -d --name docpilot --restart unless-stopped --env-file .env -p 4179:4179 -v docpilot-data:/app/.docpilot-data docpilot
"
```

Identical shape to your StrayMap.ge deploy command.

## What doesn't ship (and why)

- `.docpilot-data/cms-state.json` — gitignored. On a fresh deploy this file doesn't exist; the app uses App.tsx defaults. Once an admin edits a doc through the CMS, the state file is created on the persistent volume and survives restarts.
- `.docpilot-data/docpilot.sqlite` — gitignored. Created on first boot from `server/schema.sql`; the boot-time seed adds the company + admin user.
- Real user passwords — `ADMIN_PASSWORD` env var is the only way to set the initial password. Treat the `.env` file as a secret (chmod 600, never commit).

## Local sanity check

You can prove the Docker image works locally before pushing to EC2:

```bash
docker build -t docpilot:dev .
docker run --rm -p 4180:4179 \
  -e ADMIN_PASSWORD=test1234! \
  docpilot:dev
# in another shell:
curl http://127.0.0.1:4180/api/docpilot/health
# open http://127.0.0.1:4180/c/aviator and log in as admin@aviator-studio.local / test1234!
```
