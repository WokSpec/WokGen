// WokGen — Mode Contract System
// Each mode is a fully typed product line with isolated stacks.
// Hard separation enforced at: UI state, model profiles, prompt scaffolding,
// output formats, tooling, galleries, presets, projects.

export type ModeId = 'pixel' | 'business' | 'vector' | 'emoji' | 'uiux' | 'voice' | 'text';

export type ModeStatus = 'live' | 'beta' | 'coming_soon';

export type OutputType = 'image' | 'gif' | 'svg' | 'code' | 'pack' | 'audio' | 'copy';

export type ExportFormat = 'png' | 'gif' | 'svg' | 'tsx' | 'html' | 'css' | 'zip' | 'mp3' | 'wav' | 'txt' | 'md';

export type GalleryFilter = 'tool' | 'era' | 'size' | 'platform' | 'mood' | 'style' | 'category';

export type GalleryAspect = 'square' | 'wide' | 'tall' | 'natural';

export type LicenseKey =
  | 'commercial_game'
  | 'commercial_brand'
  | 'commercial_app'
  | 'design_system'
  | 'code_ownership';

export type PromptBuilderKey = 'pixel' | 'business' | 'vector' | 'emoji' | 'uiux' | 'voice' | 'text';

// ---------------------------------------------------------------------------
// Tool definition per mode
// ---------------------------------------------------------------------------
export interface ModeToolDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  aspectRatios?: string[];
  maxBatch?: number;
  outputType: OutputType;
  exportFormats: ExportFormat[];
}

// ---------------------------------------------------------------------------
// Preset per mode — style token injection
// ---------------------------------------------------------------------------
export interface ModePreset {
  id: string;
  label: string;
  description?: string;
  tokens: string[];
  negTokens?: string[];
}

// ---------------------------------------------------------------------------
// Size constraints per mode
// ---------------------------------------------------------------------------
export interface ModeSizeConstraints {
  min: number;
  max: number;
  defaults: number[];
  defaultSize: number;
  aspectRatios?: { id: string; label: string; width: number; height: number }[];
}

// ---------------------------------------------------------------------------
// Model routing per mode
// ---------------------------------------------------------------------------
export interface ModeModelConfig {
  standardProvider: string;
  hdProvider: string;
  hdModelId?: string;
  standardRateLimit: number;   // requests per minute
  hdCreditsPerGeneration: number; // HD credits consumed per generation
}

// ---------------------------------------------------------------------------
// Route structure per mode
// ---------------------------------------------------------------------------
export interface ModeRoutes {
  landing: string;
  studio: string;
  gallery: string;
  docs: string;
}

// ---------------------------------------------------------------------------
// WokSpec services pairing per mode
// ---------------------------------------------------------------------------
export interface ModeServicePairing {
  label: string;
  description: string;
  href: string;
}

// ---------------------------------------------------------------------------
// The Mode Contract — every mode must fully implement this
// ---------------------------------------------------------------------------
export interface ModeContract {
  id: ModeId;
  label: string;          // "WokGen Pixel"
  shortLabel: string;     // "Pixel"
  tagline: string;        // "For game developers"
  description: string;    // 1-sentence product description

  // Accent color — used ONLY for: ModeSwitcher active tab indicator,
  // studio header mode label text. Nothing else in the chrome layer changes.
  accentColor: string;

  // What this mode can produce
  outputs: OutputType[];
  exportFormats: ExportFormat[];

  // Size/dimension system
  sizeConstraints: ModeSizeConstraints;

  // Available tools in the studio
  tools: ModeToolDef[];

  // Style presets for this mode
  presets: ModePreset[];

  // Which prompt builder module to use
  promptBuilder: PromptBuilderKey;

  // Model selection
  models: ModeModelConfig;

  // Gallery configuration
  galleryAspect: GalleryAspect;
  galleryFilters: GalleryFilter[];

  // Licensing
  licenseKey: LicenseKey;

  // URL structure
  routes: ModeRoutes;

  // WokSpec services integration
  servicePairing: ModeServicePairing;

  // Launch status
  status: ModeStatus;

  // "Who this is for" — shown on landing and docs
  targetUsers: string[];

  // "What this is NOT for" — shown in docs
  notFor: string[];

  // Example prompts shown in studio idle state (4 max)
  examplePrompts: { prompt: string; label: string }[];
}
