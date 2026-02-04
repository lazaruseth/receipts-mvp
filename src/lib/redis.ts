/**
 * Redis Caching Client (Upstash)
 *
 * Provides caching for expensive operations:
 * - Leaderboard (5min TTL)
 * - Agent reputation lookups (1min TTL)
 * - Passport generation (24hr TTL)
 * - Merchant network list (1hr TTL)
 * - Intel feed (30sec TTL)
 */

import { Redis } from '@upstash/redis';

// Cache entry for in-memory fallback
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache for when Redis is not configured
class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }
}

// Initialize Redis client or fallback
let redis: Redis | null = null;
let inMemoryCache: InMemoryCache | null = null;
let initialized = false;

function getClient(): { redis: Redis | null; inMemory: InMemoryCache | null } {
  if (initialized) {
    return { redis, inMemory: inMemoryCache };
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      redis = new Redis({ url, token });
      console.log('✅ Upstash Redis connected');
    } catch {
      console.warn('⚠️ Failed to connect to Upstash Redis, using in-memory cache');
      inMemoryCache = new InMemoryCache();
    }
  } else {
    console.log('ℹ️ UPSTASH_REDIS_REST_URL not set - using in-memory cache');
    inMemoryCache = new InMemoryCache();
  }

  initialized = true;
  return { redis, inMemory: inMemoryCache };
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  LEADERBOARD: 5 * 60, // 5 minutes
  AGENT_REPUTATION: 60, // 1 minute
  PASSPORT: 24 * 60 * 60, // 24 hours
  MERCHANT_LIST: 60 * 60, // 1 hour
  INTEL_FEED: 30, // 30 seconds
  STATS: 5 * 60, // 5 minutes
} as const;

// Cache key prefixes
export const CacheKey = {
  leaderboard: (type: string) => `leaderboard:${type}`,
  agentReputation: (agentId: string) => `agent:${agentId}:reputation`,
  passport: (agentId: string) => `passport:${agentId}`,
  merchantList: () => 'merchants:list',
  merchantDetail: (domain: string) => `merchant:${domain}`,
  intelFeed: () => 'intel:feed',
  leaderboardStats: () => 'leaderboard:stats',
  stakingStats: (agentId: string) => `staking:${agentId}:stats`,
} as const;

/**
 * Get a cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const { redis: r, inMemory } = getClient();

  try {
    if (r) {
      return await r.get<T>(key);
    } else if (inMemory) {
      return await inMemory.get<T>(key);
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set a cached value with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const { redis: r, inMemory } = getClient();

  try {
    if (r) {
      await r.set(key, value, { ex: ttlSeconds });
    } else if (inMemory) {
      await inMemory.set(key, value, ttlSeconds);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  const { redis: r, inMemory } = getClient();

  try {
    if (r) {
      await r.del(key);
    } else if (inMemory) {
      await inMemory.del(key);
    }
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const { redis: r, inMemory } = getClient();

  try {
    if (r) {
      const keys = await r.keys(pattern);
      for (const key of keys) {
        await r.del(key);
      }
    } else if (inMemory) {
      const keys = await inMemory.keys(pattern);
      for (const key of keys) {
        await inMemory.del(key);
      }
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Get or set pattern - tries cache first, calls factory function on miss
 */
export async function cacheGetOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await factory();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

/**
 * Invalidate all caches for an agent (after trust score change, etc.)
 */
export async function invalidateAgentCaches(agentId: string): Promise<void> {
  await cacheDel(CacheKey.agentReputation(agentId));
  await cacheDel(CacheKey.passport(agentId));
  await cacheDel(CacheKey.stakingStats(agentId));
  // Invalidate leaderboards too since agent rankings may have changed
  await cacheDelPattern('leaderboard:*');
}

/**
 * Check if using Upstash Redis (vs in-memory)
 */
export function isUsingUpstash(): boolean {
  const { redis: r } = getClient();
  return !!r;
}
