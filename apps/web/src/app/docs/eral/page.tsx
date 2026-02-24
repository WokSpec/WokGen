import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Eral Docs — AI Assistant & WAP Commands',
  description:
    'Documentation for Eral, the WokGen AI assistant. Learn WAP commands, ' +
    'how to connect Eral to a project, batch generation, and the Director feature.',
};

// ---------------------------------------------------------------------------
// Simple MDX-free docs component helpers (mirrors other docs pages)
// ---------------------------------------------------------------------------

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="docs-h2" style={{ scrollMarginTop: 80 }}>
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="docs-h3" style={{ scrollMarginTop: 80 }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="docs-p">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="docs-code">{children}</code>;
}

function Pre({ children }: { children: React.ReactNode }) {
  return <pre className="docs-pre">{children}</pre>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="docs-ul">{children}</ul>;
}

function LI({ children }: { children: React.ReactNode }) {
  return <li className="docs-li">{children}</li>;
}

function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'tip' | 'warn';
}) {
  const icons = { info: 'i', tip: '→', warn: '!' };
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <span className="docs-callout-icon">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TOC
// ---------------------------------------------------------------------------

const TOC = [
  { id: 'overview',    label: '1. What is Eral?' },
  { id: 'quickstart',  label: '2. Quick Start' },
  { id: 'wap',         label: '3. WAP Commands' },
  { id: 'connect',     label: '4. Connect to a Project' },
  { id: 'batch',       label: '5. Batch Generation' },
  { id: 'director',    label: '6. Director Feature' },
  { id: 'faq',         label: '7. FAQ' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EralDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* Sidebar TOC */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span>WokGen Eral</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/studio" className="btn-primary btn-sm">Open Studio</Link>
          </div>
        </aside>

        {/* Content */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#38bdf8' }} />
              <span>AI Assistant</span>
            </div>
            <h1 className="docs-title">WokGen Eral</h1>
            <p className="docs-subtitle">
              Eral is the WokGen AI chat assistant. Use it to navigate the platform,
              generate assets via natural language, run batch jobs, and orchestrate
              multi-step workflows with the Director feature.
            </p>
          </div>

          {/* 1. Overview */}
          <H2 id="overview">1. What is Eral?</H2>
          <P>
            Eral is a conversational AI layer built on top of WokGen. It understands
            your creative intent and translates it into generation calls, project
            actions, and platform navigation — all from a chat interface.
          </P>
          <P>
            Under the hood Eral is powered by a selectable backend model (Groq / Gemini /
            Mistral) and has full awareness of your current project, selected mode, and
            generation history.
          </P>

          {/* 2. Quick Start */}
          <H2 id="quickstart">2. Quick Start</H2>
          <P>Open the Eral chat panel from any Studio page by clicking the chat icon
          in the top-right corner, then type a command or plain English.</P>
          <Callout type="tip">
            Try: <Code>generate a neon city skyline sprite sheet, 16×16, cyberpunk palette</Code>
          </Callout>
          <P>Eral will confirm the parameters and start generation immediately.</P>

          {/* 3. WAP Commands */}
          <H2 id="wap">3. WAP Commands</H2>
          <P>
            WAP (WokGen Action Protocol) commands are slash-prefixed shortcuts you can
            type directly in the Eral chat input.
          </P>

          <H3>Navigation</H3>
          <UL>
            <LI><Code>/go pixel</Code> — switch to Pixel Studio</LI>
            <LI><Code>/go business</Code> — switch to Business Studio</LI>
            <LI><Code>/go vector</Code> — switch to Vector Studio</LI>
            <LI><Code>/go uiux</Code> — switch to UI/UX Studio</LI>
            <LI><Code>/go docs</Code> — open the Docs Hub</LI>
          </UL>

          <H3>Generation</H3>
          <UL>
            <LI><Code>/generate &lt;prompt&gt;</Code> — generate a single asset with the current mode settings</LI>
            <LI><Code>/generate hd &lt;prompt&gt;</Code> — generate in HD mode (uses credits)</LI>
            <LI><Code>/style &lt;preset&gt;</Code> — change the active style preset, then generate</LI>
            <LI><Code>/negative &lt;terms&gt;</Code> — set negative prompt for the next generation</LI>
          </UL>

          <H3>Batch</H3>
          <UL>
            <LI><Code>/batch &lt;prompt&gt; ×N</Code> — generate N variations (e.g. <Code>/batch robot ×4</Code>)</LI>
            <LI><Code>/batch csv</Code> — upload a CSV of prompts to run as a batch job</LI>
            <LI><Code>/batch status</Code> — check the status of the last batch job</LI>
          </UL>

          <H3>Project</H3>
          <UL>
            <LI><Code>/project new &lt;name&gt;</Code> — create a new project</LI>
            <LI><Code>/project open &lt;name&gt;</Code> — switch to an existing project</LI>
            <LI><Code>/project list</Code> — list all your projects</LI>
            <LI><Code>/project export</Code> — download all assets in the current project as a ZIP</LI>
          </UL>

          <H3>Utility</H3>
          <UL>
            <LI><Code>/help</Code> — show all available WAP commands</LI>
            <LI><Code>/clear</Code> — clear the Eral chat history</LI>
            <LI><Code>/model &lt;name&gt;</Code> — switch the Eral backend model (groq | gemini | mistral)</LI>
          </UL>

          {/* 4. Connect to a Project */}
          <H2 id="connect">4. Connect Eral to a Project</H2>
          <P>
            By default Eral operates in global context. To give it project-specific
            awareness (history, palette, style settings), connect it to a project:
          </P>
          <Pre>{`/project open my-game-assets`}</Pre>
          <P>
            Once connected, Eral will automatically apply the project&apos;s saved style
            preset and palette to every generation, and will store outputs directly into
            the project gallery.
          </P>
          <Callout type="info">
            Project context persists for the duration of your browser session. Refresh
            or use <Code>/project open</Code> to switch.
          </Callout>

          {/* 5. Batch Generation */}
          <H2 id="batch">5. Batch Generation</H2>
          <P>
            Batch mode lets you generate multiple assets from a single command or a
            CSV file of prompts.
          </P>
          <H3>Inline batch</H3>
          <Pre>{`/batch Viking warrior sprite, front view ×6`}</Pre>
          <P>This enqueues 6 parallel generation jobs and streams results back as they complete.</P>

          <H3>CSV batch</H3>
          <P>
            Type <Code>/batch csv</Code> and Eral will prompt you to upload a CSV with
            one prompt per row. Optional columns: <Code>style</Code>, <Code>width</Code>,
            <Code>height</Code>, <Code>negative</Code>.
          </P>
          <Callout type="warn">
            Batch jobs count against your plan&apos;s generation quota. Each row = one
            generation credit.
          </Callout>

          {/* 6. Director Feature */}
          <H2 id="director">6. Director Feature</H2>
          <P>
            Director is an advanced Eral mode that lets you describe a complete asset
            set in plain English and have Eral plan and execute all the individual
            generation steps automatically.
          </P>
          <P>
            Example: <Code>Create a full 8-directional character sprite sheet for a
            fantasy RPG warrior in a dark medieval style</Code>
          </P>
          <P>Eral will:</P>
          <UL>
            <LI>Break the request into individual generation tasks (front, back, left, right, diagonals)</LI>
            <LI>Apply consistent style and palette across all frames</LI>
            <LI>Run the jobs in parallel where possible</LI>
            <LI>Assemble the results into a single downloadable sprite sheet</LI>
          </UL>
          <Callout type="tip">
            Director works best with a connected project — it will use the project&apos;s
            palette and style settings automatically.
          </Callout>
          <P>
            To activate Director explicitly, start your message with{' '}
            <Code>/director</Code> or Eral will auto-detect multi-step requests.
          </P>

          {/* 7. FAQ */}
          <H2 id="faq">7. FAQ</H2>

          <H3>Which AI model does Eral use?</H3>
          <P>
            Eral defaults to the fastest available model for your plan. You can
            switch with <Code>/model groq</Code>, <Code>/model gemini</Code>, or{' '}
            <Code>/model mistral</Code>. All three are free-tier compatible.
          </P>

          <H3>Does Eral store my chat history?</H3>
          <P>
            Chat history is stored in your browser session only. It is not persisted
            to the server. Clearing your browser data will clear Eral&apos;s memory.
          </P>

          <H3>Can I use Eral in self-hosted mode?</H3>
          <P>
            Yes. Set <Code>GROQ_API_KEY</Code>, <Code>GOOGLE_AI_API_KEY</Code>, or{' '}
            <Code>MISTRAL_API_KEY</Code> in your <Code>.env.local</Code> and Eral
            will use whichever key is present. See the{' '}
            <Link href="/docs/api">API docs</Link> for the{' '}
            <Code>/api/eral/chat</Code> endpoint specification.
          </P>

        </main>
      </div>
    </div>
  );
}
