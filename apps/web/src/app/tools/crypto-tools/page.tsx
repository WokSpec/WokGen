import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Crypto & Web3 Utils',
  description: 'QR code generator, wallet address validator (BTC/ETH/SOL/XMR), hex/dec/bin converter.',
  openGraph: { title: 'Crypto & Web3 Utils — WokGen', description: 'QR code generator, wallet address validator (BTC/ETH/SOL/XMR), hex/dec/bin converter.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import CryptoUtilsTool from '@/components/tools/CryptoUtilsTool';

export default function Page() {
  return (
    <ToolShell
      id="crypto-tools"
      label="Crypto / Web3 Utils"
      description="QR codes, wallet validators, ENS lookup, and hex converters."
      icon="₿"
    >
      <CryptoUtilsTool />
    </ToolShell>
  );
}
