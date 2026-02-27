'use client';

import { useState } from 'react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanItem {
  id: string; label: string; mode: string; tool: string;
  prompt: string; size: number; style?: string; description: string;
  status?: 'pending' | 'running' | 'done' | 'skipped' | 'failed';
  jobId?: string; resultUrl?: string; approved?: boolean;
}

const MODE_COLORS: Record<string, string> = {
  pixel: 'var(--accent)', business: '#60a5fa', vector: '#34d399',
  emoji: 'var(--yellow)', uiux: 'var(--pink)', voice: 'var(--orange)', text: 'var(--text-muted)',
};

const MODE_STUDIOS: Record<string, string> = {
  pixel: '/studio?type=pixel', business: '/studio?type=business', vector: '/studio?type=vector',
  emoji: '/studio?type=pixel', uiux: '/studio?type=uiux', voice: '/studio?type=voice', text: '/text/studio',
};

const PROJECT_TYPES = [
  { id: 'platformer',  label: 'Platformer',       desc: '2D side-scrolling game assets' },
  { id: 'rpg',         label: 'RPG',               desc: 'Top-down role-playing game kit' },
  { id: 'brand',       label: 'Brand Identity',    desc: 'Logo, colors, social assets' },
  { id: 'product',     label: 'Product Launch',    desc: 'Landing page + marketing visuals' },
  { id: 'content',     label: 'Content Campaign',  desc: 'Social posts + thumbnails' },
  { id: 'app',         label: 'App UI Kit',        desc: 'Component library + screens' },
  { id: 'puzzle',      label: 'Puzzle Game',       desc: 'Tile-based casual game assets' },
  { id: 'other',       label: 'Other',             desc: 'Describe your own project type' },
] as const;



// ─── Plan item card ───────────────────────────────────────────────────────────

function PlanItemCard({
  item, index, onToggleApprove, onSkip, onEdit,
}: {
  item: PlanItem; index: number;
  onToggleApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onEdit: (id: string, field: 'prompt' | 'label', value: string) => void;
}) {
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [draft, setDraft] = useState(item.prompt);

  const statusIcon: Record<string, string> = {
    pending: '', running: '', done: '', skipped: '—', failed: '',
  };

  return (
    <div className={[
      'director-item',
      item.approved === false ? 'director-item--skipped' : '',
      item.status === 'done'   ? 'director-item--done'   : '',
      item.status === 'failed' ? 'director-item--failed' : '',
    ].filter(Boolean).join(' ')}>
      {/* Index */}
      <div className="director-item__index">{String(index + 1).padStart(2, '0')}</div>

      {/* Status */}
      <div
        className="director-item__status"
        title={item.status ?? 'pending'}
        style={{ color: item.status === 'done' ? '#4ade80' : item.status === 'failed' ? '#f87171' : 'var(--text-muted)' }}
      >
        {statusIcon[item.status ?? 'pending']}
      </div>

      {/* Mode badge */}
      <span
        className="director-item__mode"
        style={{ '--mode-color': MODE_COLORS[item.mode] ?? 'var(--accent)' } as React.CSSProperties}
      >
        {item.mode}
      </span>

      {/* Content */}
      <div className="director-item__content">
        <div className="director-item__label">{item.label}</div>
        <div className="director-item__desc">{item.description}</div>
        {editingPrompt ? (
          <div className="director-item__edit">
            <textarea
              className="input director-item__edit-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="director-item__edit-actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { onEdit(item.id, 'prompt', draft); setEditingPrompt(false); }}>Save</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setDraft(item.prompt); setEditingPrompt(false); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="director-item__prompt" onClick={() => setEditingPrompt(true)} title="Click to edit prompt">
            {item.prompt}
            <span className="director-item__edit-hint">Edit</span>
          </div>
        )}
      </div>

      {/* Result preview */}
      {item.resultUrl && (
        <div className="director-item__preview" style={{ position: 'relative', minHeight: '120px' }}>
          <Image src={item.resultUrl} alt={item.label} fill className="director-item__preview-img object-cover" sizes="200px" />
        </div>
      )}

      {/* Actions */}
      <div className="director-item__actions">
        {item.status !== 'done' && item.status !== 'running' && (
          <>
            <button type="button"
              className={`btn btn--sm ${item.approved === false ? 'btn--ghost' : 'btn--ghost'}`}
              onClick={() => onToggleApprove(item.id)}
              title={item.approved === false ? 'Include' : 'Skip'}
            >
              {item.approved === false ? 'Include' : 'Skip'}
            </button>
          </>
        )}
        {item.status === 'done' && item.jobId && (
          <a
            href={`${MODE_STUDIOS[item.mode] ?? '/studio'}?jobId=${item.jobId}`}
            className="btn btn--ghost btn--sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EralDirectorClient() {
  const [brief, setBrief]           = useState('');
  const [projectType, setProjectType] = useState('');
  const [mode, setMode]             = useState('');
  const [count, setCount]           = useState(8);
  const [plan, setPlan]             = useState<PlanItem[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [error, setError]           = useState('');

  const generatePlan = async () => {
    if (!brief.trim()) { setError('Describe your project first.'); return; }
    setGenerating(true); setError(''); setPlan(null);
    try {
      const res = await fetch('/api/eral/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectBrief: brief, mode: mode || undefined, count }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Failed to generate plan'); return; }
      setPlan(d.plan.map((item: PlanItem) => ({ ...item, approved: true, status: 'pending' })));
    } catch { setError('Network error'); }
    finally { setGenerating(false); }
  };

  const toggleApprove = (id: string) => {
    setPlan(prev => prev?.map(item =>
      item.id === id ? { ...item, approved: item.approved === false ? true : false } : item,
    ) ?? null);
  };

  const skipItem = (id: string) => {
    setPlan(prev => prev?.map(item =>
      item.id === id ? { ...item, approved: false } : item,
    ) ?? null);
  };

  const editItem = (id: string, field: 'prompt' | 'label', value: string) => {
    setPlan(prev => prev?.map(item =>
      item.id === id ? { ...item, [field]: value } : item,
    ) ?? null);
  };

  const executePlan = async () => {
    if (!plan) return;
    const approved = plan.filter(item => item.approved !== false);
    if (approved.length === 0) { setError('No items to execute.'); return; }
    setExecuting(true); setProgress(0); setError('');

    for (let i = 0; i < approved.length; i++) {
      const item = approved[i];

      // Mark running
      setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'running' } : p) ?? null);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: item.mode,
            tool: item.tool,
            prompt: item.prompt,
            size: item.size,
            style: item.style,
          }),
        });
        const d = await res.json();

        if (!res.ok || !d.jobId) {
          setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'failed' } : p) ?? null);
        } else {
          // Poll for completion
          let jobResult: { status: string; resultUrl?: string } | null = null;
          for (let poll = 0; poll < 30; poll++) {
            await new Promise(r => setTimeout(r, 2000));
            const jr = await fetch(`/api/jobs/${d.jobId}`).then(r => r.ok ? r.json() : null).catch(() => null);
            if (jr?.job?.status === 'succeeded') { jobResult = { status: 'succeeded', resultUrl: jr.job.resultUrl }; break; }
            if (jr?.job?.status === 'failed')    { jobResult = { status: 'failed' }; break; }
          }

          if (jobResult?.status === 'succeeded') {
            setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'done', jobId: d.jobId, resultUrl: jobResult?.resultUrl } : p) ?? null);
          } else {
            setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'failed' } : p) ?? null);
          }
        }
      } catch {
        setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'failed' } : p) ?? null);
      }

      setProgress(i + 1);
      // Small delay between executions
      if (i < approved.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    setExecuting(false);
  };

  const approvedCount = plan?.filter(p => p.approved !== false).length ?? 0;
  const doneCount     = plan?.filter(p => p.status === 'done').length ?? 0;
  const failedCount   = plan?.filter(p => p.status === 'failed').length ?? 0;

  const rerunFailed = async () => {
    if (!plan) return;
    const failed = plan.filter(p => p.status === 'failed');
    if (!failed.length) return;
    // Reset failed items to pending
    setPlan(prev => prev?.map(p => p.status === 'failed' ? { ...p, status: 'pending' } : p) ?? null);
    setExecuting(true);
    for (let i = 0; i < failed.length; i++) {
      const item = failed[i];
      setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'running' } : p) ?? null);
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: item.mode, tool: item.tool, prompt: item.prompt, size: item.size, style: item.style }),
        });
        const d = await res.json();
        if (!res.ok || !d.jobId) throw new Error('generation failed');
        let jobResult: { status: string; resultUrl?: string } | null = null;
        for (let poll = 0; poll < 30; poll++) {
          await new Promise(r => setTimeout(r, 2000));
          const jr = await fetch(`/api/jobs/${d.jobId}`).then(r => r.ok ? r.json() : null).catch(() => null);
          if (jr?.job?.status === 'succeeded') { jobResult = { status: 'succeeded', resultUrl: jr.job.resultUrl }; break; }
          if (jr?.job?.status === 'failed')    { jobResult = { status: 'failed' }; break; }
        }
        if (jobResult?.status === 'succeeded') {
          setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'done', jobId: d.jobId, resultUrl: jobResult?.resultUrl } : p) ?? null);
        } else {
          setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'failed' } : p) ?? null);
        }
      } catch {
        setPlan(prev => prev?.map(p => p.id === item.id ? { ...p, status: 'failed' } : p) ?? null);
      }
    }
    setExecuting(false);
  };

  const exportManifest = () => {
    if (!plan) return;
    const manifest = {
      projectType,
      brief,
      generatedAt: new Date().toISOString(),
      assets: plan
        .filter(p => p.status === 'done')
        .map(p => ({ id: p.id, label: p.label, mode: p.mode, tool: p.tool, prompt: p.prompt, style: p.style, jobId: p.jobId, resultUrl: p.resultUrl })),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'director-manifest.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="director-page">
      <div className="director-page__header">
        <div>
          <h1 className="director-page__title">Asset Director</h1>
          <p className="director-page__sub">
            Describe your project. Eral builds a generation plan. You approve and execute.
          </p>
        </div>
      </div>

      {!plan ? (
        /* Brief input */
        <div className="director-brief">
          {/* Project type selector */}
          <div className="director-brief__field">
            <label className="director-brief__label">Project type</label>
            <div className="director-type-grid">
              {PROJECT_TYPES.map(pt => (
                <button type="button"
                  key={pt.id}
                  className={`director-type-card ${projectType === pt.id ? 'director-type-card--active' : ''}`}
                  onClick={() => setProjectType(pt.id)}
                >
                  <span className="director-type-card__label">{pt.label}</span>
                  <span className="director-type-card__desc">{pt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="director-brief__field">
            <label className="director-brief__label">Describe your project *</label>
            <textarea
              className="input director-brief__input"
              value={brief}
              onChange={e => { setBrief(e.target.value); setError(''); }}
              rows={4}
              placeholder="e.g. Top-down dungeon crawler, dark fantasy, NES pixel art style, 16-color palette…"
            />
          </div>

          <div className="director-brief__options">
            <div className="director-brief__option">
              <label>Mode focus</label>
              <select className="input" value={mode} onChange={e => setMode(e.target.value)} style={{ width: 160 }}>
                <option value="">Auto (all modes)</option>
                <option value="pixel">Pixel art</option>
                <option value="business">Business</option>
                <option value="vector">Vector</option>
                <option value="uiux">UI/UX</option>
                <option value="voice">Voice</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div className="director-brief__option">
              <label>Assets to plan</label>
              <select className="input" value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: 80 }}>
                {[4, 6, 8, 10, 12, 16].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="director-error">{error}</p>}

          <button type="button"
            className="btn btn--primary director-brief__submit"
            onClick={generatePlan}
            disabled={generating || !brief.trim()}
          >
            {generating ? (
              <><span className="director-spinner" />Building plan…</>
            ) : (
              '→ Build plan'
            )}
          </button>
        </div>
      ) : (
        /* Plan review + execution */
        <div className="director-plan">
          <div className="director-plan__header">
            <div>
              <h2 className="director-plan__title">
                {plan.length} assets planned
                {doneCount > 0 && <span className="director-plan__done"> · {doneCount} done</span>}
              </h2>
              <p className="director-plan__sub">
                Review and edit prompts, then execute. Skipped items won&apos;t be generated.
              </p>
            </div>
            <div className="director-plan__actions">
              {!executing && doneCount < approvedCount && (
                <button type="button" className="btn btn--primary" onClick={executePlan} disabled={approvedCount === 0}>
                  {doneCount > 0 ? `Continue (${approvedCount - doneCount} left)` : `Execute ${approvedCount} assets`}
                </button>
              )}
              {!executing && failedCount > 0 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={rerunFailed}>
                  Retry {failedCount} failed
                </button>
              )}
              {doneCount > 0 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={exportManifest} title="Download manifest.json">
                  Export manifest
                </button>
              )}
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setPlan(null); setProgress(0); }}>
                New plan
              </button>
            </div>
          </div>

          {executing && (
            <div className="director-progress">
              <div className="director-progress__bar">
                <div
                  className="director-progress__fill"
                  style={{ width: `${(progress / approvedCount) * 100}%` }}
                />
              </div>
              <span className="director-progress__label">{progress} / {approvedCount} generated</span>
            </div>
          )}

          {error && <p className="director-error">{error}</p>}

          <div className="director-plan__list">
            {plan.map((item, i) => (
              <PlanItemCard
                key={item.id}
                item={item}
                index={i}
                onToggleApprove={toggleApprove}
                onSkip={skipItem}
                onEdit={editItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
