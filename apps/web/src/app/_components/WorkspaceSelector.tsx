'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface WorkspaceItem {
  id: string;
  name: string;
  mode: string;
  jobCount: number;
}

interface WorkspaceSelectorProps {
  mode: string;
  activeWorkspaceId: string | null;
  onChange: (id: string | null) => void;
}

const LS_KEY = (mode: string) => `wokgen:workspace:${mode}`;

export default function WorkspaceSelector({ mode, activeWorkspaceId, onChange }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [isOpen,     setIsOpen]     = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal,  setRenameVal]  = useState('');
  const [deleteConf, setDeleteConf] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const renameRef   = useRef<HTMLInputElement>(null);

  const activeName = workspaces.find(w => w.id === activeWorkspaceId)?.name ?? null;

  // ── Fetch workspaces on mount ────────────────────────────────────────────
  const fetchWorkspaces = useCallback(async () => {
    try {
      const res  = await fetch(`/api/workspaces?mode=${mode}`);
      const data = await res.json();
      if (res.ok) {
        setWorkspaces(data.workspaces ?? []);
        // Restore from localStorage — verify it still exists
        const stored = localStorage.getItem(LS_KEY(mode));
        if (stored && data.workspaces?.some((w: WorkspaceItem) => w.id === stored)) {
          // Already active — no-op (parent controls this)
        } else if (stored) {
          // Stale — clear it
          localStorage.removeItem(LS_KEY(mode));
          onChange(null);
        }
      }
    } catch {
      // Non-fatal: workspace list just won't show
    }
  }, [mode, onChange]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  // ── Click-outside close ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setDeleteConf(null);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // ── Auto-focus new-name input ────────────────────────────────────────────
  useEffect(() => {
    if (isCreating) setTimeout(() => newInputRef.current?.focus(), 50);
  }, [isCreating]);

  // ── Auto-focus rename input ──────────────────────────────────────────────
  useEffect(() => {
    if (renamingId) setTimeout(() => renameRef.current?.focus(), 50);
  }, [renamingId]);

  // ── Create workspace ─────────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res  = await fetch('/api/workspaces', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName.trim(), mode }),
      });
      const data = await res.json();
      if (res.ok) {
        const ws: WorkspaceItem = data.workspace;
        setWorkspaces(prev => [ws, ...prev]);
        localStorage.setItem(LS_KEY(mode), ws.id);
        onChange(ws.id);
        setNewName('');
        setIsCreating(false);
        setIsOpen(false);
      } else {
        setError(data.error ?? 'Failed to create workspace');
      }
    } finally {
      setCreating(false);
    }
  }

  // ── Rename workspace ─────────────────────────────────────────────────────
  async function handleRename(id: string) {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    try {
      const res  = await fetch(`/api/workspaces/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: renameVal.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: data.workspace.name } : w));
      }
    } finally {
      setRenamingId(null);
    }
  }

  // ── Delete workspace ─────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      if (activeWorkspaceId === id) {
        localStorage.removeItem(LS_KEY(mode));
        onChange(null);
      }
    } finally {
      setDeleteConf(null);
    }
  }

  // ── Select workspace ─────────────────────────────────────────────────────
  function handleSelect(id: string | null) {
    if (id) localStorage.setItem(LS_KEY(mode), id);
    else    localStorage.removeItem(LS_KEY(mode));
    onChange(id);
    setIsOpen(false);
  }

  return (
    <div
      ref={dropRef}
      style={{ position: 'relative', marginBottom: '0.75rem' }}
    >
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.6rem',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-muted, #4c1d95)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--surface-border)')}
      >
        <span style={{ fontSize: 10, opacity: 0.6 }}>⊡</span>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeName ?? 'All Generations'}
        </span>
        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--surface-overlay, #161616)',
            border: '1px solid var(--surface-border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {/* All generations option */}
          <button
            onClick={() => handleSelect(null)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: activeWorkspaceId === null ? 'var(--accent-dim, rgba(109,40,217,0.15))' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78rem',
              color: activeWorkspaceId === null ? 'var(--accent)' : 'var(--text-muted)',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (activeWorkspaceId !== null) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (activeWorkspaceId !== null) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 10, opacity: 0.5 }}>∞</span>
            <span style={{ flex: 1 }}>All Generations</span>
            {activeWorkspaceId === null && <span style={{ fontSize: 10 }}>{'\u2713'}</span>}
          </button>

          {/* Workspace list */}
          {workspaces.length > 0 && (
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.25rem' }}>
              {workspaces.map(ws => (
                <div key={ws.id} style={{ position: 'relative' }}>
                  {renamingId === ws.id ? (
                    <div style={{ padding: '0.35rem 0.75rem', display: 'flex', gap: '0.35rem' }}>
                      <input
                        ref={renameRef}
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(ws.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => handleRename(ws.id)}
                        maxLength={40}
                        style={{
                          flex: 1,
                          background: 'var(--surface-overlay)',
                          border: '1px solid var(--accent-muted, #4c1d95)',
                          borderRadius: 4,
                          padding: '0.2rem 0.4rem',
                          color: 'var(--text)',
                          fontSize: '0.78rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ) : deleteConf === ws.id ? (
                    <div style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239,68,68,0.08)' }}>
                      <span style={{ flex: 1, fontSize: '0.72rem', color: '#fca5a5' }}>Delete "{ws.name}"?</span>
                      <button
                        onClick={() => handleDelete(ws.id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 8px', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConf(null)}
                        style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--surface-border)', borderRadius: 3, padding: '2px 6px', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      role="group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 0.75rem',
                        background: activeWorkspaceId === ws.id ? 'var(--accent-dim, rgba(109,40,217,0.15))' : 'transparent',
                      }}
                      onMouseEnter={e => { if (activeWorkspaceId !== ws.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (activeWorkspaceId !== ws.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <button
                        onClick={() => handleSelect(ws.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          color: activeWorkspaceId === ws.id ? 'var(--accent)' : 'var(--text-muted)',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 10, opacity: 0.5 }}>⊡</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-faint, #555)', marginLeft: 'auto', paddingLeft: '0.5rem' }}>{ws.jobCount}</span>
                        {activeWorkspaceId === ws.id && <span style={{ fontSize: 10, marginLeft: '0.25rem' }}>{'\u2713'}</span>}
                      </button>
                      {/* Rename + delete icons on hover */}
                      <span
                        className="ws-action-icons"
                        style={{ display: 'flex', gap: '0.1rem', marginLeft: '0.25rem', opacity: 0, transition: 'opacity 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <button
                          onClick={() => { setRenamingId(ws.id); setRenameVal(ws.name); }}
                          title="Rename"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-faint, #555)', cursor: 'pointer', padding: '2px 4px', fontSize: 11, borderRadius: 3 }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint, #555)')}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConf(ws.id)}
                          title="Delete workspace"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-faint, #555)', cursor: 'pointer', padding: '2px 4px', fontSize: 11, borderRadius: 3 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint, #555)')}
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create workspace */}
          <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
            {error && (
              <p style={{ fontSize: '0.68rem', color: '#fca5a5', padding: '0.25rem 0.75rem', margin: 0 }}>{error}</p>
            )}
            {isCreating ? (
              <div style={{ padding: '0.35rem 0.75rem', display: 'flex', gap: '0.35rem' }}>
                <input
                  ref={newInputRef}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') { setIsCreating(false); setNewName(''); setError(null); }
                  }}
                  maxLength={40}
                  placeholder="Workspace name…"
                  disabled={creating}
                  style={{
                    flex: 1,
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--accent-muted, #4c1d95)',
                    borderRadius: 4,
                    padding: '0.2rem 0.4rem',
                    color: 'var(--text)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.72rem',
                    cursor: creating ? 'wait' : 'pointer',
                    fontWeight: 600,
                    opacity: (!newName.trim() || creating) ? 0.5 : 1,
                  }}
                >
                  {creating ? '…' : 'OK'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsCreating(true); setError(null); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  color: 'var(--text-faint, #555)',
                  textAlign: 'left',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint, #555)')}
              >
                <span style={{ fontSize: 12, fontWeight: 300 }}>+</span>
                New workspace
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hover fix: show action icons on row hover */}
      <style>{`
        [role="group"]:hover .ws-action-icons { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
