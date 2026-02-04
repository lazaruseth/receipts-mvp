import { PrismaClient } from '@prisma/client';

// PrismaClient singleton to prevent connection exhaustion in development
// https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a mock Prisma client for when DATABASE_URL is not set
// This allows the app to run in demo mode without a database
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set - database operations will fail');
    // Return a proxy that throws helpful errors
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === '$connect' || prop === '$disconnect') {
          return () => Promise.resolve();
        }
        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return () => Promise.reject(new Error('Database not configured'));
        }
        // For model access (user, agent, etc.), return a proxy that throws on operations
        return new Proxy({}, {
          get(_, method) {
            return () => {
              throw new Error(
                `Database not configured. Set DATABASE_URL in your .env file to enable database operations.`
              );
            };
          },
        });
      },
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export types for convenience
export type { User, Agent, Agreement, Dispute, Policy, ApiKey, Capture, TrustEvent, Stake } from '@prisma/client';
export { SubscriptionTier, AgentType, AgreementStatus, DisputeStatus, CaptureStatus, TrustEventType, StakeStatus, StakeOutcome } from '@prisma/client';
