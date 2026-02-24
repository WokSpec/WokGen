import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Image Compressor',
  description: 'Compress images with quality control. Live before/after size preview. Free, browser-native.',
  openGraph: { title: 'Image Compressor — WokGen', description: 'Compress images with quality control. Live before/after size preview. Free, browser-native.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import ImageCompressTool from '@/components/tools/ImageCompressTool';

export default function Page() {
  return (
    <ToolShell
      id="image-compress"
      label="Image Compressor"
      description="Compress images with a quality slider. Live before/after size comparison."
      icon="🗜️"
    >
      <ImageCompressTool />
    </ToolShell>
  );
}
