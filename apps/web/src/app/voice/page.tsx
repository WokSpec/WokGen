import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Voice — AI Text-to-Speech & Voice Generation',
  description: 'Generate natural-sounding voiceovers, narration, and character voices with AI. 40+ languages, 200+ voices. Free tier included.',
  openGraph: {
    title: 'WokGen Voice — AI Voice Generator',
    description: 'Generate natural voiceovers and character voices with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  { icon: '🌍', label: '40+ Languages',  desc: 'Generate speech in 40+ languages with native-sounding accents and regional variants.' },
  { icon: '🎙️', label: '200+ Voices',   desc: 'Choose from 200+ built-in voices, or clone a custom voice with 5 seconds of audio.' },
  { icon: '📁', label: 'MP3 / WAV',      desc: 'Export high-quality audio in MP3 or WAV format, up to 192kbps.' },
  { icon: '🆓', label: 'Free Tier',      desc: 'Up to 10,000 characters per month free via Edge-TTS. No account required.' },
];

const TOOLS = [
  { id: 'tts',     label: 'Text to Speech', desc: 'Convert any text to natural speech. Choose voice, language, speed, and pitch.', example: 'Welcome to WokGen — the AI creative studio.' },
  { id: 'narrate', label: 'Narration',       desc: 'Long-form narration optimised for audiobooks, explainers, and podcasts.', example: 'Chapter one: The AI revolution began quietly...' },
  { id: 'clone',   label: 'Voice Clone',     desc: 'Upload a 5-second reference clip and generate speech in that voice.', example: 'Upload a sample clip to clone any voice' },
  { id: 'music',   label: 'Music',           desc: 'Generate backing music and soundscapes with MusicGen. Loop-ready output.', example: 'cinematic orchestral intro, 30 seconds, building tension' },
  { id: 'sfx',     label: 'Sound FX',        desc: 'Search and download CC0 sound effects from Freesound for your projects.', example: 'magic sparkle sound effect, ascending pitch' },
];

const SHOWCASE = [
  { prompt: 'Read in a calm British female voice: "Your order has been shipped and will arrive in 2 days."', label: 'Order Update' },
  { prompt: 'Energetic US male narrator: "Introducing the next generation of AI-powered creativity!"', label: 'Product Launch' },
  { prompt: 'Soft French female voice reading a poem about the sea at dawn', label: 'Poetry Reading' },
  { prompt: 'Deep cinematic voice: "In a world where AI creates everything..."', label: 'Movie Trailer' },
  { prompt: 'Children&apos;s storyteller voice: "Once upon a time in a magical forest..."', label: 'Bedtime Story' },
  { prompt: 'Professional podcast intro: "Welcome to TechTalks, episode 47."', label: 'Podcast Intro' },
];

export default function VoiceLanding() {
  return (
    <div className="mode-landing mode-landing--voice">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              <span>WokGen Voice</span>
            </div>
            <h1 className="landing-h1">
              Natural AI voiceovers.<br />
              <span className="landing-h1-accent">Any language.</span>
            </h1>
            <p className="landing-desc">
              Text-to-speech, narration, voice cloning, music, and SFX — all in one studio.
              200+ voices, 40+ languages, export-ready audio.
            </p>
            <div className="landing-cta-row">
              <Link href="/voice/studio" className="btn-primary btn-lg">Open Voice Studio →</Link>
              <Link href="/voice/gallery" className="btn-ghost btn-lg">Browse Gallery</Link>
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
          <p className="landing-section-desc">Five audio generation tools for voice, music, and sound design.</p>
          <div className="landing-tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="landing-tool-card">
                <div className="landing-tool-header"><span className="landing-tool-label">{t.label}</span></div>
                <p className="landing-tool-desc">{t.desc}</p>
                <Link href={`/voice/studio?tool=${t.id}&prompt=${encodeURIComponent(t.example)}`} className="landing-tool-example">
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
          <p className="landing-section-desc">Click any prompt to open it in Voice mode.</p>
          <div className="landing-showcase-grid">
            {SHOWCASE.map(s => (
              <Link key={s.label} href={`/voice/studio?prompt=${encodeURIComponent(s.prompt)}`} className="landing-showcase-card">
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
          <p className="landing-wokspec-text">Need full audio production or podcast editing pipelines? WokSpec delivers.</p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">WokSpec Services →</a>
        </div>
      </section>
    </div>
  );
}

