/**
 * Unified LLM routing helper.
 *
 * Provider priority:
 *   1. Groq  (GROQ_API_KEY)    — fast inference, primary for all chat/text
 *   2. Together (TOGETHER_API_KEY) — fallback
 *
 * Usage:
 *   const cfg = resolveLLMProvider();        // auto-pick
 *   const cfg = resolveLLMProvider('groq');  // prefer specific provider
 *   const text = await callLLMChat(cfg, messages, { maxTokens: 512 });
 */

export const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';
export const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions';

export const GROQ_DEFAULT_MODEL    = 'llama-3.3-70b-versatile';
export const TOGETHER_DEFAULT_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

export type LLMProvider = 'groq' | 'together';

export interface LLMConfig {
  url:      string;
  apiKey:   string;
  model:    string;
  provider: LLMProvider;
}

export interface ChatMessage {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

export interface CallOptions {
  maxTokens?:   number;
  temperature?: number;
  stream?:      boolean;
}

/**
 * Resolve the best available LLM provider config.
 * Throws a 503-ready error if no API key is configured.
 */
export function resolveLLMProvider(prefer?: LLMProvider): LLMConfig {
  const groqKey    = process.env.GROQ_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;

  if (prefer === 'groq' && groqKey) {
    return { url: GROQ_URL, apiKey: groqKey, model: GROQ_DEFAULT_MODEL, provider: 'groq' };
  }
  if (prefer === 'together' && togetherKey) {
    return { url: TOGETHER_URL, apiKey: togetherKey, model: TOGETHER_DEFAULT_MODEL, provider: 'together' };
  }

  // Auto priority: Groq first
  if (groqKey) {
    return { url: GROQ_URL, apiKey: groqKey, model: GROQ_DEFAULT_MODEL, provider: 'groq' };
  }
  if (togetherKey) {
    return { url: TOGETHER_URL, apiKey: togetherKey, model: TOGETHER_DEFAULT_MODEL, provider: 'together' };
  }

  throw new Error('No LLM provider configured. Set GROQ_API_KEY or TOGETHER_API_KEY.');
}

/**
 * Override the model on an existing config.
 */
export function withModel(cfg: LLMConfig, model: string): LLMConfig {
  return { ...cfg, model };
}

/**
 * Call a chat-completions endpoint. Returns the assistant message content.
 * Throws on HTTP error or empty response.
 */
export async function callLLMChat(
  cfg: LLMConfig,
  messages: ChatMessage[],
  opts: CallOptions = {},
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.7 } = opts;

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model:       cfg.model,
      messages,
      max_tokens:  maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM ${cfg.provider} error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`LLM ${cfg.provider} returned empty content`);
  return content;
}

/**
 * Call with automatic fallback to the other provider on failure.
 * Useful for non-streaming routes.
 */
export async function callLLMWithFallback(
  messages: ChatMessage[],
  opts: CallOptions & { preferModel?: string } = {},
): Promise<{ content: string; provider: LLMProvider; model: string }> {
  const { preferModel, ...callOpts } = opts;
  const providers: LLMProvider[] = ['groq', 'together'];
  let lastError: Error | null = null;

  for (const pref of providers) {
    let cfg: LLMConfig;
    try {
      cfg = resolveLLMProvider(pref);
    } catch {
      continue;
    }
    if (preferModel) cfg = withModel(cfg, preferModel);
    try {
      const content = await callLLMChat(cfg, messages, callOpts);
      return { content, provider: cfg.provider, model: cfg.model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('No LLM provider available');
}
