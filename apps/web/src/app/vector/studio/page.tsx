import type { Metadata } from 'next';
import VectorStudioClient from './_client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Vector Studio',
  description: 'Generate scalable SVG vector graphics and icons with AI. Professional vector art generation powered by WokGen.',
};

export default function VectorStudioPage() {
  return (
    <ErrorBoundary context="Vector Studio">
      <VectorStudioClient />
    </ErrorBoundary>
  );
}
