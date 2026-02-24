'use client';

import { useState } from 'react';

interface ReadmeFields {
  name: string;
  description: string;
  demo: string;
  features: string;
  techStack: string;
  install: string;
  usage: string;
  contributing: boolean;
  license: string;
}

const DEFAULT: ReadmeFields = {
  name: '',
  description: '',
  demo: '',
  features: '',
  techStack: '',
  install: '',
  usage: '',
  contributing: true,
  license: 'MIT',
};

function buildReadme(f: ReadmeFields): string {
  const lines: string[] = [];

  lines.push(`# ${f.name || 'Project Name'}`);
  lines.push('');
  if (f.description) {
    lines.push(f.description);
    lines.push('');
  }
  if (f.demo) {
    lines.push(`**Live demo:** [${f.demo}](${f.demo})`);
    lines.push('');
  }
  if (f.features) {
    lines.push('## Features');
    lines.push('');
    const items = f.features.split('\n').filter(Boolean);
    items.forEach(item => lines.push(`- ${item.replace(/^-\s*/, '')}`));
    lines.push('');
  }
  if (f.techStack) {
    lines.push('## Built With');
    lines.push('');
    const techs = f.techStack.split(',').map(t => t.trim()).filter(Boolean);
    techs.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }
  lines.push('## Getting Started');
  lines.push('');
  lines.push('### Installation');
  lines.push('');
  if (f.install) {
    lines.push('```bash');
    lines.push(f.install);
    lines.push('```');
  } else {
    lines.push('```bash');
    lines.push(`git clone https://github.com/your-org/${f.name || 'project-name'}`);
    lines.push(`cd ${f.name || 'project-name'}`);
    lines.push('npm install');
    lines.push('```');
  }
  lines.push('');
  if (f.usage) {
    lines.push('### Usage');
    lines.push('');
    lines.push('```bash');
    lines.push(f.usage);
    lines.push('```');
    lines.push('');
  }
  if (f.contributing) {
    lines.push('## Contributing');
    lines.push('');
    lines.push('Contributions are welcome. Please open an issue first to discuss what you would like to change.');
    lines.push('');
    lines.push('1. Fork the repository');
    lines.push('2. Create your feature branch (`git checkout -b feature/amazing-feature`)');
    lines.push('3. Commit your changes (`git commit -m "feat: add amazing feature"`)');
    lines.push('4. Push to the branch (`git push origin feature/amazing-feature`)');
    lines.push('5. Open a Pull Request');
    lines.push('');
  }
  if (f.license) {
    lines.push('## License');
    lines.push('');
    lines.push(`Distributed under the ${f.license} License.`);
  }

  return lines.join('\n');
}

export default function ReadmeGeneratorTool() {
  const [fields, setFields] = useState<ReadmeFields>(DEFAULT);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof ReadmeFields, v: string | boolean) =>
    setFields(prev => ({ ...prev, [k]: v }));

  const output = buildReadme(fields);

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'README.md';
    a.click();
  };

  return (
    <div className="readme-gen">
      <div className="readme-gen__split">
        {/* Form */}
        <div className="readme-gen__form">
          <div className="readme-gen__field">
            <label className="tool-label">Project Name</label>
            <input className="tool-input" value={fields.name} onChange={e => set('name', e.target.value)} placeholder="my-awesome-project" />
          </div>
          <div className="readme-gen__field">
            <label className="tool-label">Short Description</label>
            <textarea className="tool-textarea" rows={2} value={fields.description} onChange={e => set('description', e.target.value)} placeholder="A brief description of what this project does." />
          </div>
          <div className="readme-gen__field">
            <label className="tool-label">Demo URL</label>
            <input className="tool-input" value={fields.demo} onChange={e => set('demo', e.target.value)} placeholder="https://demo.example.com" />
          </div>
          <div className="readme-gen__field">
            <label className="tool-label">Features (one per line)</label>
            <textarea className="tool-textarea" rows={4} value={fields.features} onChange={e => set('features', e.target.value)} placeholder={"Fast and lightweight\nZero dependencies\nTypeScript support"} />
          </div>
          <div className="readme-gen__field">
            <label className="tool-label">Tech Stack (comma-separated)</label>
            <input className="tool-input" value={fields.techStack} onChange={e => set('techStack', e.target.value)} placeholder="Next.js, TypeScript, Prisma, PostgreSQL" />
          </div>
          <div className="readme-gen__field">
            <label className="tool-label">Install commands</label>
            <textarea className="tool-textarea" rows={3} value={fields.install} onChange={e => set('install', e.target.value)} placeholder={"git clone ...\nnpm install\nnpm run dev"} />
          </div>
          <div className="readme-gen__field">
            <label className="tool-label">Usage example</label>
            <textarea className="tool-textarea" rows={2} value={fields.usage} onChange={e => set('usage', e.target.value)} placeholder="npm run build" />
          </div>
          <div className="readme-gen__field readme-gen__inline">
            <label className="tool-label">License</label>
            <select className="tool-select" value={fields.license} onChange={e => set('license', e.target.value)}>
              {['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'Unlicense'].map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <label className="readme-gen__check">
              <input type="checkbox" checked={fields.contributing} onChange={e => set('contributing', e.target.checked)} />
              Contributing section
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="readme-gen__preview">
          <div className="readme-gen__preview-header">
            <span className="readme-gen__preview-title">README.md preview</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={copy} style={{ fontSize: 12 }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-primary" onClick={download} style={{ fontSize: 12 }}>
                ↓ Download
              </button>
            </div>
          </div>
          <pre className="readme-gen__output">{output}</pre>
        </div>
      </div>

      <style>{`
        .readme-gen { padding: 0; }
        .readme-gen__split { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) { .readme-gen__split { grid-template-columns: 1fr; } }
        .readme-gen__form { display: flex; flex-direction: column; gap: 14px; }
        .readme-gen__field { display: flex; flex-direction: column; gap: 5px; }
        .readme-gen__inline { flex-direction: row; align-items: center; gap: 12px; flex-wrap: wrap; }
        .tool-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
        .tool-input, .tool-select {
          padding: 7px 10px; font-size: 13px;
          background: var(--bg); color: var(--text);
          border: 1px solid var(--surface-border); border-radius: 6px;
          outline: none; width: 100%;
        }
        .tool-input:focus, .tool-select:focus { border-color: #818cf8; }
        .tool-textarea {
          padding: 7px 10px; font-size: 12px; line-height: 1.5;
          background: var(--bg); color: var(--text);
          border: 1px solid var(--surface-border); border-radius: 6px;
          outline: none; resize: vertical; font-family: inherit; width: 100%;
        }
        .tool-textarea:focus { border-color: #818cf8; }
        .readme-gen__check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); cursor: pointer; white-space: nowrap; }
        .readme-gen__preview { display: flex; flex-direction: column; }
        .readme-gen__preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .readme-gen__preview-title { font-size: 12px; font-weight: 500; color: var(--text-muted); }
        .readme-gen__output {
          flex: 1; padding: 14px; font-size: 11.5px; line-height: 1.6;
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 6px; overflow: auto; white-space: pre-wrap;
          color: var(--text-secondary); font-family: 'Menlo', 'Consolas', monospace;
          max-height: 600px;
        }
      `}</style>
    </div>
  );
}
