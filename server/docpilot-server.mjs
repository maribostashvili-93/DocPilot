import { createServer } from 'node:http';
import { mkdirSync, readFileSync, appendFileSync, writeFileSync, existsSync, createReadStream, createWriteStream, unlinkSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Busboy from 'busboy';
import { handleApiV2 } from './api-v2.mjs';
import { seedOnBoot } from './seed-on-boot.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = process.env.DOCPILOT_DATA_DIR || join(ROOT, '.docpilot-data');
const STATE_FILE = process.env.DOCPILOT_STATE_FILE || join(DATA_DIR, 'cms-state.json');
const MUTATION_LOG = process.env.DOCPILOT_MUTATION_LOG || join(DATA_DIR, 'mutations.jsonl');
const MEDIA_DIR = process.env.DOCPILOT_MEDIA_DIR || join(DATA_DIR, 'media');
const PORT = Number.parseInt(process.env.DOCPILOT_PORT || '4179', 10);
const HOST = process.env.DOCPILOT_HOST || '127.0.0.1';

const KEY_RE = /^[a-zA-Z0-9:_-]{1,120}$/;
const MEDIA_FILE_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,179}$/;
const MAX_MEDIA_FILE_BYTES = 250 * 1024 * 1024;
const WRITE_PERMISSIONS = {
  admin: new Set(['documents:write', 'sections:write', 'media:write', 'translations:write', 'releases:write', 'users:manage', 'settings:write', 'integrations:write']),
  'company-admin': new Set(['documents:write', 'sections:write', 'media:write', 'settings:write']),
  editor: new Set(['documents:write', 'sections:write', 'media:write', 'translations:write', 'releases:write', 'integrations:write']),
  reviewer: new Set(['translations:write']),
  viewer: new Set([]),
  partner: new Set(['documents:write', 'translations:write']),
  tam: new Set(['documents:write', 'sections:write', 'media:write', 'translations:write', 'releases:write', 'integrations:write']),
  developer: new Set(['documents:write', 'sections:write', 'media:write', 'settings:write', 'integrations:write']),
};

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function ensureMediaDir() {
  ensureDataDir();
  mkdirSync(MEDIA_DIR, { recursive: true });
}

function emptyState() {
  return { version: 1, keys: {} };
}

function readState() {
  ensureDataDir();
  if (!existsSync(STATE_FILE)) return emptyState();
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || !parsed.keys || typeof parsed.keys !== 'object') return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeState(state) {
  ensureDataDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function nextRevision(key) {
  return `${key}:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
}

function writeMutation(entry) {
  ensureDataDir();
  appendFileSync(MUTATION_LOG, `${JSON.stringify(entry)}\n`);
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-docpilot-user,x-docpilot-role',
  });
  res.end(payload);
}

function guessMimeType(name) {
  const ext = extname(name || '').toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.csv') return 'text/csv; charset=utf-8';
  if (ext === '.xls') return 'application/vnd.ms-excel';
  if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/octet-stream';
}

function sendMediaFile(res, filename) {
  if (!MEDIA_FILE_RE.test(filename)) {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ error: 'Invalid file name.' }));
    return;
  }
  const path = join(MEDIA_DIR, filename);
  if (!existsSync(path)) {
    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ error: 'File not found.' }));
    return;
  }
  const mimeType = guessMimeType(filename);
  const isSvg = mimeType === 'image/svg+xml';
  const headers = {
    'content-type': mimeType,
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'x-content-type-options': 'nosniff',
  };
  if (isSvg) headers['content-disposition'] = `attachment; filename="${filename}"`;
  res.writeHead(200, headers);
  const stream = createReadStream(path);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ error: 'Failed to read file.' }));
  });
  stream.pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10_000_000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function stateKeyFromPath(pathname) {
  const prefix = '/api/docpilot/state/';
  if (!pathname.startsWith(prefix)) return null;
  const key = decodeURIComponent(pathname.slice(prefix.length));
  return KEY_RE.test(key) ? key : null;
}

function permissionForKey(key) {
  if (key.includes('users')) return 'users:manage';
  if (key.includes('media')) return 'media:write';
  if (key.includes('translation')) return 'translations:write';
  if (key.includes('release')) return 'releases:write';
  if (key.includes('integration') || key.includes('api_keys') || key.includes('webhook') || key.includes('external_references')) return 'integrations:write';
  if (key.includes('section')) return 'sections:write';
  if (key.includes('doc')) return 'documents:write';
  if (key.includes('selected_product') || key.includes('marker_color_presets') || key.includes('theme_preset')) return 'settings:write';
  return 'documents:write';
}

function canWrite(req, key) {
  const role = String(req.headers['x-docpilot-role'] || 'viewer').toLowerCase();
  const permission = permissionForKey(key);
  return Boolean(WRITE_PERMISSIONS[role]?.has(permission));
}

function sanitizeExtension(name) {
  const match = String(name || '').match(/\.([a-zA-Z0-9]{1,12})$/);
  if (!match) return '';
  return `.${match[1].toLowerCase()}`;
}

async function handleMediaUpload(req, res) {
  if (!canWrite(req, 'media_upload')) {
    return send(res, 403, { error: 'Permission denied.', permission: 'media:write' });
  }
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('multipart/form-data')) {
    return send(res, 400, { error: 'Expected multipart/form-data.' });
  }

  ensureMediaDir();

  const uploads = [];
  const writePromises = [];
  let fileCount = 0;
  let responded = false;

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 25,
      fileSize: MAX_MEDIA_FILE_BYTES,
    },
  });

  busboy.on('file', (fieldname, file, info, encodingMaybe, mimeMaybe) => {
    fileCount += 1;
    const meta = typeof info === 'object' && info ? info : { filename: info, mimeType: mimeMaybe, encoding: encodingMaybe };
    const originalName = String(meta.filename || 'upload');
    const mimeType = String(meta.mimeType || 'application/octet-stream');
    const id = `media-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const storedName = `${id}${sanitizeExtension(originalName)}`;
    const destPath = join(MEDIA_DIR, storedName);

    const record = {
      id,
      fileName: storedName,
      originalName,
      mimeType,
      sizeBytes: 0,
      src: `/api/docpilot/media/files/${encodeURIComponent(storedName)}`,
      createdAt: new Date().toISOString(),
    };
    uploads.push(record);

    const stream = createWriteStream(destPath);
    file.on('data', (chunk) => {
      record.sizeBytes += chunk.length;
    });

    writePromises.push(new Promise((resolve, reject) => {
      const cleanup = (error) => {
        try {
          stream.destroy();
        } catch {
          // ignore
        }
        try {
          unlinkSync(destPath);
        } catch {
          // ignore
        }
        reject(error);
      };

      file.on('limit', () => cleanup(new Error(`File too large (limit ${MAX_MEDIA_FILE_BYTES} bytes).`)));
      file.on('error', cleanup);
      stream.on('error', cleanup);
      stream.on('finish', resolve);
      file.pipe(stream);
    }));

  });

  busboy.on('error', (error) => {
    if (responded) return;
    responded = true;
    send(res, 400, { error: error.message || 'Upload failed.' });
  });

  busboy.on('finish', async () => {
    if (responded) return;
    if (!fileCount) return send(res, 400, { error: 'No file provided.' });
    try {
      await Promise.all(writePromises);
      return send(res, 200, { ok: true, files: uploads });
    } catch (error) {
      return send(res, 400, { error: error.message || 'Upload failed.' });
    }
  });

  req.pipe(busboy);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // v2 multi-tenant API. Handles its own auth/RBAC/OPTIONS and returns null when
  // a /api/v2/* path is unhandled, so legacy v1 routing below is never affected.
  if (url.pathname.startsWith('/api/v2/')) {
    try {
      const result = await handleApiV2(req, res, url);
      if (result !== null) return;
    } catch (error) {
      return send(res, 500, { error: error.message || 'v2 handler failed.' });
    }
  }

  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  if (req.method === 'GET' && url.pathname === '/api/docpilot/health') {
    const state = readState();
    return send(res, 200, {
      ok: true,
      storage: STATE_FILE,
      mutation_log: MUTATION_LOG,
      key_count: Object.keys(state.keys).length,
    });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/docpilot/media/files/')) {
    const filename = decodeURIComponent(url.pathname.slice('/api/docpilot/media/files/'.length));
    return sendMediaFile(res, filename);
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/docpilot/media/files/')) {
    if (!canWrite(req, 'media_delete')) {
      return send(res, 403, { error: 'Permission denied.', permission: 'media:write' });
    }
    const filename = decodeURIComponent(url.pathname.slice('/api/docpilot/media/files/'.length));
    if (!MEDIA_FILE_RE.test(filename)) return send(res, 400, { error: 'Invalid file name.' });
    ensureMediaDir();
    const path = join(MEDIA_DIR, filename);
    if (!existsSync(path)) return send(res, 404, { error: 'File not found.' });
    try {
      unlinkSync(path);
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { error: error.message || 'Delete failed.' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/docpilot/media/upload') {
    try {
      return await handleMediaUpload(req, res);
    } catch (error) {
      return send(res, 400, { error: error.message || 'Upload failed.' });
    }
  }

  const key = stateKeyFromPath(url.pathname);
  if (key && req.method === 'GET') {
    const state = readState();
    const entry = state.keys[key];
    return send(res, 200, entry ? {
      found: true,
      key,
      value: entry.value,
      revision: entry.revision,
      updated_at: entry.updated_at,
    } : {
      found: false,
      key,
    });
  }

  if (key && req.method === 'PUT') {
    try {
      if (!canWrite(req, key)) {
        return send(res, 403, {
          error: 'Permission denied.',
          permission: permissionForKey(key),
        });
      }

      const body = await readBody(req);
      if (!Object.prototype.hasOwnProperty.call(body, 'value')) {
        return send(res, 400, { error: 'Missing value.' });
      }

      const state = readState();
      const previous = state.keys[key];
      const now = new Date().toISOString();
      const revision = nextRevision(key);
      state.keys[key] = {
        value: body.value,
        revision,
        previous_revision: previous?.revision || null,
        updated_at: now,
      };
      writeState(state);
      writeMutation({
        id: `mut-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        key,
        actor: body.actor || 'prototype-admin',
        operation: body.operation || (previous ? 'update' : 'create'),
        target_entity: body.target_entity || key,
        previous_revision: previous?.revision || null,
        current_revision: revision,
        at: now,
      });
      return send(res, 200, { ok: true, key, revision, previous_revision: previous?.revision || null, updated_at: now });
    } catch (error) {
      return send(res, 400, { error: error.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/docpilot/import-local') {
    try {
      const body = await readBody(req);
      const entries = Array.isArray(body.entries) ? body.entries : [];
      const state = readState();
      const report = { imported: 0, skipped: 0, errors: [] };
      const now = new Date().toISOString();

      for (const item of entries) {
        if (!item || !KEY_RE.test(String(item.key || ''))) {
          report.errors.push({ key: item?.key || null, error: 'Invalid key.' });
          continue;
        }
        if (state.keys[item.key]) {
          report.skipped += 1;
          continue;
        }
        const revision = nextRevision(item.key);
        state.keys[item.key] = { value: item.value, revision, previous_revision: null, updated_at: now };
        writeMutation({
          id: `mut-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          key: item.key,
          actor: body.actor || 'prototype-admin',
          operation: 'import_local_prototype',
          target_entity: item.key,
          previous_revision: null,
          current_revision: revision,
          at: now,
        });
        report.imported += 1;
      }

      writeState(state);
      return send(res, 200, { ok: true, report });
    } catch (error) {
      return send(res, 400, { error: error.message });
    }
  }

  // API miss → JSON 404. Everything else → static file from dist/ (production SPA).
  if (url.pathname.startsWith('/api/')) {
    return send(res, 404, { error: 'Not found.' });
  }
  return serveStatic(req, res, url);
});

const DIST_DIR = process.env.DOCPILOT_DIST_DIR || join(ROOT, 'dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json; charset=utf-8',
};

function serveStatic(req, res, url) {
  if (!existsSync(DIST_DIR)) {
    // Dev mode (no build) — bounce the user to vite on 5173.
    res.writeHead(302, { location: `http://localhost:5173${url.pathname}${url.search}` });
    return res.end();
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, { error: 'Method not allowed.' });
  }
  // Resolve the requested path safely inside DIST_DIR; fall back to index.html for SPA routes.
  const reqPath = decodeURIComponent(url.pathname);
  const candidate = join(DIST_DIR, reqPath);
  const resolved = candidate.startsWith(DIST_DIR) ? candidate : DIST_DIR;
  const filePath = existsSync(resolved) && !resolved.endsWith('/')
    ? resolved
    : join(DIST_DIR, 'index.html');
  try {
    const ext = extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const stream = createReadStream(filePath);
    res.writeHead(200, {
      'content-type': type,
      'cache-control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    stream.pipe(res);
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  } catch {
    res.writeHead(500);
    res.end();
  }
}

server.listen(PORT, HOST, async () => {
  console.log(`DocPilot persistence API listening on http://${HOST}:${PORT}`);
  console.log(`State file: ${STATE_FILE}`);
  console.log(`Dist dir:   ${DIST_DIR}${existsSync(DIST_DIR) ? '' : ' (missing — falling back to vite dev redirect)'}`);
  try {
    await seedOnBoot();
  } catch (err) {
    console.error('[seed] failed:', err.message);
  }
});
