'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Onboarding multi-step flow — 4 steps
// ---------------------------------------------------------------------------

type ModeId = 'pixel' | 'vector' | 'business' | 'uiux' | 'voice' | 'code';

const MODES: { id: ModeId; label: string; desc: string; icon: string; accent: string }[] = [
  { id: 'pixel',    label: 'Pixel Art',   desc: 'Retro & game-ready sprites',      icon: '🎮', accent: '#a78bfa' },
  { id: 'vector',   label: 'Vector',      desc: 'Clean SVG illustrations',         icon: '✏️', accent: '#34d399' },
  { id: 'business', label: 'Brand',       desc: 'Logos, mockups & social assets',  icon: '💼', accent: '#60a5fa' },
  { id: 'uiux',     label: 'UI/UX',       desc: 'Screens, wireframes & components',icon: '🖥️', accent: '#f472b6' },
  { id: 'voice',    label: 'Voice',       desc: 'AI voiceovers & narration',       icon: '🎙️', accent: '#f59e0b' },
  { id: 'code',     label: 'Code',        desc: 'AI coding & code generation',     icon: '💻', accent: '#10b981' },
];

const FREE_SERVICES = [
  {
    id:    'groq',
    name:  'Groq',
    desc:  'Ultra-fast AI inference — takes 30 seconds to set up',
    url:   'https://console.groq.com/keys',
    icon:  '⚡',
  },
  {
    id:    'huggingface',
    name:  'HuggingFace',
    desc:  'Required for upscaling, music, and image analysis',
    url:   'https://huggingface.co/settings/tokens',
    icon:  '🤗',
  },
  {
    id:    'pixabay',
    name:  'Pixabay',
    desc:  '5M+ free CC0 images for reference',
    url:   'https://pixabay.com/api/docs/',
    icon:  '🖼️',
  },
];

const TOTAL_STEPS = 4;

export default function OnboardingClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [step,     setStep]     = useState(Math.max(1, parseInt(searchParams.get('step') ?? '1', 10)));
  const [mode,     setMode]     = useState<ModeId | null>(null);
  const [saving,   setSaving]   = useState(false);

  const user = session?.user;
  const name = user?.name?.split(' ')[0] ?? 'there';
  const preferredMode = mode ? MODES.find(m => m.id === mode) : null;

  const goTo = useCallback((s: number) => {
    setStep(s);
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(s));
    window.history.replaceState(null, '', url.toString());
  }, []);

  const saveStep = useCallback(async (s: number) => {
    try {
      await fetch('/api/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ step: s }),
      });
    } catch { /* graceful — onboarding works offline */ }
  }, []);

  const handleNext = async () => {
    if (step === 2 && !mode) return;
    const next = step + 1;
    await saveStep(next);
    goTo(next);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch('/api/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ step: TOTAL_STEPS, completed: true }),
      });
    } catch { /* graceful */ } finally {
      setSaving(false);
      router.push('/dashboard');
    }
  };

  return (
    <div className="onboarding">
      {/* Progress bar */}
      <div className="onboarding__progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`onboarding__progress-step${i + 1 <= step ? ' onboarding__progress-step--done' : ''}`}
          />
        ))}
      </div>
      <p className="onboarding__step-count">Step {step} of {TOTAL_STEPS}</p>

      {/* ── Step 1: Welcome ── */}
      {step === 1 && (
        <div className="onboarding__step">
          <div className="onboarding__emoji">🎉</div>
          <h1 className="onboarding__heading">Welcome to WokGen{user?.name ? `, ${name}` : ''}!</h1>
          <p className="onboarding__sub">You&apos;re all set. Here&apos;s what&apos;s waiting for you:</p>
          <ul className="onboarding__value-list">
            <li>🎨 <strong>6 creative studios</strong> — pixel, vector, brand, UI/UX, voice &amp; code</li>
            <li>🆓 <strong>10+ free AI services</strong> — no credit card required to start</li>
            <li>⚡ <strong>Fast generations</strong> — results in seconds</li>
          </ul>
          <button type="button" className="btn-primary onboarding__cta" onClick={() => void handleNext()}>
            Let&apos;s get started →
          </button>
        </div>
      )}

      {/* ── Step 2: Choose studio ── */}
      {step === 2 && (
        <div className="onboarding__step">
          <h1 className="onboarding__heading">Choose your primary studio</h1>
          <p className="onboarding__sub">This will be your default studio when you open WokGen.</p>
          <div className="onboarding__mode-grid">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                className={`onboarding__mode-card${mode === m.id ? ' onboarding__mode-card--selected' : ''}`}
                style={{ '--mode-accent': m.accent } as React.CSSProperties}
                onClick={() => setMode(m.id)}
              >
                <span className="onboarding__mode-icon">{m.icon}</span>
                <span className="onboarding__mode-label">{m.label}</span>
                <span className="onboarding__mode-desc">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="onboarding__actions">
            <button type="button" className="btn-ghost" onClick={() => goTo(1)}>← Back</button>
            <button type="button" className="btn-primary" onClick={() => void handleNext()} disabled={!mode}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Free services ── */}
      {step === 3 && (
        <div className="onboarding__step">
          <h1 className="onboarding__heading">Unlock more capabilities</h1>
          <p className="onboarding__sub">These free API keys take under a minute each to get.</p>
          <div className="onboarding__services">
            {FREE_SERVICES.map(svc => (
              <div key={svc.id} className="onboarding__service-card">
                <span className="onboarding__service-icon">{svc.icon}</span>
                <div className="onboarding__service-body">
                  <p className="onboarding__service-name">{svc.name}</p>
                  <p className="onboarding__service-desc">{svc.desc}</p>
                </div>
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-sm"
                >
                  Get key →
                </a>
              </div>
            ))}
          </div>
          <p className="onboarding__service-note">
            Add keys any time at{' '}
            <Link href="/settings" className="text-link">Settings → API Services</Link>.
          </p>
          <div className="onboarding__actions">
            <button type="button" className="btn-ghost" onClick={() => goTo(2)}>← Back</button>
            <button type="button" className="btn-ghost" onClick={() => void handleNext()}>Skip for now</button>
            <button type="button" className="btn-primary" onClick={() => void handleNext()}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Explore ── */}
      {step === 4 && (
        <div className="onboarding__step">
          <div className="onboarding__emoji">🚀</div>
          <h1 className="onboarding__heading">You&apos;re ready to create!</h1>
          <p className="onboarding__sub">Jump in wherever you&apos;d like to start.</p>
          <div className="onboarding__action-cards">
            {preferredMode && (
              <Link href={`/${preferredMode.id}/studio`} className="onboarding__action-card">
                <span>{preferredMode.icon}</span>
                <span>Open {preferredMode.label} Studio</span>
              </Link>
            )}
            <Link href="/prompt-lab" className="onboarding__action-card">
              <span>✨</span>
              <span>Try Prompt Lab</span>
            </Link>
            <Link href="/gallery" className="onboarding__action-card">
              <span>🖼️</span>
              <span>Browse Gallery</span>
            </Link>
          </div>
          <button
            type="button"
            className="btn-primary onboarding__cta"
            onClick={() => void handleComplete()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Go to Dashboard →'}
          </button>
        </div>
      )}
    </div>
  );
}
