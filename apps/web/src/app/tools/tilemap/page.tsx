import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Tilemap Generator',
  description: 'Paint tilemaps with layers. Export Tiled-compatible JSON. Upload any tileset PNG.',
  openGraph: { title: 'Tilemap Generator — WokGen', description: 'Paint tilemaps with layers. Export Tiled-compatible JSON. Upload any tileset PNG.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import TilemapTool from '@/components/tools/TilemapTool';
export default function Page() {
  return (
    <ToolShell id="tilemap" label="Tilemap Generator" description="Upload a tileset, paint tiles across layers, export Tiled-compatible JSON." icon="🗺️">
      <TilemapTool />
    </ToolShell>
  );
}
