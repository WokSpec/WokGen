import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Open Graph Preview',
  description: 'Preview how your URL looks on Twitter, Facebook, LinkedIn, Discord, and Slack. Free.',
  openGraph: { title: 'Open Graph Preview — WokGen', description: 'Preview how your URL looks on Twitter, Facebook, LinkedIn, Discord, and Slack. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import OgPreviewTool from '@/components/tools/OgPreviewTool';

export default function Page() {
  return (
    <ToolShell
      id="og-preview"
      label="Open Graph Preview"
      description="Preview how your link looks on Twitter, Facebook, LinkedIn, Discord, and Slack."
      icon="👁️"
    >
      <OgPreviewTool />
    </ToolShell>
  );
}
