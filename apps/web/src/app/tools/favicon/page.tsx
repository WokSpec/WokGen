import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Favicon Generator',
  description: 'Generate favicon.ico, PNG icons, apple-touch-icon and web app manifest from any image. Free.',
  openGraph: { title: 'Favicon Generator — WokGen', description: 'Generate favicon.ico, PNG icons, apple-touch-icon and web app manifest from any image. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import FaviconTool from '@/components/tools/FaviconTool';

export default function Page() {
  return (
    <ToolShell
      id="favicon"
      label="Favicon Generator"
      description="Generate favicon.ico and PNG variants from any image."
      icon="FAV"
    >
      <FaviconTool />
    </ToolShell>
  );
}
