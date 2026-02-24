'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TutorialStep {
  target: string;        // CSS selector for the highlighted element
  title: string;
  body: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;       // Optional: "click", "type", etc. hint
}

export interface Tutorial {
  id: string;
  label: string;
  steps: TutorialStep[];
}

interface TutorialOverlayProps {
  tutorial: Tutorial;
  onComplete: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({ tutorial, onComplete, onSkip }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = tutorial.steps[step];
  const isLast = step === tutorial.steps.length - 1;

  // Measure the target element
  useEffect(() => {
    const el = document.querySelector(current.target);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setRect(null);
    }
  }, [step, current.target]);

  const next = useCallback(() => {
    if (isLast) onComplete();
    else setStep(s => s + 1);
  }, [isLast, onComplete]);

  const prev = () => setStep(s => Math.max(0, s - 1));

  const PAD = 8;
  const tooltipStyle: React.CSSProperties = {};

  if (rect) {
    const pos = current.position ?? 'bottom';
    if (pos === 'bottom') {
      tooltipStyle.top = rect.bottom + PAD + window.scrollY;
      tooltipStyle.left = Math.max(12, rect.left + rect.width / 2 - 160);
    } else if (pos === 'top') {
      tooltipStyle.bottom = window.innerHeight - rect.top + PAD;
      tooltipStyle.left = Math.max(12, rect.left + rect.width / 2 - 160);
    } else if (pos === 'right') {
      tooltipStyle.top = rect.top + window.scrollY;
      tooltipStyle.left = rect.right + PAD;
    } else {
      tooltipStyle.top = rect.top + window.scrollY;
      tooltipStyle.right = window.innerWidth - rect.left + PAD;
    }
  } else {
    // Fallback: center screen
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Dimmed overlay */}
      <div className="tutorial-backdrop" onClick={onSkip} />

      {/* Highlight ring around target */}
      {rect && (
        <div
          className="tutorial-highlight"
          style={{
            top: rect.top + window.scrollY - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div className="tutorial-tooltip" style={{ ...tooltipStyle, position: 'fixed' }}>
        <div className="tutorial-tooltip-header">
          <span className="tutorial-step-label">Step {step + 1} of {tutorial.steps.length}</span>
          <button className="tutorial-skip-btn" onClick={onSkip}>Skip</button>
        </div>
        <h4 className="tutorial-tooltip-title">{current.title}</h4>
        <p className="tutorial-tooltip-body">{current.body}</p>
        {current.action && (
          <p className="tutorial-action-hint">👆 {current.action}</p>
        )}
        <div className="tutorial-tooltip-nav">
          {step > 0 && (
            <button className="btn-ghost-xs" onClick={prev}>← Back</button>
          )}
          <div className="tutorial-progress">
            {tutorial.steps.map((_, i) => (
              <div key={i} className={`tutorial-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
            ))}
          </div>
          <button className="btn-primary btn-sm" onClick={next}>
            {isLast ? '🎉 Done!' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Hook for per-page tutorial management ─────────────────────────────────

const STORAGE_KEY = 'wokgen:completed-tutorials';

function getCompleted(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

function markCompleted(id: string) {
  if (typeof window === 'undefined') return;
  const set = getCompleted();
  set.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useTutorial(tutorial: Tutorial, autoStart = true) {
  const [active, setActive] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!autoStart) { setChecked(true); return; }
    // Start tutorial automatically the first time this page is visited
    const completed = getCompleted();
    if (!completed.has(tutorial.id)) {
      // Small delay so the page can render first
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
    setChecked(true);
  }, [tutorial.id, autoStart]);

  const start = () => setActive(true);

  const complete = useCallback(() => {
    markCompleted(tutorial.id);
    setActive(false);
    setChecked(true);
  }, [tutorial.id]);

  const skip = useCallback(() => {
    markCompleted(tutorial.id);
    setActive(false);
    setChecked(true);
  }, [tutorial.id]);

  const reset = () => {
    const set = getCompleted();
    set.delete(tutorial.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  };

  return { active, start, complete, skip, reset, checked };
}

// ── Tutorial definitions ──────────────────────────────────────────────────

export const PIXEL_STUDIO_TUTORIAL: Tutorial = {
  id: 'pixel-studio-v1',
  label: 'Pixel Studio Tour',
  steps: [
    {
      target: '.studio-prompt-input, [data-tutorial="prompt"]',
      title: 'Write your prompt',
      body: 'Describe what you want to generate. Be specific — "knight warrior, 16×16, side view, pixel art" works better than just "knight".',
      action: 'Click the prompt box and type your idea',
      position: 'bottom',
    },
    {
      target: '.studio-size-selector, [data-tutorial="size"]',
      title: 'Choose your canvas size',
      body: 'Pick the pixel dimensions. 16×16 for small icons, 32×32 for characters, 64×64 for detailed sprites.',
      position: 'bottom',
    },
    {
      target: '.studio-generate-btn, [data-tutorial="generate"]',
      title: 'Generate!',
      body: 'Hit Generate to create your image. The AI uses free open-source models — FLUX, Stable Diffusion, and more.',
      action: 'Click Generate',
      position: 'bottom',
    },
    {
      target: '.studio-result-area, [data-tutorial="result"]',
      title: 'Your result',
      body: 'Your generated image appears here. Use the action bar to download, remove the background, resize, or save to your gallery.',
      position: 'left',
    },
    {
      target: '.studio-history, [data-tutorial="history"]',
      title: 'Generation history',
      body: 'Your previous generations are saved here. Click any to restore it. The history persists across sessions.',
      position: 'right',
    },
  ],
};

export const TOOLS_TUTORIAL: Tutorial = {
  id: 'tools-hub-v1',
  label: 'Tools Hub Tour',
  steps: [
    {
      target: '.tools-search, [data-tutorial="tools-search"]',
      title: 'Search any tool',
      body: 'Type to instantly filter tools by name or category. Try "image", "json", or "color".',
      position: 'bottom',
    },
    {
      target: '.tools-tag-filter, [data-tutorial="tools-tags"]',
      title: 'Filter by category',
      body: 'Use the tag chips to browse by type: Image, Design, Dev, GameDev, PDF, and more.',
      position: 'bottom',
    },
    {
      target: '.tool-card:first-child, [data-tutorial="tool-card"]',
      title: 'Click any tool to open it',
      body: 'Every tool runs 100% in your browser — nothing is uploaded to a server. Fast, private, and free.',
      position: 'bottom',
    },
  ],
};

export const ERAL_TUTORIAL: Tutorial = {
  id: 'eral-v1',
  label: 'Eral AI Tour',
  steps: [
    {
      target: '.eral-input, [data-tutorial="eral-input"]',
      title: 'Talk to Eral',
      body: 'Eral is your AI companion. Ask questions, request generations, or give commands like "Take me to Pixel Studio".',
      action: 'Type a message and press Enter',
      position: 'top',
    },
    {
      target: '.eral-command-chip, [data-tutorial="eral-commands"]',
      title: 'Quick commands',
      body: 'Click any command chip to send it immediately. Eral can navigate, generate, fill prompts, and more — all through chat.',
      position: 'top',
    },
    {
      target: '.eral-tools-section, [data-tutorial="eral-tools"]',
      title: 'Quick-launch tools',
      body: 'Jump to any free tool directly from the sidebar. Eral will also suggest relevant tools after you generate something.',
      position: 'right',
    },
  ],
};
