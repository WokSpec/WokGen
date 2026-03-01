import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — WokGen',
  description: 'Version history and release notes for WokGen.',
};

// ── Types ─────────────────────────────────────────────────────────────────

type ChangeType = 'feat' | 'fix' | 'break';
type ReleaseTag = 'major' | 'minor' | 'initial';

interface ChangeEntry { type: ChangeType; text: string; }
interface Release { version: string; date: string; tag: ReleaseTag; changes: ChangeEntry[]; }

// ── Data ──────────────────────────────────────────────────────────────────

const CHANGELOG: Release[] = [
  {
    version: '0.4.0', date: 'March 2026', tag: 'major',
    changes: [
      { type: 'feat', text: 'AI Prompt Lab — multi-mode prompt engineering with Groq/Gemini/Cerebras' },
      { type: 'feat', text: '4× Image Upscaler — Real-ESRGAN via HuggingFace' },
      { type: 'feat', text: 'Image Interrogator — BLIP reverse-prompt engineering' },
      { type: 'feat', text: 'AI Music Generator — Meta MusicGen via HuggingFace' },
      { type: 'feat', text: 'SFX Library — 600K+ CC sounds from Freesound.org' },
      { type: 'feat', text: 'Asset Library — 5M+ CC0 assets from Pixabay' },
      { type: 'feat', text: 'Color Palette Generator — pure-client harmony tool' },
      { type: 'feat', text: 'Floating Prompt FAB on all studio pages' },
      { type: 'feat', text: 'BYOK settings — store personal API keys for 5 free services' },
      { type: 'feat', text: '10 free AI service integrations (Prodia, Cerebras, Gemini, OpenRouter, etc.)' },
    ],
  },
  {
    version: '0.3.0', date: 'February 2026', tag: 'minor',
    changes: [
      { type: 'feat', text: 'New Figma-style shell — 56px icon sidebar + 44px topbar' },
      { type: 'feat', text: 'Unified route architecture — /pixel/studio, /vector/studio, etc.' },
      { type: 'feat', text: 'Per-mode accent color system via CSS variables' },
      { type: 'feat', text: 'Mobile navigation rebuilt with Studios section' },
      { type: 'fix',  text: 'Critical redirect fix: /studio → /pixel/studio (was broken in reverse)' },
      { type: 'fix',  text: 'Standalone output enabled for Render.com deployment' },
    ],
  },
  {
    version: '0.2.0', date: 'January 2026', tag: 'minor',
    changes: [
      { type: 'feat', text: 'Eral AI companion — standalone product integration contract' },
      { type: 'feat', text: 'WAP Protocol — WokGen Action Protocol for Eral communication' },
      { type: 'feat', text: 'Asset purge script — bulk delete S3/CDN assets via CLI' },
      { type: 'feat', text: 'Provider scoring system — quality-aware routing with failure tracking' },
      { type: 'feat', text: 'Prompt intelligence v2 — mode-specific token enrichment' },
    ],
  },
  {
    version: '0.1.0', date: 'December 2025', tag: 'initial',
    changes: [
      { type: 'feat', text: 'Initial release: pixel, vector, UI/UX, voice, business, code studios' },
      { type: 'feat', text: 'Multi-provider routing: Replicate, FAL, Together, HuggingFace, Pollinations' },
      { type: 'feat', text: 'Stripe billing, NextAuth, Prisma/PostgreSQL' },
      { type: 'feat', text: 'Brand kit builder, voice cloning, batch generation' },
    ],
  },
];

// ── Badge styles ──────────────────────────────────────────────────────────

const TAG_STYLES: Record<ReleaseTag, { bg: string; color: string; label: string }> = {
  major:   { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', label: 'Major'   },
  minor:   { bg: 'rgba(99,179,237,0.12)',  color: '#63b3ed', label: 'Minor'   },
  initial: { bg: 'rgba(160,174,192,0.12)', color: '#a0aec0', label: 'Initial' },
};

const TYPE_STYLES: Record<ChangeType, { bg: string; color: string; label: string }> = {
  feat:  { bg: 'var(--accent-subtle)', color: 'var(--accent)',  label: 'feat'  },
  fix:   { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', label: 'fix'   },
  break: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'break' },
};

export default function ChangelogPage() {
  return (
    <div className="changelog-page">
      <div className="changelog-inner">
        <header style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 8px' }}>
            Changelog
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
            Version history and release notes for WokGen.
          </p>
        </header>

        <div className="changelog">
          {CHANGELOG.map((release, idx) => {
            const ts = TAG_STYLES[release.tag];
            return (
              <div key={release.version} className="changelog-entry">
                <div className="changelog-timeline">
                  <div className={`changelog-timeline__dot${idx === 0 ? ' changelog-timeline__dot--current' : ''}`} />
                  {idx < CHANGELOG.length - 1 && <div className="changelog-timeline__line" />}
                </div>
                <div className="changelog-content">
                  <div className="changelog-version">
                    <span className="changelog-version__number">v{release.version}</span>
                    <span className="changelog-version__tag" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                    <span className="changelog-version__date">{release.date}</span>
                  </div>
                  <div className="changelog-changes">
                    {release.changes.map((change, ci) => {
                      const cs = TYPE_STYLES[change.type];
                      return (
                        <div key={ci} className="changelog-change">
                          <span className="change-type" style={{ background: cs.bg, color: cs.color }}>{cs.label}</span>
                          <span className="changelog-change__text">{change.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .changelog-page { min-height: 80vh; padding: 40px 24px 80px; }
        .changelog-inner { max-width: 760px; margin: 0 auto; }
        .changelog { display: flex; flex-direction: column; }
        .changelog-entry { display: flex; gap: 24px; padding-bottom: 40px; }
        .changelog-timeline { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; padding-top: 4px; }
        .changelog-timeline__dot { width: 12px; height: 12px; border-radius: 50%; background: var(--border); border: 2px solid var(--bg); flex-shrink: 0; z-index: 1; }
        .changelog-timeline__dot--current { background: var(--accent); box-shadow: 0 0 8px var(--accent-glow); }
        .changelog-timeline__line { flex: 1; width: 2px; background: var(--border); margin-top: 4px; min-height: 24px; }
        .changelog-content { flex: 1; min-width: 0; }
        .changelog-version { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .changelog-version__number { font-size: 1.125rem; font-weight: 700; color: var(--text); font-family: monospace; }
        .changelog-version__tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: capitalize; letter-spacing: 0.03em; }
        .changelog-version__date { font-size: 13px; color: var(--text-muted); margin-left: auto; }
        .changelog-changes { display: flex; flex-direction: column; gap: 8px; }
        .changelog-change { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.6; }
        .change-type { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; margin-top: 3px; }
        .changelog-change__text { flex: 1; }
      `}</style>
    </div>
  );
}
