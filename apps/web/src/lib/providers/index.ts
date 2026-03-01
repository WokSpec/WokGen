import type {
  GenerateParams,
  GenerateResult,
  ProviderName,
  ProviderConfig,
} from './types';
import { replicateGenerate } from './replicate';
import { falGenerate } from './fal';
import { togetherGenerate } from './together';
import { comfyuiGenerate } from './comfyui';
import { pollinationsGenerate } from './pollinations';
import { huggingfaceGenerate } from './huggingface';
import { stablehordeGenerate } from './stablehorde';
import { prodiaGenerate } from './prodia';

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------
export * from './types';
export { replicateGenerate } from './replicate';
export { falGenerate } from './fal';
export { togetherGenerate } from './together';
export { comfyuiGenerate } from './comfyui';
export { pollinationsGenerate } from './pollinations';
export { huggingfaceGenerate } from './huggingface';
export { stablehordeGenerate } from './stablehorde';
export { prodiaGenerate } from './prodia';
export { REPLICATE_MODELS } from './replicate';
export { FAL_MODELS } from './fal';
export { TOGETHER_MODELS } from './together';

// ---------------------------------------------------------------------------
// resolveProviderConfig
//
// Builds a ProviderConfig from environment variables + optional BYOK overrides
// passed in the request. BYOK values always win so self-hosters can supply
// their own keys without touching server env vars.
// ---------------------------------------------------------------------------
export function resolveProviderConfig(
  provider: ProviderName,
  byokKey?: string | null,
  byokComfyuiHost?: string | null,
): ProviderConfig {
  const envKey = (() => {
    switch (provider) {
      case 'replicate':    return process.env.REPLICATE_API_TOKEN ?? '';
      case 'fal':          return process.env.FAL_KEY ?? '';
      case 'together':     return process.env.TOGETHER_API_KEY ?? '';
      case 'comfyui':      return ''; // no key needed
      case 'pollinations': return ''; // no key needed
      case 'huggingface':  return process.env.HF_TOKEN ?? '';
      case 'stablehorde':  return process.env.STABLE_HORDE_KEY ?? '0000000000'; // anon key fallback
      case 'prodia':       return process.env.PRODIA_API_KEY ?? ''; // optional
    }
  })();

  return {
    apiKey: byokKey ?? envKey,
    comfyuiHost:
      byokComfyuiHost ??
      process.env.COMFYUI_HOST ??
      'http://127.0.0.1:8188',
    timeoutMs: Number(process.env.GENERATION_TIMEOUT_MS ?? 300_000),
  };
}

// ---------------------------------------------------------------------------
// assertKeyPresent
//
// Throws a descriptive error if a cloud provider is selected but no API key
// has been configured — surfaces a helpful message to the browser UI.
// ---------------------------------------------------------------------------
export function assertKeyPresent(
  provider: ProviderName,
  config: ProviderConfig,
): void {
  if (provider === 'comfyui' || provider === 'pollinations' || provider === 'stablehorde' || provider === 'prodia') return; // always available

  if (!config.apiKey) {
    const envVarNames: Record<Exclude<ProviderName, 'comfyui' | 'pollinations' | 'stablehorde' | 'prodia'>, string> = {
      replicate:   'REPLICATE_API_TOKEN',
      fal:         'FAL_KEY',
      together:    'TOGETHER_API_KEY',
      huggingface: 'HF_TOKEN',
    };
    const envVar = envVarNames[provider as Exclude<ProviderName, 'comfyui' | 'pollinations' | 'stablehorde' | 'prodia'>];
    throw new Error(
      `No API key configured for provider "${provider}". ` +
        `Set ${envVar} in your .env.local file, or supply your key in the ` +
        `Studio → Settings panel (stored only in your browser).`,
    );
  }
}

// ---------------------------------------------------------------------------
// detectAvailableProvider
//
// Returns the first provider that has a key configured in env vars.
// Useful for picking a sensible default on first launch.
// Falls back to "together" (FLUX-schnell-Free) since it's the most accessible
// free-tier option, then "comfyui" as the zero-dependency local fallback.
// ---------------------------------------------------------------------------
export function detectAvailableProvider(): ProviderName {
  if (process.env.REPLICATE_API_TOKEN) return 'replicate';
  if (process.env.FAL_KEY)             return 'fal';
  if (process.env.TOGETHER_API_KEY)    return 'together';
  if (process.env.HF_TOKEN)            return 'huggingface';
  // Pollinations is always available — no key needed
  return 'pollinations';
}

// ---------------------------------------------------------------------------
// listProviderStatus
//
// Returns an object describing which providers are configured server-side.
// Intentionally does NOT expose key values — only boolean presence flags.
// ---------------------------------------------------------------------------
export interface ProviderStatus {
  provider: ProviderName;
  configured: boolean;
  /** Where to obtain an API key */
  docsUrl: string;
  /** Env var that configures this provider */
  envVar: string | null;
  free: boolean;
}

export function listProviderStatus(): ProviderStatus[] {
  return [
    {
      provider: 'replicate',
      configured: Boolean(process.env.REPLICATE_API_TOKEN),
      docsUrl: 'https://replicate.com/account/api-tokens',
      envVar: 'REPLICATE_API_TOKEN',
      free: true,
    },
    {
      provider: 'fal',
      configured: Boolean(process.env.FAL_KEY),
      docsUrl: 'https://fal.ai/dashboard/keys',
      envVar: 'FAL_KEY',
      free: true,
    },
    {
      provider: 'together',
      configured: Boolean(process.env.TOGETHER_API_KEY),
      docsUrl: 'https://api.together.xyz/settings/api-keys',
      envVar: 'TOGETHER_API_KEY',
      free: true,
    },
    {
      provider: 'pollinations' as ProviderName,
      configured: true, // always available — no key needed
      docsUrl: 'https://pollinations.ai',
      envVar: null,
      free: true,
    },
    {
      provider: 'huggingface' as ProviderName,
      configured: Boolean(process.env.HF_TOKEN),
      docsUrl: 'https://huggingface.co/settings/tokens',
      envVar: 'HF_TOKEN',
      free: true,
    },
    {
      provider: 'comfyui',
      configured: true, // always "available" — reachability is checked at generate time
      docsUrl: 'https://github.com/comfyanonymous/ComfyUI',
      envVar: null,
      free: true,
    },
    {
      provider: 'prodia' as ProviderName,
      configured: true, // works without key; PRODIA_API_KEY unlocks higher rate limits
      docsUrl: 'https://docs.prodia.com',
      envVar: 'PRODIA_API_KEY',
      free: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// generate
//
// Central dispatch function — selects the right provider module and runs the
// generation. This is the only function the API routes need to call.
// ---------------------------------------------------------------------------
export async function generate(
  provider: ProviderName,
  params: GenerateParams,
  config: ProviderConfig,
): Promise<GenerateResult> {
  switch (provider) {
    case 'replicate':
      return replicateGenerate(params, config.apiKey);

    case 'fal':
      return falGenerate(params, config.apiKey);

    case 'together':
      return togetherGenerate(params, config.apiKey);

    case 'comfyui':
      return comfyuiGenerate(params, config.comfyuiHost);

    case 'pollinations':
      return pollinationsGenerate(params, config);

    case 'huggingface':
      return huggingfaceGenerate(params, config);

    case 'stablehorde':
      return stablehordeGenerate(params, config);

    case 'prodia':
      return prodiaGenerate(params, config.apiKey);

    default: {
      // TypeScript exhaustiveness guard — should never reach this at runtime
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Utility: wrap any provider error into a JSON-serialisable shape for API
// responses. Strips stack traces and internal details.
// ---------------------------------------------------------------------------
export interface SerializedProviderError {
  error: string;
  provider?: ProviderName;
  statusCode?: number;
  providerJobId?: string;
}

export function serializeError(err: unknown): SerializedProviderError {
  if (err instanceof Error) {
    const pe = err as Error & {
      provider?: ProviderName;
      statusCode?: number;
      providerJobId?: string;
      jobId?: string;
    };
    return {
      error: pe.message,
      provider: pe.provider,
      statusCode: pe.statusCode,
      providerJobId: pe.providerJobId ?? pe.jobId,
    };
  }
  return { error: String(err) };
}
