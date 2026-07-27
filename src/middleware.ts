import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/api/auth"];
const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const entry = RATE_LIMIT.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= 100) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests" }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
            },
          }
        );
      }
      entry.count++;
    } else {
      RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60_000 });
    }
  }

  // Security headers (handled by next.config.ts, but add CSP here)
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://accounts.google.com",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sounds|sw.js|manifest.json).*)",
  ],
};
