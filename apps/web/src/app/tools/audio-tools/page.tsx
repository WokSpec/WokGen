'use client';
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
