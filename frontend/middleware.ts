import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware
 * - /admin/* requires admin role (checked via cookie)
 * - /vendor/* requires authenticated user with a shop
 * - All other routes are public
 *
 * Note: This is a basic implementation using cookies.
 * In production, you'd verify JWT tokens and check roles.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookie
  const accessToken = request.cookies.get("access_token")?.value;

  // Protected admin routes
  if (pathname.startsWith("/admin")) {
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // In production: decode JWT, verify role === 'ADMIN'
    return NextResponse.next();
  }

  // Protected vendor routes
  if (pathname.startsWith("/vendor")) {
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // In production: decode JWT, verify user has a shop
    return NextResponse.next();
  }

  // Protected customer routes
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/profile")
  ) {
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
  ],
};
