/**
 * Rate Limiting Library
 *
 * Provides sliding window rate limiting for API routes.
 * Uses Redis (Upstash) for distributed environments or in-memory for development.
 *
 * Features:
 * - Sliding window algorithm for smooth rate limiting
 * - Different limits for different route types
 * - IP-based and API key-based limiting
 * - Graceful fallback to in-memory when Redis unavailable
 */

// Rate limit entry for in-memory storage
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limit store (fallback when Redis unavailable)
const inMemoryStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetAt < now) {
      inMemoryStore.delete(key);
    }
  }
}, 60000); // Clean every minute

// Rate limit configurations
export const RateLimitConfig = {
  // Public endpoints - generous limits
  PUBLIC: {
    requests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Authenticated API calls
  AUTHENTICATED: {
    requests: 300,
    windowMs: 60 * 1000, // 1 minute
  },
  // Agent API key calls - higher limits
  AGENT: {
    requests: 1000,
    windowMs: 60 * 1000, // 1 minute
  },
  // Expensive operations (GPT-4 parsing)
  EXPENSIVE: {
    requests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // Auth endpoints - strict to prevent brute force
  AUTH: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export type RateLimitType = keyof typeof RateLimitConfig;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
  retryAfter?: number; // Seconds until retry allowed
}

/**
 * Check and increment rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'PUBLIC'
): Promise<RateLimitResult> {
  const config = RateLimitConfig[type];
  const key = `ratelimit:${type}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Try to use Redis if available
    const result = await checkRateLimitRedis(key, config, now, windowStart);
    if (result) return result;
  } catch (error) {
    console.warn('Redis rate limit failed, using in-memory:', error);
  }

  // Fallback to in-memory
  return checkRateLimitInMemory(key, config, now);
}

/**
 * Redis-based rate limiting using sliding window
 */
async function checkRateLimitRedis(
  key: string,
  config: { requests: number; windowMs: number },
  now: number,
  windowStart: number
): Promise<RateLimitResult | null> {
  // Dynamic import to avoid issues when Redis not configured
  const { Redis } = await import('@upstash/redis');

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null; // Fallback to in-memory
  }

  const redis = new Redis({ url, token });

  // Use sorted set for sliding window
  // Remove old entries, add new one, count total
  const pipeline = redis.pipeline();

  // Remove entries older than window
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Add current request
  pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });

  // Count requests in window
  pipeline.zcard(key);

  // Set expiry on key
  pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 1);

  const results = await pipeline.exec();

  // zcard result is at index 2
  const count = (results[2] as number) || 0;
  const remaining = Math.max(0, config.requests - count);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  if (count > config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  return {
    success: true,
    limit: config.requests,
    remaining,
    reset,
  };
}

/**
 * In-memory rate limiting using fixed window (simpler, good for dev)
 */
function checkRateLimitInMemory(
  key: string,
  config: { requests: number; windowMs: number },
  now: number
): RateLimitResult {
  const entry = inMemoryStore.get(key);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  if (!entry || entry.resetAt < now) {
    // New window
    inMemoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset,
    };
  }

  // Increment existing window
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

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Extract identifier from request for rate limiting
 * Priority: API Key > User ID > IP Address
 */
export function getIdentifier(request: Request, userId?: string): string {
  // Check for API key
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer rmsm_')) {
    // Use first 16 chars of API key as identifier (don't use full key)
    return `apikey:${authHeader.slice(7, 23)}`;
  }

  // Use user ID if available
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Determine rate limit type based on request path
 */
export function getRateLimitType(pathname: string): RateLimitType {
  // Auth endpoints - strict limits
  if (pathname.startsWith('/api/auth')) {
    return 'AUTH';
  }

  // Expensive operations (GPT-4)
  if (pathname === '/api/parse' || pathname === '/api/chat' || pathname === '/api/playground/analyze') {
    return 'EXPENSIVE';
  }

  // Agent API endpoints (high volume expected)
  if (
    pathname.startsWith('/api/capture') ||
    pathname.startsWith('/api/validate') ||
    pathname.startsWith('/api/stake') ||
    pathname.startsWith('/api/anchor') ||
    pathname.startsWith('/api/passport')
  ) {
    return 'AGENT';
  }

  // Public endpoints
  if (
    pathname.startsWith('/api/agents/leaderboard') ||
    pathname.startsWith('/api/merchants') ||
    pathname.startsWith('/api/intel')
  ) {
    return 'PUBLIC';
  }

  // Default to authenticated
  return 'AUTHENTICATED';
}
