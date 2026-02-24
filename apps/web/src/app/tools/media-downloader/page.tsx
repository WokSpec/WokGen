import type { Metadata } from 'next';
import MediaDownloaderTool from '@/components/tools/MediaDownloaderTool';

export const metadata: Metadata = {
  title: 'Media Downloader — WokGen Tools',
  description: 'Download images, audio, and video from any public URL. Supports direct file links and HTML pages with media.',
};

export default function MediaDownloaderPage() {
  return <MediaDownloaderTool />;
}
