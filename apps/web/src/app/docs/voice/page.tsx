import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Voice Docs — AI Text-to-Speech Studio',
  description:
    'Complete user documentation for WokGen Voice. Learn to generate narration, NPC dialogue, ' +
    'podcast intros, and ads using natural TTS, HD Kokoro/Bark models, voice types, and speed control.',
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
  { id: 'overview',       label: '1. Overview' },
  { id: 'getting-started', label: '2. Getting Started' },
  { id: 'voice-types',    label: '3. Voice Types' },
  { id: 'languages',      label: '4. Languages' },
  { id: 'speed-control',  label: '5. Speed Control' },
  { id: 'tiers',          label: '6. Standard vs HD' },
  { id: 'audio-player',   label: '7. Audio Player' },
  { id: 'downloading',    label: '8. Downloading' },
  { id: 'gallery',        label: '9. Saving to Gallery' },
  { id: 'rate-limits',    label: '10. Rate Limits' },
  { id: 'best-practices', label: '11. Best Practices' },
  { id: 'limitations',    label: '12. Limitations' },
];

export default function VoiceDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar TOC                                                       */}
        {/* ---------------------------------------------------------------- */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            
            <span>WokGen Voice</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/voice/studio" className="btn-primary btn-sm">Open Voice Studio</Link>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#f59e0b' }} />
              WokGen Voice
            </div>
            <h1 className="docs-title">Voice Documentation</h1>
            <p className="docs-subtitle">
              Complete guide to generating AI-powered speech — narration, NPC dialogue,
              podcast intros, product demos, and ads.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 1. OVERVIEW                                                      */}
          {/* ============================================================== */}
          <H2 id="overview">1. Overview</H2>

          <P>
            <strong>WokGen Voice</strong> is an AI text-to-speech studio built for creators who need
            high-quality audio without recording equipment or voice talent. Type your script, pick a
            voice, and get back a WAV file in seconds.
          </P>

          <H3>Use cases</H3>
          <UL>
            <LI><strong>Narration</strong> — explainer videos, tutorials, and e-learning modules.</LI>
            <LI><strong>NPC dialogue</strong> — game characters, interactive fiction, and branching narratives.</LI>
            <LI><strong>Product demos</strong> — voiceovers for SaaS walkthroughs and app store videos.</LI>
            <LI><strong>Podcast intros</strong> — polished intro and outro segments with music-ready timing.</LI>
            <LI><strong>Advertisements</strong> — punchy 15 s and 30 s ad spots with energetic delivery.</LI>
          </UL>

          <Callout type="tip">
            WokGen Voice is in <strong>Beta</strong>. Features are actively expanding — expect new
            voices and language support in upcoming releases.
          </Callout>

          {/* ============================================================== */}
          {/* 2. GETTING STARTED                                               */}
          {/* ============================================================== */}
          <H2 id="getting-started">2. Getting Started</H2>

          <P>Generating your first voice clip takes under a minute:</P>

          <UL>
            <LI><strong>Step 1</strong> — Navigate to <Link href="/voice/studio">Voice Studio</Link> from the top nav or the WokGen home page.</LI>
            <LI><strong>Step 2</strong> — Enter your text in the script box. Keep it under 200 words for fastest results.</LI>
            <LI><strong>Step 3</strong> — Pick a Voice Type from the selector (Natural, Character, Whisper, etc.).</LI>
            <LI><strong>Step 4</strong> — Choose a language and set your speed if needed.</LI>
            <LI><strong>Step 5</strong> — Click <strong>Generate</strong>. Your audio will appear in the player within seconds.</LI>
          </UL>

          <Callout type="info">
            Standard tier generates instantly using your browser&apos;s built-in TTS engine. HD tier
            sends the request to HuggingFace Kokoro or Bark and may take 5–15 seconds.
          </Callout>

          {/* ============================================================== */}
          {/* 3. VOICE TYPES                                                   */}
          {/* ============================================================== */}
          <H2 id="voice-types">3. Voice Types</H2>

          <P>
            WokGen Voice offers six voice types to match different content needs. Each type affects
            delivery, pacing, and emotional tone.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Voice Type</th>
                  <th>Character</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Natural',   'Clean, measured, announcer-style',           'Narration, explainers, product demos'],
                  ['Character', 'Expressive, dramatic, character-driven',     'Game NPC dialogue, fantasy/gaming content'],
                  ['Whisper',   'Soft, intimate, low-energy',                 'ASMR, meditation guides, romantic scenes'],
                  ['Energetic', 'Upbeat, fast-paced, enthusiastic',           'Marketing spots, ads, hype reels'],
                  ['News',      'Authoritative, clipped, broadcast-quality',  'News segments, corporate announcements'],
                  ['Deep',      'Rich baritone, commanding presence',         'Movie trailers, documentary narration'],
                ].map(([type, char, best]) => (
                  <tr key={type}>
                    <td><strong>{type}</strong></td>
                    <td>{char}</td>
                    <td>{best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            In HD tier, voice type influences the Kokoro/Bark model parameters. In Standard tier,
            it maps to browser <Code>SpeechSynthesis</Code> pitch and rate parameters.
          </Callout>

          {/* ============================================================== */}
          {/* 4. LANGUAGES                                                     */}
          {/* ============================================================== */}
          <H2 id="languages">4. Languages</H2>

          <P>
            WokGen Voice currently supports seven languages. Language availability may vary between
            Standard and HD tiers.
          </P>

          <UL>
            <LI><strong>English</strong> (en) — full support, all voice types, all speeds</LI>
            <LI><strong>Spanish</strong> (es) — full support</LI>
            <LI><strong>French</strong> (fr) — full support</LI>
            <LI><strong>German</strong> (de) — full support</LI>
            <LI><strong>Japanese</strong> (ja) — HD tier recommended for natural prosody</LI>
            <LI><strong>Portuguese</strong> (pt) — full support</LI>
            <LI><strong>Chinese</strong> (zh) — HD tier recommended for tonal accuracy</LI>
          </UL>

          <Callout type="warn">
            Standard tier uses the browser&apos;s system TTS voices. Available languages depend on
            the voices installed on the user&apos;s OS. For guaranteed multilingual output, use HD tier.
          </Callout>

          {/* ============================================================== */}
          {/* 5. SPEED CONTROL                                                 */}
          {/* ============================================================== */}
          <H2 id="speed-control">5. Speed Control</H2>

          <P>
            The speed slider controls how fast the voice speaks, from a slow dramatic pace to a rapid
            upbeat delivery.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Speed</th>
                  <th>Feel</th>
                  <th>Recommended for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['0.5×', 'Very slow, dramatic, weighted',    'Trailers, dramatic reveals, meditation'],
                  ['0.75×', 'Slow and deliberate',             'Technical explanations, e-learning'],
                  ['1.0×', 'Normal conversational pace',       'Most content — default'],
                  ['1.25×', 'Slightly brisk',                  'Podcasts, quick explainers'],
                  ['1.5×', 'Fast, energetic',                  'Ads, hype content, social clips'],
                  ['2.0×', 'Very fast, upbeat, punchy',        'Short-form marketing, TikTok/Reels'],
                ].map(([speed, feel, rec]) => (
                  <tr key={speed}>
                    <td><Code>{speed}</Code></td>
                    <td>{feel}</td>
                    <td>{rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================== */}
          {/* 6. STANDARD VS HD                                                */}
          {/* ============================================================== */}
          <H2 id="tiers">6. Standard vs HD Tier</H2>

          <H3>Standard tier (free)</H3>
          <P>
            Standard voice generation uses your browser&apos;s built-in <Code>Web Speech API</Code>{' '}
            (<Code>SpeechSynthesis</Code>). Results are instant and require no server round-trip or
            credits. Voice quality depends on the OS and browser — it can sound robotic on some
            platforms, especially for non-English text.
          </P>
          <UL>
            <LI>Instant — no network latency</LI>
            <LI>Free, no credits consumed</LI>
            <LI>Robotic on some OS/browser combos</LI>
            <LI>Language quality varies by installed system voices</LI>
          </UL>

          <H3>HD tier (1 credit per clip)</H3>
          <P>
            HD voice uses <strong>HuggingFace Kokoro</strong> (fast, natural-sounding neural TTS)
            or <strong>Bark</strong> (expressive, character-style voice synthesis). Results are
            significantly more natural, with proper prosody, breathing, and emotional inflection.
          </P>
          <UL>
            <LI>Natural-sounding neural TTS</LI>
            <LI>Consistent quality across all languages</LI>
            <LI>Better character voice expressiveness with Bark</LI>
            <LI>Costs 1 credit per clip</LI>
            <LI>Takes 5–15 seconds to generate</LI>
          </UL>

          <Callout type="tip">
            Use Standard to iterate on your script and timing, then switch to HD for your final
            production clip.
          </Callout>

          {/* ============================================================== */}
          {/* 7. AUDIO PLAYER                                                  */}
          {/* ============================================================== */}
          <H2 id="audio-player">7. Audio Player</H2>

          <P>
            After generation, the audio appears in the built-in player. Controls include:
          </P>

          <UL>
            <LI><strong>Play / Pause</strong> — toggle playback with the play button or spacebar.</LI>
            <LI><strong>Seek</strong> — click anywhere on the progress bar to jump to that position.</LI>
            <LI><strong>Volume</strong> — drag the volume slider to adjust output level (0–100%).</LI>
            <LI><strong>Duration</strong> — elapsed time and total clip length are displayed.</LI>
          </UL>

          <P>
            The player is non-destructive — you can re-generate with different settings without
            losing your current clip until you explicitly clear it.
          </P>

          {/* ============================================================== */}
          {/* 8. DOWNLOADING                                                   */}
          {/* ============================================================== */}
          <H2 id="downloading">8. Downloading</H2>

          <P>
            All generated audio is available for immediate download in <strong>WAV format</strong>,
            which is lossless and universally compatible with DAWs, video editors, and game engines.
          </P>

          <UL>
            <LI>Click the <strong>Download</strong> button below the player.</LI>
            <LI>The file is named <Code>wokgen-voice-[timestamp].wav</Code> by default.</LI>
            <LI>WAV files can be imported directly into Unity, Godot, Premiere, DaVinci Resolve, etc.</LI>
          </UL>

          <Callout type="info">
            WAV format is chosen for maximum compatibility. If you need MP3 or OGG, convert using
            Audacity, ffmpeg, or an online converter after downloading.
          </Callout>

          {/* ============================================================== */}
          {/* 9. SAVING TO GALLERY                                             */}
          {/* ============================================================== */}
          <H2 id="gallery">9. Saving to Gallery</H2>

          <P>
            Voice clips can be saved to your WokGen Gallery for later access and sharing.
          </P>

          <UL>
            <LI>Click <strong>Save to Gallery</strong> after generation.</LI>
            <LI>Choose <strong>Public</strong> to share with the WokGen community, or <strong>Private</strong> to keep it in your account only.</LI>
            <LI>Saved clips appear under your profile in the Gallery with the script text and voice settings.</LI>
            <LI>You can delete saved clips at any time from your Gallery page.</LI>
          </UL>

          {/* ============================================================== */}
          {/* 10. RATE LIMITS                                                  */}
          {/* ============================================================== */}
          <H2 id="rate-limits">10. Rate Limits</H2>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Voice clips per hour</th>
                  <th>HD clips</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Free',  '5 clips / hour',       'From credit balance'],
                  ['Pro',   '20 clips / hour',      'From credit balance'],
                  ['Max',   'Unlimited',             'Unlimited (subject to fair use)'],
                ].map(([plan, limit, hd]) => (
                  <tr key={plan}>
                    <td><strong>{plan}</strong></td>
                    <td>{limit}</td>
                    <td>{hd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <P>
            Rate limits apply to the number of generation requests, not clip duration. A 500-word
            clip counts as one request. Limits reset on a rolling 60-minute window.
          </P>

          {/* ============================================================== */}
          {/* 11. BEST PRACTICES                                               */}
          {/* ============================================================== */}
          <H2 id="best-practices">11. Best Practices</H2>

          <H3>Script length</H3>
          <P>
            Keep your script <strong>under 200 words</strong> for the fastest generation times and
            most consistent quality. Long scripts may be split internally — shorter inputs give
            better control over pacing and tone.
          </P>

          <H3>Voice selection</H3>
          <UL>
            <LI>Use <strong>Character</strong> voice for game NPC dialogue — it adds the expressive variability that makes characters feel alive.</LI>
            <LI>Use <strong>Natural</strong> for product demos and explainers — clean, professional, and easy to understand.</LI>
            <LI>Use <strong>News</strong> for authoritative corporate content — it signals credibility and broadcast quality.</LI>
            <LI>Use <strong>Whisper</strong> for ASMR or intimate voiceover — the soft delivery reduces listener fatigue.</LI>
          </UL>

          <H3>Punctuation matters</H3>
          <P>
            TTS engines respond to punctuation. Use commas for brief pauses, periods for full stops,
            and ellipses (<Code>...</Code>) for dramatic hesitation. Exclamation marks increase
            energy in Energetic and Character voices.
          </P>

          <H3>Iterating on HD clips</H3>
          <P>
            Credits are precious. Proof your script in Standard tier first — fix typos, check pacing,
            and confirm the word count is correct. Only upgrade to HD once the script is finalised.
          </P>

          {/* ============================================================== */}
          {/* 12. LIMITATIONS                                                  */}
          {/* ============================================================== */}
          <H2 id="limitations">12. Limitations</H2>

          <UL>
            <LI><strong>Standard tier uses browser TTS</strong> — output quality varies significantly between Chrome, Firefox, Safari, and different operating systems. On some Linux systems it may sound robotic.</LI>
            <LI><strong>HD tier requires API credits</strong> — each clip consumes 1 credit. Credits are consumed even if you choose not to download the result.</LI>
            <LI><strong>No real-time streaming</strong> — the full clip is generated before playback begins.</LI>
            <LI><strong>Script length cap</strong> — inputs over 500 words may be truncated. Split long scripts into multiple clips.</LI>
            <LI><strong>Emotional nuance</strong> — AI voices are improving rapidly but still lack the full expressive range of a human voice actor for nuanced emotional scenes.</LI>
            <LI><strong>Singing not supported</strong> — WokGen Voice is for speech only. It cannot generate musical singing or melody.</LI>
          </UL>

          <Callout type="warn">
            Do not use WokGen Voice to impersonate real people or generate deceptive content.
            Review the WokSpec Terms of Service before using voice output in commercial projects.
          </Callout>

        </main>
      </div>
    </div>
  );
}
