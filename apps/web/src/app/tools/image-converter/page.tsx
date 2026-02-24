import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Image Converter',
  description: 'Convert PNG, JPG, WebP, AVIF images in bulk. Browser-only, no upload required. Free.',
  openGraph: { title: 'Image Converter — WokGen', description: 'Convert PNG, JPG, WebP, AVIF images in bulk. Browser-only, no upload required. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import ImageConverterTool from '@/components/tools/ImageConverterTool';

export default function Page() {
  return (
    <ToolShell
      id="image-converter"
      label="Image Converter"
      description="Convert between PNG, JPG, WebP, GIF, and AVIF. Batch up to 10 files."
      icon="🔄"
    >
      <ImageConverterTool />
    </ToolShell>
  );
}
