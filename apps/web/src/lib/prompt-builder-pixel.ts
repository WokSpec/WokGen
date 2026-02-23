/**
 * WokGen — Pixel Prompt Builder
 * ─────────────────────────────
 * Server-side prompt enrichment for pixel art generation.
 * Enforces size, palette, and tool-type constraints at the API level —
 * runs before the provider-level buildPrompt so every provider benefits.
 *
 * Pattern mirrors prompt-builder-business.ts / prompt-builder-vector.ts.
 */

// ---------------------------------------------------------------------------
// Sprite-type suffixes
// ---------------------------------------------------------------------------

const TOOL_SUFFIXES: Record<string, string> = {
  character:  'single character, centered composition, full body view, no background',
  enemy:      'enemy character sprite, menacing pose, centered, no background',
  tileset:    'tile grid layout, all tiles same size, seamless edges, transparent gaps',
  item:       'single item, centered, small object, game item icon',
  ui:         'game HUD element, flat pixel art, dark compatible, icon',
  animation:  'animation frames in a row, consistent character, even spacing',
  npc:        'non-player character sprite, friendly appearance, centered, no background',
  boss:       'boss enemy sprite, large imposing figure, detailed within pixel art constraints',
  scene:      'top-down or side-scroll environment, cohesive tileset, seamless edges',
  effect:     'particle or magic effect, bright colors, transparent-friendly, looping-ready',
};

// ---------------------------------------------------------------------------
// Era → palette descriptor
// ---------------------------------------------------------------------------

const ERA_PALETTE: Record<string, string> = {
  nes:     'NES palette',
  gameboy: '4-shade monochrome Game Boy palette',
  snes:    '16-bit SNES palette',
  gba:     '32-bit GBA palette',
  modern:  'modern 32-bit game palette',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function derivePaletteSize(canvasSize: number, explicit?: number): number {
  if (explicit) return explicit;
  if (canvasSize <= 32)  return 8;
  if (canvasSize <= 64)  return 16;
  if (canvasSize <= 128) return 32;
  return 32;
}

function derivePaletteDescriptor(paletteSize: number, era?: string): string {
  const eraLabel = era && ERA_PALETTE[era] ? ERA_PALETTE[era] : undefined;
  if (eraLabel) return `${eraLabel}, limited ${paletteSize} color palette`;
  return `limited ${paletteSize} color palette`;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BuildPixelPromptOptions {
  /** User's raw text prompt */
  concept: string;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Sprite/asset type — drives tool-specific suffix */
  spriteType?: string;
  /** Pixel era hint — affects palette descriptor */
  era?: string;
  /** Explicit palette size; derived from canvas size if omitted */
  paletteSize?: number;
  /** For animation sprite sheets: number of frames */
  frameCount?: number;
}

export interface PixelPromptResult {
  prompt: string;
  negPrompt: string;
}

// ---------------------------------------------------------------------------
// Main export: buildPixelPrompt
// ---------------------------------------------------------------------------

export function buildPixelPrompt(opts: BuildPixelPromptOptions): PixelPromptResult {
  const {
    concept,
    width   = 64,
    height  = 64,
    spriteType,
    era,
    paletteSize: explicitPalette,
    frameCount,
  } = opts;

  const maxDim   = Math.max(width, height);
  const palette  = derivePaletteSize(maxDim, explicitPalette);
  const palLabel = derivePaletteDescriptor(palette, era);

  const parts: string[] = [];

  // 1. Hard size declaration — forces the model to think in pixel grid terms
  parts.push(`${width}x${height} pixel art`);

  // 2. User concept — preserved verbatim as the creative core
  if (concept.trim()) parts.push(concept.trim());

  // 3. Sprite-type suffix
  const typeSuffix = spriteType ? TOOL_SUFFIXES[spriteType] ?? '' : '';
  if (typeSuffix) parts.push(typeSuffix);

  // 4. Animation frame layout
  if (spriteType === 'animation' && frameCount && frameCount > 1) {
    parts.push(
      `sprite sheet, ${frameCount} frames horizontal layout, ${width}x${height} per frame, consistent character across all frames`,
    );
  }

  // 5. Palette enforcement
  parts.push(palLabel);

  // 6. Hard pixel art quality constraints
  parts.push(
    'pixel art character sprite sheet',
    'hard pixel edges',
    'no anti-aliasing',
    'transparent background PNG',
    'game sprite',
    'masterful pixel art',
    'crisp pixel grid',
  );

  // Deduplicate while preserving order
  const seen  = new Set<string>();
  const final: string[] = [];
  for (const raw of parts) {
    for (const tok of raw.split(/,\s*/)) {
      const key = tok.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        final.push(tok.trim());
      }
    }
  }

  const negParts: string[] = [
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
    // Wrong format
    'white background', 'grey background', 'background elements',
    'drop shadow', 'glow effect', 'particle effects',
    // AI artifacts
    'multiple characters', 'duplicate', 'mirror image', 'extra limbs',
    'deformed', 'mutated', 'text', 'watermark', 'signature', 'artist name',
    'frame', 'border', 'grid lines', 'ui elements outside sprite',
  ];

  return {
    prompt:    final.join(', '),
    negPrompt: negParts.join(', '),
  };
}
