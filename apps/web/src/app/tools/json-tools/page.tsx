import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'JSON Toolkit',
  description: 'Format, minify, validate, diff, and convert JSON to CSV or YAML. All client-side. Free.',
  openGraph: { title: 'JSON Toolkit — WokGen', description: 'Format, minify, validate, diff, and convert JSON to CSV or YAML. All client-side. Free.', type: 'website' },
};

import ToolShell from '@/components/tools/ToolShell';
import JsonTool from '@/components/tools/JsonTool';

export default function Page() {
  return (
    <ToolShell
      id="json-tools"
      label="JSON Toolkit"
      description="Format, validate, minify, diff, and convert JSON. All client-side — nothing leaves your browser."
      icon="{ }"
    >
      <JsonTool />
    </ToolShell>
  );
}
