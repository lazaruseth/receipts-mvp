import { PrismaAdapter } from '@auth/prisma-adapter';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import crypto from 'crypto';

// Extend the session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      subscriptionTier: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    subscriptionTier: string;
  }
}

// Check if database is available for the adapter
let dbAdapter: ReturnType<typeof PrismaAdapter> | undefined;
try {
  if (process.env.DATABASE_URL) {
    dbAdapter = PrismaAdapter(prisma);
  }
} catch {
  console.warn('PrismaAdapter not available, running without database adapter');
}

export const authOptions: NextAuthOptions = {
  // Only use adapter if database is available - for OAuth persistence
  // Credentials provider works without adapter
  adapter: dbAdapter,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    // GitHub OAuth
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Demo credentials provider (for testing without OAuth setup)
    // SECURITY: Only enabled when ENABLE_DEMO_MODE=true
    CredentialsProvider({
      id: 'demo',
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@remaster.ai' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Demo mode must be explicitly enabled via environment variable
        // SECURITY: Set ENABLE_DEMO_MODE=false in production to disable demo login
        if (process.env.ENABLE_DEMO_MODE === 'true') {
          try {
            let user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: 'Demo User',
                },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } catch (error) {
            // Database not available - return a mock user for demo
            console.warn('Database not available, using demo mode:', error);
            return {
              id: 'demo-user-1',
              email: credentials.email,
              name: 'Demo User',
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch subscription tier (with fallback for demo mode)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { subscriptionTier: true },
          });
          token.subscriptionTier = dbUser?.subscriptionTier || 'free';
        } catch {
          // Database not available - default to free tier
          token.subscriptionTier = 'free';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.subscriptionTier = token.subscriptionTier;
      }
      return session;
    },
  },
};

// Helper to get session on the server
export const getSession = () => getServerSession(authOptions);

// ============================================
// API Key Utilities
// ============================================

const API_KEY_PREFIX = 'rmsm_';
const API_KEY_LENGTH = 32;

/**
 * Generate a new API key
 * Returns the raw key (only shown once) and the hash (stored in DB)
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const rawKey = `${API_KEY_PREFIX}${randomBytes.toString('base64url')}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12); // rmsm_xxxx...

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Get API signing secret - REQUIRED in production
 */
function getApiSigningSecret(): string {
  const secret = process.env.API_SIGNING_SECRET;

  if (secret) {
    return secret;
  }

  // In production, fail hard if secret is not configured
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: API_SIGNING_SECRET must be set in production!');
    throw new Error('API_SIGNING_SECRET environment variable is required in production');
  }

  // Development only fallback
  console.warn('⚠️ Using development-only API signing secret. Set API_SIGNING_SECRET in production!');
  return 'dev-only-api-secret-do-not-use-in-production';
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(key: string): string {
  const secret = getApiSigningSecret();
  return crypto.createHmac('sha256', secret).update(key).digest('hex');
}

/**
 * Validate an API key and return the associated user
 */
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  scopes?: string[];
  error?: string;
}> {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey) {
    return { valid: false, error: 'API key not found' };
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: 'API key has been revoked' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used timestamp (fire and forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    valid: true,
    userId: apiKey.userId,
    scopes: apiKey.scopes,
  };
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  name: string = 'Default API Key',
  scopes: string[] = ['read', 'write'],
  expiresInDays?: number
): Promise<{ id: string; rawKey: string; keyPrefix: string }> {
  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      keyPrefix,
      scopes,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  return {
    id: apiKey.id,
    rawKey, // Only returned once - user must save this
    keyPrefix,
  };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: {
      id: keyId,
      userId, // Ensure user owns the key
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count > 0;
}

/**
 * List all API keys for a user (without the actual key values)
 */
export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
