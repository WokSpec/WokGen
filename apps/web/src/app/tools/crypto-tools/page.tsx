'use client';
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
