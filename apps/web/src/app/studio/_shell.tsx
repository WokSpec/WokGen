'use client';

/**
 * WokGen Unified Studio Shell
 *
 * One studio. All asset types accessible from a single, persistent left rail.
 * Each studio client is loaded on demand — no rewrite of existing studio logic.
 *
 * URL: /studio?type=pixel | vector | uiux | voice | business | code
 *        &projectId=<id> (optional — scopes generation to a project)
 */

import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState, useRef } from 'react';

// ── Studio type definitions ──────────────────────────────────────────────────

const STUDIO_TYPES = [
  { id: 'pixel',    label: 'Pixel',    abbr: 'PX', description: 'Sprites & pixel art' },
  { id: 'vector',   label: 'Vector',   abbr: 'VC', description: 'Icons & illustrations' },
  { id: 'business', label: 'Brand',    abbr: 'BR', description: 'Logos & brand kits' },
  { id: 'uiux',     label: 'UI/UX',    abbr: 'UI', description: 'Components & mockups' },
  { id: 'voice',    label: 'Voice',    abbr: 'VO', description: 'Audio & speech' },
  { id: 'code',     label: 'Code',     abbr: 'CD', description: 'Components & code gen' },
] as const;

type StudioType = (typeof STUDIO_TYPES)[number]['id'];

// ── Lazy-load each studio client ─────────────────────────────────────────────

const PixelClient    = dynamic(() => import('@/app/pixel/studio/_client'),    { ssr: false });
const VectorClient   = dynamic(() => import('@/app/vector/studio/_client'),   { ssr: false });
const BusinessClient = dynamic(() => import('@/app/business/studio/_client'), { ssr: false });
const UIUXClient     = dynamic(() => import('@/app/uiux/studio/_client'),     { ssr: false });
const VoiceClient    = dynamic(() => import('@/app/voice/studio/_client'),    { ssr: false });
const CodeClient     = dynamic(() => import('@/app/studio/code/page'),        { ssr: false });

function StudioContent({ type }: { type: StudioType }) {
  switch (type) {
    case 'pixel':    return <PixelClient />;
    case 'vector':   return <VectorClient />;
    case 'business': return <BusinessClient />;
    case 'uiux':     return <UIUXClient />;
    case 'voice':    return <VoiceClient />;
    case 'code':     return <CodeClient />;
    default:         return <PixelClient />;
  }
}

// ── Project picker ───────────────────────────────────────────────────────────

interface Project { id: string; name: string; mode: string }

function ProjectPicker({ projectId, onSelect }: {
  projectId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch projects when opening
  const handleOpen = async () => {
    setOpen(o => !o);
    if (projects.length === 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/projects?limit=20');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const active = projects.find(p => p.id === projectId);

  return (
    <div ref={ref} className="wok-proj-picker">
      <button type="button"
        className={`wok-proj-trigger${open ? ' --open' : ''}`}
        onClick={handleOpen}
        title={active ? `Project: ${active.name}` : 'No project selected'}
        aria-label="Select project context"
      >
        <span className="wok-proj-trigger__icon">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0" y="0" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="5.5" y="0" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="0" y="5.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="5.5" y="5.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.3"/>
          </svg>
        </span>
        <span className="wok-proj-trigger__label">
          {active ? active.name : 'No project'}
        </span>
        <span className="wok-proj-trigger__caret">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>
      {open && (
        <div className="wok-proj-dropdown">
          <button type="button"
            className={`wok-proj-option${!projectId ? ' --active' : ''}`}
            onClick={() => { onSelect(null); setOpen(false); }}
          >
            <span className="wok-proj-option__dot" />
            No project
          </button>
          {loading ? (
            <div className="wok-proj-loading">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="wok-proj-loading">
              <a href="/projects" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.7rem' }}>
                Create a project →
              </a>
            </div>
          ) : projects.map(p => (
            <button type="button"
              key={p.id}
              className={`wok-proj-option${p.id === projectId ? ' --active' : ''}`}
              onClick={() => { onSelect(p.id); setOpen(false); }}
            >
              <span className="wok-proj-option__dot --filled" />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Unified shell ────────────────────────────────────────────────────────────

interface ProjectContext {
  projectName: string;
  projectType: string | null;
  artStyle: string | null;
  brandName: string | null;
  briefContent: string | null;
  palette: { hex: string; name: string; role: string }[] | null;
  primaryColor: string | null;
}

interface Props {
  type: StudioType;
}

export default function UnifiedStudioClient({ type }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get('projectId');
  const [ctx, setCtx] = useState<ProjectContext | null>(null);

  // Fetch project context when projectId is set
  useEffect(() => {
    if (!projectId) { setCtx(null); return; }
    fetch(`/api/projects/${projectId}/context`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCtx(d as ProjectContext); })
      .catch(() => { /* context fetch failure is non-fatal */ });
  }, [projectId]);

  const navigate = (t: StudioType) => {
    const proj = params.get('projectId');
    router.push(`/studio?type=${t}${proj ? `&projectId=${proj}` : ''}`);
  };

  const setProject = (id: string | null) => {
    router.push(`/studio?type=${type}${id ? `&projectId=${id}` : ''}`);
  };

  return (
    <div className="wok-studio-shell">
      {/* ── Type rail ────────────────────────────────────────────────────── */}
      <nav className="wok-studio-rail" aria-label="Studio type">
        <div className="wok-studio-rail__wordmark" title="WokGen Studio">WG</div>
        <div className="wok-studio-rail__items">
          {STUDIO_TYPES.map(({ id, abbr, label, description }) => (
            <button type="button"
              key={id}
              className={`wok-studio-rail__item${type === id ? ' --active' : ''}`}
              onClick={() => navigate(id)}
              title={`${label} — ${description}`}
              aria-label={label}
              aria-pressed={type === id}
            >
              <span className="wok-studio-rail__abbr">{abbr}</span>
              <span className="wok-studio-rail__label">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Studio content ───────────────────────────────────────────────── */}
      <div className="wok-studio-content">
        {/* Project context bar */}
        <div className="wok-studio-ctx-bar">
          <ProjectPicker projectId={projectId} onSelect={setProject} />
          {ctx && (
            <div className="wok-studio-ctx-meta">
              {ctx.projectName && (
                <span className="wok-studio-ctx-tag">{ctx.projectName}</span>
              )}
              {ctx.primaryColor && (
                <span
                  className="wok-studio-ctx-swatch"
                  title={`Brand color: ${ctx.primaryColor}`}
                  style={{ background: ctx.primaryColor }}
                />
              )}
              {ctx.artStyle && (
                <span className="wok-studio-ctx-tag wok-studio-ctx-tag--faint">{ctx.artStyle}</span>
              )}
            </div>
          )}
          {projectId && (
            <a
              href={`/projects/${projectId}`}
              className="wok-studio-ctx-link"
              title="Open project workspace"
            >
              Open workspace →
            </a>
          )}
        </div>

        <Suspense fallback={
          <div className="wok-studio-loading">
            <div className="wok-studio-loading__spinner" />
          </div>
        }>
          <StudioContent type={type} />
        </Suspense>
      </div>

      <style>{`
        .wok-studio-shell {
          display: flex;
          height: calc(100dvh - var(--nav-height, 56px));
          overflow: hidden;
          background: var(--surface-base, var(--bg));
        }

        /* ── Rail ───────────────────────────────────────────────────────── */
        .wok-studio-rail {
          display: flex;
          flex-direction: column;
          width: 52px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--surface-raised);
          padding: 12px 0;
          gap: 2px;
          overflow: hidden;
        }

        .wok-studio-rail__wordmark {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--border);
          text-align: center;
          padding: 4px 0 12px;
          border-bottom: 1px solid var(--surface-hover);
          margin-bottom: 6px;
        }

        .wok-studio-rail__items {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
        }

        .wok-studio-rail__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          width: 100%;
          padding: 10px 4px;
          background: none;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          transition: background 0.1s, border-color 0.1s, color 0.1s;
          color: var(--text-faint);
        }
        .wok-studio-rail__item:hover {
          background: var(--surface-card);
          color: var(--text-secondary);
        }
        .wok-studio-rail__item.--active {
          background: var(--accent-subtle, var(--accent-subtle));
          border-left-color: var(--accent);
          color: var(--accent);
        }

        .wok-studio-rail__abbr {
          font-family: ui-monospace, monospace;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          line-height: 1;
        }
        .wok-studio-rail__label {
          font-size: 0.48rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          line-height: 1;
          opacity: 0.7;
        }

        /* ── Content ────────────────────────────────────────────────────── */
        .wok-studio-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Context bar */
        .wok-studio-ctx-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 32px;
          padding: 0 12px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--surface-hover);
          flex-shrink: 0;
        }

        .wok-studio-ctx-link {
          font-size: 0.65rem;
          color: var(--text-faint);
          text-decoration: none;
          margin-left: auto;
          transition: color 0.1s;
        }
        .wok-studio-ctx-link:hover { color: var(--accent); }

        .wok-studio-ctx-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .wok-studio-ctx-tag {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          padding: 1px 5px;
          background: var(--surface-raised);
          border-radius: 2px;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wok-studio-ctx-tag--faint { color: var(--text-faint); background: var(--surface-card); }
        .wok-studio-ctx-swatch {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 1px solid var(--border);
        }

        /* Project picker */
        .wok-proj-picker {
          position: relative;
        }

        .wok-proj-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 3px;
          color: var(--text-faint);
          font-size: 0.68rem;
          font-weight: 500;
          transition: background 0.1s, color 0.1s;
        }
        .wok-proj-trigger:hover,
        .wok-proj-trigger.--open {
          background: var(--surface-hover);
          color: var(--text-secondary);
        }

        .wok-proj-trigger__icon { display: flex; align-items: center; }
        .wok-proj-trigger__label { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .wok-proj-trigger__caret { display: flex; align-items: center; opacity: 0.5; }

        .wok-proj-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          z-index: 50;
          min-width: 180px;
          background: var(--bg-surface-2, var(--bg-surface));
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 4px;
          box-shadow: 0 8px 24px var(--overlay-50);
        }

        .wok-proj-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 8px;
          background: none;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: left;
          transition: background 0.1s, color 0.1s;
        }
        .wok-proj-option:hover { background: var(--surface-hover); color: var(--text); }
        .wok-proj-option.--active { color: var(--accent); }

        .wok-proj-option__dot {
          width: 5px; height: 5px;
          border-radius: 9999px;
          border: 1px solid var(--text-faint);
          flex-shrink: 0;
        }
        .wok-proj-option__dot.--filled { background: var(--accent); border-color: var(--accent); }

        .wok-proj-loading {
          padding: 8px;
          font-size: 0.68rem;
          color: var(--text-faint);
          text-align: center;
        }

        /* Loading state */
        .wok-studio-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .wok-studio-loading__spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 9999px;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile ─────────────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .wok-studio-rail {
            width: 40px;
          }
          .wok-studio-rail__label {
            display: none;
          }
          .wok-studio-rail__item {
            padding: 8px 2px;
          }
          .wok-studio-ctx-bar {
            flex-wrap: wrap;
            gap: 4px;
          }
        }

        @media (max-width: 480px) {
          .wok-studio-shell {
            flex-direction: column-reverse;
          }
          .wok-studio-rail {
            width: 100%;
            flex-direction: row;
            height: 48px;
            padding: 0;
            border-right: none;
            border-top: 1px solid var(--surface-raised);
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
          }
          .wok-studio-rail::-webkit-scrollbar { display: none; }
          .wok-studio-rail__wordmark {
            display: none;
          }
          .wok-studio-rail__items {
            flex-direction: row;
            flex: 1;
          }
          .wok-studio-rail__item {
            flex: 1;
            padding: 6px 4px;
            border-left: none;
            border-top: 2px solid transparent;
            min-width: 48px;
          }
          .wok-studio-rail__item.--active {
            border-left-color: transparent;
            border-top-color: var(--accent);
          }
          .wok-studio-rail__label {
            display: block;
            font-size: 0.44rem;
          }
        }
      `}</style>
    </div>
  );
}

