import { ErrorBoundary } from '@/components/ErrorBoundary';
import VoiceStudioPage from './_client';

export default function VoiceStudio() {
  return (
    <ErrorBoundary context="Voice Studio">
      <VoiceStudioPage />
    </ErrorBoundary>
  );
}
