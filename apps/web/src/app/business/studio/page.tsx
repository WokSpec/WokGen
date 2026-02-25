import { ErrorBoundary } from '@/components/ErrorBoundary';
import BusinessStudio from './_client';

export default function BusinessStudioPage() {
  return (
    <ErrorBoundary context="Business Studio">
      <BusinessStudio />
    </ErrorBoundary>
  );
}
