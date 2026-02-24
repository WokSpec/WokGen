import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Changelog Writer — WokGen',
  description: 'Paste git log output or bullet points and get a properly formatted CHANGELOG.md entry.',
};
import ToolShell from '@/components/tools/ToolShell';
import ChangelogWriterTool from '@/components/tools/ChangelogWriterTool';

export default function Page() {
  return (
    <ToolShell id="changelog-writer" label="Changelog Writer" description="Paste git log output or bullet points and get a properly formatted CHANGELOG.md entry." icon="CL">
      <ChangelogWriterTool />
    </ToolShell>
  );
}
