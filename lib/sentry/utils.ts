import * as Sentry from "@sentry/nextjs";

/**
 * Set user context for Sentry error reporting
 * Call this when user logs in or user info changes
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

/**
 * Clear user context from Sentry
 * Call this when user logs out
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom tags to the current Sentry scope
 * Useful for categorizing errors
 */
export function setSentryTags(tags: Record<string, string | number | boolean>) {
  Sentry.setTags(tags);
}

/**
 * Add custom context data to the current Sentry scope
 * Useful for debugging with additional application state
 */
export function setSentryContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * Add a breadcrumb to the current Sentry scope
 * Breadcrumbs help understand the sequence of events leading to an error
 */
export function addSentryBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level?: "fatal" | "error" | "warning" | "info" | "debug"
) {
  Sentry.addBreadcrumb({
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Manually capture an exception
 * Use this for caught errors that you still want to report
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, any>;
    level?: "fatal" | "error" | "warning" | "info" | "debug";
  }
) {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || "error",
  });
}

/**
 * Manually capture a message
 * Use this for logging important events or non-error issues
 */
export function captureMessage(
  message: string,
  context?: {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, any>;
    level?: "fatal" | "error" | "warning" | "info" | "debug";
  }
) {
  return Sentry.captureMessage(message, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || "info",
  });
}

/**
 * Wrap an async function with Sentry error handling
 * Any errors thrown will be automatically reported
 */
export function withSentry<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    name?: string;
    tags?: Record<string, string | number | boolean>;
  }
): T {
  return ((...args: Parameters<T>) => {
    return Sentry.startSpan(
      {
        name: options?.name || fn.name || "anonymous",
        op: "function",
      },
      async () => {
        try {
          if (options?.tags) {
            setSentryTags(options.tags);
          }
          return await fn(...args);
        } catch (error) {
          captureException(error as Error);
          throw error;
        }
      }
    );
  }) as T;
}

/**
 * Create a new Sentry transaction for performance monitoring
 * Use this to track the performance of specific operations
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Flush Sentry events before process exit
 * Useful in serverless environments
 */
export async function flushSentry(timeout = 2000) {
  await Sentry.flush(timeout);
}
