export default function Home() {
  const tools = [
    {
      id: 'generate',
      icon: '✦',
      title: 'Text to Pixel Art',
      description: 'Type a prompt and get pixel art sprites, icons, and characters. 32×32 up to 512×512.',
      color: 'violet',
    },
    {
      id: 'animate',
      icon: '▶',
      title: 'Animate',
      description: 'Bring sprites to life. Generate walk cycles, attacks, and custom animations from text.',
      color: 'pink',
    },
    {
      id: 'rotate',
      icon: '↻',
      title: '4/8 Direction Rotation',
      description: 'One sprite → perfect directional views. Ideal for top-down and isometric games.',
      color: 'blue',
    },
    {
      id: 'inpaint',
      icon: '◈',
      title: 'Inpaint & Edit',
      description: 'Edit existing pixel art with true inpainting. Change clothes, add accessories, fix details.',
      color: 'emerald',
    },
    {
      id: 'scene',
      icon: '⬛',
      title: 'Scenes & Maps',
      description: 'Generate tilesets, environments, and game maps up to 400×400. Consistent style throughout.',
      color: 'amber',
    },
  ];

  const colorMap: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    pink:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const providers = [
    { name: 'Replicate', desc: 'Free credits for new users', href: 'https://replicate.com' },
    { name: 'Fal.ai', desc: 'Fast inference, great FLUX models', href: 'https://fal.ai' },
    { name: 'Together.ai', desc: 'FLUX.1-schnell-Free tier available', href: 'https://together.ai' },
    { name: 'ComfyUI', desc: 'Run locally, full control', href: 'https://github.com/comfyanonymous/ComfyUI' },
  ];

  return (
    <div className="bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-slate-950 to-slate-950" />
        {/* Pixel grid background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Open-source · Self-hostable · Multi-provider
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              AI Pixel Art
              <span className="text-violet-400"> Generator</span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Generate sprites, animations, tilesets and game assets with AI.
              Works with Replicate, Fal.ai, Together.ai, or your local ComfyUI.
              Free to self-host.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/studio"
                className="inline-flex items-center justify-center px-8 py-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25"
              >
                Open Studio — it&apos;s free
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="https://github.com/WokSpecialists/WokGen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700 hover:border-slate-500 transition-all"
              >
                <svg className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Everything you need to make game art
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Five specialized tools, one studio. No subscription required — bring your own AI API key or sign in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <a
                key={tool.id}
                href={`/studio?tool=${tool.id}`}
                className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border text-2xl font-mono ${colorMap[tool.color]}`}>
                  {tool.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it →
                </div>
              </a>
            ))}

            {/* Open source card */}
            <div className="bg-gradient-to-br from-violet-900/30 to-slate-900 rounded-2xl p-6 border border-violet-500/20">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border bg-violet-500/10 border-violet-500/20 text-2xl text-violet-400">
                ⬡
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Open Source</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                MIT + Commons Clause. Self-host for free. Contribute on GitHub.
                Your data stays yours.
              </p>
              <a
                href="https://github.com/WokSpecialists/WokGen"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Star on GitHub →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How it works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose your tool', desc: 'Pick from Generate, Animate, Rotate, Inpaint, or Scene. Each is optimized for a different game art workflow.' },
              { step: '02', title: 'Write a prompt', desc: 'Describe what you want in plain English. Add style hints like "16-bit RPG" or "cyberpunk". Upload a reference image for rotation and inpainting.' },
              { step: '03', title: 'Download & use', desc: 'Get transparent PNGs, GIF animations, or sprite sheets. Ready for Unity, Godot, Phaser, or any game engine.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-bold text-violet-500/20 font-mono mb-4">{s.step}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported providers */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Works with your preferred AI provider</h2>
            <p className="text-slate-400 max-w-xl mx-auto">WokGen is provider-agnostic. Use any combination — or all of them.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group"
              >
                <div className="font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors">{p.name}</div>
                <div className="text-slate-500 text-sm">{p.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to generate?</h2>
          <p className="text-slate-400 text-lg mb-8">
            No account needed. Bring your own API key and start generating pixel art in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/studio"
              className="inline-flex items-center justify-center px-8 py-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all"
            >
              Open Studio
            </a>
            <a
              href="/docs/self-hosting"
              className="inline-flex items-center justify-center px-8 py-4 bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700 hover:border-slate-500 transition-all"
            >
              Self-Hosting Guide
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
