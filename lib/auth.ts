import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@pulsemax.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Single admin account
        if (
          credentials?.email === 'admin@pulsemax.com' &&
          credentials?.password === 'admin123'
        ) {
          return {
            id: '1',
            name: 'Admin User',
            email: 'admin@pulsemax.com',
            role: 'admin'
          };
        }

        // Invalid credentials
        return null;
      }
    }),
    // Google OAuth provider (optional - requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          })
        ]
      : [])
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user role to token on first sign in
      if (user) {
        token.role = (user as any).role || 'user';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and id to session
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
