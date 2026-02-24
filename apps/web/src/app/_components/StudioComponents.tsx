'use client';

/**
 * WokGen — StudioResultPanel (Cycle 18)
 *
 * Universal result panel shown after generation in every studio.
 * Shows download, save-to-project, share link, regenerate, quality badge.
 */

import { useState } from 'react';
import Image from 'next/image';

interface StudioResultPanelProps {
  resultUrl: string | null;
  prompt: string;
  mode: string;
  tool: string;
  provider?: string;
  durationMs?: number;
  quality?: 'hd' | 'standard';
  onRegenerate?: () => void;
  onSaveToProject?: () => void;
  className?: string;
}

export function StudioResultPanel({
  resultUrl,
  prompt,
  mode,
  tool,
  provider,
  durationMs,
  quality,
  onRegenerate,
  onSaveToProject,
  className = '',
}: StudioResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyShareLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    onSaveToProject?.();
    setTimeout(() => setSaved(false), 2000);
  };

  const qualityLabel = quality === 'hd' ? 'HD' : 'Standard';
  const qualityColor = quality === 'hd' ? '#fbbf24' : '#60a5fa';

  return (
    <div className={`studio-result-panel ${className}`}>
      {resultUrl ? (
        <div className="studio-result-image-wrap">
          <Image
            src={resultUrl}
            alt={prompt}
            width={512}
            height={512}
            className="studio-result-image"
            unoptimized
          />
        </div>
      ) : (
        <div className="studio-result-placeholder">
          <span className="studio-result-placeholder-text">Result will appear here</span>
        </div>
      )}

      {resultUrl && (
        <>
          <div className="studio-result-meta">
            {quality && (
              <span className="studio-result-badge" style={{ borderColor: qualityColor, color: qualityColor }}>
                {qualityLabel}
              </span>
            )}
            {provider && (
              <span className="studio-result-badge studio-result-badge--provider">{provider}</span>
            )}
            {durationMs && (
              <span className="studio-result-badge studio-result-badge--time">{(durationMs / 1000).toFixed(1)}s</span>
            )}
          </div>

          <div className="studio-result-actions">
            <a
              href={resultUrl}
              download={`wokgen-${mode}-${tool}-${Date.now()}.png`}
              className="btn btn--ghost btn--sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
            {onSaveToProject && (
              <button className="btn btn--ghost btn--sm" onClick={handleSave}>
                {saved ? 'Saved' : 'Save to project'}
              </button>
            )}
            <button className="btn btn--ghost btn--sm" onClick={copyShareLink}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            {onRegenerate && (
              <button className="btn btn--ghost btn--sm" onClick={onRegenerate}>
                Regenerate
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generation progress indicator
// ---------------------------------------------------------------------------

type GenerationStage = 'connecting' | 'routing' | 'generating' | 'quality_check' | 'done';

const STAGE_LABELS: Record<string, Record<GenerationStage, string>> = {
  pixel: {
    connecting:    'Connecting…',
    routing:       'Selecting pixel engine…',
    generating:    'Rasterizing pixels…',
    quality_check: 'Checking output quality…',
    done:          'Done',
  },
  voice: {
    connecting:    'Connecting…',
    routing:       'Loading voice model…',
    generating:    'Parsing speakers…',
    quality_check: 'Processing audio…',
    done:          'Done',
  },
  default: {
    connecting:    'Connecting…',
    routing:       'Routing to provider…',
    generating:    'Generating…',
    quality_check: 'Quality check…',
    done:          'Done',
  },
};

interface GeneratingStateProps {
  stage?: GenerationStage;
  mode?: string;
}

export function GeneratingState({ stage = 'generating', mode = 'default' }: GeneratingStateProps) {
  const labels = STAGE_LABELS[mode] ?? STAGE_LABELS.default;
  const stages: GenerationStage[] = ['connecting', 'routing', 'generating', 'quality_check'];
  const currentIdx = stages.indexOf(stage);

  return (
    <div className="studio-generating">
      <div className="studio-generating-stages">
        {stages.map((s, i) => (
          <div
            key={s}
            className={[
              'studio-generating-stage',
              i < currentIdx ? 'studio-generating-stage--done' : '',
              i === currentIdx ? 'studio-generating-stage--active' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="studio-generating-stage-dot" />
            <span>{labels[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Studio empty state
// ---------------------------------------------------------------------------

interface StudioEmptyProps {
  mode: string;
  onTryExample?: (prompt: string) => void;
}

const MODE_EMPTY_PROMPTS: Record<string, { label: string; prompt: string }> = {
  pixel:    { label: 'Try: warrior sprite',     prompt: 'knight warrior sprite, pixel art, 16x16, idle pose, transparent background' },
  business: { label: 'Try: startup logo',       prompt: 'modern tech startup logo, minimal, dark navy and electric blue' },
  vector:   { label: 'Try: icon set',           prompt: 'app navigation icons, flat vector, 24px, minimal line style' },
  voice:    { label: 'Try: narration',          prompt: 'Welcome to WokGen, the fastest way to generate professional assets.' },
  text:     { label: 'Try: landing page copy',  prompt: 'Hero headline for a developer productivity SaaS, direct, no fluff' },
  uiux:     { label: 'Try: pricing table',      prompt: 'React pricing table, 3-tier, dark mode, highlighted recommended plan' },
};

export function StudioEmpty({ mode, onTryExample }: StudioEmptyProps) {
  const example = MODE_EMPTY_PROMPTS[mode];

  return (
    <div className="studio-empty">
      <div className="studio-empty-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="6" y="6" width="8" height="8" fill="currentColor" opacity="0.3" />
          <rect x="18" y="6" width="8" height="8" fill="currentColor" opacity="0.5" />
          <rect x="6" y="18" width="8" height="8" fill="currentColor" opacity="0.5" />
          <rect x="18" y="18" width="8" height="8" fill="currentColor" opacity="0.8" />
        </svg>
      </div>
      <p className="studio-empty-text">Enter a prompt and generate</p>
      {example && onTryExample && (
        <button
          className="studio-empty-example"
          onClick={() => onTryExample(example.prompt)}
        >
          {example.label}
        </button>
      )}
    </div>
  );
}
