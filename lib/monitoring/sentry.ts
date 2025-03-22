import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error reporting will not be sent to Sentry.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0, // Sample rate is lower in production
    environment: ENVIRONMENT,
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for profiling
        tracePropagationTargets: ['localhost', 'idocument.app'],
      }),
      new Sentry.Replay(),
    ],
    // Performance monitoring
    replaysSessionSampleRate: 0.1, // Percentage of sessions to record
    replaysOnErrorSampleRate: 1.0, // Record all sessions with errors
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: context ? { additionalContext: context } : undefined,
  });
}

export function captureMessage(message: string, level?: Sentry.SeverityLevel, context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    contexts: context ? { additionalContext: context } : undefined,
  });
}

export function setUserContext(userId: string | null, additionalData?: Record<string, any>) {
  if (userId) {
    Sentry.setUser({
      id: userId,
      ...additionalData,
    });
  } else {
    Sentry.setUser(null);
  }
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
}; 