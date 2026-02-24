'use client';
import ToolShell from '@/components/tools/ToolShell';
import FontPairerTool from '@/components/tools/FontPairerTool';
export default function Page() {
  return (
    <ToolShell id="font-pairer" label="Font Pairer" description="10 curated Google Font pairings. Live preview with your own text. Copy CSS variables and import URLs instantly." icon="🔤">
      <FontPairerTool />
    </ToolShell>
  );
}
