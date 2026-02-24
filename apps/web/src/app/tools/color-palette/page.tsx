import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Color Palette Extractor',
  description: 'Extract dominant colors from any image. Export as CSS variables, JSON, or Tailwind config.',
  openGraph: { title: 'Color Palette Extractor — WokGen', description: 'Extract dominant colors from any image. Export as CSS variables, JSON, or Tailwind config.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import ColorPaletteTool from '@/components/tools/ColorPaletteTool';

export default function Page() {
  return (
    <ToolShell
      id="color-palette"
      label="Color Palette Extractor"
      description="Extract dominant colors from any image. Export as CSS variables, Tailwind, JSON, or SCSS."
      icon="🎨"
    >
      <ColorPaletteTool />
    </ToolShell>
  );
}
