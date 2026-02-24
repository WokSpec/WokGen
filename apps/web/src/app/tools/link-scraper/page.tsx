import type { Metadata } from 'next';
import LinkScraperTool from '@/components/tools/LinkScraperTool';

export const metadata: Metadata = {
  title: 'Link Scraper — WokGen Tools',
  description: 'Extract all links, images, meta tags, and assets from any public webpage.',
};

export default function LinkScraperPage() {
  return <LinkScraperTool />;
}
