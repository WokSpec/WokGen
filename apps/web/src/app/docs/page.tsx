import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — WokGen',
  description: 'WokGen documentation: getting started, API reference, self-hosting, and provider setup.',
};

const sections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'quick-start', title: 'Quick Start', body: 'The fastest way to use WokGen is to open the Studio and provide your own API key. Go to /studio, click Advanced in the right panel, enter your Replicate/Fal.ai/Together.ai API key, write a prompt and click Generate. No account required.' },
      { id: 'self-hosting', title: 'Self-Hosting', body: 'Clone the repo, copy .env.example to .env.local, fill in at least one AI provider key, then run: npm install && npm run db:push && npm run dev. For production: npm run build && npm run start. A Dockerfile is included for containerized deployments.' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { id: 'api-generate', title: 'POST /api/generate', body: 'Accepts: { tool, prompt, negativePrompt?, width?, height?, steps?, seed?, style?, provider?, inputImageUrl?, maskImageUrl?, directions?, frames?, apiKey?, apiProvider? }. Returns: { jobId, status, provider, assets: [{ id, url, format }] }.' },
      { id: 'api-jobs', title: 'GET /api/jobs/[id]', body: 'Returns job status and output assets. Fields: id, status (pending|running|done|failed), tool, prompt, provider, error, createdAt, finishedAt, assets.' },
      { id: 'api-gallery', title: 'GET /api/gallery', body: 'Query: page, limit (max 50), tool. Returns: { assets, pagination: { page, limit, total, pages } }. Only returns isPublic=true assets.' },
      { id: 'api-providers', title: 'GET /api/providers', body: 'Returns list of configured providers with availability and capabilities per tool (generate, animate, rotate, inpaint, scene).' },
    ],
  },
  {
    title: 'Provider Setup',
    items: [
      { id: 'provider-replicate', title: 'Replicate', body: 'Sign up at replicate.com (free credits for new users). Go to Account → API tokens. Set REPLICATE_API_TOKEN=r8_your_token in .env.local. Supports all five tools.' },
      { id: 'provider-fal', title: 'Fal.ai', body: 'Sign up at fal.ai. Dashboard → Keys. Set FAL_KEY=your_key in .env.local. Supports all five tools with fast FLUX models.' },
      { id: 'provider-together', title: 'Together.ai', body: 'Sign up at together.ai. Settings → API Keys. Set TOGETHER_API_KEY=your_key in .env.local. Free tier includes FLUX.1-schnell-Free. Supports generate, rotate, scene.' },
      { id: 'provider-comfyui', title: 'Local ComfyUI', body: 'Install ComfyUI (github.com/comfyanonymous/ComfyUI). Start it (default: http://127.0.0.1:8188). Set COMFYUI_HOST=http://127.0.0.1:8188 in .env.local. WokGen sends a minimal KSampler workflow. Requires at least one checkpoint model.' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20 space-y-6">
              {sections.map((s) => (
                <div key={s.title}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{s.title}</p>
                  <ul className="space-y-1">
                    {s.items.map((item) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`} className="text-sm text-slate-500 hover:text-white transition-colors block py-0.5">
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 max-w-3xl">
            <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
            <p className="text-slate-400 mb-12">Everything you need to use and self-host WokGen.</p>

            {sections.map((s) => (
              <div key={s.title} className="mb-16">
                <h2 className="text-lg font-bold text-white mb-6 pb-2 border-b border-slate-800">{s.title}</h2>
                <div className="space-y-8">
                  {s.items.map((item) => (
                    <div key={item.id} id={item.id} className="scroll-mt-20">
                      <h3 className="text-base font-semibold text-white mb-2 font-mono bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 inline-block">
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mt-2">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Contributing */}
            <div className="bg-violet-900/20 border border-violet-500/20 rounded-xl p-6 mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Contributing</h2>
              <p className="text-slate-400 text-sm mb-4">
                WokGen is open source under MIT + Commons Clause. Pull requests welcome!
              </p>
              <a
                href="https://github.com/WokSpecialists/WokGen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
