/**
 * WokGen — Provider Quality Matrix
 *
 * Quality-aware provider routing. Replaces the naive detectProvider()
 * function with a matrix that considers mode, tool, and quality tier.
 *
 * Standard tier: free providers (Together, HuggingFace, Pollinations)
 * HD tier: premium providers (FAL, Replicate)
 *
 * Provider capabilities reference:
 *   together:    generate, scene — no animate/rotate/inpaint, no neg prompt
 *   huggingface: generate only — has neg prompt
 *   pollinations: generate only — no neg prompt, no key required
 *   fal:         generate, rotate, scene — has neg prompt, needs FAL_KEY
 *   replicate:   all tools — has neg prompt, needs REPLICATE_API_TOKEN
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
      { provider: 'pollinations' },                     // always free, no key
    ],
    animate: [
      { provider: 'pollinations' },                     // only free provider with sequential frames
    ],
    rotate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    inpaint: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    scene: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'huggingface', requires: 'HF_TOKEN' },
      { provider: 'pollinations' },
    ],
  },
  business: {
    generate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'huggingface', requires: 'HF_TOKEN' },
      { provider: 'pollinations' },
    ],
    animate: [
      { provider: 'pollinations' },
    ],
    rotate: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    inpaint: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
    scene: [
      { provider: 'together',    requires: 'TOGETHER_API_KEY' },
      { provider: 'pollinations' },
    ],
  },
};

// All other modes (vector, emoji, uiux image mockup) use the same as business
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
};

const FALLBACK_HD: Record<string, ProviderPreference[]> = {
  generate: HD_MATRIX.business.generate,
  animate:  HD_MATRIX.business.animate,
  rotate:   HD_MATRIX.business.rotate,
  inpaint:  HD_MATRIX.business.inpaint,
  scene:    HD_MATRIX.business.scene,
};

// ---------------------------------------------------------------------------
// Resolve function
// ---------------------------------------------------------------------------

/**
 * Resolve the optimal provider for a given mode + tool + quality combination.
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
): ProviderName {
  const matrix = useHD ? HD_MATRIX : STANDARD_MATRIX;
  const fallback = useHD ? FALLBACK_HD : FALLBACK_STANDARD;

  const modeMatrix = matrix[mode] ?? null;
  const preferences: ProviderPreference[] =
    modeMatrix?.[tool] ?? fallback[tool] ?? [{ provider: 'pollinations' }];

  for (const pref of preferences) {
    // If no key required, this provider is always available
    if (!pref.requires) return pref.provider;
    // If key is present in env, use this provider
    if (hasKey(pref.requires)) return pref.provider;
  }

  // Ultimate fallback — Pollinations requires no key
  return 'pollinations';
}
