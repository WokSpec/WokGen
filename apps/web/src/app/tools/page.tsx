import type { Metadata } from 'next';
import ToolsClient from './_client';

export const metadata: Metadata = {
  title: 'AI Tools',
  description: 'Explore all AI-powered creative tools on WokGen — pixel art, vector graphics, voice, image generation, and more.',
};

export default function ToolsPage() {
  return <ToolsClient />;
}
