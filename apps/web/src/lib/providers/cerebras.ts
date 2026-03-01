/**
 * Cerebras Inference — world's fastest LLM inference (1600+ tokens/sec)
 * OpenAI-compatible API. Models: llama-3.3-70b, llama-3.1-8b
 * Free tier: 60 req/min, 1M tokens/day
 * Get key: https://cloud.cerebras.ai/
 * Env: CEREBRAS_API_KEY
 */

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';

export interface CerebrasMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CerebrasOptions {
  model?: string;       // default: 'llama-3.3-70b'
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  // legacy alias kept for internal compatibility
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Call Cerebras chat completions.
 * @param messages  - Array of chat messages (system/user/assistant)
 * @param options   - Optional model config
 * @param apiKey    - Optional API key override (falls back to CEREBRAS_API_KEY env var)
 * @returns         - Text content of the first choice
 */
export async function cerebrasChat(
  messages: CerebrasMessage[],
  options?: CerebrasOptions,
  apiKey?: string,
): Promise<string> {
  const key = apiKey ?? process.env.CEREBRAS_API_KEY ?? '';
  if (!key) {
    const err = new Error('Cerebras requires CEREBRAS_API_KEY. Get free key at https://cloud.cerebras.ai/');
    (err as NodeJS.ErrnoException & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  const {
    model       = 'llama-3.3-70b',
    temperature = 0.7,
    max_tokens,
    maxTokens   = 2048,
    timeoutMs   = 15_000,
  } = options ?? {};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens:  max_tokens ?? maxTokens,
        temperature,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`Cerebras API error ${res.status}: ${body}`);
      (err as NodeJS.ErrnoException & { statusCode?: number; skipProvider?: boolean }).statusCode = res.status;
      if (res.status === 402 || res.status === 429) {
        (err as NodeJS.ErrnoException & { skipProvider?: boolean }).skipProvider = true;
      }
      throw err;
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Cerebras returned empty response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
