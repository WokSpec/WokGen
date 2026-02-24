'use client';

import { useEffect, useRef } from 'react';
import ToolShell from '@/components/tools/ToolShell';
import 'tldraw/tldraw.css';

export default function Page() {
  return (
    <ToolShell
      id="whiteboard"
      label="Infinite Whiteboard"
      description="Open-source infinite canvas powered by tldraw. Shapes, arrows, sticky notes, freehand drawing. Auto-saves to your browser."
      icon="🖊️"
    >
      <WhiteboardTool />
    </ToolShell>
  );
}

function WhiteboardTool() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let unmountFn: (() => void) | undefined;

    async function init() {
      const container = containerRef.current;
      if (!container || !mounted) return;
      const { Tldraw } = await import('tldraw');
      const { createRoot } = await import('react-dom/client');
      const { createElement } = await import('react');
      if (!mounted) return;
      const root = createRoot(container);
      root.render(
        createElement(Tldraw, {
          persistenceKey: 'wokgen-whiteboard',
        } as Parameters<typeof Tldraw>[0])
      );
      unmountFn = () => root.unmount();
    }

    init();
    return () => { mounted = false; unmountFn?.(); };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '75vh', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
    />
  );
}
