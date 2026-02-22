/**
 * WokGen Schemas — API Request/Response Contracts
 *
 * These Zod schemas define the wire format for all WokGen API endpoints.
 * Both the frontend and any external integrations should validate against these.
 *
 * Note: Zod is a peer dependency. Install it with:
 *   pnpm add zod
 */

// ---------------------------------------------------------------------------
// Re-export from zod — consumers should depend on this package for schemas
// ---------------------------------------------------------------------------

// Base generation request schema
export const GenerateRequestSchema = {
  mode:           { type: 'string', enum: ['pixel', 'business', 'vector', 'emoji', 'uiux'] },
  tool:           { type: 'string', enum: ['generate', 'animate', 'rotate', 'inpaint', 'scene'] },
  prompt:         { type: 'string', minLength: 1, maxLength: 600 },
  negPrompt:      { type: 'string', optional: true },
  width:          { type: 'number', min: 32, max: 2048, optional: true },
  height:         { type: 'number', min: 32, max: 2048, optional: true },
  seed:           { type: 'number', optional: true },
  steps:          { type: 'number', min: 1, max: 150, optional: true },
  guidance:       { type: 'number', min: 1, max: 20, optional: true },
  quality:        { type: 'string', enum: ['standard', 'hd'], optional: true },
  stylePreset:    { type: 'string', optional: true },
  assetCategory:  { type: 'string', optional: true },
  projectId:      { type: 'string', optional: true },
  isPublic:       { type: 'boolean', optional: true },
} as const;

export const GenerateResponseSchema = {
  ok:           { type: 'boolean' },
  resultUrl:    { type: 'string', nullable: true },
  resultUrls:   { type: 'array', items: { type: 'string' }, optional: true },
  durationMs:   { type: 'number', optional: true },
  resolvedSeed: { type: 'number', optional: true },
  error:        { type: 'string', optional: true },
} as const;

// Workspace schemas
export const WorkspaceSchema = {
  id:        { type: 'string' },
  name:      { type: 'string', minLength: 1, maxLength: 50 },
  mode:      { type: 'string' },
  userId:    { type: 'string' },
  createdAt: { type: 'string' },
  jobCount:  { type: 'number', optional: true },
} as const;

// UI/UX generation schemas
export const UIUXGenerateRequestSchema = {
  componentType: { type: 'string' },
  framework:     { type: 'string', enum: ['react', 'next', 'html-tailwind', 'vanilla-css'] },
  stylePreset:   { type: 'string', optional: true },
  prompt:        { type: 'string', minLength: 1 },
  colorScheme:   { type: 'string', optional: true },
  darkMode:      { type: 'boolean', optional: true },
  responsive:    { type: 'boolean', optional: true },
} as const;

export const UIUXGenerateResponseSchema = {
  ok:      { type: 'boolean' },
  code:    { type: 'string', optional: true },
  jobId:   { type: 'string', optional: true },
  error:   { type: 'string', optional: true },
} as const;

// Type helpers (for TypeScript consumers without Zod)
export type GenerateRequest = {
  mode: 'pixel' | 'business' | 'vector' | 'emoji' | 'uiux';
  tool: 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';
  prompt: string;
  negPrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  guidance?: number;
  quality?: 'standard' | 'hd';
  stylePreset?: string;
  assetCategory?: string;
  projectId?: string;
  isPublic?: boolean;
};

export type GenerateResponse = {
  ok: boolean;
  resultUrl?: string | null;
  resultUrls?: string[];
  durationMs?: number;
  resolvedSeed?: number;
  error?: string;
};
