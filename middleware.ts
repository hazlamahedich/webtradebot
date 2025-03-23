import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for auth cookie instead of using auth() which tries to connect to the database
  const authCookie = request.cookies.get("next-auth.session-token");
  const isAuthenticated = !!authCookie;
  
  // Protected routes - require authentication
  if (!isAuthenticated && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Store the original URL as a search param to redirect back after login
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 