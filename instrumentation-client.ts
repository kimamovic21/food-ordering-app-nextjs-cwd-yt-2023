import * as Sentry from '@sentry/nextjs';

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: isDevelopment ? 1.0 : 0.1,
  replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^\//, /^https:\/\/foacwd\.vercel\.app/],
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
