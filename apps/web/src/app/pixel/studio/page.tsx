import type { Metadata } from 'next';
import PixelStudioClient from './_client';

export const metadata: Metadata = {
  title: 'Pixel Art Studio',
  description: 'Create pixel art sprites, tilesets, and game assets with AI. Professional pixel art generation powered by WokGen.',
};

export default function PixelStudioPage() {
  return <PixelStudioClient />;
}
