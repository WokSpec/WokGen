import type { Metadata } from 'next';
import { InterrogateClient } from './_client';

export const metadata: Metadata = {
  title: 'Image Interrogator — WokGen',
  description: 'Reverse-engineer prompts from any image with BLIP AI. Free via HuggingFace.',
};

export default function InterrogatePage() {
  return <InterrogateClient />;
}
