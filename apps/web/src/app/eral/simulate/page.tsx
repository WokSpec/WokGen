import type { Metadata } from 'next';
import SimulateClient from './_client';

export const metadata: Metadata = {
  title: 'Agent Simulate — WokGen Eral',
  description: 'Simulate multi-agent AI conversations. Roast battles, debates, brainstorms — any scenario with any personas.',
};

export default function SimulatePage() {
  return <SimulateClient />;
}
