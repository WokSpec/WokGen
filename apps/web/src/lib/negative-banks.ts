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
// PIXEL_NEGATIVES — aggressive set used by prompt-builder-pixel.ts
// ---------------------------------------------------------------------------

export const PIXEL_NEGATIVES: string[] = [
  // Anti-pixel art
  'photorealistic', 'photograph', 'photo', '3d render', '3d model', 'realistic',
  'hyperrealistic', 'detailed texture', 'complex shading', 'smooth gradient',
  'anti-aliased', 'blurry', 'soft edges', 'watercolor', 'oil painting', 'sketch',
  'pencil drawing', 'charcoal', 'impressionist',
  // Wrong scale
  'tiny details', 'high resolution', 'HD', 'ultra HD', '8K', '4K', 'detailed',
  'complex', 'intricate', 'fine details',
  // Wrong style
  'anime style', 'manga', 'cartoon', 'vector', 'flat design', 'minimalist',
  'geometric', 'abstract', 'surreal',
  // Wrong format issues
  'white background', 'grey background', 'background elements',
  'drop shadow', 'glow effect', 'particle effects',
  // AI artifacts
  'multiple characters', 'duplicate', 'mirror image', 'extra limbs',
  'deformed', 'mutated', 'text', 'watermark', 'signature', 'artist name',
  'frame', 'border', 'grid lines', 'ui elements outside sprite',
];

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
  // Additional anti-hallucination guards
  'sub-pixel rendering',
  'smooth interpolation',
  'nearest-neighbor upscale artifacts',
  'AI artifacts',
  'deformed',
  'mutated',
  'ugly',
  'duplicate',
  'floating elements',
  'inconsistent style',
  'mixed art styles',
  'out of frame',
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
  'pixel art', '8-bit', 'retro game', 'sprite', 'pixelated',
  'low resolution', 'crude drawing', 'childish', 'cartoonish',
  'stock photo feel', 'generic', 'cliché', 'cheesy', 'clip art',
  'watermark', 'text overlay', 'sample', 'demo', 'placeholder text',
  'horror elements',
  'blurry', 'noise', 'jpeg artifacts', 'low quality', 'amateurish',
  'cluttered', 'crowded', 'chaotic layout', 'too many elements',
  'inconsistent style', 'off-brand colors', 'mixed styles',
  'overexposed', 'bad composition', 'distorted',
];

// ---------------------------------------------------------------------------
// Vector mode negatives
// ---------------------------------------------------------------------------

export const VECTOR_NEGATIVES: string[] = [
  'raster', 'pixel art', 'bitmap effects',
  'photorealistic', 'photograph', '3D render', 'CGI',
  'painterly', 'watercolor', 'oil paint', 'sketch',
  'blurry', 'noise', 'grain', 'jpeg artifacts',
  'gradient mesh', 'complex texture', 'busy background',
  'irregular stroke width', 'inconsistent stroke weight', 'jagged edges', 'rough lines',
  'misaligned nodes', 'inconsistent style', 'multiple styles mixed',
  'drop shadow', 'bevel', 'emboss', 'lens flare', 'glow effects',
  'watermark', 'text', 'signature',
];

// ---------------------------------------------------------------------------
// Emoji mode negatives
// ---------------------------------------------------------------------------

export const EMOJI_NEGATIVES: string[] = [
  'complex background', 'detailed scene', 'landscape',
  'realistic', 'photographic', 'photograph', '3D render',
  'multiple characters', 'multiple subjects',
  'text overlay', 'watermark',
  'blurry', 'low contrast', 'dark',
  'noise', 'grain',
  'tiny details invisible at small size', 'hard to read at small size',
  'inconsistent line weight', 'inconsistent style', 'mixed art styles',
  'amateurish', 'ugly', 'distorted',
  'realistic texture', 'detailed shading',
];

// ---------------------------------------------------------------------------
// UI/UX mode negatives
// ---------------------------------------------------------------------------

export const UIUX_NEGATIVES: string[] = [
  'pixel art', 'pixelated',
  'illustration', 'hand-drawn', 'sketch', 'watercolor', 'painterly',
  'anime', 'cartoon', 'photorealistic', 'photograph',
  'blurry', 'low contrast', 'low quality', 'amateur',
  'cluttered', 'crowded', 'inconsistent spacing', 'misaligned elements',
  'overlapping text', 'unreadable text', 'poor contrast',
  'hard to read text', 'inaccessible',
  'outdated design patterns',
  'multiple color themes mixed', 'inconsistent style',
  'watermark', 'placeholder text visible', 'lorem ipsum without styling',
  'skeuomorphic' ,
];

// ---------------------------------------------------------------------------
// Unified negative bank — indexed by mode (for route-level assembly)
// ---------------------------------------------------------------------------

export const NEGATIVE_BANKS = {
  pixel:    GLOBAL_PIXEL_NEGATIVES,
  business: BUSINESS_NEGATIVES,
  vector:   VECTOR_NEGATIVES,
  emoji:    EMOJI_NEGATIVES,
  uiux:     UIUX_NEGATIVES,
} as const;

export type GenerationMode = keyof typeof NEGATIVE_BANKS;

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
 * @param mode       — 'pixel' | 'business' | 'vector' | 'emoji' (selects base negative bank)
 */
export function assembleNegativePrompt(
  tool: string,
  preset: string | undefined,
  userNeg: string | undefined,
  mode: 'pixel' | 'business' | 'vector' | 'emoji' | 'uiux' | string,
): string {
  const parts: string[] = [];

  // User-supplied negatives have highest priority
  if (userNeg && userNeg.trim()) {
    parts.push(userNeg.trim());
  }

  if (mode === 'business') {
    parts.push(...BUSINESS_NEGATIVES);
  } else if (mode === 'vector') {
    parts.push(...VECTOR_NEGATIVES);
  } else if (mode === 'emoji') {
    parts.push(...EMOJI_NEGATIVES);
  } else if (mode === 'uiux') {
    parts.push(...UIUX_NEGATIVES);
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
