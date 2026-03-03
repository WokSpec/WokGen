import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pixel Animate | WokGen',
  description: 'Create animated pixel art sprites and GIF sequences with AI.',
};

const ANIMATION_PRESETS = [
  { id: 'walk-cycle', label: 'Walk Cycle', frames: 8, fps: 12, prompt: 'pixel art character walking cycle, side view, game sprite sheet' },
  { id: 'idle', label: 'Idle Animation', frames: 4, fps: 8, prompt: 'pixel art character idle breathing animation, front view' },
  { id: 'attack', label: 'Attack Swing', frames: 6, fps: 16, prompt: 'pixel art character attack swing animation, side view' },
  { id: 'explosion', label: 'Explosion', frames: 8, fps: 24, prompt: 'pixel art explosion animation, bright orange and yellow' },
  { id: 'coin-spin', label: 'Coin Spin', frames: 6, fps: 12, prompt: 'pixel art gold coin spinning animation' },
  { id: 'water', label: 'Water Ripple', frames: 4, fps: 8, prompt: 'pixel art water ripple tile animation, top-down' },
  { id: 'fire', label: 'Fire Loop', frames: 6, fps: 12, prompt: 'pixel art fire animation loop, orange and red flames' },
  { id: 'portal', label: 'Magic Portal', frames: 8, fps: 16, prompt: 'pixel art magic portal swirl animation, purple and blue' },
];

export default function PixelAnimatePage() {
  return (
    <div className="anim-page">
      <div className="anim-page-header">
        <h1 className="anim-page-title">Pixel Animate</h1>
        <p className="anim-page-subtitle">
          Generate animated pixel art sprites with AI — walk cycles, effects, loops.
        </p>
        <Link href="/pixel/studio?tool=animate" className="anim-cta-btn">
          Open in Studio →
        </Link>
      </div>

      <div className="anim-section">
        <h2 className="anim-section-title">Animation Presets</h2>
        <p className="anim-section-desc">
          Click a preset to open it in the studio with the prompt pre-filled.
        </p>
        <div className="anim-presets-grid">
          {ANIMATION_PRESETS.map((p) => (
            <Link
              key={p.id}
              href={`/pixel/studio?tool=animate&prompt=${encodeURIComponent(p.prompt)}&frames=${p.frames}&fps=${p.fps}`}
              className="anim-preset-card"
            >
              <div className="anim-preset-icon">🎬</div>
              <div className="anim-preset-label">{p.label}</div>
              <div className="anim-preset-meta">{p.frames} frames · {p.fps} fps</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="anim-section">
        <h2 className="anim-section-title">Tips for Pixel Animation</h2>
        <ul className="anim-tips-list">
          <li>Use <strong>8 or fewer frames</strong> for crisp, readable animations</li>
          <li>Keep the <strong>frame count as a power of 2</strong> (4, 8, 16) for seamless loops</li>
          <li>Specify <strong>side view</strong> or <strong>front view</strong> to control the perspective</li>
          <li>Add <strong>&quot;game sprite sheet&quot;</strong> to your prompt for multi-frame layouts</li>
          <li>Use the <strong>Pixel Editor</strong> to clean up frames after AI generation</li>
          <li>Lower FPS (6-8) for retro feel; higher FPS (24+) for smooth effects</li>
        </ul>
      </div>
    </div>
  );
}
