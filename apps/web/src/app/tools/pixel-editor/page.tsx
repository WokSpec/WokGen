import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Pixel Art Editor',
  description: 'Browser-based pixel art editor with grid, color palette, pencil/fill/eraser tools. Export PNG.',
  openGraph: { title: 'Pixel Art Editor — WokGen', description: 'Browser-based pixel art editor with grid, color palette, pencil/fill/eraser tools. Export PNG.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import PixelEditorTool from '@/components/tools/PixelEditorTool';
export default function Page() {
  return (
    <ToolShell id="pixel-editor" label="Pixel Art Editor" description="Browser-based pixel art editor with grid canvas, pencil, fill, eraser, and palette. Export PNG." icon="🖍️">
      <PixelEditorTool />
    </ToolShell>
  );
}
