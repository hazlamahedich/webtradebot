import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/error',
  '/api/auth/signin',
  '/api/auth/callback/github',
  '/api/auth/signout',
  '/api/debug/auth',
  '/api/debug/oauth-env',
];

// Auth middleware
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and other resources
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Always allow NextAuth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Allow access to public paths
  if (publicPaths.some(path => pathname === path)) {
    return NextResponse.next();
  }
  
  // Check authentication with NextAuth JWT
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (token) {
      return NextResponse.next();
    }
    
    // Also check for direct GitHub cookies as fallback
    const hasGitHubAuth = 
      request.cookies.has('github_user_id') && 
      request.cookies.has('github_access_token');
    
    if (hasGitHubAuth) {
      return NextResponse.next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
  }
  
  // If not authenticated, redirect to sign-in page
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}; 