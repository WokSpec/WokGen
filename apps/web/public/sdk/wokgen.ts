/**
 * WokGen TypeScript SDK
 *
 * Official client library for the WokGen v1 API.
 * No dependencies. Works in Node.js, Deno, and modern browsers.
 *
 * @version 1.0.0
 * @license MIT
 * @see https://wokgen.wokspec.org/developers
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WokGenConfig {
  /** Your WokGen API key. Obtain from wokgen.wokspec.org/account */
  apiKey: string;
  /** Base URL. Defaults to https://wokgen.wokspec.org */
  baseUrl?: string;
}

export type GenerationMode =
  | 'pixel' | 'business' | 'vector' | 'uiux' | 'voice'
  | 'pixel_animation' | 'tileset' | 'icon' | 'logo' | 'banner';

export interface GenerateParams {
  /** Natural language prompt describing the asset */
  prompt: string;
  /** Generation mode */
  mode: GenerationMode;
  /** Output dimensions in pixels (e.g. 512) */
  size?: 32 | 64 | 128 | 256 | 512 | 1024;
  /** Number of results to generate (1–4) */
  count?: number;
  /** Custom negative prompt */
  negativePrompt?: string;
  /** Preferred provider (falls back to best available) */
  provider?: string;
  /** Associate with a project ID */
  projectId?: string;
  /** Make result publicly visible in community gallery */
  isPublic?: boolean;
  /** If true, returns job_id immediately without waiting for completion */
  async?: boolean;
}

export interface GenerateResult {
  jobId: string;
  status: 'succeeded' | 'failed' | 'pending';
  resultUrl: string | null;
  resultUrls: string[] | null;
  prompt: string;
  mode: string;
  provider: string | null;
  seed: number | null;
  durationMs: number | null;
  creditsUsed: number;
}

export interface Job {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  resultUrl: string | null;
  resultUrls: string[] | null;
  prompt: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  prompt: string;
  mode: string;
  tool: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProcessParams {
  /** Operation to apply */
  op: 'bg-remove' | 'vectorize' | 'resize' | 'compress';
  /** Target size for resize op */
  targetSize?: number;
  /** Quality 1–100 for compress op */
  quality?: number;
}

export interface WokGenError extends Error {
  status: number;
  code: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

export class WokGenClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: WokGenConfig) {
    this.apiKey  = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://wokgen.wokspec.org').replace(/\/$/, '');
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const init: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'wokgen-sdk/1.0.0',
      },
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    };

    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      const err = new Error(
        (data?.error as string) ?? `WokGen API error: ${res.status}`,
      ) as WokGenError;
      err.status = res.status;
      err.code   = (data?.code as string) ?? null;
      throw err;
    }

    return data as T;
  }

  // ── Generation ────────────────────────────────────────────────────────────

  /**
   * Generate an AI asset.
   *
   * @example
   * const result = await client.generate({
   *   prompt: 'pixel art wizard casting a spell, 32x32',
   *   mode: 'pixel',
   *   size: 512,
   * });
   * console.log(result.resultUrl);
   */
  async generate(params: GenerateParams): Promise<GenerateResult> {
    return this.request<GenerateResult>('POST', '/generate', params);
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────

  /**
   * Get the status and result of a generation job.
   */
  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>('GET', `/jobs/${jobId}`);
  }

  /**
   * Wait for a job to complete (polls every 1.5s, max 120s).
   *
   * @example
   * const result = await client.generate({ prompt: '...', mode: 'pixel', async: true });
   * const job = await client.waitForJob(result.jobId);
   * console.log(job.resultUrl);
   */
  async waitForJob(jobId: string, maxWaitMs = 120_000): Promise<Job> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const job = await this.getJob(jobId);
      if (job.status === 'succeeded' || job.status === 'failed') return job;
      await new Promise(r => setTimeout(r, 1500));
    }
    throw new Error(`Job ${jobId} did not complete within ${maxWaitMs}ms`);
  }

  // ── Assets ────────────────────────────────────────────────────────────────

  /**
   * List your generated assets.
   *
   * @example
   * const { items, hasMore } = await client.getAssets({ mode: 'pixel', page: 1 });
   */
  async getAssets(params?: {
    mode?: GenerationMode;
    projectId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Asset>> {
    const qs = new URLSearchParams();
    if (params?.mode)      qs.set('mode', params.mode);
    if (params?.projectId) qs.set('projectId', params.projectId);
    if (params?.page)      qs.set('page', String(params.page));
    if (params?.limit)     qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs}` : '';
    return this.request<PaginatedResult<Asset>>('GET', `/assets${query}`);
  }

  /**
   * Apply a post-processing operation to an existing asset.
   *
   * @example
   * const processed = await client.processAsset('asset_123', { op: 'bg-remove' });
   * console.log(processed.imageUrl);
   */
  async processAsset(assetId: string, params: ProcessParams): Promise<Asset> {
    return this.request<Asset>('POST', `/assets/${assetId}/process`, params);
  }

  // ── Account ───────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's profile and quota information.
   */
  async getMe(): Promise<{
    id: string; name: string; email: string;
    plan: string; quotaUsed: number; quotaLimit: number;
  }> {
    return this.request('GET', '/me');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick-start convenience export
// ─────────────────────────────────────────────────────────────────────────────

export function createClient(apiKey: string, baseUrl?: string): WokGenClient {
  return new WokGenClient({ apiKey, baseUrl });
}

export default WokGenClient;
