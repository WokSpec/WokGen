/**
 * WokGen Core — Domain Interfaces
 *
 * These are the public TypeScript interfaces that define WokGen as a platform.
 * They describe the shape of modes, projects, workspaces, and generation requests
 * without exposing implementation details.
 *
 * These interfaces are stable contracts — any mode plugin, provider adapter, or
 * third-party integration should depend on these types, not on internal implementations.
 */

// ---------------------------------------------------------------------------
// Mode
// ---------------------------------------------------------------------------

/** Status of an asset engine mode */
export type ModeStatus = 'live' | 'coming_soon' | 'beta';

/** Canonical asset engine modes */
export type ModeId =
  | 'pixel'
  | 'business'
  | 'vector'
  | 'emoji'
  | 'uiux';

/** Contract that every mode must satisfy */
export interface ModeContract {
  /** Unique mode identifier */
  id: ModeId;

  /** Human-readable mode name */
  name: string;

  /** Short description of what this mode generates */
  description: string;

  /** Who this mode is designed for */
  targetAudience: string;

  /** Output types this mode can produce */
  outputTypes: OutputType[];

  /** Supported export formats */
  exportFormats: ExportFormat[];

  /** Whether this mode is publicly available */
  status: ModeStatus;

  /** Studio URL path */
  studioPath: string;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type OutputType =
  | 'image/png'
  | 'image/gif'
  | 'image/svg+xml'
  | 'image/webp'
  | 'text/html'
  | 'text/css'
  | 'text/typescript'
  | 'application/json'
  | 'image/png-strip';  // PNG sprite strip / sprite sheet

export type ExportFormat =
  | 'png'
  | 'gif'
  | 'svg'
  | 'webp'
  | 'html'
  | 'tsx'
  | 'css'
  | 'json'
  | 'zip';

// ---------------------------------------------------------------------------
// Project / Workspace
// ---------------------------------------------------------------------------

/** A typed project belongs to exactly one mode */
export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  mode: ModeId;
  createdAt: string;
  updatedAt: string;
  jobCount?: number;
}

// ---------------------------------------------------------------------------
// Generation request base
// ---------------------------------------------------------------------------

/** Shared fields across all generation requests */
export interface BaseGenerateRequest {
  /** Mode this request belongs to */
  mode: ModeId;

  /** Primary generation prompt */
  prompt: string;

  /** Optional negative prompt */
  negPrompt?: string;

  /** Desired output width in pixels */
  width?: number;

  /** Desired output height in pixels */
  height?: number;

  /** Deterministic seed (0 or undefined = random) */
  seed?: number;

  /** Quality tier */
  quality?: 'standard' | 'hd';

  /** Workspace/project to associate the job with */
  projectId?: string;
}

// ---------------------------------------------------------------------------
// Generation result
// ---------------------------------------------------------------------------

export interface GenerationResult {
  /** Whether generation succeeded */
  ok: boolean;

  /** Primary image URL */
  resultUrl?: string | null;

  /** Additional image URLs (for multi-output tools) */
  resultUrls?: string[];

  /** Wall-clock generation time in milliseconds */
  durationMs?: number;

  /** Resolved seed actually used by the provider */
  resolvedSeed?: number;

  /** Error message when ok=false */
  error?: string;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export type ProviderName =
  | 'replicate'
  | 'fal'
  | 'together'
  | 'comfyui'
  | 'pollinations'
  | 'huggingface';

/** What capabilities a provider exposes */
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

// ---------------------------------------------------------------------------
// Exporter interface
// ---------------------------------------------------------------------------

/** Base interface for all asset exporters */
export interface AssetExporter<TInput = unknown, TOutput = Blob> {
  /** Export format this exporter handles */
  format: ExportFormat;

  /** Display label */
  label: string;

  /** Run the export */
  export(input: TInput, options?: Record<string, unknown>): Promise<TOutput>;
}
