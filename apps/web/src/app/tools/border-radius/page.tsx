import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Border Radius Visualizer',
  description: 'Interactive border-radius builder with per-corner sliders. Live preview and one-click CSS copy.',
  openGraph: { title: 'Border Radius Visualizer — WokGen', description: 'Interactive border-radius builder. Live preview and copy CSS.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import BorderRadiusTool from '@/components/tools/BorderRadiusTool';

export default function Page() {
  return (
    <ToolShell id="border-radius" label="Border Radius Visualizer" description="Interactive border-radius builder with individual corner sliders. Live preview and copy CSS." icon="BR">
      <BorderRadiusTool />
    </ToolShell>
  );
}
