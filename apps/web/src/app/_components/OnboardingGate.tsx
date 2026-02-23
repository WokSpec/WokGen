'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import OnboardingModal from './OnboardingModal';

// Routes where we never show the onboarding modal
const SKIP_ROUTES = new Set([
  '/login', '/register', '/api', '/billing', '/pricing', '/privacy', '/terms',
]);

export default function OnboardingGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    if ([...SKIP_ROUTES].some(r => pathname.startsWith(r))) return;

    fetch('/api/onboarding')
      .then(r => r.json())
      .then(({ state }) => {
        // Show modal if: no onboarding state, or step is 0 and not completed
        if (!state || (state.step === 0 && !state.completedAt)) {
          setShow(true);
        }
      })
      .catch(() => null);
  }, [status, session?.user?.id, pathname]);

  if (!show) return null;

  return <OnboardingModal onComplete={() => setShow(false)} />;
}
