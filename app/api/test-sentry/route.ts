import { NextRequest, NextResponse } from "next/server";
import { captureException, captureMessage } from "@/lib/sentry";

/**
 * Test endpoint to verify Sentry error tracking
 * Visit /api/test-sentry?type=error to trigger different types of errors
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") || "error";

  try {
    switch (type) {
      case "error":
        // Test a regular error
        throw new Error("Test error from Sentry integration test");

      case "message":
        // Test a message
        captureMessage("Test message from Sentry integration", {
          level: "info",
          tags: { test: "true", endpoint: "/api/test-sentry" },
        });
        return NextResponse.json({
          success: true,
          message: "Message sent to Sentry",
        });

      case "warning":
        // Test a warning
        captureMessage("Test warning from Sentry integration", {
          level: "warning",
          tags: { test: "true", endpoint: "/api/test-sentry" },
        });
        return NextResponse.json({
          success: true,
          message: "Warning sent to Sentry",
        });

      case "handled":
        // Test a handled exception
        try {
          JSON.parse("invalid json{");
        } catch (error) {
          captureException(error as Error, {
            tags: { test: "true", handled: "true" },
            level: "error",
          });
        }
        return NextResponse.json({
          success: true,
          message: "Handled exception sent to Sentry",
        });

      default:
        return NextResponse.json({
          success: true,
          available: [
            "/api/test-sentry?type=error - Unhandled error",
            "/api/test-sentry?type=message - Info message",
            "/api/test-sentry?type=warning - Warning message",
            "/api/test-sentry?type=handled - Handled exception",
          ],
        });
    }
  } catch (error) {
    // This error will be automatically caught by Sentry's global handler
    throw error;
  }
}
