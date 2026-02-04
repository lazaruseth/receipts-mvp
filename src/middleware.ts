import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/agreements',
  '/api/disputes',
  '/api/policies',
  '/api/keys',
  '/api/billing',
  '/api/webhooks',
];

// Routes that are always public (no auth required)
// NOTE: Agent routes (/api/capture, /api/parse, etc.) are NOT public
// They require API key auth which is validated in route handlers
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/passport/verify', // Public verification of passports
  '/api/agents/leaderboard', // Public leaderboard
  '/api/merchants', // Public merchant list
  '/api/intel/feed', // Public intel feed
  '/api/playground', // Demo playground
  '/api/share', // Public share links
];

// API routes that accept API key authentication
const API_KEY_ROUTES = [
  '/api/capture',
  '/api/parse',
  '/api/validate',
  '/api/anchor',
  '/api/agents/register',
  '/api/stake',
  '/api/passport/generate',
];

// Rate limit configuration (inline to avoid import issues in middleware)
const RATE_LIMITS = {
  PUBLIC: { requests: 100, windowMs: 60000 },
  AUTHENTICATED: { requests: 300, windowMs: 60000 },
  AGENT: { requests: 1000, windowMs: 60000 },
  EXPENSIVE: { requests: 20, windowMs: 60000 },
  AUTH: { requests: 10, windowMs: 60000 },
};

// In-memory rate limit store (Edge runtime compatible)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitType(pathname: string): keyof typeof RATE_LIMITS {
  if (pathname.startsWith('/api/auth')) return 'AUTH';
  if (pathname === '/api/parse' || pathname === '/api/chat' || pathname === '/api/playground/analyze') {
    return 'EXPENSIVE';
  }
  if (
    pathname.startsWith('/api/capture') ||
    pathname.startsWith('/api/validate') ||
    pathname.startsWith('/api/stake') ||
    pathname.startsWith('/api/anchor') ||
    pathname.startsWith('/api/passport')
  ) {
    return 'AGENT';
  }
  if (
    pathname.startsWith('/api/agents/leaderboard') ||
    pathname.startsWith('/api/merchants') ||
    pathname.startsWith('/api/intel')
  ) {
    return 'PUBLIC';
  }
  return 'AUTHENTICATED';
}

function getIdentifier(request: NextRequest): string {
  // Check for API key
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer rmsm_')) {
    return `apikey:${authHeader.slice(7, 23)}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
  return `ip:${ip}`;
}

function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMITS
): { success: boolean; limit: number; remaining: number; reset: number; retryAfter?: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  // Cleanup old entries occasionally (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, limit: config.requests, remaining: config.requests - 1, reset };
  }

  entry.count++;

  if (entry.count > config.requests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
      retryAfter,
    };
  }

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes for rate limiting (but not auth check)
  const isApiRoute = pathname.startsWith('/api/');

  // Apply rate limiting to API routes
  if (isApiRoute) {
    const identifier = getIdentifier(request);
    const limitType = getRateLimitType(pathname);
    const result = checkRateLimit(identifier, limitType);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Continue with auth checks but add rate limit headers to response
    const response = await handleAuth(request, pathname);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());

    return response;
  }

  // Non-API routes - just handle auth
  return handleAuth(request, pathname);
}

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unnecessary features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  return response;
}

async function handleAuth(request: NextRequest, pathname: string): Promise<NextResponse> {
  // Skip public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check for API key authentication on agent routes
  if (API_KEY_ROUTES.some((route) => pathname.startsWith(route))) {
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer rmsm_')) {
      // API key auth - validation happens in the route handler
      // Pass through; the route will validate the key and reject if invalid
      return addSecurityHeaders(NextResponse.next());
    }

    // No API key provided for agent route - check if session exists
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      // Session auth is valid - allow through (route can use session)
      return addSecurityHeaders(NextResponse.next());
    }

    // Development mode - allow through to route handler (which will use demo user)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Middleware] Dev mode: allowing unauthenticated request to ${pathname}`);
      return addSecurityHeaders(NextResponse.next());
    }

    // No auth at all - return 401
    return addSecurityHeaders(
      NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'API key or session required',
          hint: 'Provide Authorization: Bearer rmsm_xxx header or sign in to your account',
        },
        { status: 401 }
      )
    );
  }

  // Check for session authentication on protected routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Development mode - allow through to route handler (which will use demo user)
      if (process.env.NODE_ENV === 'development' && pathname.startsWith('/api/')) {
        console.warn(`[Middleware] Dev mode: allowing unauthenticated request to ${pathname}`);
        return addSecurityHeaders(NextResponse.next());
      }

      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized. Please sign in or provide an API key.' },
            { status: 401 }
          )
        );
      }

      // For pages, redirect to sign in
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
