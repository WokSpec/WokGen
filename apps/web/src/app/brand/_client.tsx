'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaletteColor { hex: string; name: string; role: string }
interface BrandKit {
  id: string; name: string; paletteJson: string;
  typography?: string | null; styleGuide?: string | null;
  industry?: string | null; mood?: string | null;
  projectId?: string | null; createdAt: string; updatedAt: string;
}

// ─── Palette editor ───────────────────────────────────────────────────────────

const ROLES = ['primary', 'secondary', 'accent', 'background', 'text', 'border'];

function ColorSwatch({ hex, onChange }: { hex: string; onChange: (h: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="color-swatch-wrap">
      <button type="button"
        className="color-swatch-btn"
        style={{ background: hex, border: '2px solid rgba(255,255,255,0.15)', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', flexShrink: 0 }}
        onClick={() => setOpen(v => !v)}
        title="Pick color"
        aria-label={`Color picker: current color ${hex}`}
      />
      {open && (
        <div className="color-swatch-picker" style={{ position: 'absolute', zIndex: 200, top: 36, left: 0, background: '#1a1a2e', border: '1px solid #303050', borderRadius: 8, padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <HexColorPicker color={hex} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function PaletteEditor({
  colors, onChange,
}: { colors: PaletteColor[]; onChange: (c: PaletteColor[]) => void }) {
  const add = () => onChange([...colors, { hex: '#a78bfa', name: 'New color', role: 'accent' }]);
  const remove = (i: number) => onChange(colors.filter((_, ci) => ci !== i));
  const update = (i: number, field: keyof PaletteColor, value: string) => {
    const next = [...colors];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="palette-editor">
      {colors.map((c, i) => (
        <div key={i} className="palette-editor__row" style={{ position: 'relative' }}>
          <ColorSwatch hex={c.hex} onChange={hex => update(i, 'hex', hex)} />
          <input
            className="input input--sm"
            value={c.hex}
            onChange={e => update(i, 'hex', e.target.value)}
            placeholder="#000000"
            style={{ width: 90 }}
          />
          <input
            className="input input--sm"
            value={c.name}
            onChange={e => update(i, 'name', e.target.value)}
            placeholder="Name"
            style={{ flex: 1 }}
          />
          <select className="input input--sm" value={c.role} onChange={e => update(i, 'role', e.target.value)} style={{ width: 110 }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="button" className="btn btn--ghost btn--sm btn--icon" onClick={() => remove(i)} title="Remove" aria-label="Remove color">×</button>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={add}>+ Add color</button>
    </div>
  );
}

// ─── Kit form ────────────────────────────────────────────────────────────────

interface KitFormProps {
  initial?: BrandKit | null;
  onSaved: (kit: BrandKit) => void;
  onCancel: () => void;
}

function KitForm({ initial, onSaved, onCancel }: KitFormProps) {
  const parsePalette = (kit: BrandKit | null | undefined): PaletteColor[] => {
    if (!kit) return [];
    try { return JSON.parse(kit.paletteJson) || []; } catch { return []; }
  };

  const [name, setName]           = useState(initial?.name ?? '');
  const [industry, setIndustry]   = useState(initial?.industry ?? '');
  const [mood, setMood]           = useState(initial?.mood ?? '');
  const [styleGuide, setStyleGuide] = useState(initial?.styleGuide ?? '');
  const [palette, setPalette]     = useState<PaletteColor[]>(parsePalette(initial));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const save = async () => {
    if (!name.trim()) { setError('Kit name is required.'); return; }
    setSaving(true); setError('');
    const body = { name: name.trim(), paletteJson: palette, industry: industry || null, mood: mood || null, styleGuide: styleGuide || null };
    const url    = initial ? `/api/brand/${initial.id}` : '/api/brand';
    const method = initial ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Failed'); return; }
      onSaved(d.kit);
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="kit-form">
      <h2 className="kit-form__title">{initial ? 'Edit brand kit' : 'New brand kit'}</h2>

      <div className="kit-form__field">
        <label>Kit name *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="My Brand" autoFocus />
      </div>

      <div className="kit-form__field">
        <label>Industry</label>
        <input className="input" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="SaaS, e-commerce, gaming…" />
      </div>

      <div className="kit-form__field">
        <label>Mood / aesthetic</label>
        <input className="input" value={mood} onChange={e => setMood(e.target.value)} placeholder="Minimal, bold, playful, corporate…" />
      </div>

      <div className="kit-form__field">
        <label>Style guide notes</label>
        <textarea className="input" rows={3} value={styleGuide} onChange={e => setStyleGuide(e.target.value)} placeholder="Describe your brand voice, visual direction, usage rules…" />
      </div>

      <div className="kit-form__field">
        <label>Color palette</label>
        <PaletteEditor colors={palette} onChange={setPalette} />
      </div>

      {error && <p className="kit-form__error">{error}</p>}

      <div className="kit-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create kit'}
        </button>
      </div>
    </div>
  );
}

// ─── Kit card ────────────────────────────────────────────────────────────────

function KitCard({ kit, onEdit, onDelete, pendingDeleteId }: {
  kit: BrandKit; onEdit: () => void; onDelete: () => void; pendingDeleteId: string | null;
}) {
  let palette: PaletteColor[] = [];
  try { palette = JSON.parse(kit.paletteJson) || []; } catch {}

  const isPending = pendingDeleteId === kit.id;

  return (
    <div className="brand-kit-card">
      <div className="brand-kit-card__palette">
        {palette.slice(0, 6).map((c, i) => (
          <div key={i} className="brand-kit-card__swatch" style={{ background: c.hex }} title={`${c.name} (${c.role})`} />
        ))}
        {palette.length === 0 && <span className="brand-kit-card__no-palette">No palette</span>}
      </div>
      <div className="brand-kit-card__body">
        <h3 className="brand-kit-card__name">{kit.name}</h3>
        <div className="brand-kit-card__meta">
          {kit.industry && <span className="brand-kit-card__tag">{kit.industry}</span>}
          {kit.mood && <span className="brand-kit-card__tag">{kit.mood}</span>}
        </div>
        {kit.styleGuide && (
          <p className="brand-kit-card__guide">{kit.styleGuide.slice(0, 100)}{kit.styleGuide.length > 100 ? '…' : ''}</p>
        )}
      </div>
      <div className="brand-kit-card__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>Edit</button>
        <button type="button" className={`btn btn--ghost btn--sm btn--danger`} onClick={onDelete} title={isPending ? 'Click again to confirm' : 'Delete brand kit'} style={{ fontWeight: isPending ? 700 : undefined }}>
          {isPending ? 'Confirm?' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrandClient() {
  const [kits, setKits]               = useState<BrandKit[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editKit, setEditKit]         = useState<BrandKit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/brand');
    if (res.ok) { const d = await res.json(); setKits(d.kits ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (kit: BrandKit) => {
    setKits(prev => {
      const idx = prev.findIndex(k => k.id === kit.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = kit; return n; }
      return [kit, ...prev];
    });
    setShowForm(false);
    setEditKit(null);
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    await fetch(`/api/brand/${id}`, { method: 'DELETE' });
    setKits(prev => prev.filter(k => k.id !== id));
  };

  if (showForm || editKit) {
    return (
      <div className="brand-page">
        <KitForm
          initial={editKit}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditKit(null); }}
        />
      </div>
    );
  }

  return (
    <div className="brand-page">
      <div className="brand-page__header">
        <div>
          <h1 className="brand-page__title">Brand Kits</h1>
          <p className="brand-page__sub">Save your palette, mood, and style guide. Apply to any generation.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>+ New kit</button>
      </div>

      {loading ? (
        <div className="brand-skeleton">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton-block" style={{ height: 120 }} />)}
        </div>
      ) : kits.length === 0 ? (
        <div className="brand-empty">
          <p>No brand kits yet. Create one to lock in your visual identity across all generations.</p>
          <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>Create your first kit</button>
        </div>
      ) : (
        <div className="brand-kit-list">
          {kits.map(kit => (
            <KitCard
              key={kit.id}
              kit={kit}
              onEdit={() => { setConfirmDeleteId(null); setEditKit(kit); }}
              onDelete={() => handleDelete(kit.id)}
              pendingDeleteId={confirmDeleteId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
