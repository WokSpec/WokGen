import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Text Utilities',
  description: 'Word count, case converter, slug generator, deduplicator, email extractor. Free.',
  openGraph: { title: 'Text Utilities — WokGen', description: 'Word count, case converter, slug generator, deduplicator, email extractor. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import TextTool from '@/components/tools/TextTool';
export default function Page() {
  return (
    <ToolShell id="text-tools" label="Text Utilities" description="Word counter, case formats, slug generator, dedup lines, extract URLs and emails." icon="✍️">
      <TextTool />
    </ToolShell>
  );
}
