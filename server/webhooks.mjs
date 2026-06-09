import crypto from 'node:crypto';
import { makeId, nowIso, db } from './db.mjs';

function recordDelivery(endpointId, event, payload, statusCode, responseBody, durationMs) {
  db.prepare(
    `INSERT INTO webhook_deliveries(id, endpoint_id, event, payload, status_code, response_body, duration_ms, delivered_at)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(makeId('wdel'), endpointId, event, payload, statusCode, responseBody ?? null, durationMs, nowIso());
}

export async function deliverWebhooks(companyId, event, payload) {
  const endpoints = db
    .prepare('SELECT * FROM webhook_endpoints WHERE company_id = ? AND active = 1')
    .all(companyId);

  for (const ep of endpoints) {
    const eventsFilter = JSON.parse(ep.events);
    if (!eventsFilter.includes('*') && !eventsFilter.includes(event)) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: nowIso() });
    const sig = crypto.createHmac('sha256', ep.secret).update(body).digest('hex');
    const start = Date.now();

    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-DocPilot-Signature': sig },
        body,
        signal: AbortSignal.timeout(5000),
      });
      const text = await res.text().catch(() => '');
      recordDelivery(ep.id, event, body, res.status, text.slice(0, 4096), Date.now() - start);
      db.prepare('UPDATE webhook_endpoints SET last_delivered_at = ? WHERE id = ?').run(nowIso(), ep.id);
    } catch (err) {
      recordDelivery(ep.id, event, body, 0, err.message, Date.now() - start);
    }
  }
}
