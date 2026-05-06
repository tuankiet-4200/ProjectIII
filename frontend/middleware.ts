import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware
 * - /admin/* requires role === 'ADMIN' (decoded from JWT)
 * - /vendor/* requires authenticated user (any role)
 * - All other routes are public
 */

/** Decode JWT payload without verifying signature (Edge runtime safe) */
function decodeJwt(token: string): { sub: string; email: string; role: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → Base64 → decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function isTokenExpired(payload: { exp: number }): boolean {
  return Date.now() >= payload.exp * 1000;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;

  // ─── Helper: redirect to login ───────────────────────────────────────────
  const redirectToLogin = (reason?: string) => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (reason) loginUrl.searchParams.set("reason", reason);
    return NextResponse.redirect(loginUrl);
  };

  // ─── /admin/* — requires ADMIN role ──────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!accessToken) return redirectToLogin("unauthenticated");

    const payload = decodeJwt(accessToken);
    if (!payload || isTokenExpired(payload)) return redirectToLogin("session_expired");
    if (payload.role !== "ADMIN") return redirectToLogin("forbidden");

    return NextResponse.next();
  }

  // ─── /vendor/* — requires any authenticated user ──────────────────────────
  if (pathname.startsWith("/vendor")) {
    if (!accessToken) return redirectToLogin("unauthenticated");

    const payload = decodeJwt(accessToken);
    if (!payload || isTokenExpired(payload)) return redirectToLogin("session_expired");

    // Only CUSTOMER and ADMIN can access vendor portal
    // (checking if user has an active shop is done inside the page via API)
    if (payload.role === "SHIPPER") return redirectToLogin("forbidden");

    return NextResponse.next();
  }

  // ─── /checkout, /orders, /profile — requires any authenticated user ───────
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/profile")
  ) {
    if (!accessToken) return redirectToLogin("unauthenticated");

    const payload = decodeJwt(accessToken);
    if (!payload || isTokenExpired(payload)) return redirectToLogin("session_expired");

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
