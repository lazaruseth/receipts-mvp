/**
 * Authentication Helpers
 *
 * Provides utilities for extracting user identity from requests,
 * supporting both session-based auth (dashboard) and API key auth (agents).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, validateApiKey } from './auth';

const DEMO_USER_ID = 'demo-user-1';

export interface AuthResult {
  authenticated: boolean;
  userId: string | null;
  authMethod: 'session' | 'api_key' | 'demo' | null;
  scopes?: string[];
  error?: string;
}

/**
 * Extract user ID from request using session or API key authentication.
 * This is the primary helper for securing agent routes.
 *
 * Priority:
 * 1. Session authentication (NextAuth.js JWT)
 * 2. API key authentication (Bearer rmsm_xxx)
 * 3. Demo mode fallback (development only)
 *
 * @param request - The NextRequest object
 * @returns AuthResult with userId if authenticated
 */
export async function getAuthFromRequest(request: NextRequest): Promise<AuthResult> {
  // 1. Check session authentication first
  try {
    const session = await getSession();
    if (session?.user?.id) {
      return {
        authenticated: true,
        userId: session.user.id,
        authMethod: 'session',
      };
    }
  } catch (error) {
    console.warn('Session check failed:', error);
  }

  // 2. Check API key authentication
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer rmsm_')) {
    const apiKey = authHeader.slice(7); // Remove 'Bearer '

    try {
      const validation = await validateApiKey(apiKey);

      if (validation.valid && validation.userId) {
        return {
          authenticated: true,
          userId: validation.userId,
          authMethod: 'api_key',
          scopes: validation.scopes,
        };
      }

      // Key was provided but invalid
      return {
        authenticated: false,
        userId: null,
        authMethod: null,
        error: validation.error || 'Invalid API key',
      };
    } catch (error) {
      // Database error during validation - don't fall through to demo mode
      console.error('API key validation failed:', error);
      return {
        authenticated: false,
        userId: null,
        authMethod: null,
        error: 'API key validation failed. Database may be unavailable.',
      };
    }
  }

  // 3. Demo mode fallback (development only)
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using demo user for unauthenticated request in development');
    return {
      authenticated: true,
      userId: DEMO_USER_ID,
      authMethod: 'demo',
    };
  }

  // No authentication found
  return {
    authenticated: false,
    userId: null,
    authMethod: null,
    error: 'No authentication provided. Include a session cookie or API key.',
  };
}

/**
 * Require authentication for a request.
 * Returns userId if authenticated, or throws/returns error response.
 *
 * @param request - The NextRequest object
 * @returns userId if authenticated
 * @throws Returns NextResponse with 401 if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string; authMethod: string; scopes?: string[] } | NextResponse> {
  const auth = await getAuthFromRequest(request);

  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: auth.error || 'Authentication required',
        hint: 'Provide a valid API key in the Authorization header (Bearer rmsm_xxx) or sign in to your account.',
      },
      { status: 401 }
    );
  }

  return {
    userId: auth.userId,
    authMethod: auth.authMethod!,
    scopes: auth.scopes,
  };
}

/**
 * Check if a scope is allowed for the current authentication.
 * API keys can have limited scopes, sessions have full access.
 */
export function hasScope(auth: AuthResult, requiredScope: string): boolean {
  // Session auth has all scopes
  if (auth.authMethod === 'session' || auth.authMethod === 'demo') {
    return true;
  }

  // API key auth - check scopes
  if (auth.scopes) {
    return auth.scopes.includes(requiredScope) || auth.scopes.includes('*');
  }

  return false;
}

/**
 * Create a standardized 401 Unauthorized response
 */
export function unauthorizedResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: message || 'Authentication required',
      hint: 'Provide a valid API key in the Authorization header (Bearer rmsm_xxx) or sign in to your account.',
    },
    { status: 401 }
  );
}

/**
 * Create a standardized 403 Forbidden response
 */
export function forbiddenResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: message || 'You do not have permission to perform this action',
    },
    { status: 403 }
  );
}
