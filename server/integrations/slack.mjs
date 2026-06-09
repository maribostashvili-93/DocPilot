import { nowIso, db } from '../db.mjs';
import { deliverWebhooks } from '../webhooks.mjs';

export async function notifyReleasePublished({ companyId, release, actor }) {
  await deliverWebhooks(companyId, 'release.published', {
    releaseId: release.id,
    label: release.label ?? release.version,
    version: release.version,
    actorName: actor?.name ?? actor?.email ?? 'system',
    publishedAt: nowIso(),
  });
}

export async function notifyReleaseCreated({ companyId, release, actor }) {
  await deliverWebhooks(companyId, 'release.created', {
    releaseId: release.id,
    version: release.version,
    actorName: actor?.name ?? actor?.email ?? 'system',
    createdAt: nowIso(),
  });
}

export async function notifyReleaseApproved({ companyId, release, actor }) {
  await deliverWebhooks(companyId, 'release.approved', {
    releaseId: release.id,
    version: release.version,
    actorName: actor?.name ?? actor?.email ?? 'system',
    approvedAt: nowIso(),
  });
}

export async function notifyReleaseRolledBack({ companyId, release, actor }) {
  await deliverWebhooks(companyId, 'release.rolled_back', {
    releaseId: release.id,
    version: release.version,
    actorName: actor?.name ?? actor?.email ?? 'system',
    rolledBackAt: nowIso(),
  });
}

export async function notifyDocumentStatusChanged({ companyId, document, fromStatus, toStatus, actor }) {
  await deliverWebhooks(companyId, 'document.status_changed', {
    documentId: document.id,
    title: document.title,
    fromStatus,
    toStatus,
    actorName: actor?.name ?? actor?.email ?? 'system',
    changedAt: nowIso(),
  });
}

export async function notifyBlockingComment({ companyId, comment, section, actor }) {
  await deliverWebhooks(companyId, 'section.comment_blocking', {
    commentId: comment.id,
    sectionId: section.id,
    sectionTitle: section.title,
    authorName: actor?.name ?? actor?.email ?? 'anonymous',
    createdAt: nowIso(),
  });
}

export async function notifyLocaleBelowThreshold({ companyId, locale, documentId, completionPct }) {
  await deliverWebhooks(companyId, 'translation.locale_below_threshold', {
    locale, documentId, completionPct, checkedAt: nowIso(),
  });
}

// Retrieve a Slack-specific incoming webhook URL from the company's kv_store.
// key: `integration_slack_<companyId>` — value: `{ webhookUrl: string }`.
export function getSlackConfig(companyId) {
  const row = db.prepare(
    'SELECT value FROM kv_store WHERE company_scope = ? AND key = ?',
  ).get(companyId, `integration_slack_${companyId}`);
  return row ? JSON.parse(row.value) : null;
}

export async function sendSlackMessage(webhookUrl, message) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
    signal: AbortSignal.timeout(5000),
  });
  return res.ok;
}
