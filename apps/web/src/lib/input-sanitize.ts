// Strips characters that could cause prompt injection or API issues
export function sanitizePrompt(prompt: string, maxLength = 1000): string {
  return prompt
    .trim()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[<>{}]/g, '')  // strip remaining template chars
    .slice(0, maxLength);
}

export function validatePrompt(prompt: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof prompt !== 'string') return { ok: false, error: 'Prompt must be a string' };
  if (!prompt.trim()) return { ok: false, error: 'Prompt cannot be empty' };
  if (prompt.length > 1000) return { ok: false, error: 'Prompt too long (max 1000 characters)' };
  return { ok: true, value: sanitizePrompt(prompt) };
}
