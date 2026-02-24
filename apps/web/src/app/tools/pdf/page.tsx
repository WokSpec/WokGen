import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'PDF Toolkit',
  description: 'Merge, extract pages, and inspect PDF metadata. All browser-side with pdf-lib.',
  openGraph: { title: 'PDF Toolkit — WokGen', description: 'Merge, extract pages, and inspect PDF metadata. All browser-side with pdf-lib.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import PdfTool from '@/components/tools/PdfTool';

export default function Page() {
  return (
    <ToolShell
      id="pdf"
      label="PDF Toolkit"
      description="Merge, extract, convert, and watermark PDFs in your browser."
      icon="📄"
    >
      <PdfTool />
    </ToolShell>
  );
}
