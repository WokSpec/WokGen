import type { Metadata } from 'next';
import ToolShell from '@/components/tools/ToolShell';
import WhiteboardClient from './_client';

export const metadata: Metadata = {
  title: 'Infinite Whiteboard',
  description: 'Free infinite canvas powered by tldraw. Shapes, arrows, stickies, freehand. Auto-saves locally.',
  openGraph: { title: 'Infinite Whiteboard — WokGen', description: 'Free infinite canvas powered by tldraw. Shapes, arrows, stickies, freehand. Auto-saves locally.', type: 'website' },
};

export default function Page() {
  return (
    <ToolShell
      id="whiteboard"
      label="Infinite Whiteboard"
      description="Open-source infinite canvas powered by tldraw. Shapes, arrows, sticky notes, freehand drawing. Auto-saves to your browser."
      icon="🖊️"
    >
      <WhiteboardClient />
    </ToolShell>
  );
}
