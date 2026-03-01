import type { Metadata } from 'next';
import OnboardingClient from './_client';

export const metadata: Metadata = { title: 'Get Started | WokGen' };

export default function OnboardingPage() {
  return <OnboardingClient />;
}
