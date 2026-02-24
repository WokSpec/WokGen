import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'CSS Generator',
  description: 'Build gradients, glassmorphism, shadows, borders with live preview. Copy CSS instantly.',
  openGraph: { title: 'CSS Generator — WokGen', description: 'Build gradients, glassmorphism, shadows, borders with live preview. Copy CSS instantly.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import CssGeneratorTool from '@/components/tools/CssGeneratorTool';
export default function Page() {
  return (
    <ToolShell id="css-generator" label="CSS Generator Suite" description="Gradient, glassmorphism, box shadow, border radius, and animation builders." icon="✨">
      <CssGeneratorTool />
    </ToolShell>
  );
}
