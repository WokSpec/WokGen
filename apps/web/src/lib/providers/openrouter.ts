/**
 * OpenRouter — routes LLM calls to free-tier models.
 * Free models have the ":free" suffix and require no billing.
 * Get key at https://openrouter.ai/keys
 * Env: OPENROUTER_API_KEY
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REFERER = 'https://wokgen.wokspec.org';
const APP_TITLE = 'WokGen';

export const OPENROUTER_FREE_MODELS = {
  llama8b:   'meta-llama/llama-3.1-8b-instruct:free',
  mistral7b: 'mistralai/mistral-7b-instruct:free',
  gemma9b:   'google/gemma-3-9b-it:free',
  qwen7b:    'qwen/qwen-2-7b-instruct:free',
} as const;

export type OpenRouterModelKey = keyof typeof OPENROUTER_FREE_MODELS;

export async function openrouterChat(
  messages: Array<{ role: string; content: string }>,
  model?: OpenRouterModelKey | string,
  apiKey?: string,
): Promise<string> {
  const key = apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
  if (!key) throw new Error('OpenRouter requires OPENROUTER_API_KEY. Get free key at https://openrouter.ai/keys');

  // Resolve model: if it's a known key, expand it; otherwise use as-is
  const resolvedModel: string =
    model && model in OPENROUTER_FREE_MODELS
      ? OPENROUTER_FREE_MODELS[model as OpenRouterModelKey]
      : (model ?? OPENROUTER_FREE_MODELS.llama8b);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization:    `Bearer ${key}`,
        'Content-Type':   'application/json',
        'HTTP-Referer':   REFERER,
        'X-Title':        APP_TITLE,
      },
      body: JSON.stringify({
        model:    resolvedModel,
        messages,
        stream:   false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const e = new Error(`OpenRouter error ${res.status}: ${body}`);
      (e as NodeJS.ErrnoException & { skipProvider?: boolean }).skipProvider =
        res.status === 429 || res.status >= 500;
      throw e;
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('OpenRouter returned empty response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
