import { ErrorBoundary } from '@/components/ErrorBoundary';
import TextStudio from './_client';

export default function TextStudioPage() {
  return (
    <ErrorBoundary context="Text Studio">
      <TextStudio />
    </ErrorBoundary>
  );
}
