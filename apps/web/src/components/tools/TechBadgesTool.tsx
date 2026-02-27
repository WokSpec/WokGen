'use client';

import { useState, useMemo } from 'react';

const TECH_LIST = [
  // Languages
  { id: 'typescript', label: 'TypeScript', color: '3178C6', logo: 'typescript' },
  { id: 'javascript', label: 'JavaScript', color: 'F7DF1E', logo: 'javascript', logoColor: 'black' },
  { id: 'python',     label: 'Python',     color: '3776AB', logo: 'python' },
  { id: 'rust',       label: 'Rust',       color: '000000', logo: 'rust' },
  { id: 'go',         label: 'Go',         color: '00ADD8', logo: 'go' },
  { id: 'java',       label: 'Java',       color: 'ED8B00', logo: 'openjdk' },
  { id: 'csharp',     label: 'C#',         color: '512BD4', logo: 'csharp' },
  { id: 'cpp',        label: 'C++',        color: '00599C', logo: 'cplusplus' },
  // Frameworks
  { id: 'react',      label: 'React',      color: '61DAFB', logo: 'react',      logoColor: 'black' },
  { id: 'nextjs',     label: 'Next.js',    color: '000000', logo: 'nextdotjs' },
  { id: 'vue',        label: 'Vue.js',     color: '4FC08D', logo: 'vuedotjs',   logoColor: 'white' },
  { id: 'svelte',     label: 'Svelte',     color: 'FF3E00', logo: 'svelte' },
  { id: 'angular',    label: 'Angular',    color: 'DD0031', logo: 'angular' },
  { id: 'nuxt',       label: 'Nuxt',       color: '00DC82', logo: 'nuxtdotjs',  logoColor: 'white' },
  { id: 'astro',      label: 'Astro',      color: 'BC52EE', logo: 'astro' },
  { id: 'remix',      label: 'Remix',      color: '000000', logo: 'remix' },
  { id: 'express',    label: 'Express',    color: '000000', logo: 'express' },
  { id: 'fastapi',    label: 'FastAPI',    color: '009688', logo: 'fastapi' },
  { id: 'django',     label: 'Django',     color: '092E20', logo: 'django' },
  { id: 'nestjs',     label: 'NestJS',     color: 'E0234E', logo: 'nestjs' },
  // Databases
  { id: 'postgresql', label: 'PostgreSQL', color: '4169E1', logo: 'postgresql' },
  { id: 'mysql',      label: 'MySQL',      color: '4479A1', logo: 'mysql' },
  { id: 'mongodb',    label: 'MongoDB',    color: '47A248', logo: 'mongodb' },
  { id: 'redis',      label: 'Redis',      color: 'DC382D', logo: 'redis' },
  { id: 'sqlite',     label: 'SQLite',     color: '003B57', logo: 'sqlite' },
  { id: 'supabase',   label: 'Supabase',   color: '3ECF8E', logo: 'supabase',   logoColor: 'white' },
  { id: 'planetscale',label: 'PlanetScale',color: '000000', logo: 'planetscale' },
  // Tools
  { id: 'docker',     label: 'Docker',     color: '2496ED', logo: 'docker' },
  { id: 'kubernetes', label: 'Kubernetes', color: '326CE5', logo: 'kubernetes' },
  { id: 'prisma',     label: 'Prisma',     color: '2D3748', logo: 'prisma' },
  { id: 'tailwind',   label: 'Tailwind CSS', color: '38BDF8', logo: 'tailwindcss', logoColor: 'white' },
  { id: 'graphql',    label: 'GraphQL',    color: 'E10098', logo: 'graphql' },
  { id: 'trpc',       label: 'tRPC',       color: '2596BE', logo: 'trpc' },
  { id: 'vercel',     label: 'Vercel',     color: '000000', logo: 'vercel' },
  { id: 'aws',        label: 'AWS',        color: 'FF9900', logo: 'amazonaws',  logoColor: 'white' },
  { id: 'gcp',        label: 'GCP',        color: '4285F4', logo: 'googlecloud' },
  { id: 'stripe',     label: 'Stripe',     color: '008CDD', logo: 'stripe' },
  { id: 'github',     label: 'GitHub',     color: '181717', logo: 'github' },
  { id: 'linux',      label: 'Linux',      color: 'FCC624', logo: 'linux',      logoColor: 'black' },
];

function badgeUrl(tech: typeof TECH_LIST[0]) {
  const logoColor = tech.logoColor ?? 'white';
  return `https://img.shields.io/badge/${encodeURIComponent(tech.label)}-${tech.color}?style=flat-square&logo=${tech.logo}&logoColor=${logoColor}`;
}

function markdownBadge(tech: typeof TECH_LIST[0]) {
  return `![${tech.label}](${badgeUrl(tech)})`;
}

export default function TechBadgesTool() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() =>
    search ? TECH_LIST.filter(t => t.label.toLowerCase().includes(search.toLowerCase())) : TECH_LIST,
    [search]
  );

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedTechs = TECH_LIST.filter(t => selected.includes(t.id));
  const markdown = selectedTechs.map(markdownBadge).join(' ');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="badge-tool">
      {/* Search */}
      <input
        className="tool-input"
        placeholder="Search techs..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Badge grid */}
      <div className="badge-tool__grid">
        {filtered.map(tech => (
          <button
            key={tech.id}
            onClick={() => toggle(tech.id)}
            className={`badge-tool__item ${selected.includes(tech.id) ? 'badge-tool__item--selected' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl(tech)} alt={tech.label} className="badge-tool__img" />
          </button>
        ))}
      </div>

      {/* Output */}
      {selected.length > 0 && (
        <div className="badge-tool__output">
          <div className="badge-tool__output-header">
            <span className="badge-tool__output-label">Preview — {selected.length} badge{selected.length !== 1 ? 's' : ''}</span>
            <button className="btn-ghost" onClick={copy} style={{ fontSize: 12 }}>{copied ? 'Copied!' : 'Copy Markdown'}</button>
            <button className="btn-ghost" onClick={() => setSelected([])} style={{ fontSize: 12 }}>Clear</button>
          </div>
          <div className="badge-tool__preview">
            {selectedTechs.map(t => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={t.id} src={badgeUrl(t)} alt={t.label} className="badge-tool__preview-img" />
            ))}
          </div>
          <pre className="badge-tool__markdown">{markdown}</pre>
        </div>
      )}

      <style>{`
        .badge-tool { display: flex; flex-direction: column; gap: 16px; }
        .badge-tool__grid {
          display: flex; flex-wrap: wrap; gap: 6px;
          padding: 14px; background: var(--bg-surface);
          border: 1px solid var(--surface-border); border-radius: 8px;
          max-height: 280px; overflow-y: auto;
        }
        .badge-tool__item {
          background: transparent; border: 2px solid transparent;
          border-radius: 5px; padding: 3px; cursor: pointer;
          transition: border-color 0.12s, background 0.12s;
        }
        .badge-tool__item:hover { background: var(--surface-hover); }
        .badge-tool__item--selected { border-color: var(--accent); background: var(--accent-subtle); }
        .badge-tool__img { display: block; height: 20px; }
        .badge-tool__output { display: flex; flex-direction: column; gap: 10px; }
        .badge-tool__output-header { display: flex; align-items: center; gap: 10px; }
        .badge-tool__output-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .badge-tool__preview { display: flex; flex-wrap: wrap; gap: 5px; padding: 10px; background: var(--bg-surface); border: 1px solid var(--surface-border); border-radius: 6px; }
        .badge-tool__preview-img { height: 20px; }
        .badge-tool__markdown {
          padding: 12px; font-size: 11px; font-family: 'Menlo','Consolas',monospace;
          background: var(--bg); border: 1px solid var(--surface-border); border-radius: 6px;
          color: var(--text-secondary); white-space: pre-wrap; word-break: break-all; margin: 0;
        }
      `}</style>
    </div>
  );
}
