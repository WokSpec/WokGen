'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Provider = 'replicate' | 'fal' | 'together' | 'comfyui' | 'huggingface' | 'pollinations';

export interface ProviderInfo {
  id: Provider;
  label: string;
  configured: boolean;
  free: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PROVIDER_COLORS: Record<Provider, string> = {
  replicate:    '#000000',
  fal:          '#ff6a00',
  together:     '#6366f1',
  comfyui:      '#22c55e',
  huggingface:  '#ffcc00',
  pollinations: '#06b6d4',
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  replicate:    'Replicate',
  fal:          'fal.ai',
  together:     'Together AI',
  comfyui:      'Custom Pipeline',
  huggingface:  'Hugging Face',
  pollinations: 'Pollinations',
};

// ---------------------------------------------------------------------------
// FormField helper
// ---------------------------------------------------------------------------

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium pixel-text-secondary">{label}</label>
      {children}
      {hint && <p className="text-2xs pixel-text-muted">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PixelSettingsModal
// ---------------------------------------------------------------------------

export default function PixelSettingsModal({
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
      className="pixel-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="panel w-full max-w-lg animate-scale-in flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 pixel-section-border-b">
          <div>
            <h2 className="text-sm font-semibold pixel-text-primary">Provider Settings</h2>
            <p className="text-xs mt-0.5 pixel-text-muted">
              API keys are stored in your browser only — never sent to the server unless generating.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost btn-icon flex-shrink-0" aria-label="Close settings">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="scroll-region px-5 py-4 flex flex-col gap-5">
          {(['replicate', 'fal', 'together'] as Provider[]).map((pid) => {
            const info = providers.find((p) => p.id === pid);
            return (
              <div key={pid} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PROVIDER_COLORS[pid] }} />
                    <span className="text-sm font-medium pixel-text-primary">{PROVIDER_LABELS[pid]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {info?.configured && <span className="badge-success text-2xs pixel-badge-xs">✓ env configured</span>}
                    <span className="text-2xs pixel-mono-xs">{ENV_VARS[pid]}</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showKeys[pid] ? 'text' : 'password'}
                    className="input pr-10 font-mono text-xs"
                    placeholder={info?.configured ? '(env var set — leave blank to use it)' : `Paste your ${PROVIDER_LABELS[pid]} API key`}
                    value={keys[pid]}
                    onChange={(e) => setKeys((k) => ({ ...k, [pid]: e.target.value }))}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pixel-text-muted"
                    onClick={() => setShowKeys((s) => ({ ...s, [pid]: !s[pid] }))}
                    tabIndex={-1}
                    aria-label={showKeys[pid] ? 'Hide key' : 'Show key'}
                  >
                    {showKeys[pid] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* ComfyUI host */}
          <div className="pt-4 pixel-section-border-t">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PROVIDER_COLORS.comfyui }} />
              <span className="text-sm font-medium pixel-text-primary">Custom Pipeline</span>
              <span className="badge-success text-2xs ml-auto pixel-badge-xs">Always free</span>
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
          <div className="rounded-lg px-3 py-2.5 text-xs pixel-byok-note">
            <strong className="pixel-byok-title">BYOK mode:</strong> Keys entered here are stored in{' '}
            <code>localStorage</code> and sent only with your generation requests. They are never logged
            or persisted server-side. Alternatively, set env vars in <code>.env.local</code> for server-side use.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0 pixel-section-border-t">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={() => { onSave(keys, host || 'http://127.0.0.1:8188'); onClose(); }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
