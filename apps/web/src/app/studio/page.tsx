'use client';

import { useState, useCallback } from 'react';

type Tool = 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';
type Status = 'idle' | 'loading' | 'done' | 'error';

const TOOLS: { id: Tool; icon: string; label: string; desc: string; needsImage: boolean }[] = [
  { id: 'generate', icon: '✦', label: 'Generate', desc: 'Text → pixel art sprite', needsImage: false },
  { id: 'animate', icon: '▶', label: 'Animate', desc: 'Sprite → animation', needsImage: true },
  { id: 'rotate', icon: '↻', label: 'Rotate', desc: 'Sprite → directional views', needsImage: true },
  { id: 'inpaint', icon: '◈', label: 'Inpaint', desc: 'Edit with masking', needsImage: true },
  { id: 'scene', icon: '⬛', label: 'Scenes', desc: 'Tilesets & environments', needsImage: false },
];

const SIZES = [
  { label: '32×32', value: 32 },
  { label: '64×64', value: 64 },
  { label: '128×128', value: 128 },
  { label: '256×256', value: 256 },
  { label: '512×512', value: 512 },
];

const STYLES = [
  'RPG item icon',
  '16-bit SNES style',
  '8-bit NES style',
  'Isometric',
  'Top-down',
  'Side-scroller',
  'Cyberpunk',
  'Fantasy',
  'Sci-fi',
];

export default function StudioPage() {
  const [tool, setTool] = useState<Tool>('generate');
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [size, setSize] = useState(256);
  const [steps, setSteps] = useState(20);
  const [style, setStyle] = useState('');
  const [directions, setDirections] = useState<4 | 8>(4);
  const [frames, setFrames] = useState(16);
  const [provider, setProvider] = useState('');
  const [userApiKey, setUserApiKey] = useState('');
  const [userApiProvider, setUserApiProvider] = useState('replicate');
  const [inputImageUrl, setInputImageUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [outputs, setOutputs] = useState<Array<{ id: string; url: string; format: string }>>([]);
  const [error, setError] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [seed, setSeed] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentTool = TOOLS.find((t) => t.id === tool)!;

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setStatus('loading');
    setError('');
    setOutputs([]);

    try {
      const body: Record<string, unknown> = {
        tool,
        prompt: prompt.trim(),
        negativePrompt: negPrompt || undefined,
        width: size,
        height: size,
        steps,
        style: style || undefined,
        provider: provider || undefined,
        ...(seed ? { seed: parseInt(seed) } : {}),
      };

      if (currentTool.needsImage && inputImageUrl) {
        body.inputImageUrl = inputImageUrl;
      }
      if (tool === 'rotate') body.directions = directions;
      if (tool === 'animate') body.frames = frames;
      if (userApiKey) {
        body.apiKey = userApiKey;
        body.apiProvider = userApiProvider;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      setOutputs(data.assets ?? []);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }, [tool, prompt, negPrompt, size, steps, style, provider, seed, inputImageUrl, currentTool, directions, frames, userApiKey, userApiProvider]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left sidebar — tool selector */}
      <aside className="w-16 lg:w-56 bg-slate-900 border-r border-slate-800 flex flex-col py-4 shrink-0">
        <div className="px-2 lg:px-4 mb-4">
          <p className="hidden lg:block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tools</p>
        </div>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`flex items-center gap-3 px-2 lg:px-4 py-3 mx-2 rounded-lg transition-all text-left ${
              tool === t.id
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="text-lg font-mono shrink-0 w-6 text-center">{t.icon}</span>
            <div className="hidden lg:block min-w-0">
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-slate-500 truncate">{t.desc}</div>
            </div>
          </button>
        ))}
      </aside>

      {/* Center — canvas / output */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 gap-2">
          <span className="text-slate-400 text-sm">{currentTool.icon}</span>
          <span className="text-white text-sm font-medium">{currentTool.label}</span>
          <span className="text-slate-600 text-sm">·</span>
          <span className="text-slate-500 text-sm">{currentTool.desc}</span>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          {status === 'idle' && (
            <div className="text-center">
              <div className="w-32 h-32 rounded-2xl bg-slate-900 border border-slate-800 border-dashed flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl opacity-20 font-mono">{currentTool.icon}</span>
              </div>
              <p className="text-slate-500 text-sm">Configure your prompt and click Generate</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <div className="w-32 h-32 rounded-2xl bg-slate-900 border border-violet-500/20 border-dashed flex items-center justify-center mx-auto mb-6 animate-pulse">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-slate-400 text-sm">Generating pixel art…</p>
              <p className="text-slate-600 text-xs mt-1">This can take 10–60 seconds depending on the provider</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center max-w-md">
              <div className="w-32 h-32 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✗</span>
              </div>
              <p className="text-red-400 text-sm font-medium mb-2">Generation failed</p>
              <p className="text-slate-500 text-xs">{error}</p>
            </div>
          )}

          {status === 'done' && outputs.length > 0 && (
            <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
              {outputs.map((out) => (
                <div key={out.id} className="group relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  {/* Pixel checkerboard background */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={out.url}
                    alt="Generated pixel art"
                    className="relative w-full aspect-square object-contain p-2"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a
                      href={out.url}
                      download={`wokgen-${out.id}.${out.format}`}
                      className="px-3 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar — controls */}
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Settings</h2>
        </div>

        <div className="flex-1 p-4 space-y-5">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                tool === 'generate' ? 'a golden sword, glowing runes…' :
                tool === 'animate' ? 'walking animation, 4 frames…' :
                tool === 'rotate' ? 'warrior character…' :
                tool === 'inpaint' ? 'replace helmet with iron helmet…' :
                'forest tileset, dark fantasy…'
              }
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Style preset */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">None (auto)</option>
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Output size</label>
            <div className="grid grid-cols-3 gap-1">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    size === s.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rotate-specific */}
          {tool === 'rotate' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Directions</label>
              <div className="grid grid-cols-2 gap-2">
                {([4, 8] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirections(d)}
                    className={`py-2 text-sm rounded-lg font-medium transition-colors ${
                      directions === d ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d} directions
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Animate-specific */}
          {tool === 'animate' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Frames: {frames}</label>
              <input
                type="range"
                min={4}
                max={32}
                step={4}
                value={frames}
                onChange={(e) => setFrames(parseInt(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}

          {/* Input image URL for tools that need it */}
          {currentTool.needsImage && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Input image URL</label>
              <input
                type="url"
                value={inputImageUrl}
                onChange={(e) => setInputImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>Advanced</span>
            <span>{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Negative prompt */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Negative prompt</label>
                <textarea
                  value={negPrompt}
                  onChange={(e) => setNegPrompt(e.target.value)}
                  placeholder="blurry, smooth, 3d render…"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              {/* Steps */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Steps: {steps}</label>
                <input
                  type="range" min={4} max={50} value={steps}
                  onChange={(e) => setSteps(parseInt(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>

              {/* Seed */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Seed (optional)</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Provider */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Provider (auto if blank)</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Auto (best available)</option>
                  <option value="replicate">Replicate</option>
                  <option value="fal">Fal.ai</option>
                  <option value="together">Together.ai</option>
                  <option value="comfyui">Local ComfyUI</option>
                </select>
              </div>

              {/* Anonymous API key */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-400 mb-2">Your own API key</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={userApiProvider}
                    onChange={(e) => setUserApiProvider(e.target.value)}
                    className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="replicate">Replicate</option>
                    <option value="fal">Fal.ai</option>
                    <option value="together">Together</option>
                  </select>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="r8_…"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <p className="text-xs text-slate-600">Key is sent server-side only and never stored.</p>
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Share to gallery</label>
                <button
                  onClick={() => setIsPublic((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-violet-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generate button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleGenerate}
            disabled={status === 'loading' || !prompt.trim()}
            className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <span>{currentTool.icon}</span>
                Generate
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
