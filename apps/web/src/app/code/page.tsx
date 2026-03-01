import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Code — AI Code & Component Generator',
  description: 'Generate React components, SQL queries, boilerplate, API docs, and code snippets with AI.',
  openGraph: {
    title: 'WokGen Code — AI Code Generator',
    description: 'Generate React components, SQL, docs, and boilerplate with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  { icon: '⚛️', label: 'React Components', desc: 'Copy-paste ready JSX with Tailwind, TypeScript, and accessibility baked in.' },
  { icon: '🗄️', label: 'SQL & Schemas',    desc: 'Generate SQL queries, Prisma schemas, and database migration scripts.' },
  { icon: '📖', label: 'Docs & READMEs',   desc: 'Auto-generate API documentation, READMEs, and technical specifications.' },
  { icon: '⚡', label: 'Boilerplate',       desc: 'Scaffold entire project structures with config, CI, and tooling included.' },
];

const TOOLS = [
  { id: 'component', label: 'Component',  desc: 'Generate a React component with props, types, and Tailwind styling.', example: 'responsive data table with sort and pagination, TypeScript' },
  { id: 'sql',       label: 'SQL',        desc: 'Write SQL queries, stored procedures, and schema migrations.', example: 'user activity analytics query with window functions' },
  { id: 'api',       label: 'API',        desc: 'Generate REST or GraphQL API endpoints with request/response types.', example: 'REST API for user authentication with JWT and refresh tokens' },
  { id: 'docs',      label: 'Docs',       desc: 'Auto-document functions, classes, and APIs in Markdown or JSDoc.', example: 'document this Express middleware with JSDoc and examples' },
  { id: 'scaffold',  label: 'Scaffold',   desc: 'Generate full project scaffolds: Next.js, Express, Python FastAPI, and more.', example: 'Next.js 14 SaaS starter with auth, payments, and dashboard' },
];

const SHOWCASE = [
  { prompt: 'Modal dialog component with React portal, focus trap, and escape key handler', label: 'Modal Component' },
  { prompt: 'PostgreSQL query to find top customers by revenue in last 30 days', label: 'Analytics Query' },
  { prompt: 'Next.js API route for file upload to S3 with presigned URLs', label: 'S3 Upload API' },
  { prompt: 'TypeScript utility types for deep partial and required object transformations', label: 'TypeScript Utils' },
  { prompt: 'Python FastAPI CRUD endpoints for a blog with SQLAlchemy and Pydantic', label: 'FastAPI CRUD' },
  { prompt: 'GitHub Actions workflow for Node.js CI with test, lint, and deploy stages', label: 'CI/CD Workflow' },
];

export default function CodeLanding() {
  return (
    <div className="mode-landing mode-landing--code">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              <span>WokGen Code</span>
            </div>
            <h1 className="landing-h1">
              AI code generation.<br />
              <span className="landing-h1-accent">Production-ready.</span>
            </h1>
            <p className="landing-desc">
              React components, SQL queries, API endpoints, documentation, and full project scaffolds —
              generated with AI and immediately usable in your codebase.
            </p>
            <div className="landing-cta-row">
              <Link href="/code/studio" className="btn-primary btn-lg">Open Code Studio →</Link>
              <Link href="/developers" className="btn-ghost btn-lg">API Docs</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map(f => (
          <div key={f.label} className="landing-feature-card">
            <span className="landing-feature-icon">{f.icon}</span>
            <div>
              <div className="landing-feature-label">{f.label}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-h2">Tools</h2>
          <p className="landing-section-desc">Five code generation tools across components, data, APIs, docs, and scaffolding.</p>
          <div className="landing-tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="landing-tool-card">
                <div className="landing-tool-header"><span className="landing-tool-label">{t.label}</span></div>
                <p className="landing-tool-desc">{t.desc}</p>
                <Link href={`/code/studio?tool=${t.id}&prompt=${encodeURIComponent(t.example)}`} className="landing-tool-example">
                  <span className="landing-tool-example-label">Try:</span>
                  <span className="landing-tool-example-prompt">{t.example}</span>
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <h2 className="landing-h2">What you can make</h2>
          <p className="landing-section-desc">Click any prompt to open it in Code mode.</p>
          <div className="landing-showcase-grid">
            {SHOWCASE.map(s => (
              <Link key={s.label} href={`/code/studio?prompt=${encodeURIComponent(s.prompt)}`} className="landing-showcase-card">
                <div className="landing-showcase-label">{s.label}</div>
                <div className="landing-showcase-prompt">{s.prompt}</div>
                <div className="landing-showcase-cta">Try this →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-wokspec">
        <div className="landing-wokspec-inner">
          <p className="landing-wokspec-text">Need custom software development or full-stack builds? WokSpec delivers.</p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">WokSpec Services →</a>
        </div>
      </section>
    </div>
  );
}
