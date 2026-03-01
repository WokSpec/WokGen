import type { Metadata } from 'next';
import { PromptLabClient } from './_client';

export const metadata: Metadata = {
  title: 'Prompt Lab — WokGen',
  description: 'AI-powered prompt engineering for pixel art, vectors, UI, voice, music, and code.',
};

export default function PromptLabPage() {
  return <PromptLabClient />;
}
