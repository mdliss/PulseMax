import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { captureException } from "./utils";

/**
 * Wraps API route handlers with Sentry error tracking
 * Automatically captures and reports any errors that occur
 *
 * Usage:
 * export const GET = withSentryApiHandler(async (req: NextRequest) => {
 *   // Your API logic here
 *   return NextResponse.json({ data: "..." });
 * });
 */
export function withSentryApiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const route = req.nextUrl.pathname;

    return await Sentry.withServerActionInstrumentation(
      "api.route",
      {
        recordResponse: true,
      },
      async () => {
        try {
          // Add request context to Sentry
          Sentry.setContext("request", {
            url: req.url,
            method: req.method,
            headers: Object.fromEntries(req.headers.entries()),
            route,
          });

          // Add breadcrumb for API call
          Sentry.addBreadcrumb({
            category: "api",
            message: `${req.method} ${route}`,
            level: "info",
          });

          // Execute the handler
          const response = await handler(req, context);

          // Track response status
          if (response.status >= 400) {
            Sentry.addBreadcrumb({
              category: "api.error",
              message: `API returned ${response.status}`,
              level: "warning",
              data: {
                status: response.status,
                route,
              },
            });
          }

          return response;
        } catch (error) {
          // Capture the error with additional context
          captureException(error as Error, {
            tags: {
              route,
              method: req.method,
            },
            extra: {
              url: req.url,
              searchParams: Object.fromEntries(req.nextUrl.searchParams),
            },
            level: "error",
          });

          // Return error response
          return NextResponse.json(
            {
              error: "Internal Server Error",
              message:
                process.env.NODE_ENV === "development"
                  ? (error as Error).message
                  : "An unexpected error occurred",
            },
            { status: 500 }
          );
        }
      }
    );
  };
}

/**
 * Wraps Server Actions with Sentry error tracking
 * Use this for Next.js Server Actions
 *
 * Usage:
 * export const myAction = withSentryAction(async (formData: FormData) => {
 *   "use server";
 *   // Your server action logic here
 * });
 */
export function withSentryAction<T extends (...args: any[]) => any>(
  action: T,
  options?: {
    name?: string;
    tags?: Record<string, string | number | boolean>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    return await Sentry.withServerActionInstrumentation(
      options?.name || action.name || "server.action",
      {
        recordResponse: true,
      },
      async () => {
        try {
          if (options?.tags) {
            Sentry.setTags(options.tags);
          }

          return await action(...args);
        } catch (error) {
          captureException(error as Error, {
            tags: options?.tags,
            level: "error",
          });
          throw error;
        }
      }
    );
  }) as T;
}
