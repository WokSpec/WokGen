import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Word Counter', description: 'Count words, characters, sentences, and estimate reading time.', openGraph: { title: 'Word Counter — WokGen', description: 'Count words, characters, sentences, and estimate reading time.', type: 'website' } };

import ToolShell from '@/components/tools/ToolShell';
import WordCounterTool from '@/components/tools/WordCounterTool';

export default function Page() {
  return (
    <ToolShell id="word-counter" label="Word Counter" description="Count words, characters, sentences, and estimate reading time." icon="WC">
      <WordCounterTool />
    </ToolShell>
  );
}
