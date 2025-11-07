import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Environment configuration
  environment: process.env.NODE_ENV || "development",

  // Enable performance monitoring for server-side
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Integrations for enhanced error tracking
  integrations: [
    // HTTP integration for request tracking
    Sentry.httpIntegration(),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.SENTRY_DSN) {
      return null;
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
      sensitiveHeaders.forEach((header) => {
        if (event.request?.headers?.[header]) {
          event.request.headers[header] = "REDACTED";
        }
      });
    }

    // Filter out URLs with sensitive data
    if (event.request?.url) {
      event.request.url = event.request.url.replace(
        /([?&])(token|key|password|secret)=[^&]*/gi,
        "$1$2=REDACTED"
      );
    }

    // Filter out sensitive data from request body
    if (event.request?.data) {
      const sensitiveFields = ["password", "token", "secret", "apiKey"];
      const data = typeof event.request.data === "string"
        ? JSON.parse(event.request.data)
        : event.request.data;

      sensitiveFields.forEach((field) => {
        if (data?.[field]) {
          data[field] = "REDACTED";
        }
      });

      event.request.data = data;
    }

    return event;
  },

  // Add additional context to all events
  initialScope: {
    tags: {
      runtime: "nodejs",
    },
  },
});
