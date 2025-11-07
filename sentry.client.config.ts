import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Environment configuration
  environment: process.env.NODE_ENV || "development",

  // Capture 100% of errors, 10% of sessions for replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Integrations for enhanced error tracking
  integrations: [
    // Session Replay for visual debugging
    Sentry.replayIntegration({
      maskAllText: false, // Set to true in production if needed
      blockAllMedia: false,
      maskAllInputs: true, // Always mask input fields for security
    }),
    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration({
      enableLongTask: true,
      enableInp: true,
    }),
    // Breadcrumbs for better context
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),
  ],

  // Ignore common errors that aren't actionable
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    // Random network errors
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    // React hydration errors (usually not actionable)
    "Minified React error",
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }

    // Filter out URLs with sensitive data
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/([?&])(token|key|password|secret)=[^&]*/gi, "$1$2=REDACTED");
    }

    return event;
  },

  // Add additional context to all events
  initialScope: {
    tags: {
      runtime: "browser",
    },
  },
});
