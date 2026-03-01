/**
 * WokGen — Provider Quality Matrix
 *
 * Quality-aware provider routing. Replaces the naive detectProvider()
 * function with a matrix that considers mode, tool, and quality tier.
 *
 * Standard tier: free providers (Together, HuggingFace, Pollinations, Stable Horde)
 * HD tier: premium providers (FAL, Replicate)
 *
 * Provider capabilities reference:
 *   together:     generate, scene — no animate/rotate/inpaint, no neg prompt
 *   huggingface:  generate only — has neg prompt
 *   pollinations: generate only — no neg prompt, no key required, 5 model variants
 *   stablehorde:  generate only — 300+ open-source models, no key required (anon key)
 *   fal:          generate, rotate, scene — has neg prompt, needs FAL_KEY
 *   replicate:    all tools — has neg prompt, needs REPLICATE_API_TOKEN
 */

import type { ProviderName } from './providers/types';

// ---------------------------------------------------------------------------
// Environment-based capability flags (resolved at call time, not module load)
// ---------------------------------------------------------------------------

function hasKey(envVar: string): boolean {
  return Boolean(process.env[envVar]);
}

// ---------------------------------------------------------------------------
// Standard-tier routing matrix
//
// Each entry is an ordered preference list. The first provider for which
// the required key is present (or no key is required) wins.
// ---------------------------------------------------------------------------

type ProviderPreference = { provider: ProviderName; requires?: string };

const STANDARD_MATRIX: Record<string, Record<string, ProviderPreference[]>> = {
  pixel: {
    generate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'huggingface', requires: 'HF_TOKEN' },
      { provider: 'prodia' },                           // free SD, no key needed
      { provider: 'pollinations' },                     // always free, no key
    ],
    animate: [
      { provider: 'pollinations' },                     // only free provider with sequential frames
    ],
    rotate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'prodia' },
      { provider: 'pollinations' },
    ],
    inpaint: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    scene: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'huggingface', requires: 'HF_TOKEN' },
      { provider: 'prodia' },
      { provider: 'pollinations' },
    ],
  },
  business: {
    generate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'huggingface', requires: 'HF_TOKEN' },
      { provider: 'prodia' },
      { provider: 'pollinations' },
    ],
    animate: [
      { provider: 'pollinations' },
    ],
    rotate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'prodia' },
      { provider: 'pollinations' },
    ],
    inpaint: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    scene: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'prodia' },
      { provider: 'pollinations' },
    ],
  },
  vector: {
    generate: [
      { provider: 'pollinations' },
    ],
    animate:  [{ provider: 'pollinations' }],
    rotate:   [{ provider: 'pollinations' }],
    inpaint:  [{ provider: 'pollinations' }],
    scene:    [{ provider: 'pollinations' }],
  },
  emoji: {
    generate: [
      { provider: 'pollinations' },
    ],
    animate:  [{ provider: 'pollinations' }],
    rotate:   [{ provider: 'pollinations' }],
    inpaint:  [{ provider: 'pollinations' }],
    scene:    [{ provider: 'pollinations' }],
  },
};

// Vector mode: prefer Replicate Recraft V3 SVG for HD (true SVG generation)
const VECTOR_STANDARD: Record<string, ProviderPreference[]> = {
  generate: [
    { provider: 'together',    requires: 'TOGETHER_API_KEY' },
    { provider: 'huggingface', requires: 'HF_TOKEN' },
    { provider: 'prodia' },
    { provider: 'pollinations' },
  ],
  animate:  [{ provider: 'pollinations' }],
  rotate:   [{ provider: 'together', requires: 'TOGETHER_API_KEY' }, { provider: 'prodia' }, { provider: 'pollinations' }],
  inpaint:  [{ provider: 'together', requires: 'TOGETHER_API_KEY' }, { provider: 'pollinations' }],
  scene:    [{ provider: 'together', requires: 'TOGETHER_API_KEY' }, { provider: 'prodia' }, { provider: 'pollinations' }],
};

const VECTOR_HD: Record<string, ProviderPreference[]> = {
  generate: [
    { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, // Recraft V3 SVG
    { provider: 'fal',       requires: 'FAL_KEY' },
    { provider: 'together',  requires: 'TOGETHER_API_KEY' },
    { provider: 'pollinations' },
  ],
  animate:  [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
  rotate:   [{ provider: 'fal',       requires: 'FAL_KEY' }, { provider: 'pollinations' }],
  inpaint:  [{ provider: 'fal',       requires: 'FAL_KEY' }, { provider: 'pollinations' }],
  scene:    [{ provider: 'fal',       requires: 'FAL_KEY' }, { provider: 'pollinations' }],
};

// Emoji mode: same quality chain as pixel (small-format, high-detail)
const EMOJI_STANDARD: Record<string, ProviderPreference[]> = {
  generate: [
    { provider: 'together',    requires: 'TOGETHER_API_KEY' },
    { provider: 'huggingface', requires: 'HF_TOKEN' },
    { provider: 'pollinations' },
  ],
  animate:  [{ provider: 'pollinations' }],
  rotate:   [{ provider: 'together', requires: 'TOGETHER_API_KEY' }, { provider: 'pollinations' }],
  inpaint:  [{ provider: 'together', requires: 'TOGETHER_API_KEY' }, { provider: 'pollinations' }],
  scene:    [{ provider: 'pollinations' }],
};

const EMOJI_HD: Record<string, ProviderPreference[]> = {
  generate: [
    { provider: 'fal',       requires: 'FAL_KEY' },
    { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
    { provider: 'together',  requires: 'TOGETHER_API_KEY' },
    { provider: 'pollinations' },
  ],
  animate:  [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
  rotate:   [{ provider: 'fal',       requires: 'FAL_KEY' }, { provider: 'pollinations' }],
  inpaint:  [{ provider: 'fal',       requires: 'FAL_KEY' }, { provider: 'pollinations' }],
  scene:    [{ provider: 'fal',       requires: 'FAL_KEY' }, { provider: 'pollinations' }],
};

// All other modes (uiux image mockup) use business routing as fallback
const FALLBACK_STANDARD: Record<string, ProviderPreference[]> = {
  generate: STANDARD_MATRIX.business.generate,
  animate:  STANDARD_MATRIX.business.animate,
  rotate:   STANDARD_MATRIX.business.rotate,
  inpaint:  STANDARD_MATRIX.business.inpaint,
  scene:    STANDARD_MATRIX.business.scene,
};

// ---------------------------------------------------------------------------
// HD-tier routing matrix
// ---------------------------------------------------------------------------

const HD_MATRIX: Record<string, Record<string, ProviderPreference[]>> = {
  pixel: {
    generate: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'together', requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    animate: [
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'pollinations' },
    ],
    rotate: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'pollinations' },
    ],
    inpaint: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'together', requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    scene: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'together', requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
  },
  business: {
    generate: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'together', requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    animate: [
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'pollinations' },
    ],
    rotate: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'pollinations' },
    ],
    inpaint: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'pollinations' },
    ],
    scene: [
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'together', requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
  },
  vector: {
    generate: [
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'pollinations' },
    ],
    animate:  [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
    rotate:   [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
    inpaint:  [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
    scene:    [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
  },
  emoji: {
    generate: [
      { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' },
      { provider: 'fal',      requires: 'FAL_KEY' },
      { provider: 'pollinations' },
    ],
    animate:  [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
    rotate:   [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
    inpaint:  [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
    scene:    [{ provider: 'replicate', requires: 'REPLICATE_API_TOKEN' }, { provider: 'pollinations' }],
  },
};

const FALLBACK_HD: Record<string, ProviderPreference[]> = {
  generate: HD_MATRIX.business.generate,
  animate:  HD_MATRIX.business.animate,
  rotate:   HD_MATRIX.business.rotate,
  inpaint:  HD_MATRIX.business.inpaint,
  scene:    HD_MATRIX.business.scene,
};

// ---------------------------------------------------------------------------
// Voice and Text provider routing
//
// These modes use non-image providers (HuggingFace for TTS, Groq/Together for
// LLM). Exposed as separate resolver functions used by /api/voice/generate
// and /api/text/generate respectively.
// ---------------------------------------------------------------------------

/** A provider entry with model identifier and priority rank. */
export interface ProviderEntry {
  provider: string;
  model: string;
  priority: number;
  requires?: string; // env var name required for this provider
}

const VOICE_STANDARD: ProviderEntry[] = [
  { provider: 'huggingface', model: 'hexgrad/Kokoro-82M', priority: 1, requires: 'HF_TOKEN' },
];

const TEXT_STANDARD: ProviderEntry[] = [
  { provider: 'groq',     model: 'llama-3.3-70b-versatile',                    priority: 1, requires: 'GROQ_API_KEY' },
  { provider: 'together', model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',    priority: 2, requires: 'TOGETHER_API_KEY' },
];

/**
 * Resolve the best available voice provider.
 * Returns the highest-priority entry whose required env key is present,
 * or null if no voice provider is configured.
 */
export function resolveVoiceProvider(): ProviderEntry | null {
  for (const entry of VOICE_STANDARD) {
    if (!entry.requires || hasKey(entry.requires)) return entry;
  }
  return null;
}

/**
 * Resolve the best available text/LLM provider.
 * Returns the highest-priority entry whose required env key is present,
 * or null if no LLM provider is configured.
 */
export function resolveTextProvider(): ProviderEntry | null {
  for (const entry of TEXT_STANDARD) {
    if (!entry.requires || hasKey(entry.requires)) return entry;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Resolve function
// ---------------------------------------------------------------------------

/**
 * Resolve the optimal provider for a given mode + tool + quality combination.
 *
 * Failover chain (HD): fal → replicate → together → pollinations
 * Failover chain (standard): together → huggingface → pollinations
 * Each provider is tried in order; the first one with a valid env key is used.
 * pollinations is always the final fallback — no key required.
 *
 * Walks the preference list for the mode/tool and returns the first provider
 * whose required environment key is present. Falls back to 'pollinations' if
 * nothing else is available (always works, no key required).
 *
 * @param mode    — 'pixel' | 'business' | other
 * @param tool    — 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene'
 * @param useHD   — true = use HD matrix (FAL/Replicate), false = standard matrix
 */
export function resolveOptimalProvider(
  mode: string,
  tool: string,
  useHD: boolean,
  style?: string,
): ProviderName {
  // Mode-specific matrices
  const modeStandardMap: Record<string, Record<string, ProviderPreference[]>> = {
    ...STANDARD_MATRIX,
    vector: VECTOR_STANDARD,
  };
  const modeHdMap: Record<string, Record<string, ProviderPreference[]>> = {
    ...HD_MATRIX,
    vector: VECTOR_HD,
  };

  const map = useHD ? modeHdMap : modeStandardMap;
  const fallback = useHD ? FALLBACK_HD : FALLBACK_STANDARD;

  const modeMatrix = map[mode] ?? null;

  // Style-specific routing: some style presets route to better providers
  if (style) {
    const styleProvider = resolveStyleProvider(mode, style, useHD);
    if (styleProvider) return styleProvider;
  }

  const preferences: ProviderPreference[] =
    modeMatrix?.[tool] ?? fallback[tool] ?? [{ provider: 'pollinations' }];

  for (const pref of preferences) {
    if (!pref.requires) return pref.provider;
    if (hasKey(pref.requires)) return pref.provider;
  }

  return 'pollinations';
}

// ---------------------------------------------------------------------------
// Style-aware provider overrides
//
// Some style presets produce measurably better output on specific providers.
// This function checks style hints and returns a preferred provider when
// the required key is available. Returns null to fall through to matrix.
// ---------------------------------------------------------------------------

const STYLE_PROVIDER_MAP: Record<string, { standard: ProviderPreference | null; hd: ProviderPreference | null }> = {
  // Pixel styles
  'dithered':        { standard: { provider: 'pollinations' }, hd: { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' } },
  'isometric':       { standard: { provider: 'together',    requires: 'TOGETHER_API_KEY' }, hd: { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' } },
  'gb_mono':         { standard: { provider: 'pollinations' }, hd: { provider: 'replicate', requires: 'REPLICATE_API_TOKEN' } },
  // Business / vector styles
  'flat-vector':     { standard: { provider: 'pollinations' }, hd: { provider: 'fal', requires: 'FAL_KEY' } },
  'logo-mark':       { standard: { provider: 'huggingface', requires: 'HF_TOKEN' }, hd: { provider: 'fal', requires: 'FAL_KEY' } },
  'portrait-photo':  { standard: { provider: 'together',    requires: 'TOGETHER_API_KEY' }, hd: { provider: 'fal', requires: 'FAL_KEY' } },
  'data-viz':        { standard: { provider: 'pollinations' }, hd: { provider: 'pollinations' } },
};

function resolveStyleProvider(mode: string, style: string, useHD: boolean): ProviderName | null {
  void mode; // reserved for future mode-specific style overrides
  const entry = STYLE_PROVIDER_MAP[style];
  if (!entry) return null;
  const pref = useHD ? entry.hd : entry.standard;
  if (!pref) return null;
  if (!pref.requires || hasKey(pref.requires)) return pref.provider as ProviderName;
  // Required key missing — try other tier
  const fallbackPref = useHD ? entry.standard : entry.hd;
  if (fallbackPref && (!fallbackPref.requires || hasKey(fallbackPref.requires))) {
    return fallbackPref.provider as ProviderName;
  }
  return null;
}
