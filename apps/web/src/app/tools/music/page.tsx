import type { Metadata } from 'next';
import { MusicClient } from './_client';

export const metadata: Metadata = {
  title: 'AI Music Generator — WokGen',
  description: 'Generate background music from text descriptions with MusicGen (Meta). Free via HuggingFace.',
};

export default function MusicPage() {
  return <MusicClient />;
}
