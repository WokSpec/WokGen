// Sentry server-side instrumentation
// Called by Next.js on the server (Node.js runtime).
// Set NEXT_PUBLIC_SENTRY_DSN to enable. No-op if unset.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV ?? 'development',
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  // Avoid leaking internal details in production
  sendDefaultPii: false,
  beforeSend(event) {
    // Strip PII: email, token fields
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
