import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use Node.js runtime to avoid Edge compatibility issues with NextAuth
export const runtime = 'nodejs';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/direct-login',
  '/auth/test-oauth',
  '/api/auth/callback',
  '/api/debug/auth',
  '/api/debug/oauth-env',
  '/api/fix-auth',
  '/fix-auth',
  '/auth/error',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow NextAuth routes to pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Allow access to public paths and static assets
  if (publicPaths.some(path => pathname === path) || 
      pathname.includes('favicon') ||
      pathname.includes('_next') ||
      pathname.includes('images')) {
    return NextResponse.next();
  }
  
  // Check for authentication - try both NextAuth and direct GitHub methods
  const githubUserId = request.cookies.get('github_user_id');
  const githubAccessToken = request.cookies.get('github_access_token');
  
  // First check for direct GitHub auth cookies
  if (githubUserId && githubAccessToken) {
    return NextResponse.next();
  }
  
  // Then check for NextAuth session cookie
  const hasNextAuthSession = request.cookies.has('next-auth.session-token') || 
                            request.cookies.has('__Secure-next-auth.session-token');
  
  if (hasNextAuthSession) {
    return NextResponse.next();
  }
  
  // If not authenticated by either method, redirect to sign-in
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|images/|favicon.ico).*)'],
}; 