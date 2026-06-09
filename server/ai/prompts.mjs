export function summarizeSourcePrompt(source) {
  return {
    system: 'You are a technical documentation assistant. Write concise, accurate documentation summaries.',
    user: `Summarize the following documentation source for use in a Getting Started guide.\n\nSource name: ${source.name}\nURL: ${source.url ?? 'N/A'}\nType: ${source.type}\n\nWrite a 2-3 paragraph summary covering: what the product does, who it is for, and the key concepts a new user needs to know. Be factual and concise.`,
  };
}

export function outlineDocumentPrompt({ productName, topic, audience = 'end users' }) {
  return {
    system: 'You are a technical documentation architect. Create clear, structured document outlines.',
    user: `Create a documentation outline for the following:\n\nProduct: ${productName}\nTopic: ${topic}\nAudience: ${audience}\n\nReturn a numbered list of section titles with a one-line description for each section. Aim for 5-8 sections.`,
  };
}

export function translateSectionPrompt({ body, fromLocale, toLocale }) {
  return {
    system: `You are a professional technical translator. Translate the content from ${fromLocale} to ${toLocale} accurately, preserving all HTML tags and formatting.`,
    user: `Translate the following HTML section content from ${fromLocale} to ${toLocale}. Preserve all HTML tags exactly. Only output the translated HTML, nothing else.\n\n${body}`,
  };
}

export function rewriteSectionPrompt({ body, instruction }) {
  return {
    system: 'You are a technical writing editor. Improve documentation clarity without changing meaning or structure.',
    user: `${instruction || 'Improve the clarity and readability of the following documentation section. Fix grammar, improve sentence structure, and make it more concise.'}\n\nOriginal content:\n${body}\n\nReturn only the improved content, preserving HTML tags.`,
  };
}

export function suggestReleaseNotesPrompt({ version, changedSections }) {
  const sectionList = changedSections.map((s) => `- ${s.title}: ${s.summary ?? ''}`).join('\n');
  return {
    system: 'You are a technical writer specialising in release notes. Write clear, user-facing release notes.',
    user: `Generate release notes for version ${version}.\n\nChanged sections:\n${sectionList}\n\nWrite 3-5 bullet points describing what changed from a user perspective. Use present tense. Keep each point under 80 characters.`,
  };
}
