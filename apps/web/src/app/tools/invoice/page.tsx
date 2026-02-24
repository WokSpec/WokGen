import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Invoice Generator — WokGen',
  description: 'Create and print professional invoices right in your browser. No account required.',
};
import ToolShell from '@/components/tools/ToolShell';
import InvoiceGeneratorTool from '@/components/tools/InvoiceGeneratorTool';

export default function Page() {
  return (
    <ToolShell id="invoice" label="Invoice Generator" description="Create and print professional invoices right in your browser. No account required." icon="INV">
      <InvoiceGeneratorTool />
    </ToolShell>
  );
}
