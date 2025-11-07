"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that integrates with Sentry
 * Catches React component errors and reports them to Sentry
 *
 * Usage:
 * <SentryErrorBoundary>
 *   <YourComponent />
 * </SentryErrorBoundary>
 */
export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry with component stack
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Show Sentry dialog if enabled
    if (this.props.showDialog) {
      Sentry.showReportDialog({
        eventId: Sentry.lastEventId() || undefined,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-red-900">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-red-700">
              We&apos;re sorry for the inconvenience. The error has been reported to our team.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
