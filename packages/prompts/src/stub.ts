/**
 * WokGen Prompts — OSS Stub Implementation
 *
 * This is a functional but generic prompt builder for OSS deployments.
 * It produces recognizable, usable outputs without the production-grade
 * token engineering that WokSpec uses in the hosted platform.
 *
 * Differences from the production implementation:
 * - Uses basic quality anchors (not the curated token chains)
 * - Does not use the preset-specific model tuning parameters
 * - Does not include the proprietary quality layers that improve outputs
 *
 * For OSS self-hosted deployments: this is sufficient to run the platform
 * and generate useful assets. For production WokSpec quality: the hosted
 * platform at wokgen.wokspec.org uses a private implementation.
 *
 * To use your own prompt engine:
 *   Set PROMPT_ENGINE=oss in your environment (default behavior)
 *   Or implement the PromptEngine interface and swap it in prompt-engine.ts
 */

// ---------------------------------------------------------------------------
// OSS Pixel Prompt Builder
// ---------------------------------------------------------------------------

export interface PixelPromptParams {
  prompt: string;
  preset?: string;
  category?: string;
  era?: string;
  backgroundMode?: string;
  outlineStyle?: string;
}

/**
 * Build a pixel art prompt for OSS deployments.
 * Prepends standard pixel art anchors and appends preset/category context.
 */
export function buildPixelPromptOSS(params: PixelPromptParams): string {
  const parts: string[] = [];

  // Base pixel art anchors
  parts.push('pixel art', 'game asset');

  // Background context
  if (params.backgroundMode === 'transparent' || !params.backgroundMode) {
    parts.push('transparent background');
  } else if (params.backgroundMode === 'dark') {
    parts.push('dark background');
  } else if (params.backgroundMode === 'scene') {
    parts.push('environmental background');
  }

  // Pixel era
  if (params.era && params.era !== 'none') {
    const eraLabels: Record<string, string> = {
      nes:     '8-bit NES style',
      gameboy: 'Game Boy monochrome style',
      snes:    '16-bit SNES style',
      gba:     '32-bit GBA style',
      modern:  'modern high-resolution pixel art',
    };
    parts.push(eraLabels[params.era] ?? params.era);
  }

  // Preset context
  if (params.preset && params.preset !== 'raw') {
    parts.push(params.preset.replace(/_/g, ' '));
  }

  // Category context
  if (params.category && params.category !== 'none') {
    parts.push(params.category.replace(/_/g, ' '));
  }

  // User prompt
  parts.push(params.prompt);

  // Outline
  if (params.outlineStyle && params.outlineStyle !== 'none') {
    parts.push(`${params.outlineStyle} outline`);
  }

  return parts.filter(Boolean).join(', ');
}

// ---------------------------------------------------------------------------
// OSS Negative Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Build a basic negative prompt for OSS deployments.
 * Includes the most impactful quality negatives without the full bank.
 */
export function buildNegativePromptOSS(): string {
  return [
    'blurry',
    'anti-aliased',
    'photorealistic',
    'smooth shading',
    '3D render',
    'text',
    'watermark',
    'low quality',
    'bad anatomy',
  ].join(', ');
}

// ---------------------------------------------------------------------------
// OSS Business Prompt Builder
// ---------------------------------------------------------------------------

export interface BusinessPromptParams {
  prompt: string;
  tool?: string;
  style?: string;
  industry?: string;
}

/**
 * Build a business asset prompt for OSS deployments.
 */
export function buildBusinessPromptOSS(params: BusinessPromptParams): string {
  const parts: string[] = [];

  // Tool context
  const toolLabel: Record<string, string> = {
    logo:       'logo design',
    'brand-kit': 'brand identity visual',
    slide:      'presentation slide visual',
    banner:     'social media banner',
    'web-hero': 'web hero section image',
    icon:       'professional icon',
  };
  if (params.tool && toolLabel[params.tool]) {
    parts.push(toolLabel[params.tool]);
  }

  // Style
  if (params.style) parts.push(params.style);

  // Industry
  if (params.industry) parts.push(`${params.industry} industry`);

  // User prompt
  parts.push(params.prompt);

  // Base quality anchors
  parts.push('professional design', 'clean layout', 'high quality');

  return parts.filter(Boolean).join(', ');
}
