import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Timestamp Converter', description: 'Convert between Unix timestamps, ISO 8601, UTC, and local time.', openGraph: { title: 'Timestamp Converter — WokGen', description: 'Convert between Unix timestamps, ISO 8601, UTC, and local time.', type: 'website' } };

import ToolShell from '@/components/tools/ToolShell';
import TimestampTool from '@/components/tools/TimestampTool';

export default function Page() {
  return (
    <ToolShell id="timestamp" label="Timestamp" description="Convert between Unix timestamps, ISO 8601, UTC, and local time." icon="TS">
      <TimestampTool />
    </ToolShell>
  );
}
