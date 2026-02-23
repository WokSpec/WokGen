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
  /** Generation width in pixels (optional — used by mode-aware routing) */
  width?: number;
  /** Generation height in pixels (optional — used by mode-aware routing) */
  height?: number;
  /** Whether to request HD upscaling from the provider */
  upscaleToHD?: boolean;
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

  // ── UI/UX mode (mockup image generation) ─────────────────────────────────
  // Higher guidance for precise layout adherence; moderate steps for speed
  uiux_section:    { steps: 25, guidance: 8.0 },
  uiux_component:  { steps: 22, guidance: 8.0 },
  uiux_page:       { steps: 28, guidance: 8.5 },

  // ── Voice / Text modes — non-image; steps/guidance are not used
  // but entries are included for exhaustive coverage and future use.
  voice:           { steps: 1,  guidance: 1.0 },
  text:            { steps: 1,  guidance: 1.0 },
};

/**
 * Resolve quality profile for a given preset.
 * Returns default profile if preset is not in the map.
 */
export function resolveQualityProfile(preset: string | undefined): QualityProfile {
  if (!preset) return QUALITY_PROFILES.default;
  return QUALITY_PROFILES[preset] ?? QUALITY_PROFILES.default;
}

// ---------------------------------------------------------------------------
// Mode-aware quality profiles (steps + guidance tuned per mode + output type)
// ---------------------------------------------------------------------------

export const QUALITY_PROFILES_BY_MODE: Record<string, Record<string, QualityProfile>> = {
  pixel: {
    standard:  { steps: 30, guidance: 7.5, width: 512,  height: 512  },
    hd:        { steps: 50, guidance: 8.0, width: 1024, height: 1024, upscaleToHD: true },
    '16px':    { steps: 25, guidance: 9.0, width: 512,  height: 512  },
    '32px':    { steps: 28, guidance: 8.5, width: 512,  height: 512  },
    '64px':    { steps: 30, guidance: 8.0, width: 512,  height: 512  },
    '128px':   { steps: 35, guidance: 7.5, width: 1024, height: 1024 },
    '256px':   { steps: 40, guidance: 7.5, width: 1024, height: 1024, upscaleToHD: true },
    character: { steps: 32, guidance: 8.5, width: 512,  height: 512  },
    item:      { steps: 28, guidance: 8.5, width: 512,  height: 512  },
    tileset:   { steps: 28, guidance: 7.5, width: 512,  height: 512  },
    animation: { steps: 25, guidance: 8.0, width: 512,  height: 512  },
    scene:     { steps: 35, guidance: 7.5, width: 1024, height: 512  },
  },
  business: {
    standard:      { steps: 35, guidance: 7.0, width: 1024, height: 1024 },
    hd:            { steps: 50, guidance: 7.5, width: 1536, height: 1536, upscaleToHD: true },
    logo:          { steps: 40, guidance: 8.0, width: 1024, height: 1024 },
    'brand-kit':   { steps: 40, guidance: 7.5, width: 1024, height: 1024 },
    slide:         { steps: 35, guidance: 7.0, width: 1920, height: 1080 },
    social:        { steps: 35, guidance: 7.0, width: 1200, height: 630  },
    'square-post': { steps: 35, guidance: 7.0, width: 1080, height: 1080 },
    'web-hero':    { steps: 40, guidance: 7.0, width: 1920, height: 1080 },
  },
  vector: {
    standard:      { steps: 35, guidance: 7.0, width: 1024, height: 1024 },
    hd:            { steps: 50, guidance: 7.5, width: 2048, height: 2048, upscaleToHD: true },
    icon:          { steps: 30, guidance: 8.5, width: 512,  height: 512  },
    illustration:  { steps: 40, guidance: 7.0, width: 1024, height: 1024 },
    'logo-mark':   { steps: 35, guidance: 8.0, width: 1024, height: 1024 },
    pattern:       { steps: 35, guidance: 7.0, width: 1024, height: 1024 },
    'ui-component':{ steps: 28, guidance: 7.5, width: 512,  height: 512  },
  },
  emoji: {
    standard:  { steps: 25, guidance: 8.5, width: 512,  height: 512  },
    hd:        { steps: 35, guidance: 8.0, width: 1024, height: 1024, upscaleToHD: true },
    pack:      { steps: 25, guidance: 8.5, width: 512,  height: 512  },
    discord:   { steps: 28, guidance: 8.5, width: 512,  height: 512  },
    slack:     { steps: 25, guidance: 8.5, width: 512,  height: 512  },
    telegram:  { steps: 30, guidance: 8.0, width: 512,  height: 512  },
  },
  uiux: {
    standard:   { steps: 28, guidance: 8.0, width: 1024, height: 768  },
    hd:         { steps: 45, guidance: 8.5, width: 1920, height: 1080, upscaleToHD: true },
    section:    { steps: 28, guidance: 8.0, width: 1440, height: 900  },
    component:  { steps: 25, guidance: 8.0, width: 768,  height: 768  },
    page:       { steps: 35, guidance: 8.5, width: 1440, height: 900  },
    mobile:     { steps: 28, guidance: 8.0, width: 390,  height: 844  },
  },
};

/**
 * Resolve quality profile for a given mode + output type combination.
 * Falls back gracefully through: type → standard → global default.
 *
 * @param mode    — 'pixel' | 'business' | 'vector' | 'emoji' | 'uiux'
 * @param type    — mode-specific type key (e.g. 'logo', 'icon', '64px', 'character')
 * @param hd      — if true, prefer 'hd' profile
 */
export function getQualityProfile(
  mode: string,
  type: string,
  hd: boolean,
): QualityProfile {
  const modeProfiles = QUALITY_PROFILES_BY_MODE[mode];
  if (!modeProfiles) return QUALITY_PROFILES.default;
  if (hd && modeProfiles.hd) return modeProfiles.hd;
  return modeProfiles[type] ?? modeProfiles.standard ?? QUALITY_PROFILES.default;
}
