'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssetTag { tag: string }
interface Job {
  id: string; tool: string; mode: string; prompt: string;
  resultUrl: string | null; provider: string; createdAt: string;
  assetTags: AssetTag[];
}
interface Relationship {
  id: string; fromJobId: string; toJobId: string; type: string; createdAt: string;
}
interface Brief {
  genre?: string; artStyle?: string; paletteJson?: string;
  brandName?: string; industry?: string; colorHex?: string; styleGuide?: string;
}
interface ActivityEvent {
  id: string; type: string; message: string; refId: string | null; createdAt: string;
}
interface Comment {
  id: string; body: string; createdAt: string;
  author: { name: string | null; email: string | null };
}
interface Props {
  projectId: string; projectName: string; projectMode: string; brief: Brief | null;
}

const REL_LABELS: Record<string, string> = {
  variation: 'Variation', animation_of: 'Animation', enemy_of: 'Enemy',
  tileset_for: 'Tileset', same_palette: 'Same palette', brand_use: 'Brand use',
};

const REL_COLORS: Record<string, string> = {
  variation: '#a78bfa', animation_of: '#60a5fa', enemy_of: '#f87171',
  tileset_for: '#34d399', same_palette: '#fbbf24', brand_use: '#fb923c',
};

const MODE_STUDIOS: Record<string, string> = {
  pixel: '/pixel/studio', business: '/business/studio', vector: '/vector/studio',
  emoji: '/emoji/studio', uiux: '/uiux/studio', voice: '/voice/studio', text: '/text/studio',
};

// ─── Asset grid card ─────────────────────────────────────────────────────────

function AssetCard({
  job, isSelected, isHighlighted, onSelect, linkedIds,
}: {
  job: Job;
  isSelected: boolean;
  isHighlighted: boolean;
  linkedIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  const hasLink = linkedIds.has(job.id);
  return (
    <button
      className={[
        'project-asset-card',
        isSelected    && 'project-asset-card--selected',
        isHighlighted && 'project-asset-card--highlighted',
        hasLink       && 'project-asset-card--linked',
      ].filter(Boolean).join(' ')}
      onClick={() => onSelect(job.id)}
      title={job.prompt}
    >
      {job.resultUrl ? (
        <img
          src={job.resultUrl}
          alt={job.prompt.slice(0, 60)}
          className="project-asset-card__img"
          loading="lazy"
        />
      ) : (
        <div className="project-asset-card__placeholder">
          <span>{job.tool}</span>
        </div>
      )}
      <div className="project-asset-card__overlay">
        <span className="project-asset-card__tool">{job.tool}</span>
        {hasLink && <span className="project-asset-card__link-dot" title="Has relationships" />}
      </div>
      {isSelected && (
        <div className="project-asset-card__selected-ring" aria-label="Selected" />
      )}
    </button>
  );
}

// ─── Relationship panel ───────────────────────────────────────────────────────

function RelationshipPanel({
  projectId, fromJobId, existingRels, jobs,
  onCreated, onClose,
}: {
  projectId: string; fromJobId: string;
  existingRels: Relationship[]; jobs: Job[];
  onCreated: () => void; onClose: () => void;
}) {
  const [toJobId, setToJobId] = useState('');
  const [type, setType]       = useState('variation');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const fromJob = jobs.find(j => j.id === fromJobId);
  const candidates = jobs.filter(j => j.id !== fromJobId);

  const create = async () => {
    if (!toJobId) { setError('Pick a target asset.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromJobId, toJobId, type }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return; }
      onCreated();
      onClose();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="rel-panel">
      <div className="rel-panel__header">
        <h3 className="rel-panel__title">Link asset</h3>
        <button className="btn btn--ghost btn--sm" onClick={onClose}>&times;</button>
      </div>
      <div className="rel-panel__from">
        <span className="rel-panel__label">From:</span>
        <span className="rel-panel__prompt">{fromJob?.prompt.slice(0, 60)}…</span>
      </div>
      <div className="rel-panel__field">
        <label className="rel-panel__label">Relationship type</label>
        <select className="input" value={type} onChange={e => setType(e.target.value)}>
          {Object.entries(REL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="rel-panel__field">
        <label className="rel-panel__label">Target asset</label>
        <select className="input" value={toJobId} onChange={e => setToJobId(e.target.value)}>
          <option value="">— pick an asset —</option>
          {candidates.map(j => (
            <option key={j.id} value={j.id}>{j.prompt.slice(0, 60)}</option>
          ))}
        </select>
      </div>
      {error && <p className="rel-panel__error">{error}</p>}
      <div className="rel-panel__actions">
        <button className="btn btn--primary btn--sm" onClick={create} disabled={saving}>
          {saving ? 'Saving…' : 'Create link'}
        </button>
      </div>
    </div>
  );
}

// ─── Brief panel ─────────────────────────────────────────────────────────────

function BriefPanel({ projectId, brief, mode, onSaved }: {
  projectId: string; brief: Brief | null; mode: string; onSaved: (b: Brief) => void;
}) {
  const [form, setForm] = useState<Brief>(brief ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (data: Brief) => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/projects/${projectId}/brief`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) { const d = await res.json(); onSaved(d.brief); }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [projectId, onSaved]);

  const handleBlur = useCallback((latestForm: Brief) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(latestForm), 400);
  }, [save]);

  const isGame = ['pixel', 'vector', 'emoji'].includes(mode);

  return (
    <div className="brief-panel">
      <h3 className="brief-panel__title">Project brief</h3>
      {isGame ? (
        <>
          <div className="brief-panel__field">
            <label>Genre</label>
            <select className="input" value={form.genre ?? ''} onChange={e => setForm(f => ({ ...f, genre: e.target.value || undefined }))} onBlur={() => handleBlur(form)}>
              <option value="">— not set —</option>
              <option value="dungeon_crawler">Dungeon crawler</option>
              <option value="platformer">Platformer</option>
              <option value="top_down_rpg">Top-down RPG</option>
              <option value="city_builder">City builder</option>
              <option value="match_3">Match-3</option>
              <option value="shoot_em_up">Shoot-em-up</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="brief-panel__field">
            <label>Art style</label>
            <select className="input" value={form.artStyle ?? ''} onChange={e => setForm(f => ({ ...f, artStyle: e.target.value || undefined }))} onBlur={() => handleBlur(form)}>
              <option value="">— not set —</option>
              <option value="nes_16color">NES 16-color</option>
              <option value="snes_32color">SNES 32-color</option>
              <option value="gb_monochrome">Game Boy mono</option>
              <option value="modern_pixel">Modern pixel art</option>
              <option value="16bit_rpg">16-bit RPG</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div className="brief-panel__field">
            <label>Brand name</label>
            <input className="input" value={form.brandName ?? ''} onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} onBlur={() => handleBlur(form)} placeholder="Acme Inc." />
          </div>
          <div className="brief-panel__field">
            <label>Industry</label>
            <input className="input" value={form.industry ?? ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} onBlur={() => handleBlur(form)} placeholder="SaaS, e-commerce…" />
          </div>
          <div className="brief-panel__field">
            <label>Primary color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="color" value={form.colorHex ?? '#a78bfa'} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} onBlur={() => handleBlur(form)} style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
              <input className="input" style={{ flex: 1 }} value={form.colorHex ?? ''} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} onBlur={() => handleBlur(form)} placeholder="#a78bfa" />
            </div>
          </div>
          <div className="brief-panel__field">
            <label>Style guide</label>
            <textarea className="input" rows={3} value={form.styleGuide ?? ''} onChange={e => setForm(f => ({ ...f, styleGuide: e.target.value }))} onBlur={() => handleBlur(form)} placeholder="Minimal, modern, trustworthy…" />
          </div>
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn--primary btn--sm" onClick={() => save(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save brief'}
        </button>
        {saved && !saving && (
          <span style={{ color: 'var(--color-success, #22c55e)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function AssetLightbox({ job, onClose }: { job: Job; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const download = () => {
    if (!job.resultUrl) return;
    const a = document.createElement('a');
    a.href = job.resultUrl;
    a.download = `${job.tool}_${job.id.slice(0, 8)}.png`;
    a.click();
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/api/assets/${job.id}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="lightbox" onClick={e => { if (e.target === dialogRef.current?.parentElement) onClose(); }}>
      <div className="lightbox__backdrop" onClick={onClose} />
      <div className="lightbox__dialog" ref={dialogRef}>
        <button className="lightbox__close" onClick={onClose} aria-label="Close">&times;</button>
        <div className="lightbox__image-wrap">
          {job.resultUrl ? (
            <div className="lightbox__image" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image src={job.resultUrl} alt={job.prompt.slice(0, 80)} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 80vw" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
            </div>
          ) : (
            <div className="lightbox__placeholder">No image</div>
          )}
        </div>
        <div className="lightbox__meta">
          <p className="lightbox__prompt">{job.prompt}</p>
          <div className="lightbox__tags">
            <span className="lightbox__tag lightbox__tag--tool">{job.tool}</span>
            <span className="lightbox__tag lightbox__tag--provider">{job.provider}</span>
            <span className="lightbox__tag lightbox__tag--mode">{job.mode}</span>
          </div>
          <div className="lightbox__actions">
            <button className="btn btn--ghost btn--sm" onClick={download} disabled={!job.resultUrl}>
              ↓ Download
            </button>
            <button className="btn btn--ghost btn--sm" onClick={copyLink}>
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, string> = {
  generate: '→', comment: '»', export: '↓', member_join: '+',
  brief_update: '»', batch: '□', like: '♥',
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function ActivityFeed({ projectId }: { projectId: string }) {
  const [events, setEvents]     = useState<ActivityEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [cursor, setCursor]     = useState<string | null>(null);
  const [hasMore, setHasMore]   = useState(false);

  const load = useCallback(async (cur?: string) => {
    const url = `/api/projects/${projectId}/activity` + (cur ? `?cursor=${cur}` : '');
    const res = await fetch(url);
    if (res.ok) {
      const d = await res.json();
      setEvents(prev => cur ? [...prev, ...(d.events ?? [])] : (d.events ?? []));
      setCursor(d.nextCursor ?? null);
      setHasMore(d.hasMore ?? false);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="activity-feed activity-feed--loading">Loading activity…</div>;

  if (events.length === 0) return (
    <div className="activity-feed activity-feed--empty">
      <p>No activity yet. Generate your first asset to see it here.</p>
    </div>
  );

  return (
    <div className="activity-feed">
      <ul className="activity-feed__list">
        {events.map(ev => (
          <li key={ev.id} className="activity-feed__item">
            <span className="activity-feed__icon">{ACTIVITY_ICONS[ev.type] ?? '•'}</span>
            <div className="activity-feed__body">
              <span className="activity-feed__message">{ev.message}</span>
              <span className="activity-feed__time">{timeAgo(ev.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
      {hasMore && cursor && (
        <button className="btn btn--ghost btn--sm activity-feed__more" onClick={() => load(cursor)}>
          Load more
        </button>
      )}
    </div>
  );
}

// ─── Comments panel ───────────────────────────────────────────────────────────

function CommentsPanel({ jobId }: { jobId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody]         = useState('');
  const [posting, setPosting]   = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}/comments`);
    if (res.ok) { const d = await res.json(); setComments(d.comments ?? []); }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!body.trim()) return;
    setPosting(true); setError('');
    const res = await fetch(`/api/jobs/${jobId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (res.ok) { setBody(''); await load(); }
    else { const d = await res.json(); setError(d.error ?? 'Failed'); }
    setPosting(false);
  };

  const del = async (id: string) => {
    await fetch(`/api/jobs/${jobId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: id }),
    });
    await load();
  };

  return (
    <div className="comments-panel">
      <h4 className="comments-panel__title">Notes & comments</h4>
      {comments.length === 0 && <p className="comments-panel__empty">No notes yet.</p>}
      <ul className="comments-panel__list">
        {comments.map(c => (
          <li key={c.id} className="comments-panel__item">
            <div className="comments-panel__header">
              <span className="comments-panel__author">{c.author.name ?? c.author.email ?? 'You'}</span>
              <span className="comments-panel__time">{timeAgo(c.createdAt)}</span>
              <button className="comments-panel__del" onClick={() => del(c.id)} title="Delete">&times;</button>
            </div>
            <p className="comments-panel__body">{c.body}</p>
          </li>
        ))}
      </ul>
      <div className="comments-panel__compose">
        <textarea
          className="input comments-panel__textarea"
          rows={2}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a note…"
          maxLength={2000}
        />
        {error && <p className="comments-panel__error">{error}</p>}
        <button className="btn btn--primary btn--sm" onClick={post} disabled={posting || !body.trim()}>
          {posting ? 'Posting…' : 'Post note'}
        </button>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function ProjectDashboard({ projectId, projectName, projectMode, brief: initialBrief }: Props) {
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [relationships, setRels]      = useState<Relationship[]>([]);
  const [brief, setBrief]             = useState<Brief | null>(initialBrief);
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [lightboxJob, setLightboxJob] = useState<Job | null>(null);
  const [showRelPanel, setShowRelPanel] = useState(false);
  const [showBriefPanel, setShowBriefPanel] = useState(!initialBrief);
  const [exporting, setExporting]     = useState(false);
  const [view, setView]               = useState<'grid' | 'relationships' | 'activity'>('grid');
  const [extractingPalette, setExtractingPalette] = useState(false);
  const [extractedPalette, setExtractedPalette]   = useState<{hex:string;name:string;ratio:number}[]|null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/assets`);
    if (res.ok) {
      const d = await res.json();
      setJobs(d.jobs ?? []);
      setRels(d.relationships ?? []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Compute set of job IDs that have at least one relationship
  const linkedIds = new Set<string>();
  for (const r of relationships) {
    linkedIds.add(r.fromJobId);
    linkedIds.add(r.toJobId);
  }

  // When a card is selected, highlight its connected assets
  const highlightedIds = new Set<string>();
  if (selectedId) {
    for (const r of relationships) {
      if (r.fromJobId === selectedId) highlightedIds.add(r.toJobId);
      if (r.toJobId   === selectedId) highlightedIds.add(r.fromJobId);
    }
  }

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setExtractedPalette(null); }
    else { setSelectedId(id); setExtractedPalette(null); }
    setShowRelPanel(false);
  };

  const handleOpenLightbox = (job: Job) => setLightboxJob(job);

  const handleExtractPalette = async (jobId: string) => {
    setExtractingPalette(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/palette`, { method: 'POST' });
      if (res.ok) { const d = await res.json(); setExtractedPalette(d.palette ?? null); }
    } finally { setExtractingPalette(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (!res.ok) { toast.error('Export failed — no assets succeeded yet.'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assets.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const handleExportPdf = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/export/pdf`);
      if (!res.ok) { toast.error('PDF export failed — check that the project has succeeded assets.'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_brand_sheet.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF export failed.');
    }
  };

  const studioUrl = MODE_STUDIOS[projectMode] ?? '/pixel/studio';

  // Relationships for selected asset
  const selectedRels = selectedId
    ? relationships.filter(r => r.fromJobId === selectedId || r.toJobId === selectedId)
    : [];

  const selectedJob = selectedId ? jobs.find(j => j.id === selectedId) : null;

  return (
    <div className="project-dashboard">
      {lightboxJob && <AssetLightbox job={lightboxJob} onClose={() => setLightboxJob(null)} />}

      {/* Header */}
      <div className="project-dashboard__header">
        <div className="project-dashboard__header-left">
          <h1 className="project-dashboard__title">{projectName}</h1>
          <span className="project-dashboard__mode-badge">{projectMode}</span>
        </div>
        <div className="project-dashboard__header-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setShowBriefPanel(v => !v)}
          >
            {showBriefPanel ? 'Hide brief' : brief ? 'Edit brief' : 'Set brief'}
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={handleExport}
            disabled={exporting || jobs.length === 0}
          >
            {exporting ? 'Exporting…' : '↓ Export ZIP'}
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={handleExportPdf}
            disabled={jobs.length === 0}
            title="Export as PDF brand sheet"
          >
            ↓ Brand PDF
          </button>
          <Link href={`${studioUrl}?project=${projectId}`} className="btn btn--primary btn--sm">
            + Generate
          </Link>
        </div>
      </div>

      {/* View toggle */}
      <div className="project-dashboard__tabs">
        <button
          className={`project-tab ${view === 'grid' ? 'project-tab--active' : ''}`}
          onClick={() => setView('grid')}
        >
          Assets ({jobs.length})
        </button>
        <button
          className={`project-tab ${view === 'relationships' ? 'project-tab--active' : ''}`}
          onClick={() => setView('relationships')}
        >
          Relationships ({relationships.length})
        </button>
        <button
          className={`project-tab ${view === 'activity' ? 'project-tab--active' : ''}`}
          onClick={() => setView('activity')}
        >
          Activity
        </button>
      </div>

      <div className="project-dashboard__body">
        {/* Left: main content */}
        <div className="project-dashboard__main">
          {view === 'activity' ? (
            <ActivityFeed projectId={projectId} />
          ) : loading ? (
            <div className="project-skeleton">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton-block skeleton-block--square" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="project-empty">
              <p>No assets yet.</p>
              <Link href={`${studioUrl}?project=${projectId}`} className="btn btn--primary">
                Generate your first asset
              </Link>
            </div>
          ) : view === 'grid' ? (
            <>
              <p className="project-hint">
                Click an asset to see its connections.{' '}
                {selectedId && 'Click "Link asset" to add a relationship.'}
              </p>
              <div className="project-asset-grid">
                {jobs.map(j => (
                  <AssetCard
                    key={j.id}
                    job={j}
                    isSelected={selectedId === j.id}
                    isHighlighted={highlightedIds.has(j.id)}
                    linkedIds={linkedIds}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
              {selectedId && (
                <div className="project-selected-panel">
                  <div className="project-selected-panel__header">
                    <h3>Selected asset</h3>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => selectedJob && handleOpenLightbox(selectedJob)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => { setShowRelPanel(v => !v); }}
                    >
                      Link
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setSelectedId(null)}>&times;</button>
                  </div>
                  {selectedRels.length > 0 && (
                    <div className="project-selected-rels">
                      <span className="project-selected-rels__label">Linked to:</span>
                      {selectedRels.map(r => {
                        const otherId = r.fromJobId === selectedId ? r.toJobId : r.fromJobId;
                        const other   = jobs.find(j => j.id === otherId);
                        return (
                          <span key={r.id} className="rel-chip" style={{ '--rel-color': REL_COLORS[r.type] ?? '#a78bfa' } as React.CSSProperties}>
                            <span className="rel-chip__type">{REL_LABELS[r.type]}</span>
                            {other && <span className="rel-chip__name">{other.prompt.slice(0, 30)}…</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {showRelPanel && (
                    <RelationshipPanel
                      projectId={projectId}
                      fromJobId={selectedId}
                      existingRels={relationships}
                      jobs={jobs}
                      onCreated={load}
                      onClose={() => setShowRelPanel(false)}
                    />
                  )}

                  {/* Style DNA */}
                  <div className="style-dna-panel">
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleExtractPalette(selectedId)}
                      disabled={extractingPalette || !selectedJob?.resultUrl}
                    >
                      {extractingPalette ? 'Extracting…' : 'Extract palette'}
                    </button>
                    {extractedPalette && extractedPalette.length > 0 && (
                      <div className="style-dna-panel__swatches">
                        {extractedPalette.map((c, i) => (
                          <div
                            key={i}
                            className="style-dna-swatch"
                            title={`${c.name} — ${c.hex} (${Math.round(c.ratio * 100)}%)`}
                            style={{ background: c.hex }}
                          />
                        ))}
                        <span className="style-dna-panel__hint">
                          {extractedPalette.map(c => c.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <CommentsPanel jobId={selectedId} />
                </div>
              )}
            </>
          ) : (
            /* Relationships view */
            <div className="project-rel-list">
              {relationships.length === 0 ? (
                <p className="project-hint">No relationships yet. Select an asset to link it to another.</p>
              ) : (
                relationships.map(r => {
                  const from = jobs.find(j => j.id === r.fromJobId);
                  const to   = jobs.find(j => j.id === r.toJobId);
                  return (
                    <div key={r.id} className="project-rel-row">
                      <div className="project-rel-row__asset">
                        {from?.resultUrl && <div className="project-rel-row__thumb" style={{ position: 'relative' }}><Image src={from.resultUrl} alt="" fill className="object-cover" sizes="64px" /></div>}
                        <span className="project-rel-row__prompt">{from?.prompt.slice(0, 40)}…</span>
                      </div>
                      <span
                        className="project-rel-row__type"
                        style={{ color: REL_COLORS[r.type] ?? '#a78bfa' }}
                      >
                        ──{REL_LABELS[r.type]}──▶
                      </span>
                      <div className="project-rel-row__asset">
                        {to?.resultUrl && <div className="project-rel-row__thumb" style={{ position: 'relative' }}><Image src={to.resultUrl} alt="" fill className="object-cover" sizes="64px" /></div>}
                        <span className="project-rel-row__prompt">{to?.prompt.slice(0, 40)}…</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: brief panel */}
        {showBriefPanel && (
          <div className="project-dashboard__sidebar">
            <BriefPanel
              projectId={projectId}
              brief={brief}
              mode={projectMode}
              onSaved={(b) => { setBrief(b); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
