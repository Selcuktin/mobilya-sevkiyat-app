import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.npm_package_version,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message) {
        // Skip network errors
        if (error.message.includes('Network Error')) {
          return null;
        }
        // Skip cancelled requests
        if (error.message.includes('AbortError')) {
          return null;
        }
      }
    }
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: "client"
    }
  }
});