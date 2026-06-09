import { makeId, nowIso, db } from '../db.mjs';
import * as providers from './providers.mjs';
import * as prompts from './prompts.mjs';

function createTask({ companyId, taskType, sourceEntityType, sourceEntityId, model, promptExcerpt, createdBy }) {
  const id = makeId('ait');
  const now = nowIso();
  db.prepare(
    `INSERT INTO ai_tasks(id, company_id, task_type, source_entity_type, source_entity_id,
       model, prompt_excerpt, status, created_by, created_at, updated_at)
     VALUES(?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
  ).run(id, companyId, taskType, sourceEntityType ?? null, sourceEntityId ?? null,
    model, promptExcerpt, createdBy ?? null, now, now);
  return id;
}

function completeTask(id, outputRef) {
  db.prepare(
    `UPDATE ai_tasks SET status = 'completed', output_ref = ?, updated_at = ? WHERE id = ?`,
  ).run(outputRef ?? null, nowIso(), id);
}

function failTask(id, error) {
  db.prepare(
    `UPDATE ai_tasks SET status = 'failed', prompt_excerpt = prompt_excerpt || '\n[ERROR: ' || ? || ']', updated_at = ? WHERE id = ?`,
  ).run(error.slice(0, 200), nowIso(), id);
}

export async function summarizeSource({ companyId, sourceId, source, createdBy }) {
  const model = providers.defaultModel();
  const { system, user } = prompts.summarizeSourcePrompt(source);
  const taskId = createTask({ companyId, taskType: 'summarize_source', sourceEntityType: 'research_source',
    sourceEntityId: sourceId, model, promptExcerpt: user.slice(0, 200), createdBy });

  try {
    const text = await providers.complete({ model, systemPrompt: system, userPrompt: user, maxTokens: 512 });
    completeTask(taskId, text.slice(0, 2000));
    return { taskId, summary: text };
  } catch (e) {
    failTask(taskId, e.message);
    throw e;
  }
}

export async function outlineDocument({ companyId, productName, topic, audience, createdBy }) {
  const model = providers.defaultModel();
  const { system, user } = prompts.outlineDocumentPrompt({ productName, topic, audience });
  const taskId = createTask({ companyId, taskType: 'outline_document',
    model, promptExcerpt: user.slice(0, 200), createdBy });

  try {
    const text = await providers.complete({ model, systemPrompt: system, userPrompt: user, maxTokens: 512 });
    completeTask(taskId, text.slice(0, 4000));
    return { taskId, outline: text };
  } catch (e) {
    failTask(taskId, e.message);
    throw e;
  }
}

export async function translateSection({ companyId, sectionId, body, fromLocale, toLocale, createdBy }) {
  const model = providers.defaultModel();
  const { system, user } = prompts.translateSectionPrompt({ body, fromLocale, toLocale });
  const taskId = createTask({ companyId, taskType: 'translate_section', sourceEntityType: 'section',
    sourceEntityId: sectionId, model, promptExcerpt: user.slice(0, 200), createdBy });

  try {
    const text = await providers.complete({ model, systemPrompt: system, userPrompt: user, maxTokens: 2048 });
    completeTask(taskId, text.slice(0, 20000));
    return { taskId, translatedBody: text, state: 'dirty' };
  } catch (e) {
    failTask(taskId, e.message);
    throw e;
  }
}

export async function rewriteSection({ companyId, sectionId, body, instruction, createdBy }) {
  const model = providers.defaultModel();
  const { system, user } = prompts.rewriteSectionPrompt({ body, instruction });
  const taskId = createTask({ companyId, taskType: 'rewrite_section', sourceEntityType: 'section',
    sourceEntityId: sectionId, model, promptExcerpt: user.slice(0, 200), createdBy });

  try {
    const text = await providers.complete({ model, systemPrompt: system, userPrompt: user, maxTokens: 2048 });
    completeTask(taskId, text.slice(0, 20000));
    return { taskId, rewrittenBody: text };
  } catch (e) {
    failTask(taskId, e.message);
    throw e;
  }
}

export async function suggestReleaseNotes({ companyId, releaseId, version, changedSections, createdBy }) {
  const model = providers.defaultModel();
  const { system, user } = prompts.suggestReleaseNotesPrompt({ version, changedSections });
  const taskId = createTask({ companyId, taskType: 'release_notes', sourceEntityType: 'release',
    sourceEntityId: releaseId, model, promptExcerpt: user.slice(0, 200), createdBy });

  try {
    const text = await providers.complete({ model, systemPrompt: system, userPrompt: user, maxTokens: 512 });
    completeTask(taskId, text.slice(0, 2000));
    return { taskId, notes: text };
  } catch (e) {
    failTask(taskId, e.message);
    throw e;
  }
}

export function listTasks(companyId, { limit = 20, taskType } = {}) {
  let query = 'SELECT * FROM ai_tasks WHERE company_id = ?';
  const args = [companyId];
  if (taskType) { query += ' AND task_type = ?'; args.push(taskType); }
  query += ' ORDER BY created_at DESC LIMIT ?';
  args.push(limit);
  return db.prepare(query).all(...args);
}
