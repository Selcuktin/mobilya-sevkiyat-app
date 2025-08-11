import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.npm_package_version,
  
  // Server-specific configuration
  integrations: [
    Sentry.httpIntegration(),
  ],

  // Error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint?.originalException;
      const message = error instanceof Error ? error.message : String(error);
      
      // Skip network errors
      if (message.includes('Network Error')) {
        return null;
      }
      // Skip cancelled requests
      if (message.includes('AbortError')) {
        return null;
      }
      // Skip database connection errors in development
      if (process.env.NODE_ENV === 'development' && message.includes('ECONNREFUSED')) {
        return null;
      }
    }
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: "server"
    }
  }
});