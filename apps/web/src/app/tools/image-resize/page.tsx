import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Image Resizer',
  description: 'Resize images to any dimension or pick from social media presets. Free browser tool.',
  openGraph: { title: 'Image Resizer — WokGen', description: 'Resize images to any dimension or pick from social media presets. Free browser tool.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import ImageResizeTool from '@/components/tools/ImageResizeTool';

export default function Page() {
  return (
    <ToolShell
      id="image-resize"
      label="Image Resizer"
      description="Resize and crop images with social media presets."
      icon="↔️"
    >
      <ImageResizeTool />
    </ToolShell>
  );
}
