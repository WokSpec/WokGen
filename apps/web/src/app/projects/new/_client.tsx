'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const USE_CASES = [
  { value: 'pixel',    label: 'Pixel / Illustration' },
  { value: 'business', label: 'Business / Marketing' },
  { value: 'vector',   label: 'Vector / Logo' },
  { value: 'uiux',     label: 'UI/UX Design' },
  { value: 'voice',    label: 'Voice / Audio' },
  { value: 'text',     label: 'Text / Copy' },
] as const;

export default function NewProjectClient({ name, brief }: { name: string; brief: string }) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(name);
  const [projectBrief, setProjectBrief] = useState(brief);
  const [useCase, setUseCase] = useState<string>('pixel');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName.trim(), description: projectBrief.trim(), mode: useCase }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create project');
      const data = await res.json();
      router.push(`/projects/${data.project?.id ?? ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '1.5rem' }}>New Project</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Project name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. Game Kit 2024"
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Use case
          </label>
          <select
            value={useCase}
            onChange={e => setUseCase(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
          >
            {USE_CASES.map(uc => (
              <option key={uc.value} value={uc.value}>{uc.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Brief (optional)
          </label>
          <textarea
            value={projectBrief}
            onChange={e => setProjectBrief(e.target.value)}
            placeholder="Describe the project..."
            rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={loading || !projectName.trim()}
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating…' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/projects')}
            style={{ background: 'transparent', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
