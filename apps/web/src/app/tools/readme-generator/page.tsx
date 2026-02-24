import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'README Generator — WokGen',
  description: 'Fill in project details and generate a professional README.md instantly.',
};
import ToolShell from '@/components/tools/ToolShell';
import ReadmeGeneratorTool from '@/components/tools/ReadmeGeneratorTool';

export default function Page() {
  return (
    <ToolShell id="readme-generator" label="README Generator" description="Fill in project details and generate a professional README.md instantly." icon="MD">
      <ReadmeGeneratorTool />
    </ToolShell>
  );
}
