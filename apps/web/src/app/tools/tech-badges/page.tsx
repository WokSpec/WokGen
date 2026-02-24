import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Tech Stack Badge Builder — WokGen',
  description: 'Select technologies and generate shields.io badge markdown for your README.',
};
import ToolShell from '@/components/tools/ToolShell';
import TechBadgesTool from '@/components/tools/TechBadgesTool';

export default function Page() {
  return (
    <ToolShell id="tech-badges" label="Tech Stack Badge Builder" description="Select technologies and generate shields.io badge markdown for your README or portfolio." icon="BD">
      <TechBadgesTool />
    </ToolShell>
  );
}
