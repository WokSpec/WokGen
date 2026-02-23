import type { Metadata } from 'next';
import ApiKeysClient from './_client';

export const metadata: Metadata = {
  title: 'API Keys — WokGen',
  description: 'Manage personal access tokens for the WokGen API.',
};

export default function ApiKeysPage() {
  return <ApiKeysClient />;
}
