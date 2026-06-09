// AI provider configuration for DocPilot.
// Phase 8B: Claude API (Anthropic) is the primary provider.
// API key is loaded from environment; falls back to a stub when not configured.

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CLAUDE_MODEL = process.env.DOCPILOT_AI_MODEL ?? 'claude-haiku-4-5-20251001';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export function isConfigured() {
  return !!CLAUDE_API_KEY;
}

export function defaultModel() {
  return CLAUDE_MODEL;
}

export async function complete({ model, systemPrompt, userPrompt, maxTokens = 1024 }) {
  if (!CLAUDE_API_KEY) {
    // Stub response when API key is not configured — returns placeholder text
    // so the task flow works end-to-end without a real key.
    return `[AI output not available — ANTHROPIC_API_KEY not set]\n\n${userPrompt.slice(0, 120)}…`;
  }

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model ?? CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw Object.assign(new Error(`Claude API error ${res.status}: ${err.slice(0, 200)}`), { status: 502 });
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}
