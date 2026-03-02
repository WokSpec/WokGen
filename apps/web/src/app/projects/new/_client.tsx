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
    <div className="proj-n-container">
      <h1 className="proj-n-title">New Project</h1>
      <form onSubmit={handleSubmit} className="proj-n-form">
        <div>
          <label className="proj-n-label">
            Project name <span className="proj-n-required">*</span>
          </label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. Game Kit 2024"
            required
            className="proj-n-field-input"
          />
        </div>
        <div>
          <label className="proj-n-label">
            Use case
          </label>
          <select
            value={useCase}
            onChange={e => setUseCase(e.target.value)}
            className="proj-n-field-input"
          >
            {USE_CASES.map(uc => (
              <option key={uc.value} value={uc.value}>{uc.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="proj-n-label">
            Brief (optional)
          </label>
          <textarea
            value={projectBrief}
            onChange={e => setProjectBrief(e.target.value)}
            placeholder="Describe the project..."
            rows={3}
            className="proj-n-textarea"
          />
        </div>
        {error && <p className="proj-n-error">{error}</p>}
        <div className="proj-n-actions">
          <button
            type="submit"
            disabled={loading || !projectName.trim()}
            className="proj-n-btn-submit" style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating…' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/projects')}
            className="proj-n-btn-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
