import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'JSON to TypeScript Types — WokGen',
  description: 'Paste any JSON and instantly get TypeScript interface/type definitions. Client-side.',
};
import ToolShell from '@/components/tools/ToolShell';
import JsonToTypesTool from '@/components/tools/JsonToTypesTool';

export default function Page() {
  return (
    <ToolShell id="json-to-types" label="JSON to TypeScript Types" description="Paste any JSON and instantly get TypeScript interface/type definitions. Client-side." icon="TS">
      <JsonToTypesTool />
    </ToolShell>
  );
}
