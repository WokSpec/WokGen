'use client';
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
