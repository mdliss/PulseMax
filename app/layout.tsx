import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { SentryErrorBoundary } from "@/lib/sentry";
import FeedbackButton from "@/components/FeedbackButton";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PulseMax - Marketplace Analytics",
  description: "Real-time marketplace health monitoring and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={robotoMono.className}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          minHeight: '100vh'
        }}
      >
        <SentryErrorBoundary>
          <SessionProvider>
            {children}
            <FeedbackButton />
          </SessionProvider>
        </SentryErrorBoundary>
      </body>
    </html>
  );
}
