import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Link Checker — WokGen',
  description: 'Check HTTP status codes for a list of URLs. Runs entirely in your browser.',
};

import ToolShell from '@/components/tools/ToolShell';
import LinkCheckerTool from '@/components/tools/LinkCheckerTool';

export default function Page() {
  return (
    <ToolShell id="link-checker" label="Link Checker" description="Check HTTP status codes for a list of URLs. Runs entirely in your browser." icon="LK">
      <LinkCheckerTool />
    </ToolShell>
  );
}
