import type { Metadata } from 'next';
import { UpscaleClient } from './_client';

export const metadata: Metadata = {
  title: '4× Image Upscaler — WokGen',
  description: 'Sharpen and enlarge images up to 4× with Real-ESRGAN AI. Free, no limits.',
};

export default function UpscalePage() {
  return <UpscaleClient />;
}
