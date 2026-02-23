// Sentry client-side instrumentation
// Loaded in the browser. Set NEXT_PUBLIC_SENTRY_DSN to enable.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  environment: process.env.NODE_ENV ?? 'development',
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  sendDefaultPii: false,
});
