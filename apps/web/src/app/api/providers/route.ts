import { NextResponse } from 'next/server';
import { listProviderStatus, PROVIDER_META, PROVIDER_CAPABILITIES } from '@/lib/providers';

// ---------------------------------------------------------------------------
// GET /api/providers
//
// Returns the status of all configured AI providers — used by the Studio UI
// to know which providers are available, whether keys are set, and what
// capabilities each provider supports.
//
// Response shape:
// {
//   providers: Array<{
//     id:           ProviderName
//     label:        string
//     description:  string
//     docsUrl:      string
//     configured:   boolean          -- true if env var is set server-side
//     free:         boolean
//     freeCreditsNote: string
//     color:        string           -- brand color hex for UI badges
//     capabilities: ProviderCapability
//   }>
//   default: ProviderName            -- recommended provider given current env
// }
//
// NOTE: This endpoint never exposes key values — only boolean presence flags.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

export async function GET() {
  const statuses = listProviderStatus();

  const providers = statuses.map((status) => {
    const meta = PROVIDER_META[status.provider];
    const caps = PROVIDER_CAPABILITIES[status.provider];

    return {
      id:              status.provider,
      label:           meta.label,
      description:     meta.description,
      docsUrl:         status.docsUrl,
      envVar:          status.envVar,
      configured:      status.configured,
      free:            status.free,
      freeCreditsNote: meta.freeCreditsNote,
      color:           meta.color,
      capabilities:    caps,
    };
  });

  // Determine recommended default — first configured provider,
  // falling back to "together" (free FLUX) then "comfyui".
  const defaultProvider =
    providers.find((p) => p.configured && p.id !== 'comfyui')?.id ??
    'comfyui';

  return NextResponse.json({
    providers,
    default: defaultProvider,
    // Quick summary flags for UI
    anyCloudConfigured: providers.some(
      (p) => p.configured && p.id !== 'comfyui',
    ),
    count: providers.length,
  });
}
