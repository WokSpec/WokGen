/**
 * WokGen — Prompt Engine Adapter
 *
 * Thin adapter that routes to the OSS stub or the production engine
 * based on the PROMPT_ENGINE environment variable.
 *
 * PROMPT_ENGINE=oss      → uses packages/prompts/src/stub.ts (OSS quality)
 * PROMPT_ENGINE=wokspec  → uses apps/web/src/lib/prompt-builder.ts (production quality)
 * (default: wokspec in hosted, oss when no internal engine is configured)
 *
 * This is the clean boundary between open-source and proprietary implementations.
 * Both sides expose the same interface — callers don't need to know which is active.
 *
 * Self-hosted users: PROMPT_ENGINE=oss is the right choice. It produces
 * functional pixel art and business prompts using the OSS stub.
 */

import type { PixelEra, AssetCategory, BackgroundMode, OutlineStyle, PaletteSize } from './prompt-builder';

// ---------------------------------------------------------------------------
// Engine selection
// ---------------------------------------------------------------------------

const engine = process.env.PROMPT_ENGINE ?? 'wokspec';

// ---------------------------------------------------------------------------
// Shared interface
// ---------------------------------------------------------------------------

export interface PixelPromptInput {
  tool: string;
  userPrompt: string;
  stylePreset?: string;
  assetCategory?: AssetCategory;
  pixelEra?: PixelEra;
  backgroundMode?: BackgroundMode;
  outlineStyle?: OutlineStyle;
  paletteSize?: PaletteSize;
}

export interface PixelPromptOutput {
  prompt: string;
  negPrompt: string;
}

// ---------------------------------------------------------------------------
// Adapter — routes to OSS stub or production engine
// ---------------------------------------------------------------------------

export async function buildPromptAdapter(input: PixelPromptInput): Promise<PixelPromptOutput> {
  if (engine === 'oss') {
    // OSS stub — generic quality, no proprietary token chains
    // OSS stub is in packages/prompts/src/stub.ts
    // Self-hosted: copy stub.ts logic here or reference it via your own import
    return {
      prompt:    [
        'pixel art', 'game asset',
        input.backgroundMode === 'scene' ? 'environmental background' : 'transparent background',
        input.stylePreset,
        input.assetCategory,
        input.userPrompt,
      ].filter(Boolean).join(', '),
      negPrompt: 'blurry, anti-aliased, photorealistic, smooth shading, 3D render, text, watermark, low quality',
    };
  }

  // Production engine (default) — full internal implementation
  const { buildPrompt, buildNegativePrompt } = await import('./prompt-builder');
  return {
    prompt:    buildPrompt({
      tool:           input.tool as import('./providers/types').Tool,
      userPrompt:     input.userPrompt,
      stylePreset:    input.stylePreset as import('./providers/types').StylePreset | undefined,
      assetCategory:  input.assetCategory,
      pixelEra:       input.pixelEra,
      backgroundMode: input.backgroundMode,
      outlineStyle:   input.outlineStyle,
      paletteSize:    input.paletteSize,
    }),
    negPrompt: buildNegativePrompt({
      assetCategory: input.assetCategory,
      pixelEra:      input.pixelEra,
    }),
  };
}

