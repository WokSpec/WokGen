/**
 * WokGen — Batch Variant Prompt Mutation
 *
 * Prevents hallucination collapse in batch generation.
 * Each batch slot receives a semantically distinct prompt mutation so the
 * model produces genuine variants rather than 4 copies of the same image.
 *
 * Index 0 = canonical (unchanged)
 * Index 1 = perspective / pose shift
 * Index 2 = lighting / mood shift
 * Index 3 = detail density / color variant
 */

import type { StylePreset } from './providers/types';

// ---------------------------------------------------------------------------
// Preset-aware mutation tables
// ---------------------------------------------------------------------------

type MutationSet = [string, string, string]; // indices 1, 2, 3

const CHARACTER_MUTATIONS: MutationSet = [
  'dynamic action pose, slight angle',
  'expressive stance, subtle color shift',
  'alternate palette color variant, same character',
];

const ITEM_MUTATIONS: MutationSet = [
  'alternate viewing angle, rotated slightly',
  'battle-worn weathered version',
  'glowing enchanted magical version',
];

const TILE_MUTATIONS: MutationSet = [
  'worn aged variant, subtle scratches',
  'wet mossy overgrown version',
  'cracked broken damaged variation',
];

const EFFECT_MUTATIONS: MutationSet = [
  'burst peak frame, maximum intensity',
  'dissipating fade-out frame',
  'impact flash frame, bright center',
];

const UI_MUTATIONS: MutationSet = [
  'hover state appearance, slightly highlighted',
  'pressed active state, depressed look',
  'disabled muted state, reduced opacity feel',
];

const PORTRAIT_MUTATIONS: MutationSet = [
  'slightly different expression, same character',
  'alternate lighting direction, same face',
  'alternate color mood, warm vs cool tones',
];

const DEFAULT_MUTATIONS: MutationSet = [
  'slightly different angle',
  'alternate mood lighting',
  'alternate color palette variant',
];

// Map preset → mutation set
const PRESET_MUTATION_MAP: Partial<Record<StylePreset, MutationSet>> = {
  character_idle:  CHARACTER_MUTATIONS,
  character_side:  CHARACTER_MUTATIONS,
  top_down_char:   CHARACTER_MUTATIONS,
  chibi:           CHARACTER_MUTATIONS,
  horror:          CHARACTER_MUTATIONS,
  rpg_icon:        ITEM_MUTATIONS,
  weapon_icon:     ITEM_MUTATIONS,
  badge_icon:      ITEM_MUTATIONS,
  emoji:           ITEM_MUTATIONS,
  tileset:         TILE_MUTATIONS,
  nature_tile:     TILE_MUTATIONS,
  animated_effect: EFFECT_MUTATIONS,
  game_ui:         UI_MUTATIONS,
  portrait:        PORTRAIT_MUTATIONS,
  isometric:       [...TILE_MUTATIONS] as MutationSet,
  sprite_sheet:    CHARACTER_MUTATIONS,
  sci_fi:          ITEM_MUTATIONS,
  raw:             DEFAULT_MUTATIONS,
};

// ---------------------------------------------------------------------------
// Tool-level perspective prefixes (index 1 only — overrides preset for index 1)
// ---------------------------------------------------------------------------

const TOOL_PERSPECTIVE: Partial<Record<string, string>> = {
  generate: '',       // handled by preset
  scene:    'wider environmental view, same style',
  inpaint:  '',       // not used in batch
  rotate:   '',       // not used in batch
  animate:  '',       // not used in batch
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Mutate a base prompt for a specific batch slot.
 *
 * @param basePrompt  — The user's original prompt (already assembled).
 * @param variantIndex — 0 = unchanged, 1–3 = semantic mutations.
 * @param tool        — Current generation tool.
 * @param preset      — Active style preset.
 * @returns The mutated prompt string.
 */
export function buildVariantPrompt(
  basePrompt: string,
  variantIndex: number,
  tool: string,
  preset: StylePreset | string | undefined,
): string {
  // Slot 0 is always the canonical prompt — no mutation
  if (variantIndex === 0) return basePrompt;

  // Clamp to range [1, 3]
  const idx = Math.max(1, Math.min(3, variantIndex)) - 1; // 0-indexed into MutationSet

  const resolvedPreset = (preset as StylePreset | undefined) ?? 'raw';
  const mutations = PRESET_MUTATION_MAP[resolvedPreset] ?? DEFAULT_MUTATIONS;

  // Tool-level perspective override for index 1
  if (idx === 0 && tool && TOOL_PERSPECTIVE[tool]) {
    const toolMod = TOOL_PERSPECTIVE[tool]!;
    if (toolMod) {
      return `${basePrompt}, ${toolMod}`;
    }
  }

  const modifier = mutations[idx];
  return `${basePrompt}, ${modifier}`;
}
