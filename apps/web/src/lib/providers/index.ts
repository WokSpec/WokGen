// Provider registry — returns the best available provider for a given tool

import { ReplicateProvider } from './replicate';
import { FalProvider } from './fal';
import { TogetherProvider } from './together';
import { ComfyUIProvider } from './comfyui';
import type { AIProvider, Tool } from './types';

export type { AIProvider, GenerateParams, GenerateResult, Tool, ProviderCapabilities } from './types';

// Priority order: most capable → least capable
const ALL_PROVIDERS: AIProvider[] = [
  new ReplicateProvider(),
  new FalProvider(),
  new ComfyUIProvider(),
  new TogetherProvider(),
];

export function getProvider(tool: Tool, preferredProvider?: string): AIProvider {
  if (preferredProvider) {
    const found = ALL_PROVIDERS.find(
      (p) => p.name === preferredProvider && p.isAvailable() && p.capabilities[tool]
    );
    if (found) return found;
  }

  const available = ALL_PROVIDERS.filter((p) => p.isAvailable() && p.capabilities[tool]);
  if (available.length === 0) {
    throw new Error(
      `No AI provider available for tool "${tool}". ` +
      `Set at least one of: REPLICATE_API_TOKEN, FAL_KEY, TOGETHER_API_KEY, or COMFYUI_HOST`
    );
  }
  return available[0];
}

export function listAvailableProviders(): { name: string; available: boolean; capabilities: Record<string, boolean> }[] {
  return ALL_PROVIDERS.map((p) => ({
    name: p.name,
    available: p.isAvailable(),
    capabilities: p.capabilities,
  }));
}
