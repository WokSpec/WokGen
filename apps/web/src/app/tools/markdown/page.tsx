import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Markdown Editor',
  description: 'Split-pane markdown editor with live GFM preview. Export HTML. Word count.',
  openGraph: { title: 'Markdown Editor — WokGen', description: 'Split-pane markdown editor with live GFM preview. Export HTML. Word count.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import MarkdownTool from '@/components/tools/MarkdownTool';

export default function Page() {
  return (
    <ToolShell
      id="markdown"
      label="Markdown Editor"
      description="Split-pane editor with live preview, GFM support, toolbar, and export."
      icon="📝"
    >
      <MarkdownTool />
    </ToolShell>
  );
}
