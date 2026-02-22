/**
 * WokGen — Negative Prompt Banks
 *
 * Curated per-tool, per-preset negative prompts that prevent the most
 * common hallucination patterns in pixel art and business asset generation.
 *
 * For providers that do NOT support native negative prompts (Pollinations,
 * Together FLUX.1-schnell-Free), use `encodeNegativesIntoPositive()` to
 * inject them as CLIP avoidance tokens at the end of the positive prompt.
 */

// ---------------------------------------------------------------------------
// Global negatives — applied to ALL pixel art generations
// ---------------------------------------------------------------------------

export const GLOBAL_PIXEL_NEGATIVES: string[] = [
  'blurry',
  'anti-aliased',
  'soft edges',
  'gradient shading',
  'smooth shading',
  '3D render',
  'photorealistic',
  'realistic lighting',
  'depth of field',
  'bokeh',
  'photograph',
  'CGI',
  'text',
  'watermark',
  'signature',
  'low quality',
  'bad anatomy',
  'extra limbs',
  'malformed',
  'jpeg artifacts',
  'partially cropped',
  'cut off',
  'dithering artifacts',
  'noise',
];

// ---------------------------------------------------------------------------
// Tool-specific negatives — added on top of global negatives
// ---------------------------------------------------------------------------

export const TOOL_NEGATIVES: Record<string, string[]> = {
  generate: [
    'motion blur',
    'floating limbs',
    'multiple poses',
    'busy background',
  ],
  animate: [
    'static image',
    'single frame',
    'no motion',
    'completely still',
  ],
  rotate: [
    'inconsistent character',
    'different character',
    'merged figures',
    'fused sprites',
  ],
  inpaint: [
    'obvious seam',
    'visible mask edge',
    'mismatched style',
    'color bleed',
  ],
  scene: [
    'foreground characters',
    'floating objects',
    'perspective inconsistency',
    'non-tileable',
    'visible seams',
  ],
};

// ---------------------------------------------------------------------------
// Preset-specific negatives — added on top of tool negatives
// ---------------------------------------------------------------------------

export const PRESET_NEGATIVES: Record<string, string[]> = {
  character_idle: [
    'side view',
    'back view',
    'multiple characters',
    'running',
    'jumping',
    'aggressive pose',
  ],
  character_side: [
    'front view',
    'back view',
    'multiple characters',
    'idle standing straight',
  ],
  tileset: [
    'foreground objects',
    'characters',
    'weapons',
    'sky',
    'clouds',
    'asymmetric',
  ],
  nature_tile: [
    'characters',
    'weapons',
    'buildings',
    'asymmetric',
    'visible tile borders',
  ],
  portrait: [
    'full body',
    'hands visible',
    'action pose',
    'weapon in hand',
    'multiple faces',
    'body below waist',
  ],
  rpg_icon: [
    'background scene',
    'multiple items',
    'hand holding item',
    'character',
    'environmental context',
  ],
  weapon_icon: [
    'background scene',
    'multiple weapons',
    'hand holding weapon',
    'character',
    'environmental context',
  ],
  badge_icon: [
    'background scene',
    'text labels',
    'complex detail',
    'multiple symbols',
  ],
  sprite_sheet: [
    'single pose only',
    'misaligned frames',
    'inconsistent scale',
    'background fill',
  ],
  isometric: [
    'flat top-down',
    'front-facing',
    'perspective inconsistency',
    'non-isometric angle',
  ],
  chibi: [
    'realistic proportions',
    'tall body',
    'small head',
    'normal anatomy',
  ],
  horror: [
    'bright cheerful colors',
    'cute style',
    'cartoonish',
    'low contrast',
  ],
  sci_fi: [
    'organic natural',
    'fantasy medieval',
    'low tech',
    'wooden textures',
  ],
  animated_effect: [
    'solid background',
    'characters',
    'items',
    'text overlay',
    'flat static design',
  ],
  emoji: [
    'detailed shading',
    'complex background',
    'multiple objects',
    'realistic',
  ],
  game_ui: [
    'characters',
    'background scenes',
    'complex gradients',
    'drop shadows',
    'photorealistic elements',
  ],
  top_down_char: [
    'front view',
    'side view',
    'perspective inconsistency',
    'incorrect angle',
  ],
};

// ---------------------------------------------------------------------------
// Business mode negatives
// ---------------------------------------------------------------------------

export const BUSINESS_NEGATIVES: string[] = [
  'pixel art',
  'pixelated',
  'low resolution',
  'crude drawing',
  'childish',
  'cartoonish',
  'watermark',
  'text overlay',
  'dark background',
  'horror elements',
  'blurry',
  'noise',
  'jpeg artifacts',
  'low quality',
  'amateurish',
];

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Assemble the complete negative prompt string for a given tool and preset.
 * Always includes global pixel negatives + tool negatives + preset negatives.
 *
 * @param tool       — e.g. 'generate', 'animate', 'scene'
 * @param preset     — style preset key (or undefined)
 * @param userNeg    — the user's own negative prompt (prepended with highest priority)
 * @param mode       — 'pixel' | 'business' (selects base negative bank)
 */
export function assembleNegativePrompt(
  tool: string,
  preset: string | undefined,
  userNeg: string | undefined,
  mode: 'pixel' | 'business' | string,
): string {
  const parts: string[] = [];

  // User-supplied negatives have highest priority
  if (userNeg && userNeg.trim()) {
    parts.push(userNeg.trim());
  }

  if (mode === 'business') {
    parts.push(...BUSINESS_NEGATIVES);
  } else {
    // Pixel mode (and others default to pixel negatives)
    parts.push(...GLOBAL_PIXEL_NEGATIVES);
    parts.push(...(TOOL_NEGATIVES[tool] ?? []));
    if (preset) {
      parts.push(...(PRESET_NEGATIVES[preset] ?? []));
    }
  }

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(p.trim());
    }
  }

  return deduped.join(', ');
}

/**
 * Encode negative tokens into the positive prompt for providers that don't
 * support a native negative prompt field (Pollinations, Together FLUX.1-schnell-Free).
 *
 * Uses ((avoid: X)) token pattern — CLIP interprets these as avoidance weights.
 * Appended at the end of the positive prompt so they don't override user intent.
 *
 * Caps at 8 negatives to avoid prompt length explosion on free providers.
 */
export function encodeNegativesIntoPositive(
  positivePrompt: string,
  negativePrompt: string,
  maxTerms: number = 8,
): string {
  if (!negativePrompt.trim()) return positivePrompt;

  const terms = negativePrompt
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, maxTerms);

  if (terms.length === 0) return positivePrompt;

  const avoidTokens = terms.map(t => `((avoid: ${t}))`).join(', ');
  return `${positivePrompt.trimEnd()}, ${avoidTokens}`;
}
