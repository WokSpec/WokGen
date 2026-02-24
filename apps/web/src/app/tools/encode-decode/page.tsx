import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Encode / Decode',
  description: 'Base64, URL encode, HTML entities, JWT decode, Morse code, ROT13. All in one tool.',
  openGraph: { title: 'Encode / Decode — WokGen', description: 'Base64, URL encode, HTML entities, JWT decode, Morse code, ROT13. All in one tool.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import EncodeTool from '@/components/tools/EncodeTool';
export default function Page() {
  return (
    <ToolShell id="encode-decode" label="Encode / Decode" description="Base64, URL encoding, HTML entities, Unicode escape, JWT decoder, Morse code." icon="🔐">
      <EncodeTool />
    </ToolShell>
  );
}
