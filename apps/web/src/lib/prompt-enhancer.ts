/**
 * Prompt Enhancer — multi-provider LLM pipeline to expand and enrich generation prompts.
 * Provider chain: Groq → Cerebras → OpenRouter → Gemini → local fallback
 */

import { analyzeAndEnrichPrompt } from './prompt-intelligence';
import { geminiChat } from './providers/gemini';
import { openrouterChat } from './providers/openrouter';

export type StudioMode = 'pixel' | 'vector' | 'uiux' | 'voice' | 'business' | 'code';

export interface EnhancePromptOptions {
  mode: StudioMode;
  style?: string;
  aspectRatio?: string;
  targetLength?: 'short' | 'medium' | 'detailed';
}

export interface EnhancePromptResult {
  original: string;
  enhanced: string;
  suggestions: string[];   // 3 alternative prompt variations
  tags: string[];
  provider: string;
  durationMs: number;
}

const SYSTEM_PROMPTS: Record<StudioMode | 'default', string> = {
  pixel:    'You are an expert pixel art prompt engineer. Expand the user\'s concept into a detailed pixel art generation prompt including: art style, color palette, era (NES/SNES/Game Boy/modern), sprite perspective, detail level. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
  vector:   'You are an SVG/vector art expert. Expand into a vector illustration prompt with: style, line weight, color scheme, composition. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
  uiux:     'You are a UI/UX design expert. Expand into a UI mockup prompt with: device, color palette, typography style, component types. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
  business: 'You are a brand design expert. Expand into a brand asset prompt with: industry, visual style, color psychology, typography. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
  voice:    'You are an audio/voice design expert. Expand into a detailed voice synthesis prompt with: tone, pace, emotion, character. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
  code:     'You are a creative AI prompt engineer specializing in technical visuals. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
  default:  'You are a creative AI prompt engineer. Expand the user\'s concept into a rich, detailed generation prompt. Return JSON only: {"enhanced":"...","suggestions":["...","...","..."],"tags":["..."]}',
};

function getSystemPrompt(mode: StudioMode): string {
  return SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.default;
}

function parseEnhancedJson(raw: string): { enhanced?: string; suggestions?: string[]; tags?: string[] } | null {
  try {
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(clean);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch { /* fall through */ }
  return null;
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

async function tryGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('no key');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 512,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function tryCerebras(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) throw new Error('no key');
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 512,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Cerebras ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function tryOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('no key');
  return openrouterChat(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    'llama8b',
  );
}

async function tryGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) throw new Error('no key');
  return geminiChat(userPrompt, { systemInstruction: systemPrompt, maxOutputTokens: 512 });
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function enhancePrompt(
  userPrompt: string,
  options: EnhancePromptOptions,
): Promise<EnhancePromptResult> {
  const t0 = Date.now();
  const systemPrompt = getSystemPrompt(options.mode);
  const userMsg = `Expand this prompt: "${userPrompt}"${options.style ? ` (style: ${options.style})` : ''}${options.aspectRatio ? ` (aspect: ${options.aspectRatio})` : ''}`;

  const providers: Array<{ name: string; fn: () => Promise<string> }> = [
    { name: 'groq',       fn: () => tryGroq(systemPrompt, userMsg) },
    { name: 'cerebras',   fn: () => tryCerebras(systemPrompt, userMsg) },
    { name: 'openrouter', fn: () => tryOpenRouter(systemPrompt, userMsg) },
    { name: 'gemini',     fn: () => tryGemini(systemPrompt, userMsg) },
  ];

  for (const { name, fn } of providers) {
    try {
      const raw = await fn();
      if (!raw) continue;
      const parsed = parseEnhancedJson(raw);
      if (parsed?.enhanced) {
        return {
          original:    userPrompt,
          enhanced:    parsed.enhanced,
          suggestions: (parsed.suggestions ?? []).slice(0, 3),
          tags:        parsed.tags ?? [],
          provider:    name,
          durationMs:  Date.now() - t0,
        };
      }
      // Non-JSON response — use raw as enhanced
      return {
        original:    userPrompt,
        enhanced:    raw.trim(),
        suggestions: [],
        tags:        [],
        provider:    name,
        durationMs:  Date.now() - t0,
      };
    } catch {
      // Try next provider
      continue;
    }
  }

  // Final fallback: use existing prompt-intelligence engine
  const enriched = analyzeAndEnrichPrompt(userPrompt, options.mode);
  return {
    original:    userPrompt,
    enhanced:    enriched.enriched,
    suggestions: [],
    tags:        [],
    provider:    'local',
    durationMs:  Date.now() - t0,
  };
}
