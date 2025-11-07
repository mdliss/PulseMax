'use client';

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  session?: any;
}

// Component to sync session with Sentry
function SentryUserSync() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      // Set Sentry user context when logged in
      setSentryUser({
        id: session.user.email || 'unknown',
        email: session.user.email || undefined,
        username: session.user.name || undefined,
      });
    } else {
      // Clear Sentry user context when logged out
      clearSentryUser();
    }
  }, [session]);

  return null;
}

export default function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider session={session}>
      <SentryUserSync />
      {children}
    </NextAuthSessionProvider>
  );
}
