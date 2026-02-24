import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Privacy Policy Generator — WokGen',
  description: 'Generate a privacy policy for your website from a simple form. Copy or download as .txt.',
};
import ToolShell from '@/components/tools/ToolShell';
import PrivacyPolicyTool from '@/components/tools/PrivacyPolicyTool';

export default function Page() {
  return (
    <ToolShell id="privacy-policy" label="Privacy Policy Generator" description="Generate a privacy policy for your website from a simple form. Copy or download as .txt." icon="PP">
      <PrivacyPolicyTool />
    </ToolShell>
  );
}
