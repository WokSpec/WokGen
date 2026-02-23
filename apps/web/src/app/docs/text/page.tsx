import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Text Docs — AI Copywriting Studio',
  description:
    'Complete user documentation for WokGen Text. Learn to generate headlines, blog posts, ' +
    'product descriptions, email copy, social posts, code snippets, stories, essays, and ads.',
};

// ---------------------------------------------------------------------------
// Docs component helpers (mirror pixel/page.tsx pattern)
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
  const icons = { info: 'ℹ', tip: '✦', warn: '⚠' };
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
  { id: 'overview',        label: '1. Overview' },
  { id: 'content-types',   label: '2. Content Types' },
  { id: 'tone',            label: '3. Tone Settings' },
  { id: 'length',          label: '4. Length Control' },
  { id: 'prompting',       label: '5. Prompting Guide' },
  { id: 'downloading',     label: '6. Downloading' },
  { id: 'gallery',         label: '7. Saving to Gallery' },
  { id: 'rate-limits',     label: '8. Rate Limits' },
  { id: 'ai-models',       label: '9. AI Models' },
  { id: 'best-practices',  label: '10. Best Practices' },
  { id: 'example-prompts', label: '11. Example Prompts' },
];

export default function TextDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar TOC                                                       */}
        {/* ---------------------------------------------------------------- */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span style={{ color: '#10b981' }}>✍️</span>
            <span>WokGen Text</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/text/studio" className="btn-primary btn-sm">Open Text Studio</Link>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#10b981' }} />
              WokGen Text
            </div>
            <h1 className="docs-title">Text Documentation</h1>
            <p className="docs-subtitle">
              Complete guide to WokGen&apos;s AI copywriting engine — headlines, blog posts,
              product descriptions, social copy, code, stories, and more.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 1. OVERVIEW                                                      */}
          {/* ============================================================== */}
          <H2 id="overview">1. Overview</H2>

          <P>
            <strong>WokGen Text</strong> is an AI copywriting engine powered by Eral 7c (Llama 3.3 70B).
            It covers ten distinct content types — from punchy marketing headlines to long-form essays —
            with tone controls and length presets that let you dial in exactly the copy you need.
          </P>

          <H3>Who it&apos;s for</H3>
          <UL>
            <LI><strong>Marketers</strong> — ad copy, landing page headlines, email subject lines.</LI>
            <LI><strong>Developers</strong> — code snippets, technical documentation stubs, README sections.</LI>
            <LI><strong>Content creators</strong> — blog posts, social captions, newsletter intros.</LI>
            <LI><strong>Product teams</strong> — product descriptions, feature taglines, onboarding copy.</LI>
            <LI><strong>Writers</strong> — story starters, essay outlines, creative writing prompts expanded into full drafts.</LI>
          </UL>

          <Callout type="tip">
            WokGen Text is in <strong>Beta</strong>. Model improvements and new content types are
            being added regularly.
          </Callout>

          {/* ============================================================== */}
          {/* 2. CONTENT TYPES                                                 */}
          {/* ============================================================== */}
          <H2 id="content-types">2. Content Types</H2>

          <P>
            WokGen Text supports ten content types. Each type primes the model with a different
            structural and tonal objective.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>What it generates</th>
                  <th>Typical length</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Headline',             'Attention-grabbing title for an article, ad, or landing page', 'Single line'],
                  ['Tagline',              'Short brand statement or product slogan', '5–15 words'],
                  ['Blog Post',            'Full structured article with intro, body sections, and conclusion', '200–1 000 words'],
                  ['Product Description',  'Benefit-led product copy for e-commerce or SaaS', '50–300 words'],
                  ['Email',                'Subject line + email body for marketing, cold outreach, or transactional messages', '100–400 words'],
                  ['Social Post',          'Platform-optimised caption for Twitter/X, LinkedIn, Instagram, or TikTok', '20–280 chars'],
                  ['Code Snippet',         'Functional code sample in any language, with inline comments', 'Varies'],
                  ['Story',                'Short-form narrative or scene with characters and arc', '100–800 words'],
                  ['Essay',                'Structured argument or analytical piece with thesis and evidence', '300–1 000 words'],
                  ['Ad Copy',              'CTA-driven copy for display, search, or social ads', '25–150 words'],
                ].map(([type, what, len]) => (
                  <tr key={type}>
                    <td><strong>{type}</strong></td>
                    <td>{what}</td>
                    <td>{len}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Selecting a content type</H3>
          <P>
            Choose the content type that matches your <em>output goal</em>, not your prompt. For example,
            if you want a short punchy sentence that sums up your product, choose <strong>Tagline</strong>
            even if your prompt is a paragraph of context. The model uses the content type to set its
            output structure.
          </P>

          {/* ============================================================== */}
          {/* 3. TONE SETTINGS                                                 */}
          {/* ============================================================== */}
          <H2 id="tone">3. Tone Settings</H2>

          <P>
            Tone shapes the voice and register of the generated copy. The same prompt with different
            tones produces meaningfully different output.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Tone</th>
                  <th>Description</th>
                  <th>Example output excerpt</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Professional', 'Formal, polished, business-appropriate',         '"Our platform delivers enterprise-grade performance at scale."'],
                  ['Casual',       'Conversational, friendly, approachable',          '"Hey — we built this so you don\'t have to stress about it."'],
                  ['Creative',     'Imaginative, original, narrative-driven',         '"In a world where data breathes, your dashboard is the heartbeat."'],
                  ['Technical',    'Precise, jargon-aware, developer-focused',        '"The API accepts a JSON payload with a required prompt field and optional temperature parameter."'],
                  ['Persuasive',   'CTA-oriented, benefit-led, conversion-focused',   '"Join 12 000 teams already shipping faster — start free today."'],
                  ['Playful',      'Light, humorous, energetic, emoji-friendly',      '"Your pixels just levelled up ✨ (and honestly? We\'re a bit proud.)"'],
                ].map(([tone, desc, ex]) => (
                  <tr key={tone}>
                    <td><strong>{tone}</strong></td>
                    <td>{desc}</td>
                    <td><em style={{ color: 'var(--text-muted)' }}>{ex}</em></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            <strong>Technical</strong> tone pairs well with Code Snippet and Essay. <strong>Persuasive</strong> is
            the default recommendation for Ad Copy and Product Description. <strong>Playful</strong> works
            best for Social Post and brand-led content.
          </Callout>

          {/* ============================================================== */}
          {/* 4. LENGTH CONTROL                                                */}
          {/* ============================================================== */}
          <H2 id="length">4. Length Control</H2>

          <P>
            The Length control sets a target word count for the generated output. The model treats
            this as a guide, not a hard cap — final outputs may vary ±20%.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Target length</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Micro',  '~50 words',    'Headlines, taglines, social posts, ad one-liners'],
                  ['Short',  '~200 words',   'Product descriptions, emails, short blog intros'],
                  ['Medium', '~500 words',   'Blog sections, essays, landing page copy'],
                  ['Long',   '~1 000 words', 'Full blog posts, detailed essays, long-form copy'],
                ].map(([setting, target, best]) => (
                  <tr key={setting}>
                    <td><strong>{setting}</strong></td>
                    <td>{target}</td>
                    <td>{best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="info">
            For <strong>Code Snippet</strong>, length control affects the verbosity of comments
            and the number of included examples, not the number of lines of actual code.
          </Callout>

          {/* ============================================================== */}
          {/* 5. PROMPTING GUIDE                                               */}
          {/* ============================================================== */}
          <H2 id="prompting">5. Prompting Guide</H2>

          <P>
            The quality of your output is directly tied to prompt specificity. Vague prompts
            produce generic copy; specific prompts produce copy you can actually use.
          </P>

          <H3>General principles</H3>
          <UL>
            <LI><strong>Name the product or subject explicitly.</strong> Don&apos;t write "a productivity app" — write "Flowline, a Kanban-based project management tool for remote engineering teams".</LI>
            <LI><strong>Specify the target audience.</strong> "for indie game developers aged 20–35" gives the model critical context about register and assumed knowledge.</LI>
            <LI><strong>Include the desired action or outcome.</strong> For ad copy, say what you want readers to do: "click to start a free trial", "share with their team", "visit the pricing page".</LI>
            <LI><strong>Mention constraints.</strong> "Under 100 characters", "no technical jargon", "must include the word 'launch'" all steer the model effectively.</LI>
          </UL>

          <H3>Content-type-specific tips</H3>

          <H3 id="prompting-headline">Headline</H3>
          <P>
            Include the topic, the benefit, and optionally a number or power word.
            Example: <em>"Headline for a blog post about reducing Kubernetes costs — emphasise saving money without sacrificing performance."</em>
          </P>

          <H3 id="prompting-blog">Blog Post</H3>
          <P>
            Provide the topic, target audience, main argument, and 2–3 key points to cover.
            Example: <em>"Blog post for junior developers about understanding async/await in JavaScript. Cover the event loop, callback hell as context, and three real-world examples."</em>
          </P>

          <H3 id="prompting-product-desc">Product Description</H3>
          <P>
            Lead with the product category, key differentiators, and who it&apos;s for.
            Example: <em>"Product description for NoiseBuster Pro, a noise-cancelling USB microphone for remote workers. Key features: 48kHz recording, AI noise reduction, plug-and-play. Target: developers on video calls."</em>
          </P>

          <H3 id="prompting-email">Email</H3>
          <P>
            Specify email type (cold outreach / newsletter / transactional), sender context, recipient,
            and CTA. Example: <em>"Cold outreach email from a design agency to a SaaS startup founder. Goal: book a 30-minute brand strategy call. Keep it under 150 words, Professional tone."</em>
          </P>

          <H3 id="prompting-social">Social Post</H3>
          <P>
            Name the platform — copy structure differs significantly between LinkedIn, Twitter/X,
            and Instagram. Example: <em>"LinkedIn post announcing WokGen Voice Beta launch. Highlight AI voice generation for game devs. Include one relevant emoji, no hashtag spam."</em>
          </P>

          <H3 id="prompting-code">Code Snippet</H3>
          <P>
            Specify language, what the code should do, input/output, and any libraries allowed.
            Example: <em>"TypeScript function that debounces an async callback with a configurable delay. Use no external dependencies. Include JSDoc comments."</em>
          </P>

          {/* ============================================================== */}
          {/* 6. DOWNLOADING                                                   */}
          {/* ============================================================== */}
          <H2 id="downloading">6. Downloading</H2>

          <P>
            Generated text can be downloaded in two formats:
          </P>

          <UL>
            <LI><strong>.txt</strong> — plain text, no formatting, maximum compatibility with any editor or system.</LI>
            <LI><strong>.md</strong> — Markdown format, preserving headings, bold, bullet lists, and code blocks where applicable. Ideal for blog posts, essays, and documentation.</LI>
          </UL>

          <P>
            Click the <strong>Download</strong> button below the output panel and select your
            preferred format. The file is named <Code>wokgen-text-[timestamp].[ext]</Code>.
          </P>

          <Callout type="tip">
            Download as <Code>.md</Code> if you&apos;re pasting into Notion, GitHub, or a Markdown-based
            CMS — the formatting will be preserved. Use <Code>.txt</Code> for Word, Google Docs, or
            email clients.
          </Callout>

          {/* ============================================================== */}
          {/* 7. SAVING TO GALLERY                                             */}
          {/* ============================================================== */}
          <H2 id="gallery">7. Saving to Gallery</H2>

          <P>
            Text generations can be saved to your WokGen Gallery to build a reusable copy library
            and share with your community.
          </P>

          <UL>
            <LI>Click <strong>Save to Gallery</strong> after generation.</LI>
            <LI>Set visibility to <strong>Public</strong> to share with the WokGen community, or <strong>Private</strong> to keep it in your account.</LI>
            <LI>Public copy appears in the Text Gallery with your username, content type, and tone tags.</LI>
            <LI>Browse community-saved copy in the Gallery to discover prompt patterns and tone examples.</LI>
          </UL>

          {/* ============================================================== */}
          {/* 8. RATE LIMITS                                                   */}
          {/* ============================================================== */}
          <H2 id="rate-limits">8. Rate Limits</H2>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Generations per hour</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Free', '20 / hour',       'All content types and tones included'],
                  ['Pro',  '100 / hour',      'Priority queue, faster response times'],
                  ['Max',  'Unlimited',        'Subject to fair use; no per-hour cap'],
                ].map(([plan, limit, note]) => (
                  <tr key={plan}>
                    <td><strong>{plan}</strong></td>
                    <td>{limit}</td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <P>
            Rate limits apply to generation requests regardless of content type or output length.
            Limits reset on a rolling 60-minute window.
          </P>

          {/* ============================================================== */}
          {/* 9. AI MODELS                                                     */}
          {/* ============================================================== */}
          <H2 id="ai-models">9. AI Models</H2>

          <P>
            WokGen Text is powered by <strong>Eral 7c</strong>, the platform&apos;s primary language
            model backed by <strong>Llama 3.3 70B</strong>.
          </P>

          <UL>
            <LI><strong>Model</strong>: Llama 3.3 70B via the Eral 7c inference layer</LI>
            <LI><strong>Response time</strong>: typically 1–4 seconds for Micro/Short; 5–12 seconds for Long outputs</LI>
            <LI><strong>Consistency</strong>: no model degradation over time — the same prompt returns consistent quality regardless of time of day or load</LI>
            <LI><strong>Context window</strong>: 128 000 tokens — long enough to include extensive background context in your prompt</LI>
            <LI><strong>Output temperature</strong>: dynamically adjusted per content type — lower for Technical/Professional, higher for Creative/Playful</LI>
          </UL>

          <Callout type="info">
            Eral is also available as a standalone AI companion in the sidebar (🧠 Eral button)
            across all WokGen studios, and as a full chat interface at{' '}
            <Link href="/eral">/eral</Link>.
          </Callout>

          {/* ============================================================== */}
          {/* 10. BEST PRACTICES                                               */}
          {/* ============================================================== */}
          <H2 id="best-practices">10. Best Practices</H2>

          <H3>Be specific in your prompt</H3>
          <P>
            The single most impactful improvement you can make is adding specificity. Replace
            "write a product description" with "write a product description for Lumino, a portable
            LED ring light for content creators, sold on Amazon, targeting YouTubers aged 18–30."
            The difference in output quality is dramatic.
          </P>

          <H3>Specify your target audience</H3>
          <P>
            Including the audience shifts vocabulary, assumed knowledge, and tone automatically.
            "for senior backend engineers" vs "for non-technical founders" will produce substantially
            different copy from the same product brief.
          </P>

          <H3>Mention the product category</H3>
          <P>
            Category context helps the model use industry-appropriate language and conventions.
            "a B2B SaaS project management tool" gives the model more signal than "an app that
            helps teams work together".
          </P>

          <H3>Use tone intentionally</H3>
          <P>
            Don&apos;t leave tone on the default unless you&apos;re happy with a neutral result.
            For most marketing copy, <strong>Persuasive</strong> is the right choice. For developer
            documentation, use <strong>Technical</strong>. For social media, try <strong>Playful</strong>
            or <strong>Casual</strong> first.
          </P>

          <H3>Iterate with short lengths first</H3>
          <P>
            Start with <strong>Micro</strong> or <strong>Short</strong> to validate the direction,
            then re-generate at <strong>Medium</strong> or <strong>Long</strong> once you&apos;re happy
            with the angle and tone. This is faster than regenerating a 1 000-word piece three times.
          </P>

          {/* ============================================================== */}
          {/* 11. EXAMPLE PROMPTS                                              */}
          {/* ============================================================== */}
          <H2 id="example-prompts">11. Example Prompts</H2>

          <P>Five worked examples across different content types:</P>

          <H3>1. Headline — SaaS landing page</H3>
          <P><strong>Prompt:</strong></P>
          <Pre>{`Content type: Headline
Tone: Persuasive
Length: Micro

Write a headline for the landing page of Deployify — a one-click deployment
platform for Node.js apps. Target audience: solo developers. Emphasise speed
and simplicity. No jargon.`}</Pre>
          <P><strong>Output:</strong></P>
          <Pre>{`Deploy Your Node App in One Click — No DevOps Required.`}</Pre>

          <H3>2. Product Description — consumer hardware</H3>
          <P><strong>Prompt:</strong></P>
          <Pre>{`Content type: Product Description
Tone: Creative
Length: Short

Product: StellarPad X2 — a wireless mechanical keyboard with per-key RGB,
hot-swappable switches, and 6-month battery life. Target: PC gamers and
enthusiast typists. Highlight the tactile feel and RGB customisation.`}</Pre>
          <P><strong>Output excerpt:</strong></P>
          <Pre>{`Every keystroke is a statement. The StellarPad X2 puts tactile, responsive
hot-swap switches under your fingertips — swap in your favourite clicky or
silent switches in seconds, no soldering required. Bathe your desk in 16.8M
colours with per-key RGB that syncs to your game, your music, or your mood.
And with six months of wireless freedom on a single charge, the cord-cutting
never ends.`}</Pre>

          <H3>3. Social Post — LinkedIn announcement</H3>
          <P><strong>Prompt:</strong></P>
          <Pre>{`Content type: Social Post
Tone: Professional
Length: Micro
Platform: LinkedIn

Announcing the public beta of WokGen Voice — AI text-to-speech for game devs,
content creators, and marketers. Mention NPC dialogue, narration, and ads as
use cases. End with a call to try it free.`}</Pre>
          <P><strong>Output:</strong></P>
          <Pre>{`Excited to announce WokGen Voice is now in public beta.

Generate professional-quality narration, NPC dialogue for your game, or
punchy ad voiceovers from plain text — in seconds.

Whether you're an indie dev, content creator, or marketer, Voice gives you
studio-quality audio without the recording setup.

Try it free → wokgen.com/voice`}</Pre>

          <H3>4. Code Snippet — TypeScript utility</H3>
          <P><strong>Prompt:</strong></P>
          <Pre>{`Content type: Code Snippet
Tone: Technical
Length: Short

Write a TypeScript utility function that truncates a string to a given character
limit and appends '…' if truncated. Handle edge cases: empty string, limit of 0,
and limit larger than string. Include JSDoc.`}</Pre>
          <P><strong>Output:</strong></P>
          <Pre>{`/**
 * Truncates a string to the given character limit, appending '…' if truncated.
 * @param str   - The input string.
 * @param limit - Maximum character length (must be >= 0).
 * @returns The truncated string, or the original if within the limit.
 */
export function truncate(str: string, limit: number): string {
  if (!str || limit <= 0) return '';
  if (str.length <= limit) return str;
  return str.slice(0, limit) + '…';
}`}</Pre>

          <H3>5. Email — cold outreach</H3>
          <P><strong>Prompt:</strong></P>
          <Pre>{`Content type: Email
Tone: Casual
Length: Short

Cold outreach from a freelance motion designer to an indie game studio.
Goal: offer trailer editing and UI animation services. Studio recently launched
a Kickstarter. Keep it friendly, reference the Kickstarter, and ask for a quick
chat — not a long sales call.`}</Pre>
          <P><strong>Output excerpt:</strong></P>
          <Pre>{`Subject: Quick thought on your Kickstarter trailer

Hey [Name],

Saw the Kickstarter for [Game] — the art style is genuinely striking.

I'm a motion designer who works mostly with indie studios on trailers and
in-game UI animations. I noticed your launch trailer and thought there might
be room to punch up a few of the transitions and particle effects if you're
planning a follow-up.

No big pitch — just wondering if you'd be up for a 20-min call this week?

[Your name]`}</Pre>

          <Callout type="tip">
            Save prompts that produce great results to a personal prompt library (copy the prompt
            text before clearing the input). Prompt reuse dramatically speeds up your content
            workflow over time.
          </Callout>

        </main>
      </div>
    </div>
  );
}
