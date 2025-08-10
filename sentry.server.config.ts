import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.npm_package_version,
  
  // Server-specific configuration
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: undefined }),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Add server context
    if (event.request) {
      event.tags = {
        ...event.tags,
        component: "server"
      };
    }
    return event;
  }
});