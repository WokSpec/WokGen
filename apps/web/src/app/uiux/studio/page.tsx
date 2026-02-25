import { ErrorBoundary } from '@/components/ErrorBoundary';
import UIUXStudio from './_client';

export default function UIUXStudioPage() {
  return (
    <ErrorBoundary context="UI/UX Studio">
      <UIUXStudio />
    </ErrorBoundary>
  );
}
