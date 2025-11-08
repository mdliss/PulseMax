import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware() {
  // No authentication required - allow all access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
  ],
};
