'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/app/_components/EmptyState';

interface Project {
  id: string;
  name: string;
  mode: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { jobs: number };
}

export default function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/projects');
    if (res.ok) {
      const d = await res.json();
      setProjects(d.projects ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="projects-page"><p style={{ color: 'var(--text-muted, #6b7280)', padding: '2rem' }}>Loading…</p></div>;
  }

  return (
    <div className="projects-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#e2e8f0' }}>Projects</h1>
        <Link href="/pixel/studio" style={{ background: '#4f8ef7', color: '#fff', padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
          + New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to organize your generated assets."
          action={{ label: 'Create project', href: '/pixel/studio' }}
        />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {projects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} style={{ display: 'block', background: '#1a1a2e', borderRadius: 8, padding: '1rem', textDecoration: 'none', color: '#e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{p._count.jobs} assets</span>
              </div>
              {p.description && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{p.description}</p>}
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4b5563' }}>{p.mode} · {new Date(p.updatedAt).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
