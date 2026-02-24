import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Markdown to HTML — WokGen',
  description: 'Paste Markdown and get rendered HTML with a live preview. Client-side, no upload needed.',
};
import ToolShell from '@/components/tools/ToolShell';
import MdToHtmlTool from '@/components/tools/MdToHtmlTool';

export default function Page() {
  return (
    <ToolShell id="md-to-html" label="Markdown to HTML" description="Paste Markdown and get rendered HTML with a live preview. Client-side, no upload needed." icon="MD">
      <MdToHtmlTool />
    </ToolShell>
  );
}
