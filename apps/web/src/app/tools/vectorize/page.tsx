import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Vectorize',
  description: 'Convert raster images to SVG using Vectorizer.AI',
};

import ToolShell from '@/components/tools/ToolShell';
import VectorizeTool from '@/components/tools/VectorizeTool';

export default function Page() {
  return (
    <ToolShell
      id="vectorize"
      label="Raster to SVG"
      description="Convert PNG, JPG, and GIF images into clean, scalable SVG vectors using Vectorizer.AI."
      icon="VZ"
    >
      <VectorizeTool />
    </ToolShell>
  );
}
