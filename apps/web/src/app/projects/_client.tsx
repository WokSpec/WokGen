'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EmptyState } from '@/app/_components/EmptyState';
// Inline Search icon since lucide-react is not a dependency
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

interface RecentAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
}

interface Project {
  id: string;
  name: string;
  mode: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { jobs: number };
  recentAssets?: RecentAsset[];
}

const BLUR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export default function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<string>('updated');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? 'Failed to load projects');
        setProjects([]);
      } else {
        const d = await res.json();
        setProjects(d.projects ?? []);
      }
    } catch (e) {
      setError('Network error while loading projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteProject = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        alert(d?.error ?? 'Failed to delete project');
        return;
      }
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Network error');
    }
  }, []);

  const filtered = projects
    .filter(p => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'assets') return b._count.jobs - a._count.jobs;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  if (loading) {
    return <div className="projects-page"><p style={{ color: 'var(--text-muted, #6b7280)', padding: '2rem' }}>Loading…</p></div>;
  }

  return (
    <div className="projects-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Projects</h1>
        <Link href="/projects/new" style={{ background: 'var(--accent)', color: '#fff', padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
          + New project
        </Link>
      </div>

      {/* Search + sort bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text)]/30" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded text-sm text-[var(--text)]/80 placeholder:text-[var(--text)]/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-3 py-2.5 text-sm text-[var(--text)]/60"
        >
          <option value="updated">Last updated</option>
          <option value="name">Name</option>
          <option value="assets">Asset count</option>
        </select>
      </div>

      {error ? (
        <div style={{ color: 'var(--color-danger, #ef4444)', padding: '1rem' }}>Error loading projects: {error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching projects' : 'No projects yet'}
          description={searchQuery ? 'Try a different search.' : 'No projects yet. Create your first project.'}
          action={!searchQuery ? { label: 'Create project', href: '/projects/new' } : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              style={{ background: 'var(--bg-surface, #1a1a2e)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}
            >
              {/* Asset thumbnail preview strip */}
              <div className="grid grid-cols-4 gap-1 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                {[0, 1, 2, 3].map(i => {
                  const asset = p.recentAssets?.[i];
                  return (
                    <div key={i} className="aspect-square bg-white/5 relative overflow-hidden">
                      {asset && (
                        <Image
                          src={asset.thumbUrl ?? asset.imageUrl}
                          alt=""
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card body */}
              <div style={{ padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{p._count.jobs} asset{p._count.jobs !== 1 ? 's' : ''}</span>
                </div>
                {p.description && <p style={{ margin: '0 0 0.5rem', fontSize: 13, color: '#6b7280' }}>{p.description}</p>}
                <p style={{ margin: '0 0 0.75rem', fontSize: 11, color: '#4b5563' }}>{p.mode} · updated {new Date(p.updatedAt).toLocaleDateString()}</p>

                {/* Quick action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link
                    href={`/projects/${p.id}`}
                    style={{ fontSize: 12, background: 'var(--accent)', color: '#fff', padding: '5px 12px', borderRadius: 6, textDecoration: 'none' }}
                  >
                    Open
                  </Link>
                  <Link
                    href={`/library?projectId=${p.id}`}
                    style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '5px 12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Assets
                  </Link>
                  <button
                    onClick={() => deleteProject(p.id, p.name)}
                    style={{ marginLeft: 'auto', fontSize: 12, background: 'transparent', color: 'var(--danger, #ef4444)', border: '1px solid rgba(239,68,68,0.25)', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
