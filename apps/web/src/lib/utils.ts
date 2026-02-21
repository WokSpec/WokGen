// ---------------------------------------------------------------------------
// WokGen — shared utility functions
// ---------------------------------------------------------------------------

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ---------------------------------------------------------------------------
// cn — class name merger (clsx + tailwind-merge)
//
// Usage:
//   cn('px-4 py-2', isActive && 'bg-accent', className)
// ---------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// randomSeed — generate a random 32-bit positive integer seed
// ---------------------------------------------------------------------------
export function randomSeed(): number {
  return Math.floor(Math.random() * (2 ** 31 - 1)) + 1;
}

// ---------------------------------------------------------------------------
// formatDuration — human-readable elapsed time from milliseconds
//
// Examples:
//   formatDuration(500)    → "0.5s"
//   formatDuration(3200)   → "3.2s"
//   formatDuration(65000)  → "1m 5s"
// ---------------------------------------------------------------------------
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

// ---------------------------------------------------------------------------
// timeAgo — relative time string from a Date or ISO string
//
// Examples:
//   timeAgo(new Date(Date.now() - 30_000))   → "30s ago"
//   timeAgo(new Date(Date.now() - 90_000))   → "1m ago"
//   timeAgo(new Date(Date.now() - 7200_000)) → "2h ago"
// ---------------------------------------------------------------------------
export function timeAgo(date: Date | string): string {
  const then = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diff = Math.max(0, Date.now() - then);

  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;

  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;

  const w = Math.floor(d / 7);
  if (w < 5)   return `${w}w ago`;

  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;

  return `${Math.floor(d / 365)}y ago`;
}

// ---------------------------------------------------------------------------
// formatBytes — human-readable file size
//
// Examples:
//   formatBytes(512)        → "512 B"
//   formatBytes(1536)       → "1.5 KB"
//   formatBytes(2097152)    → "2.0 MB"
// ---------------------------------------------------------------------------
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : decimals)} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// truncate — trim a string to maxLength characters, appending ellipsis
// ---------------------------------------------------------------------------
export function truncate(str: string, maxLength: number, ellipsis = '…'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length).trimEnd() + ellipsis;
}

// ---------------------------------------------------------------------------
// capitalize — uppercase the first character
// ---------------------------------------------------------------------------
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// safeParseJson — JSON.parse with a typed fallback, never throws
// ---------------------------------------------------------------------------
export function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (value == null || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// sleep — awaitable timeout
// ---------------------------------------------------------------------------
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// clampSize — clamp a pixel dimension to a valid range for generation
// Min 32px (smallest practical pixel icon), max 2048px.
// ---------------------------------------------------------------------------
export function clampSize(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 512;
  return Math.max(32, Math.min(2048, n));
}

// ---------------------------------------------------------------------------
// isDataUri — check if a string is a base64 data URI
// ---------------------------------------------------------------------------
export function isDataUri(url: string): boolean {
  return url.startsWith('data:');
}

// ---------------------------------------------------------------------------
// downloadBlob — trigger a browser file download from a URL or data URI
// ---------------------------------------------------------------------------
export function downloadBlob(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------------------------------------------------------------------------
// copyToClipboard — async clipboard write with graceful fallback
// Returns true on success, false on failure.
// ---------------------------------------------------------------------------
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers / non-HTTPS environments
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// buildGenerationFilename — produce a deterministic filename for a generated asset
//
// Examples:
//   buildGenerationFilename('generate', 1234567890, 512) → "wokgen-generate-1234567890-512px.png"
// ---------------------------------------------------------------------------
export function buildGenerationFilename(
  tool: string,
  seed: number | null | undefined,
  size: number,
): string {
  const seedPart = seed != null ? `-${seed}` : `-${Date.now()}`;
  return `wokgen-${tool}${seedPart}-${size}px.png`;
}

// ---------------------------------------------------------------------------
// RARITY_CONFIG — canonical rarity meta used across studio + gallery
// ---------------------------------------------------------------------------
export const RARITY_CONFIG = {
  common: {
    label: 'Common',
    color: '#94B0C2',
    bg:    'rgba(148,176,194,0.12)',
    border: 'rgba(148,176,194,0.3)',
  },
  uncommon: {
    label: 'Uncommon',
    color: '#38B764',
    bg:    'rgba(56,183,100,0.12)',
    border: 'rgba(56,183,100,0.3)',
  },
  rare: {
    label: 'Rare',
    color: '#41A6F6',
    bg:    'rgba(65,166,246,0.12)',
    border: 'rgba(65,166,246,0.3)',
  },
  epic: {
    label: 'Epic',
    color: '#9B59B6',
    bg:    'rgba(155,89,182,0.12)',
    border: 'rgba(155,89,182,0.3)',
  },
  legendary: {
    label: 'Legendary',
    color: '#FFCD75',
    bg:    'rgba(255,205,117,0.12)',
    border: 'rgba(255,205,117,0.3)',
  },
} as const;

export type Rarity = keyof typeof RARITY_CONFIG;

export function getRarityConfig(rarity: string | null | undefined): (typeof RARITY_CONFIG)[Rarity] {
  if (rarity && rarity in RARITY_CONFIG) {
    return RARITY_CONFIG[rarity as Rarity];
  }
  return RARITY_CONFIG.common;
}

// ---------------------------------------------------------------------------
// PROVIDER_META_DISPLAY — display-only provider colours + labels (client-safe)
// Mirrors types.ts PROVIDER_META without importing server modules into client.
// ---------------------------------------------------------------------------
export const PROVIDER_DISPLAY = {
  replicate: { label: 'Replicate', color: '#0066FF' },
  fal:       { label: 'fal.ai',   color: '#7B2FBE' },
  together:  { label: 'Together', color: '#00A67D' },
  comfyui:   { label: 'ComfyUI',  color: '#E06C00' },
} as const;

export type ProviderDisplayKey = keyof typeof PROVIDER_DISPLAY;

export function getProviderDisplay(provider: string) {
  return (
    PROVIDER_DISPLAY[provider as ProviderDisplayKey] ?? {
      label: provider,
      color: '#566C86',
    }
  );
}
