'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// WokGen Onboarding Modal — 4-step first-login flow
// ---------------------------------------------------------------------------

type UseCase = 'game-dev' | 'brand' | 'creative' | 'developer';

const USE_CASES: { id: UseCase; label: string; desc: string; prompt: string; mode: string }[] = [
  {
    id:     'game-dev',
    label:  'Game Developer',
    desc:   'Sprites, tilesets, animations, and game-ready asset packs.',
    prompt: 'knight warrior sprite, pixel art, 16x16, side view, idle pose, limited palette',
    mode:   'pixel',
  },
  {
    id:     'brand',
    label:  'Brand & Business',
    desc:   'Logos, social banners, marketing visuals, and brand kits.',
    prompt: 'modern tech startup logo, clean geometric, dark navy and electric blue, minimal',
    mode:   'business',
  },
  {
    id:     'creative',
    label:  'Creative & Hobbyist',
    desc:   'Illustrations, emoji packs, icons, and personal projects.',
    prompt: 'cute cat emoji, expressive, round face, big eyes, flat color style',
    mode:   'emoji',
  },
  {
    id:     'developer',
    label:  'Developer / Technical',
    desc:   'API access, automation, CI pipelines, and tooling integrations.',
    prompt: 'minimal vector icon set, 24px grid, solid fill, monochrome, UI system',
    mode:   'vector',
  },
];

const STEP_TITLES = [
  'What are you building?',
  'See it in action',
  'Create your first project',
  'Meet Eral, your AI director',
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [step,       setStep]       = useState(1);
  const [useCase,    setUseCase]    = useState<UseCase | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genResult,  setGenResult]  = useState<string | null>(null);
  const [genError,   setGenError]   = useState('');
  const [projName,   setProjName]   = useState('');
  const [projBrief,  setProjBrief]  = useState('');
  const [creating,   setCreating]   = useState(false);
  const router = useRouter();

  const selectedCase = USE_CASES.find(u => u.id === useCase);

  // Persist step to API
  const saveStep = async (s: number, uc?: UseCase) => {
    await fetch('/api/onboarding', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ step: s, ...(uc ? { useCase: uc } : {}) }),
    }).catch(() => null);
  };

  const handleUseCaseSelect = (id: UseCase) => {
    setUseCase(id);
  };

  const goToStep2 = async () => {
    if (!useCase) return;
    await saveStep(2, useCase);
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!selectedCase) return;
    setGenerating(true);
    setGenError('');
    setGenResult(null);
    try {
      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          prompt: selectedCase.prompt,
          mode:   selectedCase.mode,
          tool:   selectedCase.mode === 'pixel' ? 'sprite' : selectedCase.mode === 'emoji' ? 'emoji' : selectedCase.mode === 'vector' ? 'icon' : 'logo',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.resultUrl) {
        setGenResult(data.resultUrl);
      } else {
        setGenError(data.error ?? 'Generation failed. Try again.');
      }
    } catch {
      setGenError('Network error. Try again.');
    }
    setGenerating(false);
  };

  const goToStep3 = async () => {
    await saveStep(3);
    setStep(3);
  };

  const handleCreateProject = async () => {
    if (!projName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/projects', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:        projName.trim(),
        mode:        selectedCase?.mode ?? 'pixel',
        description: projBrief.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    await saveStep(4);
    setStep(4);
    if (data.project?.id) {
      // Pre-navigate so clicking "Open Project" is instant
    }
  };

  const handleComplete = async () => {
    await fetch('/api/onboarding', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ step: 4, completed: true }),
    }).catch(() => null);
    onComplete();
  };

  const handleSkip = async () => {
    await fetch('/api/onboarding', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ step: 4, completed: true }),
    }).catch(() => null);
    onComplete();
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-modal" role="dialog" aria-label="Onboarding" aria-modal="true">
        {/* Header */}
        <div className="onboard-header">
          <div className="onboard-progress">
            {[1,2,3,4].map(s => (
              <div key={s} className={`onboard-dot ${s <= step ? 'onboard-dot--active' : ''}`} />
            ))}
          </div>
          <button className="onboard-skip" onClick={handleSkip}>Skip</button>
        </div>

        {/* Step content — aria-live so screen readers announce step changes */}
        <div aria-live="polite">
        {/* Step title */}
        <h2 className="onboard-title">{STEP_TITLES[step - 1]}</h2>

        {/* Step 1: Use case picker */}
        {step === 1 && (
          <>
            <div className="onboard-usecases">
              {USE_CASES.map(u => (
                <button
                  key={u.id}
                  className={`onboard-usecase ${useCase === u.id ? 'onboard-usecase--selected' : ''}`}
                  onClick={() => handleUseCaseSelect(u.id)}
                >
                  <span className="onboard-usecase-label">{u.label}</span>
                  <span className="onboard-usecase-desc">{u.desc}</span>
                </button>
              ))}
            </div>
            <button
              className="btn-primary onboard-cta"
              onClick={goToStep2}
              disabled={!useCase}
            >
              Continue
            </button>
          </>
        )}

        {/* Step 2: Live generation demo */}
        {step === 2 && selectedCase && (
          <>
            <p className="onboard-body">
              Here is a sample prompt for your use case. Hit Generate to see WokGen in action.
            </p>
            <div className="onboard-prompt-preview">
              <code>{selectedCase.prompt}</code>
            </div>
            {genError && <p className="onboard-error">{genError}</p>}
            {genResult ? (
              <div className="onboard-result">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={genResult} alt="Generated result" className="onboard-result-img" />
                <button className="btn-primary onboard-cta" onClick={goToStep3}>
                  Next
                </button>
              </div>
            ) : (
              <button className="btn-primary onboard-cta" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating…' : 'Generate'}
              </button>
            )}
          </>
        )}

        {/* Step 3: Create first project */}
        {step === 3 && (
          <>
            <p className="onboard-body">
              Projects keep your assets organized. Name yours to get started.
            </p>
            <label className="onboard-field">
              Project name
              <input
                className="onboard-input"
                placeholder={selectedCase ? `${selectedCase.label} assets` : 'My first project'}
                value={projName}
                onChange={e => setProjName(e.target.value)}
                maxLength={80}
              />
            </label>
            <label className="onboard-field">
              Brief (optional)
              <input
                className="onboard-input"
                placeholder="What are you making?"
                value={projBrief}
                onChange={e => setProjBrief(e.target.value)}
                maxLength={200}
              />
            </label>
            <button
              className="btn-primary onboard-cta"
              onClick={handleCreateProject}
              disabled={!projName.trim() || creating}
            >
              {creating ? 'Creating…' : 'Create project'}
            </button>
          </>
        )}

        {/* Step 4: Meet Eral */}
        {step === 4 && (
          <>
            <p className="onboard-body">
              Eral is your AI creative director. Describe what you want to build
              and Eral will plan it, suggest prompts, and orchestrate multi-step
              generation workflows.
            </p>
            <div className="onboard-eral-card">
              <span className="onboard-eral-label">Eral can:</span>
              <ul className="onboard-eral-list">
                <li>Turn a brief into a multi-asset generation plan</li>
                <li>Simulate multi-agent creative discussions</li>
                <li>Maintain brand consistency across a project</li>
                <li>Suggest prompt improvements and style direction</li>
              </ul>
            </div>
            <div className="onboard-final-actions">
              <button className="btn-primary" onClick={() => { handleComplete(); router.push('/eral'); }}>
                Open Eral
              </button>
              <button className="btn-ghost" onClick={handleComplete}>
                Go to studio
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
