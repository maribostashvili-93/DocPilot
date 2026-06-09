import { db, nowIso } from '../db.mjs';

// Retrieve integration config from kv_store.
// key: `integration_github_<companyId>` → { token, owner, repo }
// key: `integration_jira_<companyId>`  → { baseUrl, email, apiToken, project }
function getConfig(companyId, type) {
  const row = db.prepare(
    'SELECT value FROM kv_store WHERE company_scope = ? AND key = ?',
  ).get(companyId, `integration_${type}_${companyId}`);
  return row ? JSON.parse(row.value) : null;
}

export async function createGitHubIssue({ companyId, title, body, labels = [] }) {
  const cfg = getConfig(companyId, 'github');
  if (!cfg?.token || !cfg?.owner || !cfg?.repo) {
    throw Object.assign(new Error('GitHub integration not configured'), { status: 422 });
  }
  const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/issues`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw Object.assign(new Error(`GitHub API error: ${res.status} ${err.slice(0, 120)}`), { status: 502 });
  }
  return res.json();
}

export async function createJiraIssue({ companyId, summary, description, issueType = 'Bug' }) {
  const cfg = getConfig(companyId, 'jira');
  if (!cfg?.baseUrl || !cfg?.email || !cfg?.apiToken || !cfg?.project) {
    throw Object.assign(new Error('Jira integration not configured'), { status: 422 });
  }
  const auth = Buffer.from(`${cfg.email}:${cfg.apiToken}`).toString('base64');
  const res = await fetch(`${cfg.baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: cfg.project },
        summary,
        description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }] },
        issuetype: { name: issueType },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw Object.assign(new Error(`Jira API error: ${res.status} ${err.slice(0, 120)}`), { status: 502 });
  }
  return res.json();
}

export async function createIssueFromBlockingComment({ companyId, comment, section, document, platform = 'github' }) {
  const title = `[DocPilot] Blocking comment on "${section?.title ?? 'section'}" in "${document?.title ?? 'document'}"`;
  const body = `**Comment:** ${comment.body}\n\n**Section:** ${section?.title ?? comment.section_id}\n**Document:** ${document?.title ?? ''}\n\n*Reported via DocPilot at ${nowIso()}*`;

  if (platform === 'jira') {
    return createJiraIssue({ companyId, summary: title, description: body });
  }
  return createGitHubIssue({ companyId, title, body, labels: ['docs', 'blocking'] });
}
