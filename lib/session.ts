import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  return session;
}

export function hasRole(session: any, role: string | string[]) {
  if (!session?.user) return false;

  const userRole = (session.user as any).role;

  if (Array.isArray(role)) {
    return role.includes(userRole);
  }

  return userRole === role;
}
