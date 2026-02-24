import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Code Snippet Manager',
  description: 'Save and search code snippets with syntax highlighting. 20+ languages. Stored in your browser.',
  openGraph: { title: 'Code Snippet Manager — WokGen', description: 'Save and search code snippets with syntax highlighting. 20+ languages. Stored in your browser.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import SnippetsTool from '@/components/tools/SnippetsTool';
export default function Page() {
  return (
    <ToolShell id="snippets" label="Code Snippet Manager" description="Save, tag, search, and preview code snippets with syntax highlighting. Stored in your browser. Import/export JSON." icon="📌">
      <SnippetsTool />
    </ToolShell>
  );
}
