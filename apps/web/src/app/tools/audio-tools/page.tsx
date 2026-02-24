import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Audio Utilities',
  description: 'Waveform visualizer, audio file info, GIF frame creator. Browser-native.',
  openGraph: { title: 'Audio Utilities — WokGen', description: 'Waveform visualizer, audio file info, GIF frame creator. Browser-native.', type: 'website' },
};
import ToolShell from '@/components/tools/ToolShell';
import AudioTool from '@/components/tools/AudioTool';

export default function Page() {
  return (
    <ToolShell
      id="audio-tools"
      label="Audio Utilities"
      description="Waveform visualizer, audio file metadata, and GIF frame builder."
      icon="🔊"
    >
      <AudioTool />
    </ToolShell>
  );
}
