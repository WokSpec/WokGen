import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Color Utilities',
  description: 'Convert hex/RGB/HSL, check WCAG contrast ratios, generate color harmonies. Free.',
  openGraph: { title: 'Color Utilities — WokGen', description: 'Convert hex/RGB/HSL, check WCAG contrast ratios, generate color harmonies. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import ColorTool from '@/components/tools/ColorTool';
export default function Page() {
  return (
    <ToolShell id="color-tools" label="Color Utilities" description="Hex/RGB/HSL/OKLCH converter, WCAG contrast checker, color harmonies, and palette generator." icon="🌈">
      <ColorTool />
    </ToolShell>
  );
}
