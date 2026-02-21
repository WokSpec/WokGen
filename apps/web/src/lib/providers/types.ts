// ---------------------------------------------------------------------------
// WokGen — shared provider types
// ---------------------------------------------------------------------------

// Tool identifiers
export type Tool = 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';

// Provider identifiers
export type ProviderName = 'replicate' | 'fal' | 'together' | 'comfyui';

// Canonical export pixel sizes
export type PixelSize = 32 | 64 | 128 | 256 | 512;

// ---------------------------------------------------------------------------
// GenerateParams — unified input shape accepted by all providers
// ---------------------------------------------------------------------------
export interface GenerateParams {
  /** Which studio tool is calling */
  tool: Tool;

  /** Main generation prompt */
  prompt: string;

  /** Negative prompt (optional; ignored by providers that don't support it) */
  negPrompt?: string;

  /** Output width in pixels — provider may snap to nearest valid size */
  width?: number;

  /** Output height in pixels */
  height?: number;

  /** Deterministic seed; 0 or undefined = random */
  seed?: number;

  /** Number of denoising steps (provider-specific default used if omitted) */
  steps?: number;

  /** Classifier-free guidance scale */
  guidance?: number;

  /**
   * Override the default model selection logic.
   * Format: "<owner>/<name>:<version>" for Replicate versioned models,
   *          "<owner>/<name>" for latest, or a fal/together model ID.
   */
  modelOverride?: string;

  /**
   * Style preset tag — translated into prompt tokens by each provider module.
   * e.g. "rpg_icon" | "emoji" | "tileset" | "sprite_sheet" | "raw"
   */
  stylePreset?: StylePreset;

  /**
   * For rotate tool: number of directions (4 or 8)
   */
  directions?: 4 | 8;

  /**
   * For inpaint tool: base64-encoded PNG mask (white = inpaint region)
   */
  maskBase64?: string;

  /**
   * For inpaint tool: base64-encoded source PNG
   */
  imageBase64?: string;

  /**
   * For animate tool: base64-encoded source sprite
   */
  sourceImageBase64?: string;

  /** Free-form extra params forwarded as-is to the provider */
  extra?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Style preset tokens
// ---------------------------------------------------------------------------
export type StylePreset =
  | 'rpg_icon'      // Classic RPG inventory icon — dark bg, bold silhouette
  | 'emoji'         // Emoji-scale, bright, simple
  | 'tileset'       // Seamlessly tileable flat tile
  | 'sprite_sheet'  // Multiple poses on one sheet
  | 'raw'           // Minimal steering — model defaults
  | 'game_ui';      // UI widget / HUD element

export const STYLE_PRESET_LABELS: Record<StylePreset, string> = {
  rpg_icon:     'RPG Icon',
  emoji:        'Emoji',
  tileset:      'Tileset',
  sprite_sheet: 'Sprite Sheet',
  raw:          'Raw (no preset)',
  game_ui:      'Game UI',
};

/** Extra prompt tokens appended per preset */
export const STYLE_PRESET_TOKENS: Record<StylePreset, string> = {
  rpg_icon:
    'game inventory icon, RPG item, dark background, bold readable silhouette, crisp outlines',
  emoji:
    'emoji icon, bright colors, simple shape, no background, very small scale readability',
  tileset:
    'seamless tile, flat perspective, repeating texture, top-down game tileset, no border',
  sprite_sheet:
    'multiple poses grid, sprite sheet layout, consistent character scale, side view',
  raw: '',
  game_ui:
    'game HUD element, UI widget, flat design, dark theme, readable at small size',
};

// ---------------------------------------------------------------------------
// GenerateResult — unified output shape returned by all providers
// ---------------------------------------------------------------------------
export interface GenerateResult {
  /** Provider that produced this result */
  provider: ProviderName;

  /** Provider-native job/prediction ID for reference */
  providerJobId?: string;

  /** Primary image URL (remote CDN or data: URI for local providers) */
  resultUrl: string | null;

  /** Additional image URLs for multi-output tools (rotate, scenes) */
  resultUrls?: string[];

  /** Wall-clock milliseconds the provider took to generate */
  durationMs?: number;

  /** Resolved seed used (provider may echo back a randomised seed) */
  resolvedSeed?: number;
}

// ---------------------------------------------------------------------------
// ProviderError — enriched Error subtype thrown by all provider modules
// ---------------------------------------------------------------------------
export interface ProviderError extends Error {
  provider?: ProviderName;
  providerJobId?: string;
  jobId?: string;
  statusCode?: number;
}

// ---------------------------------------------------------------------------
// ProviderConfig — runtime config resolved from env + request headers
// ---------------------------------------------------------------------------
export interface ProviderConfig {
  /** API key for cloud providers; ignored for comfyui */
  apiKey: string;

  /** ComfyUI host URL (default: http://127.0.0.1:8188) */
  comfyuiHost?: string;

  /** Timeout in milliseconds for the full generation (default: 300_000) */
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// ProviderCapability — what each provider supports
// ---------------------------------------------------------------------------
export interface ProviderCapability {
  generate: boolean;
  animate: boolean;
  rotate: boolean;
  inpaint: boolean;
  scene: boolean;
  maxWidth: number;
  maxHeight: number;
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
  free: boolean;
  requiresKey: boolean;
}

export const PROVIDER_CAPABILITIES: Record<ProviderName, ProviderCapability> = {
  replicate: {
    generate: true,
    animate: true,
    rotate: true,
    inpaint: true,
    scene: true,
    maxWidth: 1024,
    maxHeight: 1024,
    supportsSeed: true,
    supportsNegativePrompt: true,
    free: false,
    requiresKey: true,
  },
  fal: {
    generate: true,
    animate: false,
    rotate: true,
    inpaint: false,
    scene: true,
    maxWidth: 1024,
    maxHeight: 1024,
    supportsSeed: true,
    supportsNegativePrompt: true,
    free: false,
    requiresKey: true,
  },
  together: {
    generate: true,
    animate: false,
    rotate: false,
    inpaint: false,
    scene: true,
    maxWidth: 1024,
    maxHeight: 1024,
    supportsSeed: true,
    supportsNegativePrompt: false,
    free: true,
    requiresKey: true,
  },
  comfyui: {
    generate: true,
    animate: true,
    rotate: true,
    inpaint: true,
    scene: true,
    maxWidth: 2048,
    maxHeight: 2048,
    supportsSeed: true,
    supportsNegativePrompt: true,
    free: true,
    requiresKey: false,
  },
};

// ---------------------------------------------------------------------------
// ProviderMeta — display info for each provider
// ---------------------------------------------------------------------------
export interface ProviderMeta {
  id: ProviderName;
  label: string;
  description: string;
  docsUrl: string;
  keyEnvVar: string | null;
  keyLabel: string | null;
  freeCredits: boolean;
  freeCreditsNote: string;
  color: string;
}

export const PROVIDER_META: Record<ProviderName, ProviderMeta> = {
  replicate: {
    id: 'replicate',
    label: 'Replicate',
    description: 'Run SDXL and FLUX models in the cloud. Free credits for new users.',
    docsUrl: 'https://replicate.com/account/api-tokens',
    keyEnvVar: 'REPLICATE_API_TOKEN',
    keyLabel: 'API Token',
    freeCredits: true,
    freeCreditsNote: 'Free credits for new accounts',
    color: '#0066FF',
  },
  fal: {
    id: 'fal',
    label: 'fal.ai',
    description: 'Fast inference with FLUX models. Free trial credits available.',
    docsUrl: 'https://fal.ai/dashboard/keys',
    keyEnvVar: 'FAL_KEY',
    keyLabel: 'API Key',
    freeCredits: true,
    freeCreditsNote: 'Free trial credits on signup',
    color: '#7B2FBE',
  },
  together: {
    id: 'together',
    label: 'Together.ai',
    description: 'FLUX.1-schnell-Free — unlimited free image generation.',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    keyEnvVar: 'TOGETHER_API_KEY',
    keyLabel: 'API Key',
    freeCredits: true,
    freeCreditsNote: 'FLUX.1-schnell-Free is fully free',
    color: '#00A67D',
  },
  comfyui: {
    id: 'comfyui',
    label: 'ComfyUI (Local)',
    description: 'Run your own local ComfyUI instance. 100% free, runs on your GPU.',
    docsUrl: 'https://github.com/comfyanonymous/ComfyUI',
    keyEnvVar: null,
    keyLabel: null,
    freeCredits: true,
    freeCreditsNote: 'Fully free — runs locally',
    color: '#E06C00',
  },
};
