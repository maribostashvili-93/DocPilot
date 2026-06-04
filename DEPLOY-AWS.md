# DocPilot — AWS EC2 deploy from GitHub (no domain, IP-only)

This playbook deploys DocPilot to a single AWS EC2 instance, built from the GitHub repo on the instance itself (no local Docker build, no image registry). Access is via the EC2 public IPv4 on plain HTTP — no domain, no TLS.

**Target:** `http://<public-ip>/c/aviator` opens the login page and `admin@aviator-studio.local` + your chosen password gets you in.

---

## Phase 0 — Decisions you have to make once

Fill these in before starting; they're referenced throughout.

| Variable | Suggested | Notes |
|---|---|---|
| AWS region | `eu-central-1` (Frankfurt) | Closest to Georgia / lowest latency. `us-east-1` is fine too. |
| Instance name | `docpilot-prod` | Just a tag. |
| Instance type | `t3.small` | 2 vCPU / 2 GB RAM. `t3.micro` works for demo but tight. |
| Storage | 16 GB gp3 | Default 8 GB is too small for npm + image. |
| Admin email | `admin@aviator-studio.local` | Same as local for parity. |
| Admin password | *(set your own; never commit it)* | Treat as a secret. Lives only in `.env` on the host, mode 600. |
| SSH key name | `docpilot-key` | Will be created in Phase 2. |
| Repo URL | `https://github.com/EarendilM83/DocPilot.git` | Public repo, no auth needed for clone. |

---

## Phase 1 — AWS Console: create the EC2 instance (browser steps)

Sign in to https://console.aws.amazon.com. Top-right, set region to your chosen region.

### 1.1 Launch the instance

Navigate to **EC2** → **Instances** → **Launch instances**.

Fill in the form:

| Field | Value |
|---|---|
| **Name** | `docpilot-prod` |
| **Application and OS Images (AMI)** | "Amazon Linux 2023 AMI" (Free tier eligible) |
| **Architecture** | `64-bit (x86)` |
| **Instance type** | `t3.small` |
| **Key pair (login)** → Create new key pair | Name: `docpilot-key`, type: RSA, format: `.pem`. **Click "Create key pair" — download the `.pem` file when prompted. Save it somewhere safe; you can't redownload it.** |
| **Network settings** → Edit | See 1.2 below |
| **Configure storage** | Change root volume from 8 to **16 GiB**, keep type `gp3` |
| **Advanced details** → (leave defaults) | |

### 1.2 Security group — inbound rules

Click **Create security group** (or **Edit** if you want to reuse one). Name it `docpilot-sg`. Add these inbound rules:

| Type | Protocol | Port range | Source | Description |
|---|---|---|---|---|
| SSH | TCP | 22 | **My IP** | dropdown auto-fills your current IP |
| HTTP | TCP | 80 | Anywhere-IPv4 (`0.0.0.0/0`) | public web access |
| Custom TCP | TCP | 4179 | Anywhere-IPv4 (`0.0.0.0/0`) | optional direct API access for debugging |

Outbound: leave default (all traffic allowed out).

### 1.3 Launch

Click **Launch instance**. Wait until **Instance state** shows **Running** (~30 s) and **Status checks** shows **2/2 checks passed** (~2 min).

### 1.4 Note the public IP

In the instance detail panel, copy the **Public IPv4 address**. Call this `<EC2_IP>` for the rest of the playbook.

Optional but recommended: **allocate an Elastic IP** (EC2 → Network & Security → Elastic IPs → Allocate → Associate with your instance) so the IP doesn't change if you stop/start the instance.

---

## Phase 2 — Prepare your local terminal

Open a terminal on your Mac. Move the key into place and lock its permissions (SSH refuses keys that are world-readable).

```bash
mkdir -p ~/.ssh
mv ~/Downloads/docpilot-key.pem ~/.ssh/docpilot-key.pem
chmod 400 ~/.ssh/docpilot-key.pem
```

Test the connection (replace `<EC2_IP>`):

```bash
ssh -i ~/.ssh/docpilot-key.pem ec2-user@<EC2_IP> "uname -a && cat /etc/os-release | head -3"
```

You should see `Linux ip-...amazonaws.com ... x86_64` and the Amazon Linux release info. If you get "permission denied", re-check the chmod and the username (`ec2-user` on Amazon Linux 2023).

---

## Phase 3 — One-shot setup on the EC2 instance

SSH in and run the bootstrap. Copy-paste the **whole block** into the remote shell.

```bash
ssh -i ~/.ssh/docpilot-key.pem ec2-user@<EC2_IP>
```

Then on the remote shell:

```bash
# 3.1 — Install git + docker.
sudo dnf install -y git docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# 3.2 — Re-login so the docker group takes effect.
exit
```

You're now back on your Mac. SSH back in (the docker group only applies on a fresh session):

```bash
ssh -i ~/.ssh/docpilot-key.pem ec2-user@<EC2_IP>
```

On the remote shell again:

```bash
# 3.3 — Clone the repo.
cd ~
git clone https://github.com/EarendilM83/DocPilot.git
cd DocPilot

# 3.4 — Create the .env file with your admin credentials.
#       This is the ONLY place ADMIN_PASSWORD lives. Never commit it.
# IMPORTANT: pick a strong password yourself and paste it here.
# Don't commit the .env file. After first login, rotate the password
# via the user-menu in the DocPilot UI.
cat > .env <<'EOF'
ADMIN_EMAIL=admin@aviator-studio.local
ADMIN_PASSWORD=<paste-a-strong-password-here>
ADMIN_NAME=Aviator Admin
COMPANY_SLUG=aviator
COMPANY_NAME=Aviator Studio
EOF
chmod 600 .env

# 3.5 — Build the Docker image. --network=host avoids Alpine/Debian TLS hiccups during npm ci.
docker build --network=host -t docpilot .

# 3.6 — Run the container. Bind port 80 on the host to 4179 in the container.
#       Named volume "docpilot-data" persists SQLite + media across restarts/rebuilds.
docker run -d \
  --name docpilot \
  --restart unless-stopped \
  --env-file .env \
  -p 80:4179 \
  -v docpilot-data:/app/.docpilot-data \
  docpilot

# 3.7 — Confirm.
docker ps --filter name=docpilot
docker logs docpilot --tail 30
curl -fsS http://127.0.0.1/api/docpilot/health
```

The `docker logs` output should include:
```
DocPilot persistence API listening on http://0.0.0.0:4179
Dist dir:   /app/dist
[seed] Created company "Aviator Studio" (aviator) → co_...
[seed] Created admin user "admin@aviator-studio.local" → usr_..., role=company-admin
```

The `curl` should return `{"ok":true,...}`.

---

## Phase 4 — Open it in your browser

From your Mac:

```
http://<EC2_IP>/c/aviator
```

Log in with:
- Email: `admin@aviator-studio.local`
- Password: `<your-admin-password-from-.env>`

You should land on the Aviator client area with the Recently-updated card, the Account-manager card (empty until AMs are assigned), and the staging link. Click into:

- `/docs/minescape-complete-guide` — Minescape doc, tabs interactive, no markers
- `/docs/aviator-bo` — 7-section back-office manual
- `/docs/doc-manual` — Aviator Game User Manual

If any page is a white screen, run `docker logs docpilot --tail 50` and report the error.

---

## Phase 5 — Re-deploy when you push new code

When you push to `main` on GitHub, redeploy with one SSH:

```bash
ssh -i ~/.ssh/docpilot-key.pem ec2-user@<EC2_IP> "
  set -e
  cd ~/DocPilot
  git fetch origin
  git reset --hard origin/main
  docker build --network=host -t docpilot .
  docker stop docpilot || true
  docker rm docpilot || true
  docker run -d --name docpilot --restart unless-stopped --env-file .env -p 80:4179 -v docpilot-data:/app/.docpilot-data docpilot
  sleep 3
  curl -fsS http://127.0.0.1/api/docpilot/health
"
```

The named volume `docpilot-data` is **not** touched by the rebuild — the admin user, sessions, audit log, and any CMS edits made through the UI all survive.

---

## Phase 6 — Operations cheatsheet

| Task | Command (run after `ssh -i ~/.ssh/docpilot-key.pem ec2-user@<EC2_IP>`) |
|---|---|
| Tail logs | `docker logs -f docpilot` |
| Restart | `docker restart docpilot` |
| Shell into container | `docker exec -it docpilot sh` |
| Inspect SQLite | `docker exec -it docpilot sh -c 'apt-get install -y sqlite3 && sqlite3 /app/.docpilot-data/docpilot.sqlite "SELECT slug FROM documents;"'` |
| Rotate admin password | Log in as admin → user menu → change password. Don't edit `.env` — that's first-boot only. |
| Wipe all data | `docker stop docpilot && docker rm docpilot && docker volume rm docpilot-data` then re-run Phase 3.6. **Destroys all CMS edits, users, sessions.** |
| Stop the instance (save costs) | AWS Console → EC2 → Instance state → Stop. **Public IP changes on next start unless you allocated an Elastic IP.** |

---

## Phase 7 — Troubleshooting

**Browser shows "this site can't be reached" on `http://<EC2_IP>/`**
- Check the security group has inbound port 80 from `0.0.0.0/0` (Phase 1.2).
- Check the container is listening on host 80: `sudo ss -tlnp | grep :80`. You should see Docker.
- `curl http://127.0.0.1/` from inside the EC2 — if that works but external doesn't, it's the security group.

**Login fails with "Invalid email or password"**
- `docker logs docpilot --tail 30` and look for `[seed]` lines. If you see "skipping admin user creation" → `ADMIN_PASSWORD` wasn't set in `.env`. Stop the container, fix `.env`, **wipe the volume** (`docker volume rm docpilot-data`), and rebuild. The seed only creates the admin on a clean DB.
- Alternative without wiping: `docker exec -it docpilot node -e 'import("./server/auth.mjs").then(async({updatePassword,findUserByEmail})=>{const u=findUserByEmail("co_...","admin@aviator-studio.local");await updatePassword(u.id,"NewPassword!1");console.log("ok")})'` — replace `co_...` with the company ID from the seed log.

**`docker build` fails with TLS / certificate errors during `npm ci`**
- Always include `--network=host` in the build command (Phase 3.5). Without it, Docker's default bridge network has DNS/TLS issues on some AMIs.

**"Public IPv4 address" is blank after launch**
- Edit the instance: VPC subnet must have **auto-assign public IPv4** enabled, OR allocate + associate an Elastic IP.

**Need to reset everything**
- `docker stop docpilot && docker rm docpilot && docker volume rm docpilot-data && docker rmi docpilot` then start from Phase 3.5.

---

## Security notes (read before going public)

This deployment runs DocPilot on plain HTTP. Anyone with the IP can hit the login page; the admin password is the only barrier. For a real-world deployment:

1. **Put Cloudflare in front** (needs a domain — even a free one like `*.workers.dev` won't help here since you need to point DNS at the EC2 IP). With a domain you get free TLS via Cloudflare Flexible SSL.
2. **Lock SG inbound 80 to Cloudflare IP ranges** so the origin isn't reachable directly.
3. **Rotate the admin password** through the UI as soon as the deployment is up — don't leave the local password in production.
4. **Restrict SSH** to your IP only (already done in Phase 1.2).

Without a domain, the only practical TLS option is a self-signed cert + browser warning, which is fine for demos but not for sharing externally.
