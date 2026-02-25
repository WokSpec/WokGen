'use client';

import { useState, useCallback } from 'react';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'discord' | 'slack';

interface OgFields {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
}

const LIMITS: Record<Platform, { title: number; description: number }> = {
  twitter:  { title: 70,  description: 200 },
  facebook: { title: 100, description: 300 },
  linkedin: { title: 119, description: 400 },
  discord:  { title: 256, description: 2048 },
  slack:    { title: 120, description: 500 },
};

const PLATFORM_LABELS: Record<Platform, string> = {
  twitter:  'Twitter',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  discord:  'Discord',
  slack:    'Slack',
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function CharCount({ val, max }: { val: string; max: number }) {
  const over = val.length > max;
  return (
    <span className={`og-char-count${over ? ' over' : ''}`}>
      {val.length} / {max}
    </span>
  );
}

function FallbackImage({ label }: { label: string }) {
  return (
    <div className="og-img-placeholder">
      <span>{label}</span>
    </div>
  );
}

function TwitterCard({ f }: { f: OgFields }) {
  const lim = LIMITS.twitter;
  const title = truncate(f.title || 'Page Title', lim.title);
  const desc = truncate(f.description || 'Description of your page goes here.', lim.description);
  const domain = f.url ? (() => { try { return new URL(f.url).hostname; } catch { return f.url; } })() : 'example.com';
  return (
    <div className="og-card og-twitter">
      {f.image
        ? <img src={f.image} alt="og" className="og-card-img og-twitter-img" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        : <FallbackImage label="1200 × 628" />
      }
      <div className="og-twitter-body">
        <p className="og-twitter-domain">{domain}</p>
        <p className="og-twitter-title">{title}</p>
        <p className="og-twitter-desc">{desc}</p>
      </div>
    </div>
  );
}

function FacebookCard({ f }: { f: OgFields }) {
  const lim = LIMITS.facebook;
  const title = truncate(f.title || 'Page Title', lim.title);
  const desc = truncate(f.description || 'Description of your page.', lim.description);
  const domain = f.url ? (() => { try { return new URL(f.url).hostname.toUpperCase(); } catch { return (f.url || 'EXAMPLE.COM').toUpperCase(); } })() : 'EXAMPLE.COM';
  return (
    <div className="og-card og-facebook">
      {f.image
        ? <img src={f.image} alt="og" className="og-card-img" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        : <FallbackImage label="1200 × 628" />
      }
      <div className="og-facebook-body">
        <p className="og-facebook-domain">{domain}</p>
        <p className="og-facebook-title">{title}</p>
        <p className="og-facebook-desc">{desc}</p>
      </div>
    </div>
  );
}

function LinkedInCard({ f }: { f: OgFields }) {
  const lim = LIMITS.linkedin;
  const title = truncate(f.title || 'Page Title', lim.title);
  const desc = truncate(f.description || 'Description of your page.', lim.description);
  const domain = f.url ? (() => { try { return new URL(f.url).hostname; } catch { return f.url; } })() : 'example.com';
  return (
    <div className="og-card og-linkedin">
      {f.image
        ? <img src={f.image} alt="og" className="og-card-img" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        : <FallbackImage label="1200 × 628" />
      }
      <div className="og-linkedin-body">
        <p className="og-linkedin-title">{title}</p>
        <p className="og-linkedin-desc">{desc}</p>
        <p className="og-linkedin-domain">{f.siteName || domain}</p>
      </div>
    </div>
  );
}

function DiscordCard({ f }: { f: OgFields }) {
  const title = truncate(f.title || 'Page Title', LIMITS.discord.title);
  const desc = truncate(f.description || 'Description of your page.', LIMITS.discord.description);
  const domain = f.url ? (() => { try { return new URL(f.url).hostname; } catch { return f.url; } })() : 'example.com';
  return (
    <div className="og-card og-discord">
      <div className="og-discord-inner">
        <div className="og-discord-accent" />
        <div className="og-discord-content">
          <p className="og-discord-domain">{f.siteName || domain}</p>
          <p className="og-discord-title">{title}</p>
          <p className="og-discord-desc">{desc}</p>
          {f.image && (
            <img src={f.image} alt="og" className="og-discord-img" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          )}
        </div>
      </div>
    </div>
  );
}

function SlackCard({ f }: { f: OgFields }) {
  const title = truncate(f.title || 'Page Title', LIMITS.slack.title);
  const desc = truncate(f.description || 'Description of your page.', LIMITS.slack.description);
  const domain = f.url ? (() => { try { return new URL(f.url).hostname; } catch { return f.url; } })() : 'example.com';
  return (
    <div className="og-card og-slack">
      <div className="og-slack-inner">
        <div className="og-slack-accent" />
        <div className="og-slack-content">
          <p className="og-slack-domain">{f.siteName || domain}</p>
          <p className="og-slack-title">{title}</p>
          <p className="og-slack-desc">{desc}</p>
          {f.image && (
            <img src={f.image} alt="og" className="og-slack-thumb" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function OgPreviewTool() {
  const [fields, setFields] = useState<OgFields>({
    title: 'WokGen — Free AI Image Generator',
    description: 'Generate stunning AI images for free. No sign-up required. 300+ models available.',
    image: '',
    siteName: 'WokGen',
    url: 'https://wokgen.com',
  });
  const [platform, setPlatform] = useState<Platform>('twitter');
  const [copiedTags, setCopiedTags] = useState(false);

  const set = useCallback((key: keyof OgFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields(f => ({ ...f, [key]: e.target.value }));
  }, []);

  const metaTags = `<!-- Primary Meta Tags -->
<title>${fields.title}</title>
<meta name="description" content="${fields.description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${fields.url}" />
<meta property="og:title" content="${fields.title}" />
<meta property="og:description" content="${fields.description}" />${fields.image ? `\n<meta property="og:image" content="${fields.image}" />` : ''}${fields.siteName ? `\n<meta property="og:site_name" content="${fields.siteName}" />` : ''}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${fields.url}" />
<meta property="twitter:title" content="${fields.title}" />
<meta property="twitter:description" content="${fields.description}" />${fields.image ? `\n<meta property="twitter:image" content="${fields.image}" />` : ''}`;

  const copyTags = async () => {
    await navigator.clipboard.writeText(metaTags);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const lim = LIMITS[platform];

  return (
    <div className="og-tool">
      <div className="og-layout">
        {/* Left: inputs */}
        <div className="og-inputs">
          <div className="og-field">
            <label className="og-label">
              Title
              <CharCount val={fields.title} max={lim.title} />
            </label>
            <input className="og-input" value={fields.title} onChange={set('title')} placeholder="Page title" />
          </div>
          <div className="og-field">
            <label className="og-label">
              Description
              <CharCount val={fields.description} max={lim.description} />
            </label>
            <textarea className="og-textarea" value={fields.description} onChange={set('description')} placeholder="Brief description of the page" rows={3} />
          </div>
          <div className="og-field">
            <label className="og-label">Image URL</label>
            <input className="og-input" value={fields.image} onChange={set('image')} placeholder="https://example.com/og-image.jpg" />
          </div>
          <div className="og-field">
            <label className="og-label">Site Name</label>
            <input className="og-input" value={fields.siteName} onChange={set('siteName')} placeholder="Your Site" />
          </div>
          <div className="og-field">
            <label className="og-label">URL</label>
            <input className="og-input" value={fields.url} onChange={set('url')} placeholder="https://example.com/page" />
          </div>
          <button className="btn-primary og-copy-btn" onClick={copyTags}>
            {copiedTags ? 'Copied!' : 'Copy Meta Tags'}
          </button>
          <pre className="og-meta-preview">{metaTags}</pre>
        </div>

        {/* Right: preview */}
        <div className="og-preview-col">
          <div className="og-platform-tabs">
            {(Object.entries(PLATFORM_LABELS) as [Platform, string][]).map(([p, lbl]) => (
              <button
                key={p}
                className={`og-platform-tab${platform === p ? ' active' : ''}`}
                onClick={() => setPlatform(p)}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div className="og-preview-area">
            {platform === 'twitter'  && <TwitterCard  f={fields} />}
            {platform === 'facebook' && <FacebookCard f={fields} />}
            {platform === 'linkedin' && <LinkedInCard f={fields} />}
            {platform === 'discord'  && <DiscordCard  f={fields} />}
            {platform === 'slack'    && <SlackCard    f={fields} />}
          </div>
          <div className="og-char-hints">
            <span>Title limit for this platform: <strong>{lim.title}</strong> chars</span>
            <span>Description limit: <strong>{lim.description}</strong> chars</span>
          </div>
        </div>
      </div>
    </div>
  );
}
