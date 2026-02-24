import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Developer Generators',
  description: 'UUID v4/v7, secure passwords, Lorem ipsum, CRON builder, timestamps, text diff.',
  openGraph: { title: 'Developer Generators — WokGen', description: 'UUID v4/v7, secure passwords, Lorem ipsum, CRON builder, timestamps, text diff.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import GeneratorsTool from '@/components/tools/GeneratorsTool';
export default function Page() {
  return (
    <ToolShell id="generators" label="Developer Generators" description="UUID, password generator, Lorem ipsum, CRON builder, timestamp converter, diff." icon="⚡">
      <GeneratorsTool />
    </ToolShell>
  );
}
