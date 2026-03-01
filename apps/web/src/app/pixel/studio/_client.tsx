'use client';




import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import WorkspaceSelector from '@/app/_components/WorkspaceSelector';
import { EralSidebar } from '@/app/_components/EralSidebar';
import { parseApiError, type StudioError } from '@/lib/studio-errors';
import { usePreferenceSync } from '@/hooks/usePreferenceSync';
import { useWAPListener } from '@/hooks/useWAPListener';
import { QuotaBadge } from '@/components/quota-badge';
import { ColorPalette } from '@/components/color-palette';
import { StudioResult } from '@/components/StudioResult';
import { PostProcessToolbar } from '@/components/studio/PostProcessToolbar';
import PromptIntelligenceBar from '@/app/_components/PromptIntelligenceBar';
import SfxBrowser from '@/components/sfx-browser';
import { CanvasPresets } from '@/components/studio/CanvasPresets';
import { StylePresetGrid } from '@/components/studio/StylePresetGrid';
import { GenerationHistory, type GenHistoryEntry } from '@/components/studio/GenerationHistory';
import { BrandContextSelector } from '@/components/studio/BrandContextSelector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tool = 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';
type Provider = 'replicate' | 'fal' | 'together' | 'comfyui' | 'huggingface' | 'pollinations';
type StylePreset = 'rpg_icon' | 'emoji' | 'tileset' | 'sprite_sheet' | 'raw' | 'game_ui'
  | 'character_idle' | 'character_side' | 'top_down_char' | 'isometric' | 'chibi'
  | 'horror' | 'sci_fi' | 'nature_tile' | 'animated_effect' | 'portrait'
  | 'badge_icon' | 'weapon_icon';
type JobStatus = 'idle' | 'pending' | 'succeeded' | 'failed';

interface GenerationResult {
  jobId: string;
  resultUrl: string | null;
  resultUrls: string[] | null;
  durationMs?: number;
  resolvedSeed?: number;
  width?: number;
  height?: number;
  seed?: number | null;
  guestDownloadGated?: boolean;
  provider?: string;
}

interface ProviderInfo {
  id: Provider;
  label: string;
  configured: boolean;
  free: boolean;
  color: string;
  capabilities: {
    generate: boolean;
    animate: boolean;
    rotate: boolean;
    inpaint: boolean;
    scene: boolean;
  };
}

interface HistoryItem {
  id: string;
  tool: Tool;
  prompt: string;
  resultUrl: string | null;
  provider: string;
  width: number;
  height: number;
  seed: number | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLS: { id: Tool; icon?: string; label: string; shortLabel: string; kbd: string }[] = [
  { id: 'generate', label: 'Sprite',      shortLabel: 'Sprite',  kbd: '1' },
  { id: 'animate',  label: 'Animate',     shortLabel: 'Anim',    kbd: '2' },
  { id: 'rotate',   label: 'Directions',  shortLabel: 'Dir',     kbd: '3' },
  { id: 'inpaint',  label: 'Edit',        shortLabel: 'Edit',    kbd: '4' },
  { id: 'scene',    label: 'Tileset',     shortLabel: 'Tile',    kbd: '5' },
];

// Preset categories
const PRESET_CATEGORIES = [
  { id: 'characters',   label: 'Characters' },
  { id: 'items',        label: 'Items'       },
  { id: 'environments', label: 'Environments'},
  { id: 'fx_ui',        label: 'FX & UI'     },
  { id: 'advanced',     label: 'Advanced'    },
] as const;
type PresetCategory = (typeof PRESET_CATEGORIES)[number]['id'];

const PRESETS_BY_CATEGORY: Record<PresetCategory, StylePreset[]> = {
  characters:   ['character_idle', 'character_side', 'top_down_char', 'chibi', 'portrait'],
  items:        ['rpg_icon', 'weapon_icon', 'badge_icon', 'emoji'],
  environments: ['tileset', 'nature_tile', 'isometric'],
  fx_ui:        ['animated_effect', 'game_ui', 'sci_fi', 'horror'],
  advanced:     ['sprite_sheet', 'raw'],
};

// Smart preset config — auto-sets controls when a preset is selected
const PRESET_CONFIG: Record<StylePreset, {
  size: PixelSize;
  category: import('@/lib/prompt-builder').AssetCategory;
  bgMode: import('@/lib/prompt-builder').BackgroundMode;
  paletteSize: import('@/lib/prompt-builder').PaletteSize;
  outlineStyle: import('@/lib/prompt-builder').OutlineStyle;
}> = {
  rpg_icon:        { size: 64,  category: 'weapon',    bgMode: 'transparent', paletteSize: 32,  outlineStyle: 'bold'   },
  weapon_icon:     { size: 64,  category: 'weapon',    bgMode: 'transparent', paletteSize: 32,  outlineStyle: 'bold'   },
  character_idle:  { size: 64,  category: 'character', bgMode: 'transparent', paletteSize: 64,  outlineStyle: 'bold'   },
  character_side:  { size: 64,  category: 'character', bgMode: 'transparent', paletteSize: 64,  outlineStyle: 'bold'   },
  top_down_char:   { size: 64,  category: 'character', bgMode: 'transparent', paletteSize: 32,  outlineStyle: 'bold'   },
  isometric:       { size: 128, category: 'structure', bgMode: 'scene',       paletteSize: 64,  outlineStyle: 'soft'   },
  chibi:           { size: 64,  category: 'character', bgMode: 'transparent', paletteSize: 32,  outlineStyle: 'bold'   },
  portrait:        { size: 128, category: 'portrait',  bgMode: 'scene',       paletteSize: 64,  outlineStyle: 'none'   },
  emoji:           { size: 64,  category: 'none',      bgMode: 'transparent', paletteSize: 16,  outlineStyle: 'bold'   },
  tileset:         { size: 256, category: 'tile',      bgMode: 'scene',       paletteSize: 32,  outlineStyle: 'none'   },
  nature_tile:     { size: 256, category: 'nature',    bgMode: 'scene',       paletteSize: 32,  outlineStyle: 'none'   },
  sprite_sheet:    { size: 512, category: 'character', bgMode: 'transparent', paletteSize: 64,  outlineStyle: 'bold'   },
  animated_effect: { size: 64,  category: 'effect',    bgMode: 'transparent', paletteSize: 16,  outlineStyle: 'none'   },
  game_ui:         { size: 128, category: 'ui',        bgMode: 'transparent', paletteSize: 32,  outlineStyle: 'soft'   },
  badge_icon:      { size: 64,  category: 'none',      bgMode: 'transparent', paletteSize: 16,  outlineStyle: 'bold'   },
  sci_fi:          { size: 128, category: 'none',      bgMode: 'scene',       paletteSize: 32,  outlineStyle: 'soft'   },
  horror:          { size: 128, category: 'none',      bgMode: 'scene',       paletteSize: 32,  outlineStyle: 'bold'   },
  raw:             { size: 512, category: 'none',      bgMode: 'dark',        paletteSize: 64,  outlineStyle: 'none'   },
};

// Placeholder text per preset — eliminates blank textarea for new users
const PRESET_PLACEHOLDERS: Record<StylePreset, string> = {
  rpg_icon:        'e.g. iron sword, serrated edge, battle damage',
  weapon_icon:     'e.g. obsidian dagger, curved black blade',
  character_idle:  'e.g. knight in plate armor, friendly face',
  character_side:  'e.g. rogue in leather armor, side view',
  top_down_char:   'e.g. warrior holding sword, top-down view',
  isometric:       'e.g. stone tower with battlements, isometric',
  chibi:           'e.g. cute mage with staff, chibi style',
  portrait:        'e.g. elven ranger, expressive eyes, detailed face',
  emoji:           'e.g. fire explosion, simple and bold',
  tileset:         'e.g. stone dungeon floor, cracked and mossy',
  nature_tile:     'e.g. lush forest floor with scattered wildflowers',
  sprite_sheet:    'e.g. warrior character, multiple poses',
  animated_effect: 'e.g. magic explosion, orange and gold burst',
  game_ui:         'e.g. health bar frame, stone and gold border',
  badge_icon:      'e.g. shield icon, flat design, dark theme',
  sci_fi:          'e.g. energy cannon, neon blue accents',
  horror:          'e.g. haunted grave, eerie fog, dark atmosphere',
  raw:             'Describe exactly what you want to generate…',
};

// Controls visible per tool
const TOOL_CONTROLS: Record<Tool, {
  showPresets:      boolean;
  showCategory:     boolean;
  showEra:          boolean;
  showPalette:      boolean;
  showOutline:      boolean;
  showBgMode:       boolean;
  showAnimControls: boolean;
  showDirControls:  boolean;
  showMaskUpload:   boolean;
  showRefImage:     boolean;
  showMapSize:      boolean;
}> = {
  generate: { showPresets: true,  showCategory: true,  showEra: true,  showPalette: true,  showOutline: true,  showBgMode: true,  showAnimControls: false, showDirControls: false, showMaskUpload: false, showRefImage: false, showMapSize: false },
  animate:  { showPresets: true,  showCategory: false, showEra: true,  showPalette: false, showOutline: false, showBgMode: true,  showAnimControls: true,  showDirControls: false, showMaskUpload: false, showRefImage: true,  showMapSize: false },
  rotate:   { showPresets: true,  showCategory: false, showEra: true,  showPalette: false, showOutline: false, showBgMode: true,  showAnimControls: false, showDirControls: true,  showMaskUpload: false, showRefImage: true,  showMapSize: false },
  inpaint:  { showPresets: true,  showCategory: true,  showEra: false, showPalette: false, showOutline: false, showBgMode: false, showAnimControls: false, showDirControls: false, showMaskUpload: true,  showRefImage: true,  showMapSize: false },
  scene:    { showPresets: true,  showCategory: false, showEra: true,  showPalette: true,  showOutline: false, showBgMode: false, showAnimControls: false, showDirControls: false, showMaskUpload: false, showRefImage: false, showMapSize: true  },
};

// Size display labels
const SIZE_LABELS: Record<PixelSize, string> = {
  32:  'Tiny',
  64:  'Standard',
  128: 'Detailed',
  256: 'Large',
  512: 'Full',
};

const STYLE_PRESETS: { id: StylePreset; label: string; description: string }[] = [
  { id: 'rpg_icon',       label: 'RPG Icon',        description: 'Dark bg, bold silhouette'       },
  { id: 'weapon_icon',    label: 'Weapon',           description: 'Inventory weapon, no bg'        },
  { id: 'character_idle', label: 'Character',        description: 'Front-facing game sprite'       },
  { id: 'character_side', label: 'Side Char',        description: 'Side-scroller sprite'           },
  { id: 'top_down_char',  label: 'Top-Down',         description: 'Bird-eye character view'        },
  { id: 'isometric',      label: 'Isometric',        description: '3/4 dimetric projection'        },
  { id: 'chibi',          label: 'Chibi',            description: 'Super-deformed cute style'      },
  { id: 'portrait',       label: 'Portrait',         description: 'Character bust/face detail'     },
  { id: 'emoji',          label: 'Emoji',            description: 'Bright, simple, no background'  },
  { id: 'tileset',        label: 'Tileset',          description: 'Seamlessly tileable flat tile'  },
  { id: 'nature_tile',    label: 'Nature Tile',      description: 'Organic seamless terrain tile'  },
  { id: 'sprite_sheet',   label: 'Sprite Sheet',     description: 'Multiple poses on one sheet'    },
  { id: 'animated_effect',label: 'Effect',           description: 'High-contrast animation frame'  },
  { id: 'game_ui',        label: 'Game UI',          description: 'HUD element, dark theme widget' },
  { id: 'badge_icon',     label: 'Badge',            description: 'App-style flat icon'            },
  { id: 'sci_fi',         label: 'Sci-Fi',           description: 'Tech aesthetic, neon accents'   },
  { id: 'horror',         label: 'Horror',           description: 'Dark, desaturated, gritty'      },
  { id: 'raw',            label: 'Raw',              description: 'No preset — model defaults'     },
];

const SIZES = [32, 64, 128, 256, 512] as const;
type PixelSize = (typeof SIZES)[number];

const ASPECT_RATIOS = [
  { id: '1:1',   label: '1:1',   w: 1, h: 1,  use: 'Profile' },
  { id: '4:3',   label: '4:3',   w: 4, h: 3,  use: 'Classic' },
  { id: '3:4',   label: '3:4',   w: 3, h: 4,  use: 'Portrait' },
  { id: '16:9',  label: '16:9',  w: 16, h: 9, use: 'Landscape' },
  { id: '9:16',  label: '9:16',  w: 9, h: 16, use: 'Mobile' },
] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number]['id'];

const PROVIDER_COLORS: Record<Provider, string> = {
  replicate:    '#0066FF',
  fal:          '#7B2FBE',
  together:     '#00A67D',
  comfyui:      '#E06C00',
  huggingface:  '#FF9D00',
  pollinations: '#6D28D9',
};

const PROVIDER_LABELS: Record<Provider, string> = {
  replicate:    'Replicate',
  fal:          'fal.ai',
  together:     'Together.ai',
  comfyui:      'Custom Pipeline',
  huggingface:  'HuggingFace',
  pollinations: 'Pollinations',
};

const EXAMPLE_PROMPTS: Record<Tool, string[]> = {
  generate: [
    'iron sword with ornate crossguard, battle-worn blade',
    'health potion, glowing red liquid in crystal vial, cork stopper',
    'leather shield with iron boss, dented edge',
    'fire scroll, golden wax seal, ancient parchment',
    'diamond ring with large emerald gemstone',
    'ancient wooden staff with glowing crystal orb',
    'assassin dagger, curved black obsidian blade',
    'enchanted longbow, runes on the limbs, glowing bowstring',
    'warrior in plate armor, full body, front-facing',
    'friendly merchant NPC, green cloak, pouch on belt',
    'skeleton archer enemy, bone bow drawn back',
    'treasure chest, gold-banded oak, glowing keyhole',
    'dungeon stone floor tile, cracked and mossy',
    'forest clearing tile, lush grass with wildflowers',
    'castle gate UI frame, stone border with torch brackets',
    'explosion particle effect, orange and white burst',
    'purple magic portal swirling vortex',
    'bat monster, cave dweller, wing spread',
    'wooden barrel, stave bands, RPG prop',
    'magic wand, twisted wood, star tip glowing',
  ],
  animate: [
    'fire spirit creature, idle breathing',
    'knight warrior character, walking cycle',
    'water ripple on calm pool surface',
    'coin spinning, gold glint reflection',
    'wizard casting fireball spell',
    'slime enemy, bouncing idle movement',
    'explosion burst, orange and red particles',
    'magic orb pulsing, purple energy',
    'archer character, drawing and releasing bow',
    'bat flying, wings flapping cycle',
  ],
  rotate: [
    'warrior in full plate armor, turntable character',
    'treasure chest, 4-direction turntable',
    'magic crystal orb, faceted gemstone spin',
    'wooden cart, RPG prop rotation',
    'goblin enemy, 8-direction sprite sheet',
    'mage character, staff in hand, turntable',
  ],
  inpaint: [
    'add glowing runes to the blade',
    'replace the background with dark dungeon stone',
    'add a large ruby gem to the center of the shield',
    'make the potion glow brighter with inner light',
    'add flames to the sword edge',
    'change the armor color to gold and black',
  ],
  scene: [
    'dark dungeon corridor, stone floor and walls, wall torches',
    'forest clearing, lush grass and scattered wildflowers',
    'castle great hall interior, stone pillars and banners',
    'desert market town, sandstone buildings, awnings',
    'snowy mountain peak, ice and pine trees',
    'volcanic cave, glowing lava pools in stone floor',
    'underwater ruins, coral-covered stone blocks',
    'cyberpunk city alley, neon signs and puddles',
  ],
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

const PIXEL_STAGES = [
  { delay: 0,     message: 'Initializing pixel engine...' },
  { delay: 5000,  message: 'Generating your sprite...' },
  { delay: 15000, message: 'Rendering pixel art...' },
  { delay: 30000, message: 'Applying palette...' },
  { delay: 60000, message: 'Still working... (complex sprites can take up to 2min)' },
];

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

// ---------------------------------------------------------------------------
// Small UI components
// ---------------------------------------------------------------------------

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 32 : 20;
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: dim,
        height: dim,
        border: '2px solid var(--surface-border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }}
      aria-hidden="true"
    />
  );
}

function ProgressBar({ indeterminate }: { indeterminate?: boolean }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-full"
      style={{ height: 3, background: 'var(--surface-border)' }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Generation progress"
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
          ...(indeterminate
            ? { width: '40%', animation: 'indeterminate-slide 1.4s ease-in-out infinite' }
            : { width: '100%', transition: 'width 0.3s ease' }),
        }}
      />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-header">
      <span className="section-title">{children}</span>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider badge
// ---------------------------------------------------------------------------
function ProviderBadge({ provider }: { provider: string }) {
  const color = (PROVIDER_COLORS as Record<string, string>)[provider] ?? '#888';
  const label = (PROVIDER_LABELS as Record<string, string>)[provider] ?? provider;
  return (
    <span
      className="provider-chip"
      style={{ borderColor: color + '40' }}
    >
      <span
        className="provider-dot"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Settings Modal
// ---------------------------------------------------------------------------
function SettingsModal({
  providers,
  apiKeys,
  comfyuiHost,
  onSave,
  onClose,
}: {
  providers: ProviderInfo[];
  apiKeys: Record<Provider, string>;
  comfyuiHost: string;
  onSave: (keys: Record<Provider, string>, host: string) => void;
  onClose: () => void;
}) {
  const [keys, setKeys] = useState<Record<Provider, string>>({ ...apiKeys });
  const [host, setHost] = useState(comfyuiHost);
  const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
    replicate:    false,
    fal:          false,
    together:     false,
    comfyui:      false,
    huggingface:  false,
    pollinations: false,
  });

  const ENV_VARS: Record<Provider, string> = {
    replicate:    'REPLICATE_API_TOKEN',
    fal:          'FAL_KEY',
    together:     'TOGETHER_API_KEY',
    comfyui:      '',
    huggingface:  'HF_TOKEN',
    pollinations: '',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-70)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="panel w-full max-w-lg animate-scale-in flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--surface-border)' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Provider Settings
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              API keys are stored in your browser only — never sent to the server unless generating.
            </p>
          </div>
          <button type="button"
            onClick={onClose}
            className="btn-ghost btn-icon flex-shrink-0"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="scroll-region px-5 py-4 flex flex-col gap-5">

          {/* Cloud providers */}
          {((['replicate', 'fal', 'together'] as Provider[]).map((pid) => {
            const info = providers.find((p) => p.id === pid);
            return (
              <div key={pid} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: PROVIDER_COLORS[pid] }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {PROVIDER_LABELS[pid]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {info?.configured && (
                      <span className="badge-success text-2xs" style={{ fontSize: '0.65rem' }}>
                        ✓ env configured
                      </span>
                    )}
                    <span
                      className="text-2xs"
                      style={{ fontSize: '0.65rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}
                    >
                      {ENV_VARS[pid]}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showKeys[pid] ? 'text' : 'password'}
                    className="input pr-10 font-mono text-xs"
                    placeholder={
                      info?.configured
                        ? '(env var set — leave blank to use it)'
                        : `Paste your ${PROVIDER_LABELS[pid]} API key`
                    }
                    value={keys[pid]}
                    onChange={(e) => setKeys((k) => ({ ...k, [pid]: e.target.value }))}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => setShowKeys((s) => ({ ...s, [pid]: !s[pid] }))}
                    tabIndex={-1}
                    aria-label={showKeys[pid] ? 'Hide key' : 'Show key'}
                  >
                    {showKeys[pid] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            );
          }))}

          {/* ComfyUI host */}
          <div
            className="pt-4"
            style={{ borderTop: '1px solid var(--surface-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: PROVIDER_COLORS.comfyui }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Custom Pipeline
              </span>
              <span className="badge-success text-2xs ml-auto" style={{ fontSize: '0.65rem' }}>
                Always free
              </span>
            </div>
            <FormField label="Pipeline Endpoint URL" hint="Your custom inference endpoint URL">
              <input
                type="url"
                className="input font-mono text-xs"
                placeholder="https://your-inference-endpoint.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </FormField>
          </div>

          {/* Note */}
          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-muted)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--accent)' }}>BYOK mode:</strong> Keys entered here are
            stored in <code>localStorage</code> and sent only with your generation requests.
            They are never logged or persisted server-side. Alternatively, set env vars in{' '}
            <code>.env.local</code> for server-side use.
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--surface-border)' }}
        >
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button"
            className="btn-primary"
            onClick={() => {
              onSave(keys, host || 'http://127.0.0.1:8188');
              onClose();
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History panel (right-side drawer)
// ---------------------------------------------------------------------------
function HistoryPanel({
  items,
  onSelect,
  onClose,
}: {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-64 z-30 flex flex-col animate-slide-right"
      style={{
        background: 'var(--surface-raised)',
        borderLeft: '1px solid var(--surface-border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--surface-border)' }}
      >
        <span className="section-title">History</span>
        <button type="button"
          className="btn-ghost btn-icon"
          onClick={onClose}
          aria-label="Close history"
        >
          ✕
        </button>
      </div>
      <div className="scroll-region flex flex-col">
        {items.length === 0 && (
          <div className="empty-state py-12">
            
            <p className="empty-state-body">Generated assets will appear here.</p>
          </div>
        )}
        {items.map((item) => (
          <button type="button"
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex items-center gap-3 p-3 text-left w-full transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--surface-border)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {/* Thumb */}
            <div
              className="w-10 h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{
                background: 'var(--surface-overlay)',
                border: '1px solid var(--surface-border)',
              }}
            >
              {item.resultUrl ? (
                <img
                  src={item.resultUrl}
                  alt={item.prompt?.slice(0, 50) || 'Generated pixel art'}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span style={{ color: 'var(--text-disabled)', fontSize: 18 }}>?</span>
              )}
            </div>
            {/* Meta */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <p
                className="text-xs font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.prompt}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-2xs"
                  style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}
                >
                  {item.width}px
                </span>
                <ProviderBadge provider={item.provider} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Output Panel (right canvas area)
// ---------------------------------------------------------------------------
function OutputPanel({
  status,
  result,
  error,
  onDownload,
  onSaveToGallery,
  onReroll,
  onCopyImage,
  savedToGallery,
  batchResults,
  selectedBatch,
  onSelectBatch,
  bgMode,
  tool,
  onFillPrompt,
  showPixelGrid,
  setShowPixelGrid,
  displayUrl,
  onBgRemove,
  bgRemoving,
  compareMode,
  compareResults,
  onSelectCompare,
}: {
  status: JobStatus;
  result: GenerationResult | null;
  error: string | null;
  onDownload: () => void;
  onSaveToGallery: () => void;
  onReroll: () => void;
  onCopyImage: () => void;
  savedToGallery: boolean;
  batchResults?: GenerationResult[];
  selectedBatch?: number;
  onSelectBatch?: (i: number) => void;
  bgMode?: string;
  tool?: string;
  onFillPrompt?: (p: string) => void;
  showPixelGrid?: boolean;
  setShowPixelGrid?: (v: boolean) => void;
  displayUrl?: string | null;
  onBgRemove?: (url: string) => void;
  bgRemoving?: boolean;
  compareMode?: boolean;
  compareResults?: GenerationResult[];
  onSelectCompare?: (r: GenerationResult) => void;
}) {
  const [zoom, setZoom] = useState<1|2|4>(1);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(PIXEL_STAGES[0].message);

  useEffect(() => {
    if (status === 'pending') {
      setElapsed(0);
      setLoadingMsg(PIXEL_STAGES[0].message);
      const start = Date.now();
      const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
      const stageTimers = PIXEL_STAGES.slice(1).map(s =>
        setTimeout(() => setLoadingMsg(s.message), s.delay)
      );
      return () => { clearInterval(iv); stageTimers.forEach(clearTimeout); };
    }
  }, [status]);

  useEffect(() => {
    if (result?.resultUrl) {
      setActiveUrl(result.resultUrl);
      setZoom(1);
    } else if (result?.resultUrls?.length) {
      setActiveUrl(result.resultUrls[0]);
      setZoom(1);
    }
  }, [result]);

  if (status === 'idle') {
    const idleExamples = (tool ? EXAMPLE_PROMPTS[tool as Tool] ?? EXAMPLE_PROMPTS.generate : EXAMPLE_PROMPTS.generate).slice(0, 4);
    return (
      <div className="output-canvas flex-1" style={{ background: 'var(--surface-muted)' }}>
        <div className="empty-state" style={{ maxWidth: 380, textAlign: 'center' }}>
          {/* Pixel art inspired placeholder grid */}
          <div className="pixel-idle-grid" aria-hidden="true">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`pixel-idle-cell ${[0, 7, 14, 21, 42, 49, 56, 63, 9, 18, 27, 36, 45, 54].includes(i) ? 'pixel-idle-grid__cell--active' : 'pixel-idle-grid__cell--muted'}`}
              />
            ))}
          </div>
          <h3 className="empty-state-title" style={{ marginBottom: '0.5rem' }}>Start with a prompt</h3>
          <p className="empty-state-body" style={{ marginBottom: '1.25rem' }}>
            Describe what you want — or click an example below.
          </p>
          {onFillPrompt && (
            <div className="studio-idle-examples">
              {idleExamples.map((ex, i) => (
                <button type="button"
                  key={i}
                  onClick={() => onFillPrompt(ex)}
                  className="studio-idle-example-btn"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
          <div className="pixel-idle-kbd-hint">
            <kbd>⌘</kbd><span>+</span><kbd>↵</kbd>
            <span>to generate</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="output-canvas flex-1 flex flex-col gap-6 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded flex items-center justify-center"
            style={{
              background: 'var(--surface-overlay)',
              border: '1px solid var(--surface-border)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            <Spinner size="lg" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {loadingMsg} {elapsed > 0 && <span style={{ color: 'var(--text-muted)' }}>{elapsed}s</span>}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Usually 3–15 seconds
            </p>
          </div>
          <div className="w-48">
            <ProgressBar indeterminate />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    const isCredits = error?.includes('credit') || error?.includes('402');
    const isRateLimit = error?.includes('Rate limit') || error?.includes('429');
    const isProvider = error?.includes('provider') || error?.includes('API key');

    return (
      <div className="output-canvas flex-1 flex flex-col gap-4 items-center justify-center p-8">
        <div
          className="w-16 h-16 rounded flex items-center justify-center text-2xl"
          style={{
            background: 'var(--danger-muted)',
            border: '1px solid var(--danger)',
          }}
        >
          ✕
        </div>
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--danger-hover)' }}>
            Generation failed
          </p>
          {isCredits && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              HD credits exhausted. Use standard mode (free) or top up your credits.
            </p>
          )}
          {isRateLimit && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              You&apos;re generating too fast. Wait a moment and try again.
            </p>
          )}
          {isProvider && !isCredits && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Provider unavailable. Standard (free) generation will retry automatically.
            </p>
          )}
          <p
            className="text-xs leading-relaxed p-3 rounded-lg font-mono"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--danger-muted)',
              border: '1px solid var(--danger)',
              wordBreak: 'break-word',
            }}
          >
            {error ?? 'An unknown error occurred.'}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={onReroll}>
          ↻ Retry
        </button>
      </div>
    );
  }

  // Succeeded
  const urls = result?.resultUrls ?? (result?.resultUrl ? [result.resultUrl] : []);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0 flex-wrap"
        style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)' }}
      >
        {/* Zoom — snap buttons */}
        <div className="flex items-center gap-1">
          {([1, 2, 4] as const).map((z) => (
            <button type="button"
              key={z}
              className="btn-ghost btn-xs"
              style={{
                fontWeight: zoom === z ? 700 : 400,
                background: zoom === z ? 'var(--accent-dim)' : 'transparent',
                color: zoom === z ? 'var(--accent)' : 'var(--text-muted)',
                border: zoom === z ? '1px solid var(--accent-muted)' : '1px solid transparent',
                minWidth: 28,
              }}
              onClick={() => setZoom(z)}
            >{z}×</button>
          ))}
        </div>

        {/* Pixel grid toggle */}
        <button type="button"
          className="btn-ghost btn-xs"
          style={{
            background: showPixelGrid ? 'var(--accent-dim)' : 'transparent',
            color: showPixelGrid ? 'var(--accent)' : 'var(--text-muted)',
            border: showPixelGrid ? '1px solid var(--accent-muted)' : '1px solid transparent',
          }}
          onClick={() => setShowPixelGrid?.(!showPixelGrid)}
          title="Toggle pixel grid overlay"
        >Grid</button>

        <div className="flex-1" />

        {/* Duration */}
        {result?.durationMs && (
          <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            {formatDuration(result.durationMs)}
          </span>
        )}

        {/* Actions */}
        <button type="button"
          className="btn-ghost btn-sm"
          onClick={onReroll}
          title="Reroll with new seed"
        >
          ↻ Reroll
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={onCopyImage} title="Copy image to clipboard">
          ⎘ Copy
        </button>
        {result?.jobId && (
          <button type="button"
            className="btn-ghost btn-sm"
            title="Copy share link"
            onClick={() => {
              const url = `${window.location.origin}/assets/${result.jobId}`;
              navigator.clipboard.writeText(url).catch(() => {});
            }}
          >
            ⇧ Share
          </button>
        )}
        {result?.jobId && !result.jobId.startsWith('anim-') && !result.jobId.startsWith('local') && (
          <div style={{ display: 'flex', gap: 2 }}>
            <RatingButton jobId={result.jobId} value={1} label="+" title="Good result" />
            <RatingButton jobId={result.jobId} value={-1} label="-" title="Bad result" />
          </div>
        )}
        {result?.guestDownloadGated ? (
          <a
            href="/api/auth/signin"
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'var(--warning-subtle, rgba(245,158,11,0.1))',
              border: '1px solid var(--warning-border, rgba(245,158,11,0.33))',
              color: 'var(--warning)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Sign in to download →
          </a>
        ) : (
          <button type="button" className="btn-secondary btn-sm" onClick={onDownload}>
            ↓ Download
          </button>
        )}
        <button type="button"
          className={cn(savedToGallery ? 'btn-success' : 'btn-primary', 'btn-sm')}
          onClick={onSaveToGallery}
          disabled={savedToGallery}
        >
          {savedToGallery ? 'Saved' : 'Save to Gallery'}
        </button>
      </div>

      {/* Canvas */}
      <div
        className="output-canvas flex-1 relative overflow-auto"
        style={{
          background: bgMode === 'transparent'
            ? 'repeating-conic-gradient(#1a1a1a 0% 25%, #111 0% 50%) 0 0 / 16px 16px'
            : 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        {urls.length > 1 ? (
          // Multi-output grid (rotate / scene)
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="grid grid-cols-2 gap-4">
              {urls.map((url, i) => (
                <button type="button"
                  key={i}
                  onClick={() => setActiveUrl(url)}
                  className="output-image-frame p-2 transition-all duration-150"
                  style={{
                    border: activeUrl === url
                      ? '2px solid var(--accent)'
                      : '1px solid var(--surface-border)',
                    boxShadow: activeUrl === url ? 'var(--glow-md)' : undefined,
                    background: 'transparent',
                  }}
                >
                  <img
                    src={url}
                    alt={`Result ${i + 1}`}
                    className="pixel-art"
                    style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain', transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.15s ease' }}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeUrl && (
          <motion.div
            key={activeUrl}
            className="output-image-frame"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent-subtle)',
              borderRadius: 4,
              padding: '0.75rem',
              maxWidth: '90%',
              maxHeight: '90%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl ?? activeUrl}
              alt="Generated result"
              className="pixel-art result-reveal"
              style={{
                imageRendering: 'pixelated',
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.15s ease',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
              }}
            />
            {/* Remove BG button on hover */}
            {onBgRemove && (
              <button type="button"
                onClick={() => onBgRemove(displayUrl ?? activeUrl)}
                disabled={bgRemoving}
                style={{
                  position: 'absolute', top: 4, right: 4, opacity: 0,
                  transition: 'opacity 0.15s', fontSize: '0.68rem', padding: '2px 6px',
                  background: 'rgba(0,0,0,0.75)', border: '1px solid var(--border)',
                  borderRadius: 3, color: '#fff', cursor: bgRemoving ? 'wait' : 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                title="Remove background"
              >
                {bgRemoving ? '' : 'Remove BG'}
              </button>
            )}
            {/* Pixel grid overlay */}
            {showPixelGrid && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: '0.75rem',
                  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent calc(100%/var(--grid-cells) - 1px),var(--surface-raised) calc(100%/var(--grid-cells))), repeating-linear-gradient(90deg,transparent,transparent calc(100%/var(--grid-cells) - 1px),var(--surface-raised) calc(100%/var(--grid-cells)))',
                  // @ts-expect-error CSS custom prop
                  '--grid-cells': result?.width ?? 64,
                  pointerEvents: 'none',
                  borderRadius: 2,
                }}
              />
            )}
          </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Color palette — shown below canvas when result is ready */}
        {result && activeUrl && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <ColorPalette imageUrl={displayUrl ?? activeUrl} />
          </div>
        )}

        {/* Size + provider readout */}
        {result && activeUrl && (
          <div style={{
            position: 'absolute',
            bottom: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}>
            {activeUrl.startsWith('data:image/gif') && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 3,
                background: 'rgba(52,211,153,.15)', color: 'var(--success)', border: '1px solid rgba(52,211,153,.3)',
              }}>GIF</span>
            )}
            {result.width && result.height && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-disabled)', background: 'rgba(0,0,0,.5)', padding: '2px 6px', borderRadius: 3 }}>
                {result.width}×{result.height}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Studio result panel — image preview, metadata, and tool actions */}
      {activeUrl && (
        <StudioResult
          imageUrl={displayUrl ?? activeUrl}
          provider={result?.provider}
          durationMs={result?.durationMs}
          seed={result?.resolvedSeed ?? (result?.seed ?? undefined)}
          onSave={onSaveToGallery}
        />
      )}
      {activeUrl && (
        <div className="px-3 pb-2 flex-shrink-0">
          <PostProcessToolbar
            imageUrl={displayUrl ?? activeUrl}
            mode="pixel"
            onResult={(_url, _tool) => { /* post-process result handled by toolbar */ }}
          />
        </div>
      )}


      {batchResults && batchResults.length > 1 && !compareMode && (
        <div
          className="flex items-center gap-2 px-4 py-2 flex-shrink-0 overflow-x-auto"
          style={{ borderTop: '1px solid var(--surface-border)', background: 'var(--surface-overlay)' }}
        >
          {batchResults.map((br, i) => br.resultUrl && (
            <button type="button"
              key={i}
              onClick={() => onSelectBatch?.(i)}
              title={`Variation ${i + 1} — seed ${br.resolvedSeed ?? '?'}`}
              style={{
                flex: '0 0 auto',
                width: 52, height: 52,
                padding: 2,
                border: `2px solid ${selectedBatch === i ? 'var(--accent)' : 'var(--surface-border)'}`,
                borderRadius: 6,
                background: 'var(--surface-raised)',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <img
                src={br.resultUrl}
                alt={`Variation ${i + 1}`}
                className="pixel-art"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </button>
          ))}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: 4 }}>
            {batchResults.length} variations — click to select
          </span>
        </div>
      )}

      {/* Compare mode side-by-side */}
      {compareMode && compareResults && compareResults.length === 2 && (
        <div
          className="flex items-center justify-center gap-4 px-4 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--surface-border)', background: 'var(--surface-overlay)', overflowX: 'auto' }}
        >
          {compareResults.map((r: GenerationResult, i: number) => r.resultUrl && (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  border: '1px solid var(--surface-border)',
                  borderRadius: 6,
                  padding: 8,
                  background: 'var(--surface-raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={r.resultUrl}
                  alt={`Variant ${i + 1}`}
                  className="pixel-art"
                  style={{
                    maxWidth: 120,
                    maxHeight: 120,
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => onSelectCompare?.(r)}
                  style={{ flex: 1, fontSize: '0.65rem', padding: '3px 6px' }}
                >
                  Use this
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seed / meta strip */}
      {result && (
        <div
          className="flex items-center gap-4 px-4 py-2 flex-shrink-0 text-xs flex-wrap"
          style={{
            borderTop: '1px solid var(--surface-border)',
            background: 'var(--surface-raised)',
            color: 'var(--text-disabled)',
          }}
        >
          {result.width && result.height && (
            <span style={{ color: 'var(--text-muted)' }}>
              {result.width}×{result.height} · PNG
              {' · ~'}{Math.round((result.width * result.height * 4) / 1024)}KB
            </span>
          )}
          {result.resolvedSeed != null && (
            <button type="button"
              className="flex items-center gap-1"
              title="Click to copy seed"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', fontSize: 'inherit', padding: 0 }}
              onClick={() => {
                navigator.clipboard.writeText(String(result.resolvedSeed)).catch(() => {});
              }}
            >
              Seed: <code style={{ color: 'var(--text-muted)' }}>{result.resolvedSeed}</code> <span style={{ opacity: 0.5 }}>⎘</span>
            </button>
          )}
          {urls.length > 1 && (
            <span>{urls.length} outputs</span>
          )}
          {result.provider && (
            <span style={{ color: 'var(--text-disabled)' }}>via {result.provider}</span>
          )}
          {result.durationMs && (
            <span style={{ color: 'var(--text-disabled)' }}>{(result.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rating button — thumbs up / down on a job result
// ---------------------------------------------------------------------------
function RatingButton({ jobId, value, label, title }: { jobId: string; value: 1 | -1; label: string; title: string }) {
  const [rated, setRated] = useState<1 | -1 | null>(null);
  const handle = async () => {
    const next = rated === value ? 0 : value;
    setRated(next === 0 ? null : (next as 1 | -1));
    await fetch(`/api/jobs/${jobId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: next }),
    }).catch(() => {});
  };
  return (
    <button type="button"
      className="btn-ghost btn-xs"
      onClick={handle}
      title={title}
      style={{
        opacity: rated === value ? 1 : 0.5,
        filter: rated === value ? 'none' : 'grayscale(1)',
        transition: 'opacity 0.15s, filter 0.15s',
        fontSize: 14,
      }}
    >{label}</button>
  );
}

// ---------------------------------------------------------------------------
// Apply Saved Style button — reads wokgen:style_token from localStorage
// ---------------------------------------------------------------------------
function ApplySavedStyleButton({ mode, onApply }: { mode: string; onApply: (preset: string) => void }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wokgen:style_token');
      if (!raw) return;
      const token = JSON.parse(raw) as { mode: string; style: string | null; prompt: string };
      if (token.mode === mode && token.style) setLabel(token.style);
    } catch { /* ignore */ }
  }, [mode]);

  if (!label) return null;

  const handleApply = () => {
    onApply(label);
    setLabel(null);
  };

  return (
    <div className="px-4 pb-2">
      <button type="button"
        onClick={handleApply}
        className="community-modal-btn"
        style={{ width: '100%', textAlign: 'left', fontSize: '0.72rem' }}
        title={`Apply saved style: ${label}`}
      >
        ✦ Apply saved style: <strong>{label}</strong>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate form (left panel body for each tool)
// ---------------------------------------------------------------------------
function GenerateForm({
  tool,
  prompt,
  setPrompt,
  negPrompt,
  setNegPrompt,
  showAdvanced,
  setShowAdvanced,
  size,
  setSize,
  aspectRatio,
  setAspectRatio,
  stylePreset,
  setStylePreset,
  onPresetSelect,
  presetCategory,
  setPresetCategory,
  assetCategory,
  setAssetCategory,
  pixelEra,
  setPixelEra,
  bgMode,
  setBgMode,
  outlineStyle,
  setOutlineStyle,
  paletteSize,
  setPaletteSize,
  animationType,
  setAnimationType,
  animFrameCount,
  setAnimFrameCount,
  animFps,
  setAnimFps,
  animLoop,
  setAnimLoop,
  animOutputFormat,
  setAnimOutputFormat,
  directionCount,
  setDirectionCount,
  refImageUrl,
  setRefImageUrl,
  refImageInputRef,
  maskUrl,
  setMaskUrl,
  mapSize,
  setMapSize,
  seed,
  setSeed,
  lockSeed,
  setLockSeed,
  steps,
  setSteps,
  guidance,
  setGuidance,
  provider,
  setProvider,
  providers,
  isPublic,
  setIsPublic,
  onGenerate,
  isLoading,
  favPrompts,
  showFavMenu,
  setShowFavMenu,
  favSaved,
  savePromptAsFavorite,
  promptHistory,
  showPromptHistory,
  setShowPromptHistory,
}: {
  tool: Tool;
  prompt: string;
  setPrompt: (v: string) => void;
  negPrompt: string;
  setNegPrompt: (v: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  size: PixelSize;
  setSize: (v: PixelSize) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;
  stylePreset: StylePreset;
  setStylePreset: (v: StylePreset) => void;
  onPresetSelect: (v: StylePreset) => void;
  presetCategory: PresetCategory;
  setPresetCategory: (v: PresetCategory) => void;
  assetCategory: import('@/lib/prompt-builder').AssetCategory;
  setAssetCategory: (v: import('@/lib/prompt-builder').AssetCategory) => void;
  pixelEra: import('@/lib/prompt-builder').PixelEra;
  setPixelEra: (v: import('@/lib/prompt-builder').PixelEra) => void;
  bgMode: import('@/lib/prompt-builder').BackgroundMode;
  setBgMode: (v: import('@/lib/prompt-builder').BackgroundMode) => void;
  outlineStyle: import('@/lib/prompt-builder').OutlineStyle;
  setOutlineStyle: (v: import('@/lib/prompt-builder').OutlineStyle) => void;
  paletteSize: import('@/lib/prompt-builder').PaletteSize;
  setPaletteSize: (v: import('@/lib/prompt-builder').PaletteSize) => void;
  // Animate-specific
  animationType: import('@/lib/prompt-builder').AnimationType;
  setAnimationType: (v: import('@/lib/prompt-builder').AnimationType) => void;
  animFrameCount: number;
  setAnimFrameCount: (v: number) => void;
  animFps: number;
  setAnimFps: (v: number) => void;
  animLoop: 'infinite' | 'pingpong' | 'once';
  setAnimLoop: (v: 'infinite' | 'pingpong' | 'once') => void;
  animOutputFormat: 'gif' | 'png_sequence';
  setAnimOutputFormat: (v: 'gif' | 'png_sequence') => void;
  // Directions-specific
  directionCount: 4 | 8;
  setDirectionCount: (v: 4 | 8) => void;
  refImageUrl: string | null;
  setRefImageUrl: (v: string | null) => void;
  refImageInputRef: React.RefObject<HTMLInputElement>;
  maskUrl: string | null;
  setMaskUrl: (v: string | null) => void;
  mapSize: string;
  setMapSize: (v: string) => void;
  seed: string;
  setSeed: (v: string) => void;
  lockSeed: boolean;
  setLockSeed: (v: boolean | ((prev: boolean) => boolean)) => void;
  steps: number;
  setSteps: (v: number) => void;
  guidance: number;
  setGuidance: (v: number) => void;
  provider: Provider;
  setProvider: (v: Provider) => void;
  providers: ProviderInfo[];
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  onGenerate: () => void;
  isLoading: boolean;
  favPrompts: { id: string; prompt: string; label?: string }[];
  showFavMenu: boolean;
  setShowFavMenu: (v: boolean | ((prev: boolean) => boolean)) => void;
  favSaved: boolean;
  savePromptAsFavorite: () => void;
  promptHistory: string[];
  showPromptHistory: boolean;
  setShowPromptHistory: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  // Derived control visibility for the active tool
  const toolControls = TOOL_CONTROLS[tool];

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/prompt/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), mode: 'pixel' }),
      });
      if (res.ok) {
        const data = await res.json() as { variations?: string[] };
        const enhanced = data.variations?.[0];
        if (enhanced) setPrompt(enhanced.slice(0, 200));
      }
    } catch { /* silent */ } finally {
      setIsEnhancing(false);
    }
  }, [prompt, isEnhancing, setPrompt]);

  // react-dropzone for reference image upload
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error react-dropzone v12 accept format differs from older typings
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: (accepted) => {
      if (accepted[0]) {
        const url = URL.createObjectURL(accepted[0]);
        setRefImageUrl(url);
      }
    },
  });
  // Prompt length color — yellow at 160, red at 190+
  const promptLen = prompt.length;
  const promptLenColor = promptLen >= 190 ? 'var(--danger)' : promptLen >= 160 ? 'var(--warning)' : 'var(--text-disabled)';

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [prompt]);

  // Close My Prompts dropdown on outside click
  useEffect(() => {
    if (!showFavMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // closest ancestor with data-fav-menu closes on outside click
      const menu = document.querySelector('[data-fav-menu]');
      if (menu && !menu.contains(target)) setShowFavMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFavMenu, setShowFavMenu]);

  const examples = EXAMPLE_PROMPTS[tool];
  const canGenerate = prompt.trim().length > 0 && !isLoading;

  return (
    <div className="scroll-region flex flex-col gap-0">

      {/* Prompt */}
      <div className="p-4 flex flex-col gap-3">
        <div className="form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Prompt</label>
            <div className="flex items-center gap-2">
              <span className="text-2xs" style={{ fontSize: '0.65rem', color: promptLenColor }}>
                {promptLen}/200
              </span>
              {/* Save as Favorite */}
              <button type="button"
                title={favSaved ? 'Saved!' : 'Save prompt as favorite'}
                aria-label={favSaved ? 'Saved!' : 'Save prompt as favorite'}
                onClick={savePromptAsFavorite}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, color: favSaved ? '#f59e0b' : 'var(--text-disabled)', transition: 'color 0.15s' }}
              >
                {favSaved ? '+' : '+'}
              </button>
              {/* My Prompts dropdown */}
              {favPrompts.length > 0 && (
                <div data-fav-menu style={{ position: 'relative' }}>
                  <button type="button"
                    title="My saved prompts"
                    onClick={() => setShowFavMenu(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: 'var(--text-disabled)', padding: '0 2px' }}
                  >
                    My Prompts ▾
                  </button>
                  {showFavMenu && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 220, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px var(--overlay-30)' }}>
                      {favPrompts.map(f => (
                        <button type="button"
                          key={f.id}
                          onClick={() => { setPrompt(f.prompt); setShowFavMenu(false); }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                        >
                          {f.prompt.length > 60 ? f.prompt.slice(0, 58) + '…' : f.prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* History dropdown */}
            {promptHistory.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn-ghost btn-xs"
                  onClick={() => setShowPromptHistory(v => !v)}
                  title="Recent prompts"
                  style={{ fontSize: '0.65rem', padding: '0 2px' }}
                >
                  History ▾
                </button>
                {showPromptHistory && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--surface-overlay, #1a1a2e)', border: '1px solid var(--surface-border, #303050)', borderRadius: 6, minWidth: 280, maxHeight: 220, overflowY: 'auto', padding: 4, marginTop: 4 }}>
                    {promptHistory.map((p, i) => (
                      <button type="button"
                        key={i}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                        onClick={() => { setPrompt(p); setShowPromptHistory(false); }}
                      >
                        {p.slice(0, 80)}{p.length > 80 ? '…' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className="textarea"
            placeholder={PRESET_PLACEHOLDERS[stylePreset] ?? 'Describe what you want to generate…'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
            rows={3}
            maxLength={200}
            style={{ resize: 'none', minHeight: 72 }}
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              title="AI-enhance your prompt with style details (⌘↑)"
              style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: isEnhancing ? 'var(--surface-overlay)' : 'rgba(139,92,246,0.15)',
                border: '1px solid var(--accent-glow)',
                color: isEnhancing ? 'var(--text-disabled)' : 'var(--accent)',
                cursor: isEnhancing || !prompt.trim() ? 'not-allowed' : 'pointer',
                opacity: !prompt.trim() ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              {isEnhancing ? 'Enhancing…' : 'Enhance'}
            </button>
          </div>
          <PromptIntelligenceBar
            prompt={prompt}
            mode="pixel"
            onAccept={(enriched) => setPrompt(enriched.slice(0, 200))}
          />
        </div>

        {/* Example prompts */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-disabled)' }}>
            Examples:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {examples.slice(0, 4).map((ex) => (
              <button type="button"
                key={ex}
                className="chip text-xs"
                style={{ fontSize: '0.7rem' }}
                onClick={() => setPrompt(ex)}
              >
                {ex.length > 38 ? ex.slice(0, 36) + '…' : ex}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced toggle — contains negative prompt */}
        <button type="button"
          className="flex items-center gap-1.5 text-xs self-start transition-colors duration-150"
          style={{ color: showAdvanced ? 'var(--text-secondary)' : 'var(--text-disabled)' }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▾' : '▸'}
          Advanced
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-2 animate-fade-in-fast">
            <div className="form-group">
              <label className="label mb-1" style={{ fontSize: '0.72rem' }}>Negative prompt</label>
              <textarea
                className="textarea"
                placeholder="What to avoid in the output…"
                value={negPrompt}
                onChange={(e) => setNegPrompt(e.target.value)}
                rows={2}
                style={{ resize: 'none', minHeight: 54 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Style preset — always visible, categorized tabs */}
      <SectionHeader>Style Preset</SectionHeader>
      <ApplySavedStyleButton mode="pixel" onApply={(preset) => onPresetSelect(preset as StylePreset)} />
      <div className="px-4 pb-1">
        {/* Category tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {PRESET_CATEGORIES.map((cat) => (
            <button type="button"
              key={cat.id}
              onClick={() => setPresetCategory(cat.id)}
              className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full transition-all duration-150"
              style={{
                background: presetCategory === cat.id ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${presetCategory === cat.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                color: presetCategory === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Preset grid — filtered by category */}
        <div className="grid grid-cols-2 gap-1.5 pb-2">
          {PRESETS_BY_CATEGORY[presetCategory].map((pid) => {
            const preset = STYLE_PRESETS.find(p => p.id === pid);
            if (!preset) return null;
            return (
              <button type="button"
                key={preset.id}
                onClick={() => onPresetSelect(preset.id)}
                className="flex flex-col gap-0.5 p-2 rounded-md text-left transition-all duration-150"
                style={{
                  background: stylePreset === preset.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                  border: `1px solid ${stylePreset === preset.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                  color: stylePreset === preset.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <span className="text-xs font-medium">{preset.label}</span>
                <span
                  className="text-2xs leading-tight"
                  style={{ fontSize: '0.6rem', color: stylePreset === preset.id ? 'var(--text-muted)' : 'var(--text-disabled)' }}
                >
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Category — only for Sprite + Edit tools */}
      {toolControls.showCategory && (
        <>
      <SectionHeader>Asset Category</SectionHeader>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-1">
          {([
            { id: 'none',       label: 'Any',      hint: 'Model decides composition' },
            { id: 'weapon',      label: 'Weapon',   hint: 'Single weapon, transparent bg, clear silhouette' },
            { id: 'armor',       label: 'Armor',    hint: 'Armor piece, centered, metallic, no wearer' },
            { id: 'character',   label: 'Char',     hint: 'Full body sprite, centered, idle pose, transparent bg' },
            { id: 'monster',     label: 'Monster',  hint: 'Enemy sprite, menacing, centered, transparent bg' },
            { id: 'consumable',  label: 'Item',     hint: 'Game item icon, clear readable silhouette' },
            { id: 'gem',         label: 'Gem',      hint: 'Gemstone, faceted, centered, transparent bg' },
            { id: 'structure',   label: 'Build',    hint: 'Building or structure, side or top-down view' },
            { id: 'nature',      label: 'Nature',   hint: 'Organic terrain, foliage, tileable-friendly' },
            { id: 'ui',          label: 'UI',       hint: 'HUD element, flat design, readable at small size' },
            { id: 'effect',      label: 'Effect',   hint: 'Particle or magic effect, transparent-friendly' },
            { id: 'tile',        label: 'Tile',     hint: 'Seamless tile, no visible seams, tileable edges' },
            { id: 'container',   label: 'Chest',    hint: 'Container prop, readable silhouette, centered' },
            { id: 'portrait',    label: 'Portrait', hint: 'Character bust, face and upper body, expressive' },
            { id: 'vehicle',     label: 'Vehicle',  hint: 'Vehicle or mount, side or top-down view' },
          ] as { id: import('@/lib/prompt-builder').AssetCategory; label: string; hint: string }[]).map((cat) => (
            <button type="button"
              key={cat.id}
              onClick={() => setAssetCategory(cat.id)}
              title={cat.hint}
              className="flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md transition-all duration-150"
              style={{
                background: assetCategory === cat.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                border: `1px solid ${assetCategory === cat.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                color: assetCategory === cat.id ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <span style={{ fontSize: '0.6rem', fontWeight: 500 }}>{cat.label}</span>
            </button>
          ))}
        </div>
        {/* Hint text for the active category */}
        {assetCategory !== 'none' && (() => {
          const CATEGORY_HINTS: Partial<Record<import('@/lib/prompt-builder').AssetCategory, string>> = {
            weapon:     'Single weapon, transparent bg, clear silhouette',
            armor:      'Armor piece, centered, metallic detail, no wearer',
            character:  'Full body sprite, centered, idle pose, transparent bg',
            monster:    'Enemy sprite, menacing pose, centered, transparent bg',
            consumable: 'Game item icon, glowing aura, readable silhouette',
            gem:        'Gemstone, faceted surfaces, centered, transparent bg',
            structure:  'Building or structure, side or top-down view',
            nature:     'Organic terrain or foliage, tileable-friendly',
            ui:         'HUD element, flat design, readable at small size',
            effect:     'Particle or magic effect, bright, transparent-friendly',
            tile:       'Seamless tile, no visible seams, tileable in all directions',
            container:  'Container prop, readable silhouette, centered',
            portrait:   'Character bust, face and upper body, expressive detail',
            vehicle:    'Vehicle or mount, full body, side or top-down view',
          };
          const hint = CATEGORY_HINTS[assetCategory];
          return hint ? (
            <p
              className="mt-2 text-2xs leading-relaxed"
              style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5 }}
            >
              {hint}
            </p>
          ) : null;
        })()}
      </div>
        </>
      )}

      {/* Pixel Era — hidden for Inpaint (uses original image's era) */}
      {toolControls.showEra && (
        <>
      <SectionHeader>Pixel Era</SectionHeader>
      <div className="p-4">
        <div className="flex gap-1.5 flex-wrap">
          {([
            { id: 'none',    label: 'Auto'     },
            { id: 'nes',     label: '8-bit NES' },
            { id: 'gameboy', label: 'Game Boy'  },
            { id: 'snes',    label: '16-bit'    },
            { id: 'gba',     label: '32-bit'    },
            { id: 'modern',  label: 'Modern'    },
          ] as { id: import('@/lib/prompt-builder').PixelEra; label: string }[]).map((era) => (
            <button type="button"
              key={era.id}
              onClick={() => setPixelEra(era.id)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: pixelEra === era.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                border: `1px solid ${pixelEra === era.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                color: pixelEra === era.id ? 'var(--accent)' : 'var(--text-muted)',
                minWidth: 52,
              }}
            >
              {era.label}
            </button>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Background — hidden for Inpaint + Tileset */}
      {toolControls.showBgMode && (
        <>
      <SectionHeader>Background</SectionHeader>
      <div className="p-4">
        <div className="flex gap-1.5">
          {([
            { id: 'transparent', label: 'None' },
            { id: 'dark',        label: 'Dark'  },
            { id: 'scene',       label: 'Scene' },
          ] as { id: import('@/lib/prompt-builder').BackgroundMode; label: string }[]).map((bg) => (
            <button type="button"
              key={bg.id}
              onClick={() => setBgMode(bg.id)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: bgMode === bg.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                border: `1px solid ${bgMode === bg.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                color: bgMode === bg.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {bg.label}
            </button>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Outline (hidden for Animate, Directions, Tileset) */}
      {toolControls.showOutline && (
        <>
      <SectionHeader>Outline</SectionHeader>
      <div className="px-4 pb-4">
        <div className="flex gap-1.5">
          {([
            { id: 'bold', label: 'Bold'  },
            { id: 'soft', label: 'Soft'  },
            { id: 'none', label: 'None'  },
            { id: 'glow', label: 'Glow'  },
          ] as { id: import('@/lib/prompt-builder').OutlineStyle; label: string }[]).map((o) => (
            <button type="button"
              key={o.id}
              onClick={() => setOutlineStyle(o.id)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: outlineStyle === o.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                border: `1px solid ${outlineStyle === o.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                color: outlineStyle === o.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Palette (hidden for Animate, Directions, Inpaint) */}
      {toolControls.showPalette && (
        <>
      <SectionHeader>Palette Colors</SectionHeader>
      <div className="px-4 pb-4">
          <div className="flex gap-1.5 flex-wrap">
            {([4, 8, 16, 32, 64, 256] as import('@/lib/prompt-builder').PaletteSize[]).map((p) => (
              <button type="button"
                key={p}
                onClick={() => setPaletteSize(p)}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  background: paletteSize === p ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                  border: `1px solid ${paletteSize === p ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                  color: paletteSize === p ? 'var(--accent)' : 'var(--text-muted)',
                  minWidth: 32,
                }}
              >
                {p}
              </button>
            ))}
          </div>
      </div>
        </>
      )}

      {/* Animate-specific controls */}
      {tool === 'animate' && (
        <>
          <SectionHeader>Animation Type</SectionHeader>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { id: 'idle',      label: 'Idle',       desc: 'Breathing, subtle motion'   },
                { id: 'walk',      label: 'Walk',       desc: '8-frame walk cycle'          },
                { id: 'run',       label: 'Run',        desc: 'Fast movement cycle'         },
                { id: 'attack',    label: 'Attack',     desc: 'Strike animation'            },
                { id: 'cast',      label: 'Cast',       desc: 'Magic spell release'         },
                { id: 'death',     label: 'Death',      desc: 'Fall and fade out'           },
                { id: 'fire',      label: 'Fire',       desc: 'Looping flame effect'        },
                { id: 'magic',     label: 'Magic',      desc: 'Particle burst loop'         },
                { id: 'explosion', label: 'Explode',    desc: 'Expand and dissipate'        },
                { id: 'water',     label: 'Water',      desc: 'Ripple surface loop'         },
                { id: 'custom',    label: 'Custom',     desc: 'Describe your own'           },
              ] as { id: import('@/lib/prompt-builder').AnimationType; label: string; desc: string }[]).map((atype) => (
                <button type="button"
                  key={atype.id}
                  onClick={() => setAnimationType(atype.id)}
                  className="flex flex-col gap-0.5 p-2 rounded-md text-left transition-all duration-150"
                  style={{
                    background: animationType === atype.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                    border: `1px solid ${animationType === atype.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                    color: animationType === atype.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{atype.label}</span>
                  <span style={{ fontSize: '0.6rem', color: animationType === atype.id ? 'var(--text-muted)' : 'var(--text-disabled)' }}>{atype.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <SectionHeader>GIF Settings</SectionHeader>
          <div className="p-4 flex flex-col gap-3">
            <div>
              <label className="label" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Frames</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{animFrameCount}</span>
              </label>
              <div className="flex gap-1.5">
                {([2, 4, 6, 8, 12] as number[]).map((fc) => (
                  <button type="button" key={fc} onClick={() => setAnimFrameCount(fc)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                    style={{
                      background: animFrameCount === fc ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                      border: `1px solid ${animFrameCount === fc ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                      color: animFrameCount === fc ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >{fc}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>FPS</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{animFps}</span>
              </label>
              <div className="flex gap-1.5">
                {([4, 8, 12, 18, 24] as number[]).map((f) => (
                  <button type="button" key={f} onClick={() => setAnimFps(f)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                    style={{
                      background: animFps === f ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                      border: `1px solid ${animFps === f ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                      color: animFps === f ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >{f}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6 }}>Loop Mode</label>
              <div className="flex gap-1.5">
                {([
                  { id: 'infinite', label: 'Loop'      },
                  { id: 'pingpong', label: 'Ping-Pong' },
                  { id: 'once',     label: 'Once'      },
                ] as { id: typeof animLoop; label: string }[]).map((lm) => (
                  <button type="button" key={lm.id} onClick={() => setAnimLoop(lm.id)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                    style={{
                      background: animLoop === lm.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                      border: `1px solid ${animLoop === lm.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                      color: animLoop === lm.id ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >{lm.label}</button>
                ))}
              </div>
            </div>
            <p className="form-hint">
              {animFrameCount} frames @ {animFps}fps = {(animFrameCount / animFps).toFixed(1)}s GIF
              {animLoop === 'pingpong' ? ` (×2 ping-pong = ${((animFrameCount * 2 - 2) / animFps).toFixed(1)}s)` : ''}
            </p>
            <div>
              <label className="label" style={{ marginBottom: 6 }}>Output Format</label>
              <div className="flex gap-1.5">
                {([
                  { id: 'gif',          label: 'GIF'         },
                  { id: 'png_sequence', label: 'PNG Sequence' },
                ] as { id: 'gif' | 'png_sequence'; label: string }[]).map((fmt) => (
                  <button type="button" key={fmt.id} onClick={() => setAnimOutputFormat(fmt.id)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                    style={{
                      background: animOutputFormat === fmt.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                      border: `1px solid ${animOutputFormat === fmt.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                      color: animOutputFormat === fmt.id ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >{fmt.label}</button>
                ))}
              </div>
              <p className="form-hint mt-1">GIF = ready to use. PNG Sequence = for manual animation import.</p>
            </div>
          </div>
        </>
      )}

      {/* Directions controls (showDirControls) */}
      {toolControls.showDirControls && (
        <>
          <SectionHeader>Direction Count</SectionHeader>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-1.5">
              {([4, 8] as (4|8)[]).map((n) => (
                <button type="button" key={n} onClick={() => setDirectionCount(n)}
                  className="flex-1 py-2 rounded-md text-xs font-medium transition-all duration-150 flex flex-col items-center"
                  style={{
                    background: directionCount === n ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                    border: `1px solid ${directionCount === n ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                    color: directionCount === n ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  <span className="font-bold">{n}</span>
                  <span style={{ fontSize: '0.58rem', marginTop: 2 }}>
                    {n === 4 ? 'N/S/E/W' : 'N/NE/E/SE/S/SW/W/NW'}
                  </span>
                </button>
              ))}
            </div>
            <p className="form-hint">4-dir: top-down RPG. 8-dir: isometric or fighting games.</p>
            <div>
              <label className="label" style={{ marginBottom: 6 }}>Reference Image</label>
              <input
                ref={refImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = URL.createObjectURL(f);
                  setRefImageUrl(url);
                }}
              />
              {refImageUrl ? (
                <div className="flex flex-col gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={refImageUrl} alt="Reference" style={{ width: 64, height: 64, imageRendering: 'pixelated', borderRadius: 4, border: '1px solid var(--surface-border)', objectFit: 'contain', background: 'var(--surface-overlay)' }} />
                  <div className="flex gap-1.5">
                    <button type="button" className="btn-ghost btn-xs flex-1" onClick={() => refImageInputRef.current?.click()}>Change</button>
                    <button type="button" className="btn-ghost btn-xs flex-1" onClick={() => setRefImageUrl(null)}>Remove</button>
                  </div>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`studio-dropzone${isDragActive ? ' studio-dropzone--active' : ''}`}
                  style={{
                    border: `1px dashed ${isDragActive ? 'var(--accent)' : 'var(--surface-border)'}`,
                    borderRadius: 6,
                    padding: '12px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragActive ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                    color: isDragActive ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* @ts-expect-error react-dropzone v12 input props type compat */}
                  <input {...getInputProps()} />
                  {isDragActive
                    ? <span>Drop image here</span>
                    : <span>Drag reference image or click to browse</span>
                  }
                </div>
              )}
              <p className="form-hint mt-1">Upload a front-facing sprite to maintain consistency across {directionCount} views.</p>
            </div>
          </div>
        </>
      )}

      {/* Mask upload (inpaint tool) */}
      {toolControls.showMaskUpload && (
        <>
          <SectionHeader>Mask Image</SectionHeader>
          <div className="p-4">
            <p className="form-hint mb-2">Upload a black/white mask. White = areas to inpaint.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => setMaskUrl(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="text-xs text-[var(--text)]/50 file:mr-2 file:text-xs file:bg-white/10 file:border-0 file:text-[var(--text)]/70 file:px-2 file:py-1 file:rounded"
            />
            {maskUrl && <img src={maskUrl} alt="Mask preview" className="mt-2 w-20 h-20 object-cover rounded opacity-70" />}
          </div>
        </>
      )}

      {/* Map size (scene/tileset tool) */}
      {toolControls.showMapSize && (
        <>
          <SectionHeader>Grid Size</SectionHeader>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Grid size</label>
              <select
                value={mapSize}
                onChange={e => setMapSize(e.target.value)}
                style={{ fontSize: '0.75rem', background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-secondary)' }}
              >
                <option value="2x2">2×2</option>
                <option value="4x4">4×4</option>
                <option value="8x8">8×8</option>
                <option value="16x16">16×16</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Output size */}
      <SectionHeader>Output Size</SectionHeader>
      <div className="p-4">
        <div className="flex gap-1.5 flex-wrap">
          {SIZES.map((s) => {
            const recSize = PRESET_CONFIG[stylePreset].size;
            const isRec = s === recSize;
            return (
              <button type="button"
                key={s}
                onClick={() => setSize(s)}
                className="flex flex-col items-center flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  background: size === s ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                  border: `1px solid ${size === s ? 'var(--accent-muted)' : isRec ? 'var(--accent-faint, rgba(99,102,241,.3))' : 'var(--surface-border)'}`,
                  color: size === s ? 'var(--accent)' : 'var(--text-muted)',
                  minWidth: 42,
                  boxShadow: isRec && size !== s ? '0 0 0 1px var(--accent-faint, rgba(99,102,241,.2))' : 'none',
                }}
              >
                <span>{s}</span>
                <span style={{ fontSize: '0.55rem', color: isRec ? 'var(--accent-muted)' : 'var(--text-disabled)', marginTop: 1 }}>
                  {SIZE_LABELS[s]}
                </span>
              </button>
            );
          })}
        </div>
        {size < PRESET_CONFIG[stylePreset].size && (
          <p className="form-hint mt-2" style={{ color: 'var(--warning)' }}>
            Below recommended size — detail loss likely
          </p>
        )}
        <p className="form-hint mt-2">
          {(() => {
            const ar = ASPECT_RATIOS.find(a => a.id === aspectRatio) ?? ASPECT_RATIOS[0];
            const w = Math.round(size * ar.w / Math.max(ar.w, ar.h));
            const h = Math.round(size * ar.h / Math.max(ar.w, ar.h));
            return `Output: ${w}×${h}px`;
          })()}
        </p>
      </div>

      {/* Aspect Ratio */}
      <SectionHeader>Aspect Ratio</SectionHeader>
      <div className="p-4">
        <div className="flex gap-1.5 flex-wrap">
          {ASPECT_RATIOS.map((ar) => {
            const maxDim = 20;
            const tw = ar.w >= ar.h ? maxDim : Math.round(maxDim * ar.w / ar.h);
            const th = ar.h >= ar.w ? maxDim : Math.round(maxDim * ar.h / ar.w);
            return (
              <button type="button"
                key={ar.id}
                onClick={() => setAspectRatio(ar.id)}
                className="flex-1 py-2 rounded-md text-xs font-medium transition-all duration-150 flex flex-col items-center gap-1"
                title={`${ar.label} — ${ar.use}`}
                style={{
                  background: aspectRatio === ar.id ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                  border: `1px solid ${aspectRatio === ar.id ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                  color: aspectRatio === ar.id ? 'var(--accent)' : 'var(--text-muted)',
                  minWidth: 42,
                }}
              >
                <svg width={tw} height={th} viewBox={`0 0 ${tw} ${th}`} style={{ display: 'block' }}>
                  <rect x={0.5} y={0.5} width={tw - 1} height={th - 1} rx={1}
                    fill={aspectRatio === ar.id ? 'var(--accent-dim)' : 'transparent'}
                    stroke={aspectRatio === ar.id ? 'var(--accent)' : 'var(--text-disabled)'}
                    strokeWidth={1}
                  />
                </svg>
                <span style={{ fontSize: '0.6rem' }}>{ar.label}</span>
              </button>
            );
          })}
        </div>
        <p className="form-hint mt-2">
          {(() => {
            const ar = ASPECT_RATIOS.find(a => a.id === aspectRatio) ?? ASPECT_RATIOS[0];
            return `${ar.label} — ${ar.use}`;
          })()}
        </p>
      </div>

      {/* Provider */}
      <SectionHeader>Provider</SectionHeader>
      <div className="p-4">
        <div className="flex flex-col gap-1.5">
          {(['replicate', 'fal', 'together', 'comfyui'] as Provider[]).map((pid) => {
            const info = providers.find((p) => p.id === pid);
            const supported = info?.capabilities?.[tool] !== false;
            return (
              <button type="button"
                key={pid}
                disabled={!supported}
                onClick={() => setProvider(pid)}
                className="flex items-center gap-3 p-2.5 rounded-md transition-all duration-150"
                style={{
                  background: provider === pid ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${provider === pid ? PROVIDER_COLORS[pid] + '55' : 'var(--surface-border)'}`,
                  opacity: supported ? 1 : 0.35,
                  cursor: supported ? 'pointer' : 'not-allowed',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: PROVIDER_COLORS[pid] }}
                />
                <span
                  className="text-xs font-medium flex-1 text-left"
                  style={{ color: provider === pid ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {PROVIDER_LABELS[pid]}
                </span>
                {info?.configured ? (
                  <span
                    className="text-2xs font-medium"
                    style={{ fontSize: '0.62rem', color: 'var(--success)' }}
                  >
                    ✓ ready
                  </span>
                ) : pid === 'comfyui' ? (
                  <span
                    className="text-2xs"
                    style={{ fontSize: '0.62rem', color: 'var(--text-disabled)' }}
                  >
                    local
                  </span>
                ) : (
                  <span
                    className="text-2xs"
                    style={{ fontSize: '0.62rem', color: 'var(--warning)' }}
                  >
                    needs key
                  </span>
                )}
                {provider === pid && (
                  <span style={{ color: PROVIDER_COLORS[pid], fontSize: 12 }}>●</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150"
        style={{ borderTop: '1px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}
        onClick={() => setShowAdvanced(!showAdvanced)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowAdvanced(!showAdvanced)}
        aria-expanded={showAdvanced}
      >
        <span className="section-title">Advanced</span>
        <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>
          {showAdvanced ? '▾' : '▸'}
        </span>
      </div>

      {showAdvanced && (
        <div className="p-4 flex flex-col gap-4 animate-fade-in-fast">
          {/* Seed */}
          <FormField
            label="Seed"
            hint="Leave blank for random. Same seed + prompt = same result."
          >
            <div className="flex gap-2">
              <input
                type="number"
                className="input flex-1"
                placeholder="Random"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                min={0}
                max={2147483647}
              />
              <button type="button"
                className="btn-secondary btn-icon flex-shrink-0"
                onClick={() => setSeed(String(randomSeed()))}
                title="Roll random seed"
                aria-label="Roll random seed"
              >
                Rng
              </button>
              {seed && (
                <button type="button"
                  className="btn-ghost btn-icon flex-shrink-0"
                  onClick={() => setSeed('')}
                  title="Clear seed"
                  aria-label="Clear seed"
                >
                  ✕
                </button>
              )}
            </div>
            {seed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  title={lockSeed ? 'Unlock seed (will vary each generation)' : 'Lock seed (keep same across generations)'}
                  onClick={() => setLockSeed(v => !v)}
                  style={{
                    padding: '3px 8px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid var(--surface-border, #303050)',
                    background: lockSeed ? 'var(--accent-subtle)' : 'transparent',
                    color: lockSeed ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: lockSeed ? 600 : 400,
                  }}
                >
                  {lockSeed ? 'Locked' : 'Lock'}
                </button>
                {!lockSeed && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Will vary each gen</span>
                )}
              </div>
            )}
          </FormField>

          {/* Steps */}
          <FormField label={`Steps: ${steps}`} hint="More steps = higher quality but slower. 4 for FLUX, 20 for SDXL.">
            <input
              type="range"
              className="slider"
              min={1}
              max={50}
              step={1}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>
              <span>1</span>
              <span>50</span>
            </div>
          </FormField>

          {/* Guidance */}
          <FormField label={`Guidance: ${guidance.toFixed(1)}`} hint="How closely to follow the prompt. 3–7 for FLUX, 7–12 for SDXL.">
            <input
              type="range"
              className="slider"
              min={1}
              max={20}
              step={0.5}
              value={guidance}
              onChange={(e) => setGuidance(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>
              <span>1</span>
              <span>20</span>
            </div>
          </FormField>

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Save to gallery
              </p>
              <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
                Publishes result to the shared gallery
              </p>
            </div>
            <button type="button"
              className={cn('toggle-track', isPublic && 'on')}
              onClick={() => setIsPublic(!isPublic)}
              role="switch"
              aria-checked={isPublic}
              aria-label="Save to gallery"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" style={{ minHeight: 16 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main studio page (inner, uses useSearchParams)
// ---------------------------------------------------------------------------
function StudioInner() {
  const searchParams = useSearchParams();
  const initialTool = (searchParams.get('tool') as Tool | null) ?? 'generate';
  const initialPrompt = searchParams.get('prompt') ?? '';
  const { success: toastSuccess, error: toastError } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>(
    TOOLS.find((t) => t.id === initialTool) ? initialTool : 'generate',
  );

  // Form state
  const [prompt, setPrompt]           = useState(initialPrompt);
  const [negPrompt, setNegPrompt]     = useState('');
  const [size, setSize]               = useState<PixelSize>(512);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [stylePreset, setStylePreset] = useState<StylePreset>('rpg_icon');
  const [presetCategory, setPresetCategory] = useState<PresetCategory>('characters');
  const [seed, setSeed]               = useState('');
  const [lockSeed, setLockSeed]       = useState(false);
  const [steps, setSteps]             = useState(4);
  const [guidance, setGuidance]       = useState(3.5);
  const [provider, setProvider]       = useState<Provider>('together');
  const [isPublic, setIsPublic]       = useState(false);
  const [batchCount, setBatchCount]   = useState<1|2|4>(1);
  const [batchResults, setBatchResults] = useState<GenerationResult[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number>(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<GenerationResult[]>([]);
  const [useHD, setUseHD]             = useState(false); // HD = Replicate; Standard = Pollinations
  const [showAdvanced, setShowAdvanced] = useState(false); // negative prompt toggle

  // SFX / Sounds panel
  const [showSoundsPanel, setShowSoundsPanel] = useState(false);
  const [sfxPrompt, setSfxPrompt]             = useState('');
  const [sfxDuration, setSfxDuration]         = useState(2.0);
  const [sfxInfluence, setSfxInfluence]       = useState(0.6);
  const [sfxAudio, setSfxAudio]               = useState<string | null>(null);
  const [sfxLoading, setSfxLoading]           = useState(false);
  const [sfxError, setSfxError]               = useState<string | null>(null);

  // Workspace
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wokgen:workspace:pixel') ?? null;
    return null;
  });

  // Brand context
  const [brandKitId, setBrandKitId] = useState<string | null>(null);

  // Generation presets
  const [genPresets, setGenPresets] = useState<Array<{ id: string; name: string; prompt: string; params?: Record<string, unknown> }>>([]);
  const [showGenPresets, setShowGenPresets] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showPresetNameInput, setShowPresetNameInput] = useState(false);
  const loadGenPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/presets');
      if (res.ok) { const d = await res.json(); setGenPresets(d.presets ?? []); }
    } catch { /* ignore */ }
  }, []);
  const saveGenPreset = useCallback(async () => {
    if (!presetNameInput.trim()) return;
    await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: presetNameInput.trim(), mode: activeTool, prompt }),
    });
    setPresetNameInput('');
    setShowPresetNameInput(false);
    loadGenPresets();
  }, [activeTool, prompt, presetNameInput, loadGenPresets]);
  const deleteGenPreset = useCallback(async (id: string) => {
    await fetch(`/api/presets/${id}`, { method: 'DELETE' });
    setGenPresets(prev => prev.filter(p => p.id !== id));
  }, []);
  useEffect(() => { loadGenPresets(); }, [loadGenPresets]);

  // Generation intelligence controls
  const [assetCategory, setAssetCategory] = useState<import('@/lib/prompt-builder').AssetCategory>('none');
  const [pixelEra, setPixelEra]           = useState<import('@/lib/prompt-builder').PixelEra>('none');
  const [bgMode, setBgMode]               = useState<import('@/lib/prompt-builder').BackgroundMode>('transparent');
  const [outlineStyle, setOutlineStyle]   = useState<import('@/lib/prompt-builder').OutlineStyle>('bold');
  const [paletteSize, setPaletteSize]     = useState<import('@/lib/prompt-builder').PaletteSize>(32);

  // Animate tool state
  const [animationType, setAnimationType] = useState<import('@/lib/prompt-builder').AnimationType>('idle');
  const [animFrameCount, setAnimFrameCount] = useState(6);
  const [animFps, setAnimFps]             = useState(8);
  const [animLoop, setAnimLoop]           = useState<'infinite' | 'pingpong' | 'once'>('infinite');
  const [animOutputFormat, setAnimOutputFormat] = useState<'gif' | 'png_sequence'>('gif');

  // Directions tool state
  const [directionCount, setDirectionCount] = useState<4 | 8>(4);
  const [refImageUrl, setRefImageUrl]     = useState<string | null>(null);
  const refImageInputRef                  = useRef<HTMLInputElement>(null);

  // Inpaint tool state
  const [maskUrl, setMaskUrl]             = useState<string | null>(null);

  // Tileset/scene tool state
  const [mapSize, setMapSize]             = useState<string>('4x4');

  // AbortController for cancelling in-flight generate requests
  const abortControllerRef                = useRef<AbortController | null>(null);

  // Output panel state
  const [outputZoom, setOutputZoom]       = useState<1 | 2 | 4>(1);
  const [showPixelGrid, setShowPixelGrid] = useState(false);

  // Bg remove state
  const [bgRemoving, setBgRemoving]       = useState(false);
  const [bgDisplayUrl, setBgDisplayUrl]   = useState<string | null>(null);

  // Job state
  const [jobStatus, setJobStatus]     = useState<JobStatus>('idle');
  const [result, setResult]           = useState<GenerationResult | null>(null);
  const [studioError, setStudioError] = useState<StudioError | null>(null);
  const [savedToGallery, setSavedToGallery] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [history, setHistory]           = useState<HistoryItem[]>([]);
  const [providers, setProviders]       = useState<ProviderInfo[]>([]);

  // HD credit balance (hosted mode)
  const [hdBalance, setHdBalance] = useState<{ monthly: number; topUp: number } | null>(null);

  // BYOK keys (kept for localStorage restore, not used in hosted mode)
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    replicate:    '',
    fal:          '',
    together:     '',
    comfyui:      '',
    huggingface:  '',
    pollinations: '',
  });
  const [comfyuiHost, setComfyuiHost] = useState('http://127.0.0.1:8188');

  // ── Favorites state ────────────────────────────────────────────────────────
  const [favPrompts, setFavPrompts]     = useState<{ id: string; prompt: string; label?: string }[]>([]);
  const [showFavMenu, setShowFavMenu]   = useState(false);
  const [favSaved, setFavSaved]         = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ── Prompt history state ───────────────────────────────────────────────────
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showPromptHistory, setShowPromptHistory] = useState(false);

  // ── Preference sync ────────────────────────────────────────────────────────
  usePreferenceSync('pixel', { tool: activeTool, size, stylePreset, useHD, assetCategory, pixelEra });

  // ── Fetch providers on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/providers')
      .then((r) => r.json())
      .then((data) => {
        if (data.providers) {
          setProviders(data.providers);
          if (data.default) setProvider(data.default as Provider);
        }
      })
      .catch(() => {
        // Graceful fallback — providers endpoint failure should not block studio
      });
  }, []);

  // ── Fetch HD credit balance (hosted mode only) ─────────────────────────────
  const refreshCredits = useCallback(() => {
    fetch('/api/credits')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setHdBalance({ monthly: d.monthlyRemaining ?? 0, topUp: d.topUpCredits ?? 0 }); })
      .catch(() => {});
  }, []);

  useEffect(() => { refreshCredits(); }, [refreshCredits]);

  // Abort in-flight generate request on unmount
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  // ── Init isPublic from user's default preference ───────────────────────────
  useEffect(() => {
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.publicGenerationsDefault) setIsPublic(true); })
      .catch(() => {});
  }, []);

  // ── Restore BYOK keys from localStorage ───────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wokgen:apiKeys');
      if (stored) setApiKeys(JSON.parse(stored));
      const storedHost = localStorage.getItem('wokgen:comfyuiHost');
      if (storedHost) setComfyuiHost(storedHost);
    } catch {
      // localStorage not available (private browsing, SSR hydration) — silently ignore
    }
  }, []);

  // ── Load history from recent jobs ─────────────────────────────────────────
  useEffect(() => {
    const qs = activeWorkspaceId
      ? `limit=20&status=succeeded&mode=pixel&projectId=${activeWorkspaceId}`
      : 'limit=20&status=succeeded&mode=pixel';
    fetch(`/api/generate?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) {
          setHistory(
            (data.jobs as HistoryItem[]).filter((j) => j.resultUrl),
          );
        }
      })
      .catch(() => {});
  }, [activeWorkspaceId]);

  // ── Load favorite prompts ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/favorites?mode=pixel')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.favorites) setFavPrompts(d.favorites); })
      .catch(() => {});
  }, []);

  const savePromptAsFavorite = useCallback(async () => {
    if (!prompt.trim()) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pixel', prompt: prompt.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavPrompts(prev => [data.favorite, ...prev]);
        setFavSaved(true);
        setTimeout(() => setFavSaved(false), 2000);
      }
    } catch { /* silent fail */ }
  }, [prompt]);

  // ── WAP listener — Eral AI action protocol ────────────────────────────────
  useWAPListener((action) => {
    switch (action.type) {
      case 'setParam':
        if (action.key === 'size' && typeof action.value === 'number') {
          setSize(action.value as PixelSize);
        }
        if (action.key === 'style' && typeof action.value === 'string') {
          setStylePreset(action.value as StylePreset);
        }
        if (action.key === 'hd' && typeof action.value === 'boolean') {
          setUseHD(action.value);
        }
        break;
      case 'setPrompt':
        if (action.text) setPrompt(action.text);
        break;
      case 'setTool':
        if (action.tool) setActiveTool(action.tool as Tool);
        break;
      case 'toggleHD':
        setUseHD((prev) => !prev);
        break;
      case 'generate':
        if (action.prompt) setPrompt(action.prompt);
        setTimeout(() => {
          const btn = document.querySelector<HTMLButtonElement>('[data-generate-btn]');
          btn?.click();
        }, 100);
        break;
      case 'batchGenerate':
        // Set first prompt and trigger generate; full batch support can be added later
        if (action.prompts?.length) setPrompt(action.prompts[0]);
        setTimeout(() => {
          const btn = document.querySelector<HTMLButtonElement>('[data-generate-btn]');
          btn?.click();
        }, 100);
        break;
    }
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const inputFocused = tag === 'input' || tag === 'textarea' || tag === 'select';

      // ⌘/Ctrl + Enter → generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
        return;
      }
      // ⌘/Ctrl + R → regenerate
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleGenerate();
        return;
      }
      // ⌘/Ctrl + ArrowUp → enhance prompt
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault();
        setPrompt((p: string) => {
          const tag = ', masterwork, highly detailed, crisp pixels';
          return p.endsWith(tag) ? p : p + tag;
        });
        return;
      }
      // ? → shortcut sheet (not in inputs)
      if (!inputFocused && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(v => !v);
        return;
      }
      // 1–5 → switch tool (only when no input focused)
      if (!inputFocused) {
        const toolMap: Record<string, Tool> = {
          '1': 'generate', '2': 'animate', '3': 'rotate', '4': 'inpaint', '5': 'scene',
        };
        if (toolMap[e.key]) setActiveTool(toolMap[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, provider, size, stylePreset, seed, steps, guidance, negPrompt, isPublic]);

  // Smart preset selection — auto-configures controls, preserves era (user's choice)
  const handlePresetSelect = useCallback((id: StylePreset) => {
    const cfg = PRESET_CONFIG[id];
    setStylePreset(id);
    setSize(cfg.size);
    setAssetCategory(cfg.category);
    setBgMode(cfg.bgMode);
    setPaletteSize(cfg.paletteSize);
    setOutlineStyle(cfg.outlineStyle);
  }, []);

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Compute dimensions from size + aspect ratio
    const ar = ASPECT_RATIOS.find(a => a.id === aspectRatio) ?? ASPECT_RATIOS[0];
    const baseSize = size;
    const genWidth  = Math.min(1024, Math.round(baseSize * ar.w / Math.max(ar.w, ar.h)));
    const genHeight = Math.min(1024, Math.round(baseSize * ar.h / Math.max(ar.w, ar.h)));

    setJobStatus('pending');
    setResult(null);
    setBatchResults([]);
    setStudioError(null);
    setSavedToGallery(false);

    try {
      const baseSeed = seed ? parseInt(seed, 10) : Math.floor(Math.random() * 2147483647);

      // ── Animate tool: calls /api/animate → returns a GIF ──────────────────
      if (activeTool === 'animate') {
        const animBody = {
          prompt:         prompt.trim(),
          animationType,
          frameCount:     animFrameCount,
          fps:            animFps,
          loop:           animLoop,
          size:           Math.min(genWidth, genHeight),
          stylePreset,
          assetCategory:  assetCategory !== 'none' ? assetCategory : undefined,
          pixelEra:       pixelEra !== 'none' ? pixelEra : undefined,
          backgroundMode: bgMode,
          outlineStyle,
          paletteSize,
          seed:           baseSeed,
          quality:        useHD ? 'hd' : 'standard',
        };
        const res = await fetch('/api/animate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(animBody),
          signal,
        });
        let data: Record<string, unknown> = {};
        try { data = await res.json(); } catch { throw new Error(`Server error (HTTP ${res.status})`); }
        if (!res.ok || !data.ok) throw new Error((data.error as string | undefined) ?? `HTTP ${res.status}`);
        const gen: GenerationResult = {
          jobId:        'anim-' + baseSeed,
          resultUrl:    data.resultUrl as string ?? null,
          resultUrls:   null,
          durationMs:   data.durationMs as number | undefined,
          resolvedSeed: baseSeed,
        };
        setResult(gen);
        setSelectedBatch(0);
        setBatchResults([gen]);
        setJobStatus('succeeded');
        if (gen.resultUrl) {
          setHistory(prev => [
            { id: gen.jobId, tool: activeTool, prompt: prompt.trim(), resultUrl: gen.resultUrl, provider: 'huggingface', width: genWidth, height: genHeight, seed: baseSeed, createdAt: new Date().toISOString() },
            ...prev.slice(0, 49),
          ]);
          setPromptHistory(prev => {
            const next = [prompt.trim(), ...prev.filter(p => p !== prompt.trim())].slice(0, 20);
            return next;
          });
        }
        // Auto-vary seed if not locked
        if (!lockSeed && seed) {
          setSeed(String(baseSeed + 1));
        }
        return;
      }

      const makeBody = (seedValue: number, variantIndex: number = 0): Record<string, unknown> => ({
        tool:           activeTool,
        provider,
        mode:           'pixel',
        prompt:         prompt.trim(),
        negPrompt:      negPrompt.trim() || undefined,
        width:          genWidth,
        height:         genHeight,
        stylePreset,
        assetCategory:  assetCategory !== 'none' ? assetCategory : undefined,
        pixelEra:       pixelEra !== 'none' ? pixelEra : undefined,
        backgroundMode: bgMode,
        outlineStyle,
        paletteSize,
        steps,
        guidance,
        isPublic,
        quality:        useHD ? 'hd' : 'standard',
        seed:           seedValue,
        variantIndex,
        ...(activeWorkspaceId ? { projectId: activeWorkspaceId } : {}),
        ...(brandKitId && !activeWorkspaceId ? { brandKitId } : {}),
        ...(apiKeys[provider] ? { apiKey: apiKeys[provider] } : {}),
        ...(provider === 'comfyui' ? { comfyuiHost } : {}),
        extra: {
          ...((activeTool as string) === 'animate' ? { animationType, animFrameCount, animFps, animLoop, animOutputFormat } : {}),
          ...((activeTool as string) === 'rotate'  ? { directionCount, refImageUrl: refImageUrl ?? undefined } : {}),
          ...((activeTool as string) === 'inpaint' ? { maskUrl: maskUrl ?? undefined } : {}),
          ...((activeTool as string) === 'scene'   ? { mapSize } : {}),
        },
      });

      // Determine number of seeds to generate
      const numSeeds = compareMode ? 2 : batchCount;
      const seeds = Array.from({ length: numSeeds }, (_, i) =>
        i === 0 ? baseSeed : baseSeed + i * 137
      );

      const fetchOne = async (s: number, idx: number = 0) => {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makeBody(s, idx)),
          signal,
        });
        let data: Record<string, unknown> = {};
        try { data = await res.json(); } catch { throw new Error(`Server error (HTTP ${res.status})`); }
        if (!res.ok || !data.ok) throw new Error((data.error as string | undefined) ?? `HTTP ${res.status}`);
        return {
          jobId:              (data.job as Record<string, unknown> | null)?.id as string ?? 'local',
          resultUrl:          data.resultUrl as string ?? null,
          resultUrls:         data.resultUrls as string[] ?? null,
          durationMs:         data.durationMs as number | undefined,
          resolvedSeed:       data.resolvedSeed as number | undefined,
          guestDownloadGated: data.guestDownloadGated as boolean | undefined,
          provider:           res.headers.get('X-WokGen-Provider') ?? (data.provider as string | undefined),
        } as GenerationResult;
      };

      if (batchCount === 1) {
        const gen = await fetchOne(baseSeed);
        setResult(gen);
        setSelectedBatch(0);
        setBatchResults([gen]);
        setJobStatus('succeeded');
        if (gen.resultUrl) {
          setHistory(prev => [
            { id: gen.jobId, tool: activeTool, prompt: prompt.trim(), resultUrl: gen.resultUrl, provider, width: genWidth, height: genHeight, seed: gen.resolvedSeed ?? null, createdAt: new Date().toISOString() },
            ...prev.slice(0, 49),
          ]);
        }
        // Auto-vary seed if not locked
        if (!lockSeed && seed) {
          setSeed(String(baseSeed + 1));
        }
      } else {
        const results = await Promise.allSettled(seeds.map((s, idx) => fetchOne(s, idx)));
        const fulfilled = results
          .filter((r): r is PromiseFulfilledResult<GenerationResult> => r.status === 'fulfilled')
          .map(r => r.value);
        if (fulfilled.length === 0) {
          const firstErr = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
          throw new Error(firstErr?.reason?.message ?? 'All generations failed');
        }
        if (compareMode) {
          setCompareResults(fulfilled);
          setResult(fulfilled[0]);
        } else {
          setBatchResults(fulfilled);
          setSelectedBatch(0);
          setResult(fulfilled[0]);
        }
        setJobStatus('succeeded');
        setPromptHistory(prev => {
          const next = [prompt.trim(), ...prev.filter(p => p !== prompt.trim())].slice(0, 20);
          return next;
        });
        fulfilled.forEach(gen => {
          if (gen.resultUrl && !compareMode) {
            setHistory(prev => [
              { id: gen.jobId, tool: activeTool, prompt: prompt.trim(), resultUrl: gen.resultUrl, provider, width: genWidth, height: genHeight, seed: gen.resolvedSeed ?? null, createdAt: new Date().toISOString() },
              ...prev.slice(0, 49),
            ]);
          }
        });
        // Auto-vary seed if not locked
        if (!lockSeed && seed) {
          const nextSeed = baseSeed + numSeeds * 137;
          setSeed(String(nextSeed));
        }
      }

      if (isPublic) setSavedToGallery(true);
      if (useHD) refreshCredits();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStudioError(parseApiError({ status: 0 }, err instanceof Error ? err.message : String(err)));
      setJobStatus('failed');
    }
  }, [
    activeTool, prompt, negPrompt, size, aspectRatio, stylePreset, assetCategory, pixelEra,
    bgMode, outlineStyle, paletteSize, steps, guidance,
    provider, seed, lockSeed, isPublic, apiKeys, comfyuiHost, useHD, refreshCredits, batchCount, compareMode,
    animationType, animFrameCount, animFps, animLoop, maskUrl, mapSize,
  ]);

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const url =
      result?.resultUrl ??
      result?.resultUrls?.[0];
    if (!url) return;

    // Smart filename: wokgen-pixel-{first-5-words}-{timestamp}.ext
    const words = prompt.trim().split(/\s+/).slice(0, 5).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const ext = url.startsWith('data:image/gif') || url.includes('.gif') ? 'gif' : 'png';
    const filename = `wokgen-pixel-${words || 'asset'}-${Date.now()}.${ext}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toastSuccess('Image downloaded');
  }, [result, prompt, toastSuccess]);

  // ── Save to gallery ────────────────────────────────────────────────────────
  const handleSaveToGallery = useCallback(async () => {
    if (!result?.jobId || savedToGallery) return;
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: result.jobId, isPublic: true }),
      });
      if (res.ok) {
        setSavedToGallery(true);
        toastSuccess('Saved to gallery!');
      } else {
        toastError('Failed to save to gallery');
      }
    } catch {
      toastError('Failed to save to gallery');
    }
  }, [result, savedToGallery, toastSuccess, toastError]);

  // ── Copy image ─────────────────────────────────────────────────────────────
  const handleCopyImage = useCallback(async () => {
    const url = result?.resultUrl ?? result?.resultUrls?.[0];
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toastSuccess('Image copied to clipboard');
    } catch {
      toastError('Clipboard not supported in this browser');
    }
  }, [result, toastSuccess, toastError]);

  // ── Reroll ─────────────────────────────────────────────────────────────────
  const handleReroll = useCallback(() => {
    setSeed(String(randomSeed()));
    setJobStatus('idle');
    setResult(null);
    setStudioError(null);
    setBgDisplayUrl(null);
  }, []);

  // ── Background remove ─────────────────────────────────────────────────────
  const handleBgRemove = useCallback(async (url: string) => {
    setBgRemoving(true);
    try {
      const res = await fetch('/api/tools/bg-remove', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error ?? 'BG removal failed'); return; }
      setBgDisplayUrl(`data:image/png;base64,${data.resultBase64}`);
      toastSuccess('Background removed');
    } catch { toastError('BG removal failed'); }
    finally { setBgRemoving(false); }
  }, [toastError, toastSuccess]);

  // ── History select ─────────────────────────────────────────────────────────
  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setPrompt(item.prompt);
    setActiveTool(item.tool);
    if (item.resultUrl) {
      setResult({
        jobId:     item.id,
        resultUrl: item.resultUrl,
        resultUrls: null,
      });
      setJobStatus('succeeded');
    }
    setShowHistory(false);
  }, []);

  // ── Gen history thumbnail strip select ─────────────────────────────────────
  const handleGenHistorySelect = useCallback((entry: GenHistoryEntry) => {
    setPrompt(entry.prompt);
    setResult({
      jobId:      entry.id,
      resultUrl:  entry.url,
      resultUrls: null,
    });
    setJobStatus('succeeded');
    setSavedToGallery(false);
    setBgDisplayUrl(null);
  }, []);

  // ── Copy prompt ────────────────────────────────────────────────────────────
  const handleCopyPrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    try {
      await navigator.clipboard.writeText(prompt.trim());
      toastSuccess('Prompt copied!');
    } catch {
      toastError('Clipboard not supported');
    }
  }, [prompt, toastSuccess, toastError]);

  // ── Generate variation ─────────────────────────────────────────────────────
  const handleGenerateVariation = useCallback(() => {
    setSeed(String(randomSeed()));
    setTimeout(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-generate-btn]');
      btn?.click();
    }, 50);
  }, []);

  // ── Save settings ──────────────────────────────────────────────────────────
  const handleSaveSettings = useCallback(
    (keys: Record<Provider, string>, host: string) => {
      setApiKeys(keys);
      setComfyuiHost(host);
      try {
        localStorage.setItem('wokgen:apiKeys', JSON.stringify(keys));
        localStorage.setItem('wokgen:comfyuiHost', host);
      } catch {
        // ignore
      }
    },
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="studio-layout">

      {/* ── Left panel (controls) ─────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          width: 'var(--panel-width, 380px)',
          background: 'var(--surface-raised)',
          borderRight: '1px solid var(--surface-border)',
        }}
      >
        {/* Panel header */}
        <div className="studio-shell__panel-header" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          <span className="studio-shell__panel-title">Pixel Studio</span>
          <div className="studio-shell__panel-actions">
            <ProviderBadge provider={provider} />
            <QuotaBadge />
            <button
              type="button"
              className="pixel-studio-eral-btn"
              title="Toggle Eral"
              aria-label="Toggle Eral"
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>('.esb-toggle-btn');
                btn?.click();
              }}
            >
              Eral
            </button>
            {/* History toggle */}
            <button
              type="button"
              style={{
                background: showHistory ? 'var(--surface-hover)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: showHistory ? 'var(--text-secondary)' : 'var(--text-disabled)',
                padding: '0.2rem 0.5rem',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
              onClick={() => setShowHistory((v) => !v)}
              title="History"
              aria-label="History"
            >
              History
            </button>
            {/* Settings button removed — cloud-only mode */}
          </div>
        </div>

        {/* Tool tabs */}
        <div className="studio-tool-tabs studio-tool-tabs--row">
          {TOOLS.map((tool) => (
            <button type="button"
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`studio-tool-tab${activeTool === tool.id ? ' studio-tool-tab--active' : ''}`}
              title={`${tool.label} (${tool.kbd})`}
              aria-label={tool.label}
              aria-pressed={activeTool === tool.id}
            >
              {tool.shortLabel}
            </button>
          ))}
        </div>

        {/* Workspace selector */}
        <div className="px-4 pt-3 flex-shrink-0">
          <WorkspaceSelector
            mode="pixel"
            activeWorkspaceId={activeWorkspaceId}
            onChange={setActiveWorkspaceId}
          />
        </div>

        {/* Brand context selector */}
        <div className="px-4 pb-2 flex-shrink-0">
          <BrandContextSelector value={brandKitId} onChange={setBrandKitId} />
        </div>

        {/* Canvas Presets accordion */}
        <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          <CanvasPresets currentSize={size} onSelect={setSize} />
        </div>

        {/* Style Preset quick-pick grid */}
        <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          <p className="pixel-studio-section-label">Style Presets</p>
          <StylePresetGrid
            value={stylePreset}
            onChange={(id) => handlePresetSelect(id as StylePreset)}
          />
        </div>

        {/* Generation Presets */}
        <div className="flex-shrink-0 px-4 py-2" style={{ borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
               onClick={() => setShowGenPresets(v => !v)}>
            <p className="pixel-studio-section-label" style={{ margin: 0 }}>Generation Presets</p>
            <span style={{ fontSize: 11, opacity: 0.6 }}>{showGenPresets ? '▲' : '▼'}</span>
          </div>
          {showGenPresets && (
            <div style={{ marginTop: 6 }}>
              {genPresets.length === 0 && (
                <p style={{ fontSize: 11, opacity: 0.5, margin: '4px 0' }}>No presets saved yet.</p>
              )}
              {genPresets.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <button type="button"
                    onClick={() => setPrompt(p.prompt)}
                    style={{ flex: 1, textAlign: 'left', fontSize: 11, padding: '3px 6px',
                             background: 'var(--surface-2)', border: '1px solid var(--surface-border)',
                             borderRadius: 4, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={p.prompt}
                  >
                    {p.name}
                  </button>
                  <button type="button" onClick={() => deleteGenPreset(p.id)}
                          style={{ fontSize: 10, padding: '2px 5px', background: 'transparent',
                                   border: '1px solid var(--surface-border)', borderRadius: 4, cursor: 'pointer', opacity: 0.6 }}>
                    ✕
                  </button>
                </div>
              ))}
              {showPresetNameInput ? (
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <input
                    autoFocus
                    value={presetNameInput}
                    onChange={e => setPresetNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveGenPreset(); if (e.key === 'Escape') { setShowPresetNameInput(false); setPresetNameInput(''); } }}
                    placeholder="Preset name"
                    style={{ flex: 1, fontSize: 11, padding: '3px 6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={saveGenPreset}
                    disabled={!presetNameInput.trim()}
                    style={{ fontSize: 11, padding: '3px 6px', background: 'var(--accent, var(--accent-muted))', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >Save</button>
                  <button
                    type="button"
                    onClick={() => { setShowPresetNameInput(false); setPresetNameInput(''); }}
                    style={{ fontSize: 11, padding: '3px 6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPresetNameInput(true)}
                  style={{ width: '100%', fontSize: 11, padding: '3px 0', marginTop: 4,
                           background: 'var(--accent, var(--accent-muted))', color: '#fff', border: 'none',
                           borderRadius: 4, cursor: 'pointer' }}
                >
                  + Save current prompt
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tool form */}
        <GenerateForm
          tool={activeTool}
          prompt={prompt}
          setPrompt={setPrompt}
          negPrompt={negPrompt}
          setNegPrompt={setNegPrompt}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          size={size}
          setSize={setSize}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          stylePreset={stylePreset}
          setStylePreset={setStylePreset}
          onPresetSelect={handlePresetSelect}
          presetCategory={presetCategory}
          setPresetCategory={setPresetCategory}
          assetCategory={assetCategory}
          setAssetCategory={setAssetCategory}
          pixelEra={pixelEra}
          setPixelEra={setPixelEra}
          bgMode={bgMode}
          setBgMode={setBgMode}
          outlineStyle={outlineStyle}
          setOutlineStyle={setOutlineStyle}
          paletteSize={paletteSize}
          setPaletteSize={setPaletteSize}
          animationType={animationType}
          setAnimationType={setAnimationType}
          animFrameCount={animFrameCount}
          setAnimFrameCount={setAnimFrameCount}
          animFps={animFps}
          setAnimFps={setAnimFps}
          animLoop={animLoop}
          setAnimLoop={setAnimLoop}
          animOutputFormat={animOutputFormat}
          setAnimOutputFormat={setAnimOutputFormat}
          directionCount={directionCount}
          setDirectionCount={setDirectionCount}
          refImageUrl={refImageUrl}
          setRefImageUrl={setRefImageUrl}
          refImageInputRef={refImageInputRef}
          maskUrl={maskUrl}
          setMaskUrl={setMaskUrl}
          mapSize={mapSize}
          setMapSize={setMapSize}
          seed={seed}
          setSeed={setSeed}
          lockSeed={lockSeed}
          setLockSeed={setLockSeed}
          steps={steps}
          setSteps={setSteps}
          guidance={guidance}
          setGuidance={setGuidance}
          provider={provider}
          setProvider={setProvider}
          providers={providers}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          onGenerate={handleGenerate}
          isLoading={jobStatus === 'pending'}
          favPrompts={favPrompts}
          showFavMenu={showFavMenu}
          setShowFavMenu={setShowFavMenu}
          favSaved={favSaved}
          savePromptAsFavorite={savePromptAsFavorite}
          promptHistory={promptHistory}
          showPromptHistory={showPromptHistory}
          setShowPromptHistory={setShowPromptHistory}
        />

        
        <div style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150"
            onClick={() => setShowSoundsPanel((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowSoundsPanel((v) => !v)}
            aria-expanded={showSoundsPanel}
          >
            <span className="section-title">Sounds</span>
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>
              {showSoundsPanel ? '▾' : '▸'}
            </span>
          </div>

          {showSoundsPanel && (
            <div className="px-4 pb-4 flex flex-col gap-3 animate-fade-in-fast">
              {/* Freesound browser */}
              <SfxBrowser onSelectPrompt={(p) => setSfxPrompt(p)} />
              <div style={{ borderTop: '1px solid var(--surface-border)', margin: '2px 0' }} />
              {/* Prompt label + Auto-suggest */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Describe the sound…
                </label>
                <button type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '2px 8px', height: 'auto' }}
                  onClick={async () => {
                    if (!prompt.trim()) return;
                    try {
                      const res = await fetch('/api/sfx/suggest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visualPrompt: prompt, assetType: 'pixel art game asset' }),
                      });
                      const data = await res.json() as { suggestion?: string };
                      if (data.suggestion) setSfxPrompt(data.suggestion);
                    } catch { /* ignore */ }
                  }}
                  title="Auto-suggest sound from image prompt"
                >
                  ✦ Auto-suggest
                </button>
              </div>
              <input
                type="text"
                className="input"
                placeholder="e.g. sword swing, fire crackle"
                value={sfxPrompt}
                onChange={(e) => setSfxPrompt(e.target.value)}
                maxLength={500}
              />

              {/* Duration slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Duration</label>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sfxDuration.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  className="slider"
                  min={0.5}
                  max={5.0}
                  step={0.5}
                  value={sfxDuration}
                  onChange={(e) => setSfxDuration(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>
                  <span>0.5s</span>
                  <span>5.0s</span>
                </div>
              </div>

              {/* Prompt influence */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Prompt influence</label>
                <div className="flex gap-1">
                  {([['Low', 0.3], ['Balanced', 0.6], ['Exact', 0.9]] as [string, number][]).map(([label, val]) => (
                    <button type="button"
                      key={label}
                      onClick={() => setSfxInfluence(val)}
                      className="flex-1"
                      style={{
                        padding: '3px 0',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: sfxInfluence === val ? 'var(--accent-muted)' : 'var(--surface-border)',
                        background:  sfxInfluence === val ? 'var(--accent-dim)'  : 'transparent',
                        color:       sfxInfluence === val ? 'var(--accent)'      : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: sfxInfluence === val ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button type="button"
                className="btn btn-primary w-full"
                style={{ height: 38, fontSize: '0.85rem', fontWeight: 600 }}
                disabled={sfxLoading || !sfxPrompt.trim()}
                onClick={async () => {
                  if (!sfxPrompt.trim()) return;
                  setSfxLoading(true);
                  setSfxError(null);
                  setSfxAudio(null);
                  try {
                    const res = await fetch('/api/sfx/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: sfxPrompt, duration: sfxDuration, promptInfluence: sfxInfluence }),
                    });
                    const data = await res.json() as { audioBase64?: string; mimeType?: string; error?: string };
                    if (!res.ok || data.error) {
                      setSfxError(data.error ?? 'Sound generation failed');
                    } else if (data.audioBase64 && data.mimeType) {
                      setSfxAudio(`data:${data.mimeType};base64,${data.audioBase64}`);
                    }
                  } catch {
                    setSfxError('Sound generation failed');
                  } finally {
                    setSfxLoading(false);
                  }
                }}
              >
                {sfxLoading ? (
                  <span className="flex items-center justify-center gap-2"><Spinner size="sm" />Generating…</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Generate Sound
                  </span>
                )}
              </button>

              {/* Error */}
              {sfxError && (
                <p className="text-xs" style={{ color: 'var(--error, #ef4444)' }}>{sfxError}</p>
              )}

              {/* Audio player */}
              {sfxAudio && (
                <div className="flex flex-col gap-2">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={sfxAudio} className="w-full" style={{ height: 36, borderRadius: 6 }} />
                  <a
                    href={sfxAudio}
                    download={`${sfxPrompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.mp3`}
                    className="btn-secondary text-center"
                    style={{ fontSize: '0.78rem', padding: '4px 0', display: 'block', textDecoration: 'none' }}
                  >
                    ↓ Download .mp3
                  </a>
                </div>
              )}

              {/* Hint */}
              <p className="text-xs" style={{ color: 'var(--text-disabled)', marginTop: -4 }}>
                Free: 3 sounds/day · Great for game assets
              </p>
            </div>
          )}
        </div>

        {/* Studio Tools — quick access to processing tools */}
        <div
          className="flex-shrink-0"
          style={{ borderBottom: '1px solid var(--surface-border)' }}
        >
          <div className="px-4 py-3">
            <p className="pixel-studio-section-label mb-2">Tools</p>
            <div className="space-y-0.5">
              {[
                { label: 'Background Remover', href: '/tools/background-remover', icon: 'Cut' },
                { label: 'Vectorize', href: '/tools/vectorize', icon: '⬡' },
                { label: 'Image Resize', href: '/tools/image-resize', icon: '⤡' },
                { label: 'Image Compress', href: '/tools/image-compress', icon: '⊡' },
                { label: 'Color Extractor', href: '/tools/color-extractor', icon: '◑' },
                { label: 'Sprite Packer', href: '/tools/sprite-packer', icon: '⊞' },
              ].map(t => (
                <a
                  key={t.href}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[var(--text)]/40 hover:text-[var(--text)]/70 hover:bg-white/5 transition-all"
                >
                  <span className="text-[10px]">{t.icon}</span>
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div
          className="flex flex-col gap-2 p-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--surface-border)' }}
        >
          {/* HD / Standard quality toggle */}
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #666)' }}>
                Quality
              </span>
              <div className="flex gap-1" style={{ fontSize: '0.75rem' }}>
                <button type="button"
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: !useHD ? 'var(--success)' : 'var(--surface-border, #2a2a2a)',
                    background:  !useHD ? 'rgba(16,185,129,.12)' : 'transparent',
                    color:       !useHD ? 'var(--success)' : 'var(--text-muted, #666)',
                    cursor: 'pointer',
                    fontWeight: !useHD ? 600 : 400,
                  }}
                  onClick={() => setUseHD(false)}
                >
                  Standard
                </button>
                <button type="button"
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: useHD ? 'var(--warning)' : 'var(--surface-border, #2a2a2a)',
                    background:  useHD ? 'var(--warning-bg)' : 'transparent',
                    color:       useHD ? 'var(--warning)' : 'var(--text-muted, #666)',
                    cursor: (!useHD && hdBalance !== null && hdBalance.monthly + hdBalance.topUp <= 0) ? 'not-allowed' : 'pointer',
                    fontWeight: useHD ? 600 : 400,
                    opacity: (!useHD && hdBalance !== null && hdBalance.monthly + hdBalance.topUp <= 0) ? 0.4 : 1,
                  }}
                  onClick={() => setUseHD(true)}
                  disabled={!useHD && hdBalance !== null && hdBalance.monthly + hdBalance.topUp <= 0}
                  title={(!useHD && hdBalance !== null && hdBalance.monthly + hdBalance.topUp <= 0) ? `HD requires credits. ${hdBalance.monthly + hdBalance.topUp} remaining.` : 'Uses HD credits (Replicate). Requires Plus plan or top-up pack.'}
                >
                  HD
                </button>
              </div>
            </div>

          <button
            type="button"
            data-generate-btn
            className="btn btn-generate"
            onClick={handleGenerate}
            disabled={!prompt.trim() || jobStatus === 'pending'}
            aria-label="Generate"
          >
            {jobStatus === 'pending' ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Generating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                
                Generate
                <kbd
                  className="ml-auto opacity-60"
                  style={{ fontSize: '0.65rem', background: 'var(--overlay-30)', border: '1px solid var(--border)' }}
                >
                  ⌘↵
                </kbd>
              </span>
            )}
          </button>

          {/* Progress bar */}
          {jobStatus === 'pending' && (
            <div className="animate-fade-in-fast">
              <ProgressBar indeterminate />
            </div>
          )}

          {/* HD credit balance widget (HD selected) */}
          {useHD && hdBalance !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '0.72rem', color: 'var(--text-faint)', padding: '0.25rem 0',
            }}>
              <span>
                <span style={{ color: hdBalance.monthly + hdBalance.topUp > 0 ? 'var(--text-muted)' : 'var(--danger)' }}>
                  HD:{' '}
                  <strong style={{ color: hdBalance.monthly + hdBalance.topUp > 0 ? 'var(--accent-light, #c4b5fd)' : 'var(--danger)' }}>
                    {hdBalance.monthly + hdBalance.topUp}
                  </strong>
                  {' '}credit{hdBalance.monthly + hdBalance.topUp !== 1 ? 's' : ''} left
                </span>
                {hdBalance.topUp > 0 && (
                  <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}>
                    ({hdBalance.monthly} monthly · {hdBalance.topUp} pack)
                  </span>
                )}
              </span>
              <a href="/billing" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.7rem' }}>
                {hdBalance.monthly + hdBalance.topUp === 0 ? 'Add credits →' : 'Manage →'}
              </a>
            </div>
          )}
          {useHD && hdBalance === null && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', paddingTop: '0.25rem' }}>
              <a href="/billing" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                HD credits — sign in or upgrade →
              </a>
            </div>
          )}
          {!useHD && (
            <>
              {/* Batch count toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.25rem' }}>
                <span>Batch</span>
                <div className="flex gap-1">
                  {([1, 2, 4] as const).map(n => (
                    <button type="button"
                      key={n}
                      onClick={() => { setBatchCount(n); setCompareMode(false); }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: batchCount === n ? 'var(--accent-muted)' : 'var(--surface-border)',
                        background:  batchCount === n ? 'var(--accent-dim)' : 'transparent',
                        color:       batchCount === n ? 'var(--accent)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: batchCount === n ? 600 : 400,
                      }}
                    >
                      ×{n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Compare mode toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.125rem' }}>
                <button
                  type="button"
                  onClick={() => { 
                  const nextCompareMode = !compareMode;
                  setCompareMode(nextCompareMode);
                  if (nextCompareMode) setBatchCount(1); // when comparing, ensure batch is 1
                }}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: compareMode ? 'var(--accent-muted)' : 'var(--surface-border)',
                    background: compareMode ? 'var(--accent-dim)' : 'transparent',
                    color: compareMode ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: compareMode ? 600 : 400,
                  }}
                  title="Generate 2 variants side-by-side for comparison"
                >
                  Compare
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-faint)', paddingTop: '0.125rem' }}>
                <span style={{ color: 'var(--success)', marginRight: '0.25rem' }}>∞</span>
                Standard generation is always free
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right: output canvas + history overlay ────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Generation history strip */}
        <GenerationHistory
          latestResult={
            result?.resultUrl
              ? { id: result.jobId, url: result.resultUrl, prompt }
              : null
          }
          currentResultId={result?.jobId ?? null}
          onSelect={handleGenHistorySelect}
        />

        <OutputPanel
          status={jobStatus}
          result={result}
          error={studioError?.message ?? null}
          onDownload={handleDownload}
          onSaveToGallery={handleSaveToGallery}
          onReroll={handleReroll}
          onCopyImage={handleCopyImage}
          savedToGallery={savedToGallery}
          batchResults={batchResults}
          selectedBatch={selectedBatch}
          bgMode={bgMode}
          tool={activeTool}
          onFillPrompt={setPrompt}
          showPixelGrid={showPixelGrid}
          setShowPixelGrid={setShowPixelGrid}
          displayUrl={bgDisplayUrl}
          onBgRemove={handleBgRemove}
          bgRemoving={bgRemoving}
          compareMode={compareMode}
          compareResults={compareResults}
          onSelectBatch={(i) => {
            setSelectedBatch(i);
            setResult(batchResults[i] ?? null);
            setBgDisplayUrl(null);
          }}
          onSelectCompare={(r) => {
            setResult(r);
            setCompareMode(false);
            setCompareResults([]);
            if (r.resultUrl) {
              setHistory(prev => [
                { id: r.jobId, tool: activeTool, prompt: prompt.trim(), resultUrl: r.resultUrl, provider, width: result?.width ?? 0, height: result?.height ?? 0, seed: r.resolvedSeed ?? null, createdAt: new Date().toISOString() },
                ...prev.slice(0, 49),
              ]);
            }
          }}
        />

        {/* Post-generation actions bar */}
        {jobStatus === 'succeeded' && result?.resultUrl && (() => {
          const resultUrl = result.resultUrl!;
          return (
            <div className="pixel-studio-actions-bar">
              <button
                type="button"
                className="pixel-studio-action-btn"
                onClick={handleDownload}
                title="Download PNG"
              >
                ↓ Download PNG
              </button>
              <Link
                href={`/tools/pixel-editor?imageUrl=${encodeURIComponent(bgDisplayUrl ?? resultUrl)}`}
                className="pixel-studio-action-btn"
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Pixel Editor"
              >
                Edit in Pixel Editor
              </Link>
              <button
                type="button"
                className="pixel-studio-action-btn"
                onClick={handleCopyPrompt}
                title="Copy prompt to clipboard"
              >
                ⎘ Copy Prompt
              </button>
              <button
                type="button"
                className="pixel-studio-action-btn"
                onClick={handleGenerateVariation}
                title="Generate a variation with a new seed"
              >
                Variation
              </button>
            </div>
          );
        })()}

        {/* History drawer overlay */}
        {showHistory && (
          <HistoryPanel
            items={history}
            onSelect={handleHistorySelect}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {showShortcuts && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <span className="modal__title">Keyboard Shortcuts</span>
              <button type="button" className="btn btn--ghost btn--sm btn--icon" onClick={() => setShowShortcuts(false)} aria-label="Close">&times;</button>
            </div>
            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                ['⌘ / Ctrl + Enter', 'Generate'],
                ['⌘ / Ctrl + R', 'Regenerate'],
                ['⌘ / Ctrl + ↑', 'Enhance prompt'],
                ['1 – 5', 'Switch tool (Generate / Animate / Rotate / Inpaint / Scene)'],
                ['?', 'Toggle this shortcut sheet'],
              ] as [string, string][]).map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13 }}>
                  <kbd style={{ fontFamily: 'monospace', background: 'var(--bg-surface, #252538)', border: '1px solid var(--surface-border, #303050)', borderRadius: 4, padding: '2px 8px', color: 'var(--accent)', flexShrink: 0 }}>{key}</kbd>
                  <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <EralSidebar mode="pixel" tool={activeTool} prompt={prompt} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — wrapped in Suspense for useSearchParams
// ---------------------------------------------------------------------------
export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center"
          style={{ height: 'calc(100dvh - 56px)' }}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded flex items-center justify-center text-3xl"
              style={{
                background: 'var(--surface-overlay)',
                border: '1px solid var(--surface-border)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            >
              ✦
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading Studio…
            </p>
          </div>
        </div>
      }
    >
      <StudioInner />
    </Suspense>
  );
}
