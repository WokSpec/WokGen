'use client';
import ToolShell from '@/components/tools/ToolShell';
import TilemapTool from '@/components/tools/TilemapTool';
export default function Page() {
  return (
    <ToolShell id="tilemap" label="Tilemap Generator" description="Upload a tileset, paint tiles across layers, export Tiled-compatible JSON." icon="🗺️">
      <TilemapTool />
    </ToolShell>
  );
}
