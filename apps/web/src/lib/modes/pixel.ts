import type { ModeContract } from './types';

export const pixelMode: ModeContract = {
  id: 'pixel',
  label: 'WokGen Pixel',
  shortLabel: 'Pixel',
  tagline: 'For game developers',
  description: 'Generate pixel art sprites, animations, tilesets, and game-ready assets with AI.',
  accentColor: '#a78bfa',

  outputs: ['image', 'gif'],
  exportFormats: ['png', 'gif'],

  sizeConstraints: {
    min: 32,
    max: 512,
    defaults: [32, 64, 128, 256, 512],
    defaultSize: 64,
  },

  tools: [
    {
      id: 'generate',
      label: 'Generate',
      description: 'Create a single pixel art asset from a prompt',
      maxBatch: 4,
      outputType: 'image',
      exportFormats: ['png'],
    },
    {
      id: 'animate',
      label: 'Animate',
      description: 'Generate an animated sprite sequence as a GIF',
      outputType: 'gif',
      exportFormats: ['gif'],
    },
    {
      id: 'scene',
      label: 'Scene',
      description: 'Generate a cohesive tileset or environmental scene',
      maxBatch: 4,
      outputType: 'image',
      exportFormats: ['png'],
    },
    {
      id: 'rotate',
      label: 'Rotate',
      description: 'Generate multi-directional views of a character or object',
      outputType: 'image',
      exportFormats: ['png'],
    },
    {
      id: 'inpaint',
      label: 'Inpaint',
      description: 'Edit or extend an existing pixel art image with a mask',
      outputType: 'image',
      exportFormats: ['png'],
    },
  ],

  presets: [
    { id: 'rpg_icon',       label: 'RPG Icon',       tokens: ['rpg item icon', 'game inventory sprite', 'centered', 'flat shading'], negTokens: ['scene', 'background', 'multiple items'] },
    { id: 'character_idle', label: 'Character Idle', tokens: ['game character sprite', 'idle pose', 'front-facing', 'symmetrical', 'full body'] },
    { id: 'character_side', label: 'Character Side', tokens: ['side-scroll character', 'side view', 'platformer sprite', 'profile stance'] },
    { id: 'top_down_char',  label: 'Top-Down',       tokens: ['top-down RPG character', 'overhead view', 'orthographic', 'JRPG style'] },
    { id: 'isometric',      label: 'Isometric',      tokens: ['isometric pixel art', '3/4 view', 'dimetric projection', 'isometric object'] },
    { id: 'chibi',          label: 'Chibi',          tokens: ['chibi character', 'super-deformed', '2:1 head body ratio', 'cute proportions'] },
    { id: 'sprite_sheet',   label: 'Sprite Sheet',   tokens: ['sprite sheet', 'grid layout', 'multiple frames', 'animation frames'] },
    { id: 'tileset',        label: 'Tileset',        tokens: ['seamless tileset', 'game tile', 'repeating pattern', 'environmental tile', 'tile-safe edges'] },
    { id: 'game_ui',        label: 'Game UI',        tokens: ['game UI element', 'HUD component', 'interface asset', 'pixel UI', 'game interface'] },
    { id: 'portrait',       label: 'Portrait',       tokens: ['character portrait', 'bust shot', 'face detail', 'expression', 'dialog portrait'] },
    { id: 'nature_tile',    label: 'Nature Tile',    tokens: ['organic tile', 'nature texture', 'natural environment', 'seamless organic'] },
    { id: 'sci_fi',         label: 'Sci-Fi',         tokens: ['sci-fi pixel art', 'futuristic', 'tech aesthetic', 'metallic', 'neon accents'] },
    { id: 'horror',         label: 'Horror',         tokens: ['horror pixel art', 'dark', 'desaturated', 'high contrast', 'gothic', 'creepy'] },
    { id: 'animated_effect',label: 'Effect',         tokens: ['pixel effect', 'particle', 'magic effect', 'bright contrast', 'looping animation'] },
    { id: 'badge_icon',     label: 'Badge Icon',     tokens: ['app icon style', 'badge', 'rounded form', 'flat colors', 'centered symbol'] },
    { id: 'weapon_icon',    label: 'Weapon',         tokens: ['weapon sprite', 'pixel weapon', 'item icon', 'game inventory', 'isolated weapon'] },
    { id: 'emoji',          label: 'Emoji',          tokens: ['pixel emoji', 'expressive face', 'emoji style', 'simple features', 'round'] },
    { id: 'raw',            label: 'Raw',            tokens: ['pixel art', 'pixel style'] },
  ],

  promptBuilder: 'pixel',

  models: {
    standardProvider: 'pollinations',
    hdProvider: 'replicate',
    hdModelId: 'black-forest-labs/flux-schnell',
    standardRateLimit: 20,
    hdCreditsPerGeneration: 1,
  },

  galleryAspect: 'square',
  galleryFilters: ['tool', 'era', 'size', 'category'],

  licenseKey: 'commercial_game',

  routes: {
    landing: '/pixel',
    studio:  '/pixel/studio',
    gallery: '/pixel/gallery',
    docs:    '/docs/pixel',
  },

  servicePairing: {
    label: 'WokSpec Game Art Services',
    description: 'Need production-ready game asset packs? WokSpec delivers full pipelines.',
    href: 'https://wokspec.org',
  },

  status: 'live',

  targetUsers: [
    'Indie game developers',
    'Game jam participants',
    'Pixel art creators',
    'Mobile game studios',
    'Hobbyist game designers',
  ],

  notFor: [
    'Corporate branding or marketing',
    'High-resolution photography',
    'Vector or SVG output',
    'UI/UX code generation',
  ],

  examplePrompts: [
    { prompt: 'RPG warrior with sword and shield, front-facing, 64x64', label: 'RPG Warrior' },
    { prompt: 'Dungeon floor tileset, stone texture, dark atmosphere', label: 'Dungeon Tile' },
    { prompt: 'Magic fire spell effect, bright orange and yellow, particle burst', label: 'Fire Effect' },
    { prompt: 'Chest item sprite, wooden treasure chest, golden lock, inventory icon', label: 'Chest Icon' },
  ],
};
