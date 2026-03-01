// ---------------------------------------------------------------------------
// WokGen — shared provider types
// ---------------------------------------------------------------------------

// Tool identifiers
export type Tool = 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';

// Provider identifiers
export type ProviderName = 'replicate' | 'fal' | 'together' | 'comfyui' | 'pollinations' | 'huggingface' | 'stablehorde' | 'prodia';

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
   */
  stylePreset?: StylePreset;

  /**
   * Asset category — enriches prompt with category-specific tokens.
   * e.g. 'weapon' | 'character' | 'tile' | 'effect'
   */
  assetCategory?: import('../prompt-builder').AssetCategory;

  /**
   * Pixel era / quality tier — injects era-specific palette and style tokens.
   * e.g. 'nes' | 'snes' | 'gba' | 'modern'
   */
  pixelEra?: import('../prompt-builder').PixelEra;

  /**
   * Background mode for the generated asset.
   * 'transparent' = no background tokens, 'dark' = dark atmospheric bg,
   * 'scene' = full environmental context
   */
  backgroundMode?: import('../prompt-builder').BackgroundMode;

  /**
   * Outline style for the pixel art.
   */
  outlineStyle?: import('../prompt-builder').OutlineStyle;

  /**
   * Maximum colors in the palette (4/8/16/32/64/256).
   */
  paletteSize?: import('../prompt-builder').PaletteSize;

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

  /** Product line mode: pixel | business | vector | emoji | uiux */
  mode?: string;

  /** Whether HD quality was requested (affects model selection) */
  useHD?: boolean;
}

// ---------------------------------------------------------------------------
// Style preset tokens
// ---------------------------------------------------------------------------
export type StylePreset =
  | 'rpg_icon'          // Classic RPG inventory icon — dark bg, bold silhouette
  | 'emoji'             // Emoji-scale, bright, simple
  | 'tileset'           // Seamlessly tileable flat tile
  | 'sprite_sheet'      // Multiple poses on one sheet
  | 'raw'               // Minimal steering — model defaults
  | 'game_ui'           // UI widget / HUD element
  | 'character_idle'    // Standing game character, centered, front-facing
  | 'character_side'    // Side-scroller platformer character sprite
  | 'top_down_char'     // Top-down RPG character sprite
  | 'isometric'         // 3/4 isometric angle, dimetric projection
  | 'chibi'             // Super-deformed cute proportions
  | 'horror'            // Dark, desaturated, high contrast
  | 'sci_fi'            // Technological, metallic, neon accents
  | 'nature_tile'       // Organic, seamless, natural color palette
  | 'animated_effect'   // Bright, high-contrast, designed for animation
  | 'portrait'          // Character bust/face, detailed expression
  | 'badge_icon'        // App-style icon, flat colors, rounded form
  | 'weapon_icon';      // Weapon close-up, inventory item

export const STYLE_PRESET_LABELS: Record<StylePreset, string> = {
  rpg_icon:       'RPG Icon',
  emoji:          'Emoji',
  tileset:        'Tileset',
  sprite_sheet:   'Sprite Sheet',
  raw:            'Raw',
  game_ui:        'Game UI',
  character_idle: 'Character (Idle)',
  character_side: 'Character (Side)',
  top_down_char:  'Top-Down Char',
  isometric:      'Isometric',
  chibi:          'Chibi',
  horror:         'Horror',
  sci_fi:         'Sci-Fi',
  nature_tile:    'Nature Tile',
  animated_effect:'Animated Effect',
  portrait:       'Portrait',
  badge_icon:     'Badge Icon',
  weapon_icon:    'Weapon Icon',
};

/** Extra prompt tokens appended per preset */
export const STYLE_PRESET_TOKENS: Record<StylePreset, string> = {
  rpg_icon:
    'game inventory icon, RPG item, dark background, bold readable silhouette, crisp outlines, centered on canvas, single object',
  emoji:
    'emoji icon, bright saturated colors, simple bold shape, no background, very small scale readability, clean linework',
  tileset:
    'seamless tile, flat top-down perspective, repeating texture, no visible seams, game tileset, consistent color palette across tiles',
  sprite_sheet:
    'sprite sheet layout, multiple animation poses in grid, consistent scale throughout, uniform spacing between frames',
  raw: '',
  game_ui:
    'game HUD element, UI widget, flat design, dark theme, readable at small size, clean geometric shapes, minimal decoration',
  character_idle:
    'standing character pose, front-facing, centered on canvas, full body visible, consistent proportions, game sprite, idle stance',
  character_side:
    'side-scrolling character, lateral side view, profile facing right, full body, platformer game sprite, grounded stance',
  top_down_char:
    'top-down view character, bird eye perspective, overhead angle, RPG character, all limbs visible from above',
  isometric:
    'isometric perspective, 2:1 dimetric projection, 45-degree angle, 3/4 view, isometric game asset, consistent isometric grid',
  chibi:
    'chibi style, super-deformed proportions, oversized head, small body, 2:1 head to body ratio, cute and expressive, round features',
  horror:
    'dark horror style, desaturated muted palette, high contrast shadows, creepy atmosphere, gritty texture, visible grain, ominous',
  sci_fi:
    'sci-fi futuristic style, technological aesthetic, metallic surfaces, neon accent colors, clean geometric shapes, holographic glow',
  nature_tile:
    'organic natural tile, earthy color palette, varied organic texture, seamlessly tileable, forest or nature theme',
  animated_effect:
    'particle effect sprite, bright vivid colors, high contrast, magic or elemental visual, designed for loop animation, transparent-ready',
  portrait:
    'character portrait, bust shot, face and upper body, expressive features, detailed for size, centered composition',
  badge_icon:
    'badge or achievement icon, flat design, bold centered symbol, rounded silhouette, clear at small size, high contrast',
  weapon_icon:
    'weapon close-up, single weapon, game inventory icon, centered and upright, detailed texture, iconic silhouette, no hands',
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
  /** When true: this provider should be skipped and the next tried (e.g. credit depleted, quota exceeded) */
  skipProvider?: boolean;
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
  pollinations: {
    generate: true,
    animate: false,
    rotate: false,
    inpaint: false,
    scene: false,
    maxWidth: 1024,
    maxHeight: 1024,
    supportsSeed: true,
    supportsNegativePrompt: false,
    free: true,
    requiresKey: false,
  },
  huggingface: {
    generate: true,
    animate: false,
    rotate: false,
    inpaint: false,
    scene: false,
    maxWidth: 1024,
    maxHeight: 1024,
    supportsSeed: true,
    supportsNegativePrompt: true,
    free: true,
    requiresKey: false,
  },
  stablehorde: {
    generate: true,
    animate: false,
    rotate: false,
    inpaint: false,
    scene: false,
    maxWidth: 1024,
    maxHeight: 1024,
    supportsSeed: false,
    supportsNegativePrompt: true,
    free: true,
    requiresKey: false,
  },
  prodia: {
    generate: true,
    animate: false,
    rotate: false,
    inpaint: false,
    scene: false,
    maxWidth: 1024,
    maxHeight: 1024,
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
  pollinations: {
    id: 'pollinations',
    label: 'Pollinations.ai',
    description: 'Free FLUX generation. No account, no key, no limits.',
    docsUrl: 'https://pollinations.ai',
    keyEnvVar: null,
    keyLabel: null,
    freeCredits: true,
    freeCreditsNote: 'Completely free — no account needed',
    color: '#22c55e',
  },
  huggingface: {
    id: 'huggingface',
    label: 'Hugging Face',
    description: 'Free FLUX.1-schnell via HF Inference API. Free account token required.',
    docsUrl: 'https://huggingface.co/settings/tokens',
    keyEnvVar: 'HF_TOKEN',
    keyLabel: 'Access Token',
    freeCredits: true,
    freeCreditsNote: 'Free with a free HF account',
    color: '#ff9d00',
  },
  stablehorde: {
    id: 'stablehorde',
    label: 'Stable Horde',
    description: 'Federated volunteer GPU network. 300+ open-source models. Completely free — no account needed.',
    docsUrl: 'https://stablehorde.net',
    keyEnvVar: 'STABLE_HORDE_KEY',
    keyLabel: 'API Key (optional — free account key gets priority)',
    freeCredits: true,
    freeCreditsNote: 'Completely free — anonymous key works, free signup for priority',
    color: '#8b5cf6',
  },
  prodia: {
    id: 'prodia',
    label: 'Prodia',
    description: 'Free Stable Diffusion API. No key required. PRODIA_API_KEY unlocks higher rate limits.',
    docsUrl: 'https://docs.prodia.com',
    keyEnvVar: 'PRODIA_API_KEY',
    keyLabel: 'API Key (optional)',
    freeCredits: true,
    freeCreditsNote: 'Free without a key; key unlocks higher rate limits',
    color: '#f97316',
  },
};
