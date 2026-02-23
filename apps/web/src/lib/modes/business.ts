import type { ModeContract } from './types';

export const businessMode: ModeContract = {
  id: 'business',
  label: 'WokGen Business',
  shortLabel: 'Business',
  tagline: 'For brands and teams',
  description: 'Generate professional logos, brand kits, slide visuals, social banners, and web hero images.',
  accentColor: '#60a5fa',

  outputs: ['image'],
  exportFormats: ['png', 'zip'],

  sizeConstraints: {
    min: 512,
    max: 2048,
    defaults: [512, 1024, 2048],
    defaultSize: 1024,
    aspectRatios: [
      { id: '1:1',           label: 'Square (1:1)',          width: 1024, height: 1024  },
      { id: '16:9',          label: 'Widescreen (16:9)',      width: 1920, height: 1080  },
      { id: '4:3',           label: 'Standard (4:3)',         width: 1024, height: 768   },
      { id: '9:16',          label: 'Portrait (9:16)',        width: 1080, height: 1920  },
      { id: 'og',            label: 'OG Image (1200×630)',    width: 1200, height: 630   },
      { id: 'twitter_header',label: 'Twitter Header',         width: 1500, height: 500   },
      { id: 'linkedin',      label: 'LinkedIn Banner',        width: 1584, height: 396   },
    ],
  },

  tools: [
    {
      id: 'logo',
      label: 'Logo',
      description: 'Generate brand logo marks and symbols',
      maxBatch: 4,
      outputType: 'image',
      exportFormats: ['png'],
      aspectRatios: ['1:1'],
    },
    {
      id: 'brand-kit',
      label: 'Brand Kit',
      description: 'Generate a cohesive set of 4 brand assets in one pass',
      outputType: 'pack',
      exportFormats: ['png', 'zip'],
    },
    {
      id: 'slide',
      label: 'Slide Asset',
      description: 'Generate presentation backgrounds and slide visuals',
      outputType: 'image',
      exportFormats: ['png'],
      aspectRatios: ['16:9', '4:3', '1:1'],
    },
    {
      id: 'social',
      label: 'Social Banner',
      description: 'Generate platform-optimised social media images',
      outputType: 'image',
      exportFormats: ['png'],
      aspectRatios: ['og', 'twitter_header', '1:1', '9:16', 'linkedin'],
    },
    {
      id: 'web-hero',
      label: 'Web Hero',
      description: 'Generate hero section backgrounds for websites',
      outputType: 'image',
      exportFormats: ['png'],
      aspectRatios: ['16:9'],
    },
  ],

  presets: [
    {
      id: 'minimal_flat',
      label: 'Minimal Flat',
      description: 'Clean flat design with dominant white space',
      tokens: ['flat design', 'minimal', 'white space', 'clean lines', 'simple geometric shapes', 'modern'],
      negTokens: ['pixel art', '8-bit', 'photorealistic', 'busy', 'cluttered', 'low quality'],
    },
    {
      id: 'bold_geometric',
      label: 'Bold Geometric',
      description: 'Strong shapes, limited palette, poster-style composition',
      tokens: ['bold geometric shapes', 'strong composition', 'high contrast', 'poster style', 'graphic design'],
      negTokens: ['pixel art', 'organic', 'soft', 'pastel', 'low contrast'],
    },
    {
      id: 'corporate_clean',
      label: 'Corporate',
      description: 'Professional, polished, executive aesthetic',
      tokens: ['corporate design', 'professional', 'polished', 'executive aesthetic', 'business visual'],
      negTokens: ['pixel art', 'cartoon', 'playful', 'low quality', 'amateur'],
    },
    {
      id: 'photography_overlay',
      label: 'Photography',
      description: 'Atmospheric photographic style with text overlay areas',
      tokens: ['atmospheric photography', 'cinematic', 'depth of field', 'dramatic lighting', 'photo quality'],
      negTokens: ['pixel art', 'illustration', 'cartoon', 'flat', 'low resolution'],
    },
    {
      id: 'monochrome',
      label: 'Monochrome',
      description: 'Black and white, high contrast, editorial style',
      tokens: ['black and white', 'monochromatic', 'high contrast', 'editorial', 'grayscale'],
      negTokens: ['color', 'pixel art', 'low quality'],
    },
    {
      id: 'gradient_modern',
      label: 'Gradient',
      description: 'Vibrant gradients, contemporary design',
      tokens: ['smooth gradient', 'modern design', 'vibrant colors', 'contemporary', 'color transition'],
      negTokens: ['pixel art', 'flat', 'monochrome', 'dull'],
    },
    {
      id: 'tech_dark',
      label: 'Tech Dark',
      description: 'Dark mode, tech startup aesthetic',
      tokens: ['dark background', 'tech aesthetic', 'subtle glow', 'digital', 'dark UI', 'sleek'],
      negTokens: ['pixel art', 'bright', 'light background', 'cartoon'],
    },
    {
      id: 'warm_brand',
      label: 'Warm Brand',
      description: 'Approachable, friendly, organic brand feel',
      tokens: ['warm colors', 'approachable', 'friendly', 'organic shapes', 'inviting', 'brand identity'],
      negTokens: ['pixel art', 'cold', 'tech', 'dark', 'sharp'],
    },
  ],

  promptBuilder: 'business',

  models: {
    standardProvider: 'pollinations',
    hdProvider: 'replicate',
    hdModelId: 'black-forest-labs/flux-1.1-pro',
    standardRateLimit: 10,
    hdCreditsPerGeneration: 1,
  },

  galleryAspect: 'natural',
  galleryFilters: ['tool', 'style', 'mood'],

  licenseKey: 'commercial_brand',

  routes: {
    landing: '/business',
    studio:  '/business/studio',
    gallery: '/business/gallery',
    docs:    '/docs/business',
  },

  servicePairing: {
    label: 'WokSpec Brand Services',
    description: 'Need a full brand identity built by designers? WokSpec delivers.',
    href: 'https://wokspec.org',
  },

  status: 'live',

  targetUsers: [
    'Startup founders',
    'Marketing teams',
    'Content creators',
    'Agencies',
    'Freelance designers',
  ],

  notFor: [
    'Pixel art or game assets',
    'Vector or SVG output',
    'Code generation',
    'Detailed character illustration',
  ],

  examplePrompts: [
    { prompt: 'Modern tech startup logo mark, minimal flat, deep blue and white', label: 'Tech Logo' },
    { prompt: 'SaaS company social banner, dark tech style, product launch announcement', label: 'Launch Banner' },
    { prompt: 'Clean pitch deck slide background, corporate, gradient blue to purple', label: 'Pitch Deck' },
    { prompt: 'E-commerce brand hero image, warm brand, lifestyle product photography style', label: 'Hero Image' },
  ],
};
