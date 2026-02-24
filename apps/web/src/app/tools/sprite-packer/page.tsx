import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Sprite Sheet Packer',
  description: 'Pack sprites into an optimized atlas. Export PNG + TexturePacker/CSS/JSON manifest. Free.',
  openGraph: { title: 'Sprite Sheet Packer — WokGen', description: 'Pack sprites into an optimized atlas. Export PNG + TexturePacker/CSS/JSON manifest. Free.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import SpritePackerTool from '@/components/tools/SpritePackerTool';
export default function Page() {
  return (
    <ToolShell id="sprite-packer" label="Sprite Sheet Packer" description="Upload PNGs → packed atlas with shelf algorithm. Export PNG + TexturePacker/CSS manifest. 100% browser-side." icon="🎮">
      <SpritePackerTool />
    </ToolShell>
  );
}
