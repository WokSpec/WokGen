import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Device Mockup Generator',
  description: 'Wrap your screenshot in MacBook, iPhone, iPad, or browser frames. Export PNG. Free.',
  openGraph: { title: 'Device Mockup Generator — WokGen', description: 'Wrap your screenshot in MacBook, iPhone, iPad, or browser frames. Export PNG. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import MockupTool from '@/components/tools/MockupTool';
export default function Page() {
  return (
    <ToolShell id="mockup" label="Mockup Generator" description="Drop your screenshot into MacBook, iPhone, iPad, or browser frames. Export at 1200px. All in your browser." icon="🖥️">
      <MockupTool />
    </ToolShell>
  );
}
