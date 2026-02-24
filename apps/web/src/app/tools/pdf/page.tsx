import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'PDF Toolkit',
  description: 'Merge, extract pages, and inspect PDF metadata. All browser-side with pdf-lib.',
  openGraph: { title: 'PDF Toolkit — WokGen', description: 'Merge, extract pages, and inspect PDF metadata. All browser-side with pdf-lib.', type: 'website' },
};
import dynamic from 'next/dynamic';
import ToolShell from '@/components/tools/ToolShell';

const PdfTool = dynamic(() => import('@/components/tools/PdfTool'), {
  loading: () => <div className="tool-page-root"><div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Loading PDF tools...</div></div>,
  ssr: false,
});

export default function Page() {
  return (
    <ToolShell
      id="pdf"
      label="PDF Toolkit"
      description="Merge, extract, convert, and watermark PDFs in your browser."
      icon="PDF"
    >
      <PdfTool />
    </ToolShell>
  );
}
