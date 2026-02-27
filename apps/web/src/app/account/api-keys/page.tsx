export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import ApiKeysClient from './_client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'API Keys — WokGen',
  description: 'Manage personal access tokens for the WokGen API.',
};

export default function ApiKeysPage() {
  return <ErrorBoundary context="API Keys"><ApiKeysClient /></ErrorBoundary>;
}
