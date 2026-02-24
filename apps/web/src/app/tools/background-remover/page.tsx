import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Background Remover',
  description: 'Remove backgrounds from images instantly in your browser. Powered by AI WASM. No uploads, 100% private and free.',
  openGraph: { title: 'Background Remover — WokGen', description: 'Remove backgrounds from images instantly in your browser. Powered by AI WASM. No uploads, 100% private and free.', type: 'website' },
};

import ToolShell from '@/components/tools/ToolShell';
import BackgroundRemoverTool from '@/components/tools/BackgroundRemoverTool';

export default function Page() {
  return (
    <ToolShell
      id="background-remover"
      label="Background Remover"
      description="Remove backgrounds from images instantly. 100% browser-side — no upload, completely private."
      icon="✂️"
    >
      <BackgroundRemoverTool />
    </ToolShell>
  );
}
