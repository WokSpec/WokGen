/**
 * WokGen — Per-Preset Quality Profiles
 *
 * Optimal steps / CFG scale per style preset.
 * When the client does not supply explicit steps/guidance values,
 * route.ts reads from this profile rather than using model defaults.
 *
 * These values are derived from empirical testing per preset type:
 * — More steps = more detail, slower (use sparingly for complex presets)
 * — Higher guidance = more literal prompt adherence (risk: artifacts at >10)
 * — Lower guidance = more creative / painterly results
 *
 * PRIVATE — do not export from packages/prompts or modes/ OSS stubs.
 */

export interface QualityProfile {
  steps: number;
  guidance: number;
}

export const QUALITY_PROFILES: Record<string, QualityProfile> = {
  // ── High-detail presets (complex faces, anatomy, fine texture) ───────────
  portrait:        { steps: 30, guidance: 8.5 },
  chibi:           { steps: 28, guidance: 8.0 },
  character_idle:  { steps: 28, guidance: 8.0 },
  character_side:  { steps: 28, guidance: 8.0 },
  top_down_char:   { steps: 25, guidance: 7.5 },

  // ── Isometric / perspective-critical presets ─────────────────────────────
  isometric:       { steps: 28, guidance: 8.5 },

  // ── Item / icon presets (silhouette clarity > fine detail) ───────────────
  rpg_icon:        { steps: 20, guidance: 7.5 },
  weapon_icon:     { steps: 20, guidance: 7.5 },
  badge_icon:      { steps: 18, guidance: 7.0 },
  emoji:           { steps: 18, guidance: 7.0 },

  // ── Tileset presets (tileability > detail) ───────────────────────────────
  tileset:         { steps: 20, guidance: 7.0 },
  nature_tile:     { steps: 20, guidance: 7.0 },

  // ── Effect / animation presets (color pop > detail) ──────────────────────
  animated_effect: { steps: 18, guidance: 6.5 },

  // ── Sheet / multi-frame presets ──────────────────────────────────────────
  sprite_sheet:    { steps: 25, guidance: 7.5 },

  // ── Atmospheric / stylistic presets ──────────────────────────────────────
  horror:          { steps: 22, guidance: 7.5 },
  sci_fi:          { steps: 22, guidance: 7.5 },

  // ── UI / HUD presets ─────────────────────────────────────────────────────
  game_ui:         { steps: 18, guidance: 7.0 },

  // ── Minimal steering ─────────────────────────────────────────────────────
  raw:             { steps: 20, guidance: 7.5 },

  // ── Default fallback ─────────────────────────────────────────────────────
  default:         { steps: 20, guidance: 7.5 },
};

/**
 * Resolve quality profile for a given preset.
 * Returns default profile if preset is not in the map.
 */
export function resolveQualityProfile(preset: string | undefined): QualityProfile {
  if (!preset) return QUALITY_PROFILES.default;
  return QUALITY_PROFILES[preset] ?? QUALITY_PROFILES.default;
}
