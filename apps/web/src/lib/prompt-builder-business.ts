// WokGen — Business Prompt Builder
// Completely separate from pixel prompt builder.
// Business vocabulary is the opposite: professional, clean, no pixel art.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BusinessTool =
  | 'logo'
  | 'brand-kit'
  | 'slide'
  | 'social'
  | 'web-hero';

export type BusinessStyle =
  | 'minimal_flat'
  | 'bold_geometric'
  | 'corporate_clean'
  | 'photography_overlay'
  | 'monochrome'
  | 'gradient_modern'
  | 'tech_dark'
  | 'warm_brand';

export type BusinessMood =
  | 'professional'
  | 'playful'
  | 'bold'
  | 'minimal'
  | 'luxury'
  | 'technical';

export type BusinessPlatform =
  | 'twitter_header'
  | 'twitter_post'
  | 'og_image'
  | 'instagram_square'
  | 'instagram_story'
  | 'linkedin_banner'
  | 'youtube_art'
  | 'youtube_thumbnail'
  | 'tiktok_cover';

export type BusinessTextZone = 'center' | 'left' | 'right' | 'none';

export interface BusinessPromptParams {
  tool: BusinessTool;
  concept: string;
  industry?: string;
  style?: BusinessStyle;
  mood?: BusinessMood;
  platform?: BusinessPlatform;
  colorDirection?: string;
  textZone?: BusinessTextZone;
  seed?: number;
  // Brand kit: which image in the 4-pack is being generated (1-4)
  brandKitIndex?: 1 | 2 | 3 | 4;
}

export interface BuiltBusinessPrompt {
  prompt: string;
  negPrompt: string;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Token maps
// ---------------------------------------------------------------------------

const STYLE_TOKENS: Record<BusinessStyle, string[]> = {
  minimal_flat:        ['flat design', 'minimalist', 'white space', 'clean lines', 'simple shapes', 'modern design'],
  bold_geometric:      ['bold geometric shapes', 'strong composition', 'high contrast', 'graphic poster design', 'geometric abstraction'],
  corporate_clean:     ['corporate design', 'professional', 'polished', 'executive aesthetic', 'business visual identity'],
  photography_overlay: ['atmospheric photography style', 'cinematic quality', 'depth of field', 'dramatic lighting', 'photorealistic'],
  monochrome:          ['black and white', 'monochromatic', 'high contrast grayscale', 'editorial design'],
  gradient_modern:     ['smooth gradient', 'vibrant color transition', 'contemporary design', 'colorful gradient'],
  tech_dark:           ['dark background', 'tech aesthetic', 'subtle glow effect', 'dark UI design', 'sleek digital'],
  warm_brand:          ['warm color palette', 'approachable design', 'friendly aesthetic', 'organic shapes', 'inviting brand'],
};

const MOOD_TOKENS: Record<BusinessMood, string[]> = {
  professional: ['professional', 'trustworthy', 'authoritative', 'reliable'],
  playful:      ['playful', 'energetic', 'fun', 'vibrant', 'expressive'],
  bold:         ['bold', 'confident', 'impactful', 'strong statement'],
  minimal:      ['minimal', 'understated', 'refined', 'quiet confidence'],
  luxury:       ['luxury', 'premium', 'sophisticated', 'elegant', 'exclusive'],
  technical:    ['technical precision', 'systematic', 'analytical', 'structured'],
};

const PLATFORM_DIMENSIONS: Record<BusinessPlatform, { width: number; height: number; label: string }> = {
  twitter_header:    { width: 1500, height: 500,  label: 'Twitter/X header' },
  twitter_post:      { width: 1080, height: 1080, label: 'Twitter/X post' },
  og_image:          { width: 1200, height: 630,  label: 'OG meta image' },
  instagram_square:  { width: 1080, height: 1080, label: 'Instagram post' },
  instagram_story:   { width: 1080, height: 1920, label: 'Instagram story' },
  linkedin_banner:   { width: 1584, height: 396,  label: 'LinkedIn banner' },
  youtube_art:       { width: 2560, height: 1440, label: 'YouTube channel art' },
  youtube_thumbnail: { width: 1280, height: 720,  label: 'YouTube thumbnail' },
  tiktok_cover:      { width: 1080, height: 1920, label: 'TikTok cover' },
};

// Universal business negative prompt — applied to all business generations
const BUSINESS_BASE_NEGATIVE = [
  'pixel art', '8-bit', 'retro game', 'sprite', 'low resolution', 'pixelated',
  'cartoon character', 'anime', 'chibi', 'watermark', 'text overlay',
  'low quality', 'blurry', 'distorted', 'JPEG artifacts', 'overexposed',
  'bad composition', 'amateur design', 'clip art',
].join(', ');

// Tool-specific negative prompts
const TOOL_NEGATIVE_EXTRA: Partial<Record<BusinessTool, string>> = {
  'logo':      'multiple logos, busy background, complex scene, text, letters, words, busy pattern',
  'brand-kit': 'inconsistent style, multiple styles, clashing colors',
  'slide':     'faces, people, text, navigation bars, UI elements, buttons',
  'social':    'watermark, copyright text, logo of other brands',
  'web-hero':  'UI elements, navigation, buttons, text, overlapping elements',
};

// ---------------------------------------------------------------------------
// Brand kit image specs (4-pack)
// ---------------------------------------------------------------------------
const BRAND_KIT_SPECS = [
  { index: 1 as const, label: 'brand icon',       width: 512,  height: 512,  suffix: 'square logo mark, symbol only, centered' },
  { index: 2 as const, label: 'brand header',      width: 1200, height: 400,  suffix: 'wide header banner, horizontal composition' },
  { index: 3 as const, label: 'social profile',    width: 500,  height: 500,  suffix: 'social profile image, circular-safe composition' },
  { index: 4 as const, label: 'OG meta image',     width: 1200, height: 630,  suffix: 'website OG image, text-safe left zone' },
];

// ---------------------------------------------------------------------------
// Text zone tokens
// ---------------------------------------------------------------------------
const TEXT_ZONE_TOKENS: Record<BusinessTextZone, string> = {
  center: 'centered composition, visual interest on left and right edges, clear center area',
  left:   'main visual on the right side, left third clear and minimal for text overlay',
  right:  'main visual on the left side, right third clear and minimal for text overlay',
  none:   'full bleed composition, edge-to-edge visual interest',
};

// ---------------------------------------------------------------------------
// Core prompt assembler
// ---------------------------------------------------------------------------

export function buildBusinessPrompt(params: BusinessPromptParams): BuiltBusinessPrompt {
  const {
    tool,
    concept,
    industry,
    style = 'corporate_clean',
    mood = 'professional',
    platform,
    colorDirection,
    textZone = 'none',
    brandKitIndex,
  } = params;

  const styleTokens = STYLE_TOKENS[style] ?? STYLE_TOKENS.corporate_clean;
  const moodTokens  = MOOD_TOKENS[mood]   ?? MOOD_TOKENS.professional;
  const styleStr    = styleTokens.join(', ');
  const moodStr     = moodTokens.join(', ');

  const industryStr = industry ? `, ${industry} industry` : '';
  const colorStr    = colorDirection ? `, ${colorDirection} color palette` : '';

  let prompt = '';
  let width  = 1024;
  let height = 1024;

  switch (tool) {
    case 'logo': {
      prompt = [
        `${concept}${industryStr} brand logo symbol`,
        styleStr,
        moodStr,
        'icon mark design, single concept, centered composition',
        'isolated on white background, brand identity design',
        colorStr,
        'professional logo design, scalable symbol, distinctive mark',
      ].filter(Boolean).join(', ');
      width  = 512;
      height = 512;
      break;
    }

    case 'brand-kit': {
      const spec = BRAND_KIT_SPECS.find(s => s.index === (brandKitIndex ?? 1)) ?? BRAND_KIT_SPECS[0];
      prompt = [
        `${concept}${industryStr} brand identity, ${spec.label}`,
        styleStr,
        moodStr,
        spec.suffix,
        colorStr,
        'cohesive brand design, professional brand identity',
      ].filter(Boolean).join(', ');
      width  = spec.width;
      height = spec.height;
      break;
    }

    case 'slide': {
      const aspectLabel = width > height ? 'widescreen 16:9' : 'square format';
      prompt = [
        `${concept}${industryStr} presentation background`,
        styleStr,
        moodStr,
        `${aspectLabel}, full bleed background`,
        'professional slide design, clean presentation visual',
        'text-safe composition, no text elements',
        colorStr,
      ].filter(Boolean).join(', ');
      width  = 1920;
      height = 1080;
      break;
    }

    case 'social': {
      const dims   = platform ? PLATFORM_DIMENSIONS[platform] : PLATFORM_DIMENSIONS.og_image;
      const platLabel = platform ? PLATFORM_DIMENSIONS[platform].label : 'social media image';
      prompt = [
        `${concept}${industryStr}, ${platLabel} visual`,
        styleStr,
        moodStr,
        'eye-catching social media design, professional marketing asset',
        colorStr,
        TEXT_ZONE_TOKENS[textZone],
      ].filter(Boolean).join(', ');
      width  = dims.width;
      height = dims.height;
      break;
    }

    case 'web-hero': {
      prompt = [
        `${concept}${industryStr} website hero section background`,
        styleStr,
        moodStr,
        'atmospheric hero image, full-bleed web design background',
        'high quality, intended for text overlay',
        TEXT_ZONE_TOKENS[textZone],
        colorStr,
      ].filter(Boolean).join(', ');
      width  = 1920;
      height = 1080;
      break;
    }
    default: {
      // Fallback for unknown/unmapped tools — generic professional visual
      prompt = [
        `${concept}${industryStr} professional visual`,
        styleStr,
        moodStr,
        'clean composition, high quality business design',
        colorStr,
      ].filter(Boolean).join(', ');
      width  = 1024;
      height = 1024;
      break;
    }
  }

  const negExtra = TOOL_NEGATIVE_EXTRA[tool] ?? '';
  const negPrompt = [BUSINESS_BASE_NEGATIVE, negExtra].filter(Boolean).join(', ');

  return { prompt, negPrompt, width, height };
}

// ---------------------------------------------------------------------------
// Brand kit: generate params for all 4 images
// ---------------------------------------------------------------------------
export function buildBrandKitPrompts(params: Omit<BusinessPromptParams, 'brandKitIndex'>) {
  return BRAND_KIT_SPECS.map(spec =>
    buildBusinessPrompt({ ...params, tool: 'brand-kit', brandKitIndex: spec.index })
  );
}

// ---------------------------------------------------------------------------
// Platform dimensions helper (used by studio UI to set aspect ratio)
// ---------------------------------------------------------------------------
export function getPlatformDimensions(platform: BusinessPlatform) {
  return PLATFORM_DIMENSIONS[platform];
}

export { PLATFORM_DIMENSIONS, BRAND_KIT_SPECS };
