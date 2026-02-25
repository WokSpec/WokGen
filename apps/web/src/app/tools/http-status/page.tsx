import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'HTTP Status Codes', description: 'Quick reference for all HTTP status codes with descriptions.', openGraph: { title: 'HTTP Status Codes — WokGen', description: 'Quick reference for all HTTP status codes with descriptions.', type: 'website' } };

import ToolShell from '@/components/tools/ToolShell';
import HttpStatusTool from '@/components/tools/HttpStatusTool';

export default function Page() {
  return (
    <ToolShell id="http-status" label="HTTP Status" description="Quick reference for all HTTP status codes with descriptions." icon="HTTP">
      <HttpStatusTool />
    </ToolShell>
  );
}
