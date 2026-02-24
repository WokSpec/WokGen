'use client';
import ToolShell from '@/components/tools/ToolShell';
import SnippetsTool from '@/components/tools/SnippetsTool';
export default function Page() {
  return (
    <ToolShell id="snippets" label="Code Snippet Manager" description="Save, tag, search, and preview code snippets with syntax highlighting. Stored in your browser. Import/export JSON." icon="📌">
      <SnippetsTool />
    </ToolShell>
  );
}
