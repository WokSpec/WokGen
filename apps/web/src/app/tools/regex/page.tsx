import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Regex Tester',
  description: 'Test regular expressions with live match highlighting. Group captures. Common presets.',
  openGraph: { title: 'Regex Tester — WokGen', description: 'Test regular expressions with live match highlighting. Group captures. Common presets.', type: 'website' },
};

import ToolShell from '@/components/tools/ToolShell';
import RegexTool from '@/components/tools/RegexTool';

export default function Page() {
  return (
    <ToolShell
      id="regex"
      label="Regex Tester"
      description="Test regular expressions with live match highlighting, group captures, and an explanation of your pattern."
      icon="🔍"
    >
      <RegexTool />
    </ToolShell>
  );
}
