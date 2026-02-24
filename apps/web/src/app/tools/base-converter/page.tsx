import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Base Converter — WokGen',
  description: 'Convert numbers between binary, octal, decimal, and hexadecimal instantly.',
};
import ToolShell from '@/components/tools/ToolShell';
import BaseConverterTool from '@/components/tools/BaseConverterTool';

export default function Page() {
  return (
    <ToolShell id="base-converter" label="Base Converter" description="Convert numbers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16)." icon="0x">
      <BaseConverterTool />
    </ToolShell>
  );
}
