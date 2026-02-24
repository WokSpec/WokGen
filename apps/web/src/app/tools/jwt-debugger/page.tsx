import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'JWT Debugger — WokGen',
  description: 'Decode and inspect JWT tokens. View header, payload, and expiry. No data leaves your browser.',
};
import ToolShell from '@/components/tools/ToolShell';
import JwtDebuggerTool from '@/components/tools/JwtDebuggerTool';

export default function Page() {
  return (
    <ToolShell id="jwt-debugger" label="JWT Debugger" description="Decode and inspect JWT tokens. View header, payload, and expiry. Entirely client-side — nothing is sent to a server." icon="JWT">
      <JwtDebuggerTool />
    </ToolShell>
  );
}
