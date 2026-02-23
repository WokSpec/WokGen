// Client-side only confetti helper. Must be called from 'use client' components.
// Gracefully no-ops if canvas-confetti is not available (SSR, old browser).

export type ConfettiPreset = 'generation' | 'milestone' | 'share';

const COLORS = ['#a78bfa', '#4f8ef7', '#34d399', '#f59e0b'];

export async function fireConfetti(preset: ConfettiPreset = 'generation'): Promise<void> {
  // Dynamic import — don't bundle unless called
  let confetti: (options?: import('canvas-confetti').Options) => Promise<undefined> | null;
  try {
    const mod = await import('canvas-confetti');
    confetti = mod.default as (options?: import('canvas-confetti').Options) => Promise<undefined> | null;
  } catch { return; }

  if (preset === 'generation') {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: COLORS });
  } else if (preset === 'milestone') {
    // Two side cannons
    confetti({ particleCount: 120, spread: 80, origin: { x: 0.1, y: 0.6 }, colors: COLORS });
    confetti({ particleCount: 120, spread: 80, origin: { x: 0.9, y: 0.6 }, colors: COLORS });
  } else if (preset === 'share') {
    confetti({ particleCount: 50, spread: 60, origin: { x: 0.5, y: 0.8 }, colors: COLORS });
  }
}
