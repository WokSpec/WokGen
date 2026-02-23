'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient instance is stable per-component-tree (not per-render)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:       30_000,    // 30s before re-fetch
        gcTime:          5 * 60_000, // 5min cache retention
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
