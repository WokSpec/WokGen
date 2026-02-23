/**
 * WokGen — Prompt Pipeline Validator
 *
 * Sanitizes and validates prompts before they reach any provider.
 * Catches bad inputs early — before wasting API calls or credit.
 *
 * Rules applied in order:
 * 1. Strip dangerous / useless tokens (URLs, HTML, markdown, code fences)
 * 2. Remove conflicting tokens (e.g. "photo of" + pixel preset)
 * 3. Normalize whitespace and punctuation
 * 4. Enforce max length per provider
 * 5. Detect empty / useless prompts (reject before dispatch)
 */

// ---------------------------------------------------------------------------
// Provider-specific max prompt lengths (in characters)
// ---------------------------------------------------------------------------

const PROVIDER_MAX_LENGTH: Record<string, number> = {
  together:    450,
  pollinations: 200,
  huggingface: 350,
  fal:         500,
  replicate:   600,
  comfyui:     800,
};

// Default max when provider is unknown
const DEFAULT_MAX_LENGTH = 450;

// ---------------------------------------------------------------------------
// Token conflict rules: if these appear in a pixel/business mode prompt,
// strip the conflicting tokens
// ---------------------------------------------------------------------------

const PIXEL_CONFLICTS = [
  /\bphoto(graph)? of\b/gi,
  /\bphotographic\b/gi,
  /\bphotorealistic\b/gi,
  /\bhyper.?realistic\b/gi,
  /\bhigh.?definition\b/gi,
  /\b4k\b/gi,
  /\b8k\b/gi,
  /\bhd render\b/gi,
  /\b3d render\b/gi,
  /\bunreal engine\b/gi,
  /\bcinematic\b/gi,
  /\bdepth of field\b/gi,
];

const BUSINESS_CONFLICTS = [
  /\bpixel art\b/gi,
  /\b8-bit\b/gi,
  /\bpixelated\b/gi,
  /\bsprite\b/gi,
  /\bgame asset\b/gi,
];

// ---------------------------------------------------------------------------
// Patterns to strip entirely
// ---------------------------------------------------------------------------

const STRIP_PATTERNS = [
  // URLs
  /https?:\/\/\S+/gi,
  // Markdown code fences
  /```[\s\S]*?```/gi,
  /`[^`]+`/g,
  // HTML tags
  /<[^>]+>/g,
  // Markdown bold/italic
  /\*{1,2}([^*]+)\*{1,2}/g,
  // Markdown links
  /\[[^\]]*\]\([^)]*\)/g,
  // Multiple dashes/underscores
  /_{3,}/g,
  /-{3,}/g,
];

// ---------------------------------------------------------------------------
// Adversarial / jailbreak pattern detection (prompt injection hardening)
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: RegExp[] = [
  // System prompt override attempts
  /ignore (all )?(previous|prior|above) (instructions?|prompts?|context)/gi,
  /you are now|forget (your|all) (instructions?|constraints?|rules?)/gi,
  /new (system |role |persona )?instructions?:/gi,
  /\[system\]|\[assistant\]|\[user\]|\[inst\]/gi,
  // DAN / jailbreak personas
  /\bDAN\b/g,
  /do anything now/gi,
  /developer mode/gi,
  /jailbreak/gi,
  /bypass (safety|filter|moderation)/gi,
  // Prompt leakage attempts
  /print (your|the) (system |original )?prompt/gi,
  /reveal (your|the) (system |internal )?instructions?/gi,
  /what (are|were) your instructions?/gi,
  // Encoded injection (base64 / unicode tricks)
  /\beval\s*\(/gi,
  /javascript:/gi,
  /data:text\/html/gi,
];



export interface ValidationResult {
  /** Sanitized positive prompt — safe to send to provider */
  sanitized: string;

  /** Sanitized negative prompt */
  sanitizedNeg: string;

  /** Non-blocking warnings to surface to user (info toast) */
  warnings: string[];

  /** True if the prompt is fundamentally unusable (empty, only noise) */
  invalid: boolean;

  /** Human-readable reason when invalid=true */
  invalidReason?: string;
}

// ---------------------------------------------------------------------------
// Main validation function
// ---------------------------------------------------------------------------

/**
 * Validate and sanitize a prompt before generation.
 *
 * @param prompt     — Raw user positive prompt
 * @param negPrompt  — Raw user negative prompt (may be undefined)
 * @param mode       — 'pixel' | 'business' | other
 * @param preset     — Active style preset key (optional)
 * @param provider   — Intended provider (for length limits)
 */
export function validateAndSanitize(
  prompt: string,
  negPrompt: string | undefined,
  mode: string,
  preset: string | undefined,
  provider: string = 'pollinations',
): ValidationResult {
  const warnings: string[] = [];
  let p = prompt ?? '';
  let n = negPrompt ?? '';

  // ── Step 0: Injection detection ─────────────────────────────────────────
  for (const re of INJECTION_PATTERNS) {
    if (re.test(p)) {
      return {
        sanitized:    '',
        sanitizedNeg: '',
        warnings:     [],
        invalid:      true,
        invalidReason: 'Prompt contains disallowed patterns and cannot be processed.',
      };
    }
    re.lastIndex = 0;
  }

  // ── Step 1: Strip dangerous / useless patterns ──────────────────────────
  for (const re of STRIP_PATTERNS) {
    p = p.replace(re, ' ');
    n = n.replace(re, ' ');
  }

  // ── Step 2: Remove conflicting tokens ───────────────────────────────────
  const conflictPatterns =
    mode === 'pixel'    ? PIXEL_CONFLICTS :
    mode === 'business' ? BUSINESS_CONFLICTS :
    [];

  for (const re of conflictPatterns) {
    if (re.test(p)) {
      warnings.push(
        mode === 'pixel'
          ? 'Photorealistic tokens removed — not compatible with pixel art style.'
          : 'Pixel art tokens removed — not compatible with business asset style.',
      );
      p = p.replace(re, ' ');
    }
    re.lastIndex = 0; // reset global regex
  }

  // ── Step 3: Normalize ───────────────────────────────────────────────────
  p = normalize(p);
  n = normalize(n);

  // ── Step 4: Length enforcement ──────────────────────────────────────────
  const maxLen = PROVIDER_MAX_LENGTH[provider] ?? DEFAULT_MAX_LENGTH;
  if (p.length > maxLen) {
    p = p.slice(0, maxLen).replace(/[,\s]+$/, '').trim();
    warnings.push(`Prompt truncated to ${maxLen} characters for ${provider}.`);
  }

  // Negative prompt cap: half the positive limit is sufficient
  const negMaxLen = Math.min(300, Math.floor(maxLen / 2));
  if (n.length > negMaxLen) {
    n = n.slice(0, negMaxLen).replace(/[,\s]+$/, '').trim();
  }

  // ── Step 5: Emptiness check ─────────────────────────────────────────────
  const meaningful = p.replace(/[^a-zA-Z]/g, '');
  if (meaningful.length < 3) {
    return {
      sanitized:    p,
      sanitizedNeg: n,
      warnings,
      invalid:      true,
      invalidReason:
        'Prompt must contain at least a few descriptive words. Numbers and punctuation alone will not generate a useful image.',
    };
  }

  return {
    sanitized:    p,
    sanitizedNeg: n,
    warnings,
    invalid:      false,
  };
}

// ---------------------------------------------------------------------------
// Normalize helper
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .replace(/\s{2,}/g, ' ')            // collapse multiple spaces
    .replace(/,\s*,/g, ',')             // collapse double commas
    .replace(/^\s*[,.\-–—]+\s*/g, '')   // strip leading punctuation
    .replace(/\s*[,.\-–—]+\s*$/g, '')   // strip trailing punctuation
    .trim();
}
