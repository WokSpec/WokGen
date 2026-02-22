/**
 * WokGen Pixel Mode — Schema
 *
 * TypeScript interfaces for the Pixel asset engine.
 * These are the public contracts. Implementation lives in apps/web/src/lib/.
 */

import type { BaseGenerateRequest, ModeContract, AssetExporter, ExportFormat } from '../../packages/core/src/index';

// ---------------------------------------------------------------------------
// Pixel mode contract declaration
// ---------------------------------------------------------------------------

export const PIXEL_MODE_CONTRACT: Pick<ModeContract, 'id' | 'name' | 'description' | 'targetAudience' | 'outputTypes' | 'exportFormats'> = {
  id:             'pixel',
  name:           'WokGen Pixel',
  description:    'Pixel art and sprite generation for game development',
  targetAudience: 'Game developers, indie game studios, pixel artists',
  outputTypes:    ['image/png', 'image/gif', 'image/png-strip'],
  exportFormats:  ['png', 'gif', 'zip'],
};

// ---------------------------------------------------------------------------
// Pixel style presets
// ---------------------------------------------------------------------------

export type PixelPreset =
  | 'rpg_icon'
  | 'emoji'
  | 'tileset'
  | 'sprite_sheet'
  | 'raw'
  | 'game_ui'
  | 'character_idle'
  | 'character_side'
  | 'top_down_char'
  | 'isometric'
  | 'chibi'
  | 'horror'
  | 'sci_fi'
  | 'nature_tile'
  | 'animated_effect'
  | 'portrait'
  | 'badge_icon'
  | 'weapon_icon';

// ---------------------------------------------------------------------------
// Asset categories
// ---------------------------------------------------------------------------

export type PixelAssetCategory =
  | 'weapon' | 'armor' | 'character' | 'monster' | 'consumable'
  | 'gem' | 'structure' | 'nature' | 'ui' | 'effect'
  | 'tile' | 'container' | 'portrait' | 'vehicle' | 'none';

// ---------------------------------------------------------------------------
// Pixel era / quality tier
// ---------------------------------------------------------------------------

export type PixelEra = 'nes' | 'gameboy' | 'snes' | 'gba' | 'modern' | 'none';

// ---------------------------------------------------------------------------
// Pixel generation request
// ---------------------------------------------------------------------------

export interface PixelGenerateRequest extends BaseGenerateRequest {
  mode: 'pixel';
  tool: 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';

  /** Style preset that controls output composition */
  stylePreset?: PixelPreset;

  /** Asset category that enriches the prompt */
  assetCategory?: PixelAssetCategory;

  /** Pixel era / generation tier */
  pixelEra?: PixelEra;

  /** Background rendering mode */
  backgroundMode?: 'transparent' | 'dark' | 'scene';

  /** Outline style */
  outlineStyle?: 'none' | 'thin' | 'thick' | 'glow';

  /** Maximum palette size (colors) */
  paletteSize?: 4 | 8 | 16 | 32 | 64 | 256;

  /** For animate tool: number of frames */
  animFrameCount?: number;

  /** For animate tool: frames per second */
  animFps?: number;

  /** For rotate tool: number of directions */
  directions?: 4 | 8;

  /** For batch generation: which variant this slot is (0=canonical) */
  variantIndex?: number;
}

// ---------------------------------------------------------------------------
// Pixel export formats
// ---------------------------------------------------------------------------

export type PixelExportFormat = 'png' | 'gif' | 'png-strip' | 'zip';

// ---------------------------------------------------------------------------
// Pixel exporter interface
// ---------------------------------------------------------------------------

/** Implement this to add a custom export format to Pixel mode */
export interface PixelExporter extends AssetExporter<string, Blob> {
  format: ExportFormat;
  /** Size hint for the export (e.g. 32x32, 64x64) */
  size?: number;
}
