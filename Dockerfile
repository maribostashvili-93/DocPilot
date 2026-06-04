# Multi-stage build for DocPilot.
# Stage 1: build the Vite frontend.
# Stage 2: a slim runtime with the Node server + native modules (better-sqlite3).

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# better-sqlite3 ships a prebuilt for linux/amd64 but its postinstall sometimes
# falls back to source build (especially under arm emulation or odd npm versions),
# which needs python3 + a C++ toolchain. Install them up front so npm ci is
# guaranteed to complete on a clean slate.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Install deps first so the layer caches when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Strip dev deps for the runtime image (saves ~150MB).
RUN npm prune --omit=dev


FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Tools that better-sqlite3 needs at startup + curl for healthchecks.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Copy production deps and built artifacts.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# server/seed-state.json was already copied as part of server/, but make the
# intent explicit so future readers don't strip it from the COPY list.

# Persistent data goes here. Mount a volume at /app/.docpilot-data so SQLite + media survive.
RUN mkdir -p /app/.docpilot-data
VOLUME ["/app/.docpilot-data"]

ENV NODE_ENV=production
ENV DOCPILOT_HOST=0.0.0.0
ENV DOCPILOT_PORT=4179
ENV DOCPILOT_DATA_DIR=/app/.docpilot-data
EXPOSE 4179

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4179/api/docpilot/health || exit 1

CMD ["node", "server/docpilot-server.mjs"]
