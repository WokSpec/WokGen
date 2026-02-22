'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tool = 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';
type Provider = 'replicate' | 'fal' | 'together' | 'comfyui';
type StylePreset = 'rpg_icon' | 'emoji' | 'tileset' | 'sprite_sheet' | 'raw' | 'game_ui';
type JobStatus = 'idle' | 'pending' | 'succeeded' | 'failed';

interface GenerationResult {
  jobId: string;
  resultUrl: string | null;
  resultUrls: string[] | null;
  durationMs?: number;
  resolvedSeed?: number;
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
  provider: Provider;
  width: number;
  height: number;
  seed: number | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLS: { id: Tool; icon: string; label: string; shortLabel: string; kbd: string }[] = [
  { id: 'generate', icon: '✦', label: 'Generate',      shortLabel: 'Gen',    kbd: '1' },
  { id: 'animate',  icon: '▶', label: 'Animate',       shortLabel: 'Anim',   kbd: '2' },
  { id: 'rotate',   icon: '↻', label: 'Rotate',        shortLabel: 'Rot',    kbd: '3' },
  { id: 'inpaint',  icon: '⬛', label: 'Inpaint',      shortLabel: 'Paint',  kbd: '4' },
  { id: 'scene',    icon: '⊞', label: 'Scenes & Maps', shortLabel: 'Scene',  kbd: '5' },
];

const STYLE_PRESETS: { id: StylePreset; label: string; description: string }[] = [
  { id: 'rpg_icon',     label: 'RPG Icon',      description: 'Dark bg, bold readable silhouette' },
  { id: 'emoji',        label: 'Emoji',         description: 'Bright, simple, no background'     },
  { id: 'tileset',      label: 'Tileset',       description: 'Seamlessly tileable flat tile'      },
  { id: 'sprite_sheet', label: 'Sprite Sheet',  description: 'Multiple poses on one sheet'        },
  { id: 'game_ui',      label: 'Game UI',       description: 'HUD element, dark theme widget'     },
  { id: 'raw',          label: 'Raw',           description: 'No preset — model defaults'         },
];

const SIZES = [32, 64, 128, 256, 512] as const;
type PixelSize = (typeof SIZES)[number];

const PROVIDER_COLORS: Record<Provider, string> = {
  replicate: '#0066FF',
  fal:       '#7B2FBE',
  together:  '#00A67D',
  comfyui:   '#E06C00',
};

const PROVIDER_LABELS: Record<Provider, string> = {
  replicate: 'Replicate',
  fal:       'fal.ai',
  together:  'Together.ai',
  comfyui:   'ComfyUI',
};

const EXAMPLE_PROMPTS: Record<Tool, string[]> = {
  generate: [
    'iron sword with ornate crossguard, RPG inventory icon',
    'health potion, glowing red liquid in crystal vial, cork stopper',
    'leather shield with iron boss, battle-worn',
    'fire scroll with golden wax seal',
    'diamond ring with emerald gemstone',
    'ancient wooden staff with crystal orb',
    'assassin dagger, curved black blade',
    'enchanted bow, glowing bowstring',
  ],
  animate: [
    'fire burning animation, looping flame cycle',
    'water ripple effect, calm pool surface',
    'coin spinning, gold glint',
    'magic portal swirling, purple vortex',
  ],
  rotate: [
    'warrior character, side-scrolling RPG style',
    'treasure chest, wooden with iron bands',
    'magic crystal, faceted gemstone',
    'wooden barrel, RPG prop',
  ],
  inpaint: [
    'add glowing runes to the blade',
    'replace the background with a dark dungeon',
    'add a gem to the center of the shield',
    'make the potion glow brighter',
  ],
  scene: [
    'dark dungeon tileset, stone floor and walls, torches',
    'forest clearing with trees and flowers',
    'castle interior, great hall with banners',
    'desert town market, sand and clay buildings',
  ],
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

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
function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span
      className="provider-chip"
      style={{ borderColor: PROVIDER_COLORS[provider] + '40' }}
    >
      <span
        className="provider-dot"
        style={{ background: PROVIDER_COLORS[provider] }}
      />
      {PROVIDER_LABELS[provider]}
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
    replicate: false,
    fal: false,
    together: false,
    comfyui: false,
  });

  const ENV_VARS: Record<Provider, string> = {
    replicate: 'REPLICATE_API_TOKEN',
    fal:       'FAL_KEY',
    together:  'TOGETHER_API_KEY',
    comfyui:   '',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
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
          <button
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
                    {showKeys[pid] ? '🙈' : '👁'}
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
                ComfyUI (Local)
              </span>
              <span className="badge-success text-2xs ml-auto" style={{ fontSize: '0.65rem' }}>
                Always free
              </span>
            </div>
            <FormField label="ComfyUI Host URL" hint="Default: http://127.0.0.1:8188">
              <input
                type="url"
                className="input font-mono text-xs"
                placeholder="http://127.0.0.1:8188"
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
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
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
        boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--surface-border)' }}
      >
        <span className="section-title">History</span>
        <button
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
            <span className="empty-state-icon text-2xl">🎨</span>
            <p className="empty-state-body">Generated assets will appear here.</p>
          </div>
        )}
        {items.map((item) => (
          <button
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
                  alt=""
                  className="w-full h-full pixel-art object-contain"
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
  savedToGallery,
}: {
  status: JobStatus;
  result: GenerationResult | null;
  error: string | null;
  onDownload: () => void;
  onSaveToGallery: () => void;
  onReroll: () => void;
  savedToGallery: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

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
    return (
      <div className="output-canvas flex-1">
        <div className="empty-state">
          <div
            className="empty-state-icon animate-float"
            style={{ fontSize: '2.5rem', animationDuration: '4s' }}
          >
            ✦
          </div>
          <h3 className="empty-state-title">Ready to generate</h3>
          <p className="empty-state-body">
            Set your prompt in the left panel and click Generate.
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-disabled)' }}>
            <kbd>⌘</kbd><span>+</span><kbd>↵</kbd>
            <span style={{ color: 'var(--text-disabled)' }}>to generate</span>
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
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
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
              Generating…
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              This usually takes 5–60 seconds
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
    return (
      <div className="output-canvas flex-1 flex flex-col gap-4 items-center justify-center p-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
          style={{
            background: 'var(--danger-muted)',
            border: '1px solid var(--danger)',
          }}
        >
          ✕
        </div>
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--danger-hover)' }}>
            Generation failed
          </p>
          <p
            className="text-xs leading-relaxed p-3 rounded-lg"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--danger-muted)',
              border: '1px solid var(--danger)',
            }}
          >
            {error ?? 'An unknown error occurred.'}
          </p>
        </div>
        <button className="btn-secondary" onClick={onReroll}>
          Try again
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
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)' }}
      >
        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost btn-icon"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            className="text-xs font-mono px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)', minWidth: 44, textAlign: 'center' }}
            onClick={() => setZoom(1)}
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="btn-ghost btn-icon"
            onClick={() => setZoom((z) => Math.min(8, z + 0.5))}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <div className="flex-1" />

        {/* Duration */}
        {result?.durationMs && (
          <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            {formatDuration(result.durationMs)}
          </span>
        )}

        {/* Actions */}
        <button
          className="btn-ghost btn-sm"
          onClick={onReroll}
          title="Reroll with new seed"
        >
          ↻ Reroll
        </button>
        <button className="btn-secondary btn-sm" onClick={onDownload}>
          ↓ Download
        </button>
        <button
          className={cn(savedToGallery ? 'btn-success' : 'btn-primary', 'btn-sm')}
          onClick={onSaveToGallery}
          disabled={savedToGallery}
        >
          {savedToGallery ? '✓ Saved' : '⊕ Save to Gallery'}
        </button>
      </div>

      {/* Canvas */}
      <div className="output-canvas flex-1 relative overflow-auto p-8">
        {urls.length > 1 ? (
          // Multi-output grid (rotate / scene)
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="grid grid-cols-2 gap-4">
              {urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveUrl(url)}
                  className="output-image-frame p-2 transition-all duration-150"
                  style={{
                    border: activeUrl === url
                      ? '2px solid var(--accent)'
                      : '1px solid var(--surface-border)',
                    boxShadow: activeUrl === url ? 'var(--glow-md)' : undefined,
                  }}
                >
                  <img
                    src={url}
                    alt={`Result ${i + 1}`}
                    className="pixel-art max-w-[200px] max-h-[200px] object-contain"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.15s ease' }}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : activeUrl ? (
          <div className="output-image-frame p-4">
            <img
              src={activeUrl}
              alt="Generated result"
              className="pixel-art"
              style={{
                imageRendering: 'pixelated',
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.15s ease',
                maxWidth: '100%',
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Seed / meta strip */}
      {result && (
        <div
          className="flex items-center gap-4 px-4 py-2 flex-shrink-0 text-xs"
          style={{
            borderTop: '1px solid var(--surface-border)',
            background: 'var(--surface-raised)',
            color: 'var(--text-disabled)',
          }}
        >
          <span>Job: <code style={{ color: 'var(--text-muted)' }}>{result.jobId.slice(0, 12)}…</code></span>
          {result.resolvedSeed != null && (
            <span>Seed: <code style={{ color: 'var(--text-muted)' }}>{result.resolvedSeed}</code></span>
          )}
          {urls.length > 1 && (
            <span>{urls.length} outputs</span>
          )}
        </div>
      )}
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
  size,
  setSize,
  stylePreset,
  setStylePreset,
  seed,
  setSeed,
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
}: {
  tool: Tool;
  prompt: string;
  setPrompt: (v: string) => void;
  negPrompt: string;
  setNegPrompt: (v: string) => void;
  size: PixelSize;
  setSize: (v: PixelSize) => void;
  stylePreset: StylePreset;
  setStylePreset: (v: StylePreset) => void;
  seed: string;
  setSeed: (v: string) => void;
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
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNeg, setShowNeg] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [prompt]);

  const examples = EXAMPLE_PROMPTS[tool];
  const canGenerate = prompt.trim().length > 0 && !isLoading;

  return (
    <div className="scroll-region flex flex-col gap-0">

      {/* Prompt */}
      <div className="p-4 flex flex-col gap-3">
        <div className="form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Prompt</label>
            <span className="text-2xs" style={{ fontSize: '0.65rem', color: 'var(--text-disabled)' }}>
              {prompt.length}/500
            </span>
          </div>
          <textarea
            ref={textareaRef}
            className="textarea"
            placeholder={`Describe what to ${tool === 'generate' ? 'generate' : tool}…`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            style={{ resize: 'none', minHeight: 72 }}
          />
        </div>

        {/* Example prompts */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-disabled)' }}>
            Examples:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {examples.slice(0, 4).map((ex) => (
              <button
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

        {/* Neg prompt toggle */}
        <button
          className="flex items-center gap-1.5 text-xs self-start transition-colors duration-150"
          style={{ color: showNeg ? 'var(--text-secondary)' : 'var(--text-disabled)' }}
          onClick={() => setShowNeg((v) => !v)}
        >
          {showNeg ? '▾' : '▸'}
          Negative prompt
        </button>

        {showNeg && (
          <div className="form-group animate-fade-in-fast">
            <textarea
              className="textarea"
              placeholder="What to avoid in the output…"
              value={negPrompt}
              onChange={(e) => setNegPrompt(e.target.value)}
              rows={2}
              style={{ resize: 'none', minHeight: 54 }}
            />
          </div>
        )}
      </div>

      {/* Style preset */}
      <SectionHeader>Style Preset</SectionHeader>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-1.5">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setStylePreset(preset.id)}
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
          ))}
        </div>
      </div>

      {/* Output size */}
      <SectionHeader>Output Size</SectionHeader>
      <div className="p-4">
        <div className="flex gap-1.5 flex-wrap">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="flex-1 py-2 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: size === s ? 'var(--accent-dim)' : 'var(--surface-overlay)',
                border: `1px solid ${size === s ? 'var(--accent-muted)' : 'var(--surface-border)'}`,
                color: size === s ? 'var(--accent)' : 'var(--text-muted)',
                minWidth: 42,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="form-hint mt-2">
          Generation is done at {size}×{size}px. Pixel art is most crisp at 32–128px.
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
              <button
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
        onClick={() => setShowAdvanced((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowAdvanced((v) => !v)}
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
              <button
                className="btn-secondary btn-icon flex-shrink-0"
                onClick={() => setSeed(String(randomSeed()))}
                title="Roll random seed"
                aria-label="Roll random seed"
              >
                🎲
              </button>
              {seed && (
                <button
                  className="btn-ghost btn-icon flex-shrink-0"
                  onClick={() => setSeed('')}
                  title="Clear seed"
                  aria-label="Clear seed"
                >
                  ✕
                </button>
              )}
            </div>
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
            <button
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

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>(
    TOOLS.find((t) => t.id === initialTool) ? initialTool : 'generate',
  );

  // Form state
  const [prompt, setPrompt]           = useState('');
  const [negPrompt, setNegPrompt]     = useState('');
  const [size, setSize]               = useState<PixelSize>(512);
  const [stylePreset, setStylePreset] = useState<StylePreset>('rpg_icon');
  const [seed, setSeed]               = useState('');
  const [steps, setSteps]             = useState(4);
  const [guidance, setGuidance]       = useState(3.5);
  const [provider, setProvider]       = useState<Provider>('together');
  const [isPublic, setIsPublic]       = useState(false);
  const [useHD, setUseHD]             = useState(false); // HD = Replicate; Standard = Pollinations

  // Job state
  const [jobStatus, setJobStatus]     = useState<JobStatus>('idle');
  const [result, setResult]           = useState<GenerationResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [savedToGallery, setSavedToGallery] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [history, setHistory]           = useState<HistoryItem[]>([]);
  const [providers, setProviders]       = useState<ProviderInfo[]>([]);

  // HD credit balance (hosted mode)
  const [hdBalance, setHdBalance] = useState<{ monthly: number; topUp: number } | null>(null);

  // BYOK keys (only used in self-hosted mode)
  const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === 'true';
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    replicate: '',
    fal: '',
    together: '',
    comfyui: '',
  });
  const [comfyuiHost, setComfyuiHost] = useState('http://127.0.0.1:8188');

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
    if (isSelfHosted) return;
    fetch('/api/credits')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setHdBalance({ monthly: d.monthlyRemaining ?? 0, topUp: d.topUpCredits ?? 0 }); })
      .catch(() => {});
  }, [isSelfHosted]);

  useEffect(() => { refreshCredits(); }, [refreshCredits]);

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
    fetch('/api/generate?limit=20&status=succeeded')
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) {
          setHistory(
            (data.jobs as HistoryItem[]).filter((j) => j.resultUrl),
          );
        }
      })
      .catch(() => {});
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘/Ctrl + Enter → generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!e.target || !(e.target as HTMLElement).closest('textarea')) {
          handleGenerate();
        }
      }
      // 1–5 → switch tool (only when no input focused)
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
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

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setJobStatus('pending');
    setResult(null);
    setError(null);
    setSavedToGallery(false);

    try {
      const body: Record<string, unknown> = {
        tool:        activeTool,
        provider,
        prompt:      prompt.trim(),
        negPrompt:   negPrompt.trim() || undefined,
        width:       size,
        height:      size,
        stylePreset,
        steps,
        guidance,
        isPublic,
        quality:     useHD ? 'hd' : 'standard',
        ...(seed ? { seed: parseInt(seed, 10) } : {}),
        ...(apiKeys[provider] ? { apiKey: apiKeys[provider] } : {}),
        ...(provider === 'comfyui' ? { comfyuiHost } : {}),
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server error (HTTP ${res.status}) — check that your provider API key is set in Settings.`);
      }

      if (!res.ok || !data.ok) {
        throw new Error((data.error as string | undefined) ?? `HTTP ${res.status}`);
      }

      const gen: GenerationResult = {
        jobId:        (data.job as Record<string, unknown> | null)?.id as string ?? 'local',
        resultUrl:    data.resultUrl as string ?? null,
        resultUrls:   data.resultUrls as string[] ?? null,
        durationMs:   data.durationMs as number | undefined,
        resolvedSeed: data.resolvedSeed,
      };

      setResult(gen);
      setJobStatus('succeeded');

      // Prepend to history
      if (gen.resultUrl) {
        setHistory((prev) => [
          {
            id:        data.job.id,
            tool:      activeTool,
            prompt:    prompt.trim(),
            resultUrl: gen.resultUrl,
            provider,
            width:     size,
            height:    size,
            seed:      gen.resolvedSeed ?? null,
            createdAt: new Date().toISOString(),
          },
          ...prev.slice(0, 49),
        ]);
      }

      if (isPublic) setSavedToGallery(true);
      // Refresh HD balance after successful HD generation
      if (useHD) refreshCredits();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJobStatus('failed');
    }
  }, [
    activeTool, prompt, negPrompt, size, stylePreset, steps, guidance,
    provider, seed, isPublic, apiKeys, comfyuiHost, useHD, refreshCredits,
  ]);

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const url =
      result?.resultUrl ??
      result?.resultUrls?.[0];
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `wokgen-${activeTool}-${Date.now()}.png`;
    a.click();
  }, [result, activeTool]);

  // ── Save to gallery ────────────────────────────────────────────────────────
  const handleSaveToGallery = useCallback(async () => {
    if (!result?.jobId || savedToGallery) return;
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: result.jobId, isPublic: true }),
      });
      if (res.ok) setSavedToGallery(true);
    } catch {
      // non-fatal
    }
  }, [result, savedToGallery]);

  // ── Reroll ─────────────────────────────────────────────────────────────────
  const handleReroll = useCallback(() => {
    setSeed(String(randomSeed()));
    setJobStatus('idle');
    setResult(null);
    setError(null);
  }, []);

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
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100dvh - var(--nav-height, 56px))' }}
    >

      {/* ── Tool rail (far left) ──────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center py-3 gap-1 flex-shrink-0"
        style={{
          width: 56,
          background: 'var(--surface-raised)',
          borderRight: '1px solid var(--surface-border)',
        }}
        data-no-select
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="flex flex-col items-center justify-center gap-1 w-10 h-12 rounded-lg transition-all duration-150"
            style={{
              background:
                activeTool === tool.id ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${activeTool === tool.id ? 'var(--accent-muted)' : 'transparent'}`,
              color:
                activeTool === tool.id ? 'var(--accent)' : 'var(--text-disabled)',
            }}
            title={`${tool.label} (${tool.kbd})`}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
            onMouseEnter={(e) => {
              if (activeTool !== tool.id)
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }}
            onMouseLeave={(e) => {
              if (activeTool !== tool.id)
                (e.currentTarget as HTMLElement).style.color = 'var(--text-disabled)';
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{tool.icon}</span>
            <span style={{ fontSize: '0.52rem', letterSpacing: '0.02em', lineHeight: 1 }}>
              {tool.shortLabel}
            </span>
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* History */}
        <button
          className="flex flex-col items-center justify-center gap-1 w-10 h-12 rounded-lg transition-all duration-150"
          style={{
            background: showHistory ? 'var(--surface-overlay)' : 'transparent',
            color: showHistory ? 'var(--text-secondary)' : 'var(--text-disabled)',
            border: `1px solid ${showHistory ? 'var(--surface-border)' : 'transparent'}`,
          }}
          onClick={() => setShowHistory((v) => !v)}
          title="History"
          aria-label="History"
          aria-pressed={showHistory}
        >
          <span style={{ fontSize: 14 }}>☰</span>
          <span style={{ fontSize: '0.52rem' }}>History</span>
        </button>

        {/* Settings — only in self-hosted mode */}
        {isSelfHosted && (
        <button
          className="flex flex-col items-center justify-center gap-1 w-10 h-12 rounded-lg transition-all duration-150 mb-1"
          style={{
            color: 'var(--text-disabled)',
            border: '1px solid transparent',
          }}
          onClick={() => setShowSettings(true)}
          title="Provider settings"
          aria-label="Open provider settings"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-disabled)';
          }}
        >
          <span style={{ fontSize: 14 }}>⚙</span>
          <span style={{ fontSize: '0.52rem' }}>Config</span>
        </button>
        )}
      </div>

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
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--surface-border)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16, color: 'var(--accent)' }}>
              {TOOLS.find((t) => t.id === activeTool)?.icon}
            </span>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {TOOLS.find((t) => t.id === activeTool)?.label}
            </h1>
          </div>
          <ProviderBadge provider={provider} />
        </div>

        {/* Tool form */}
        <GenerateForm
          tool={activeTool}
          prompt={prompt}
          setPrompt={setPrompt}
          negPrompt={negPrompt}
          setNegPrompt={setNegPrompt}
          size={size}
          setSize={setSize}
          stylePreset={stylePreset}
          setStylePreset={setStylePreset}
          seed={seed}
          setSeed={setSeed}
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
        />

        {/* Generate button */}
        <div
          className="flex flex-col gap-2 p-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--surface-border)' }}
        >
          {/* HD / Standard quality toggle (hosted mode only) */}
          {!isSelfHosted && (
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #666)' }}>
                Quality
              </span>
              <div className="flex gap-1" style={{ fontSize: '0.75rem' }}>
                <button
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: !useHD ? '#10b981' : 'var(--surface-border, #2a2a2a)',
                    background:  !useHD ? 'rgba(16,185,129,.12)' : 'transparent',
                    color:       !useHD ? '#10b981' : 'var(--text-muted, #666)',
                    cursor: 'pointer',
                    fontWeight: !useHD ? 600 : 400,
                  }}
                  onClick={() => setUseHD(false)}
                >
                  Standard
                </button>
                <button
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: useHD ? '#f59e0b' : 'var(--surface-border, #2a2a2a)',
                    background:  useHD ? 'rgba(245,158,11,.12)' : 'transparent',
                    color:       useHD ? '#f59e0b' : 'var(--text-muted, #666)',
                    cursor: 'pointer',
                    fontWeight: useHD ? 600 : 400,
                  }}
                  onClick={() => setUseHD(true)}
                  title="Uses HD credits (Replicate). Requires Plus plan or top-up pack."
                >
                  HD ✦
                </button>
              </div>
            </div>
          )}

          <button
            className="btn-primary w-full"
            style={{
              height: 44,
              fontSize: '0.9rem',
              fontWeight: 600,
              ...(jobStatus === 'pending'
                ? {}
                : {
                    animation: prompt.trim()
                      ? 'pulse-glow 2.5s ease-in-out infinite'
                      : 'none',
                  }),
            }}
            onClick={handleGenerate}
            disabled={!prompt.trim() || jobStatus === 'pending'}
          >
            {jobStatus === 'pending' ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Generating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span style={{ fontSize: 15 }}>✦</span>
                Generate
                <kbd
                  className="ml-auto opacity-60"
                  style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
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

          {/* HD credit balance widget (hosted mode, HD selected) */}
          {!isSelfHosted && useHD && hdBalance !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '0.72rem', color: 'var(--text-faint)', padding: '0.25rem 0',
            }}>
              <span>
                <span style={{ color: hdBalance.monthly + hdBalance.topUp > 0 ? 'var(--text-muted)' : '#ef4444' }}>
                  HD:{' '}
                  <strong style={{ color: hdBalance.monthly + hdBalance.topUp > 0 ? '#c4b5fd' : '#ef4444' }}>
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
              <a href="/billing" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '0.7rem' }}>
                {hdBalance.monthly + hdBalance.topUp === 0 ? 'Add credits →' : 'Manage →'}
              </a>
            </div>
          )}
          {!isSelfHosted && useHD && hdBalance === null && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', paddingTop: '0.25rem' }}>
              <a href="/billing" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                HD credits — sign in or upgrade →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: output canvas + history overlay ────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <OutputPanel
          status={jobStatus}
          result={result}
          error={error}
          onDownload={handleDownload}
          onSaveToGallery={handleSaveToGallery}
          onReroll={handleReroll}
          savedToGallery={savedToGallery}
        />

        {/* History drawer overlay */}
        {showHistory && (
          <HistoryPanel
            items={history}
            onSelect={handleHistorySelect}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {/* Settings modal — only in self-hosted mode */}
      {isSelfHosted && showSettings && (
        <SettingsModal
          providers={providers}
          apiKeys={apiKeys}
          comfyuiHost={comfyuiHost}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
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
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
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
