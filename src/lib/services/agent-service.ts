/**
 * Agent Service
 *
 * Handles agent operations with Prisma database.
 * Falls back to demo data when database is not available.
 */

import { prisma, AgentType as PrismaAgentType } from '../db';
import { getCapabilitiesForScore, getProgressToNextTier } from '../trust-score';
import { calculateBadges, getTierByScore, type AgentProfile } from '../badges';

// Check if database is available
let dbAvailable = true;

async function checkDb() {
  if (!process.env.DATABASE_URL) {
    dbAvailable = false;
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    dbAvailable = false;
    return false;
  }
}

// Initialize on module load
checkDb().catch(() => {
  dbAvailable = false;
});

// Map API agent types to Prisma enum
function toPrismaAgentType(type: string): PrismaAgentType {
  const mapping: Record<string, PrismaAgentType> = {
    'openclaw': 'openclaw',
    'claude-code': 'claude_code',
    'langchain': 'langchain',
    'openai-assistants': 'openai_assistants',
    'autogpt': 'autogpt',
    'custom': 'custom',
  };
  return mapping[type] || 'custom';
}

// Map Prisma enum to API agent types
function fromPrismaAgentType(type: PrismaAgentType): string {
  const mapping: Record<PrismaAgentType, string> = {
    'openclaw': 'openclaw',
    'claude_code': 'claude-code',
    'langchain': 'langchain',
    'openai_assistants': 'openai-assistants',
    'autogpt': 'autogpt',
    'custom': 'custom',
  };
  return mapping[type] || 'custom';
}

export interface RegisterAgentInput {
  agentId: string;
  agentType: string;
  publicKey?: string;
  ownerId?: string;
  metadata?: {
    name?: string;
    version?: string;
    owner?: string;
  };
}

export interface AgentRegistration {
  id: string;
  externalId: string;
  agentType: string;
  trustScore: number;
  capabilities: ReturnType<typeof getCapabilitiesForScore>;
  progress: ReturnType<typeof getProgressToNextTier>;
  registeredAt: string;
  alreadyRegistered: boolean;
}

/**
 * Register a new agent or return existing registration
 */
export async function registerAgent(input: RegisterAgentInput): Promise<AgentRegistration> {
  if (!dbAvailable) {
    // Fall back to in-memory for demo
    return registerAgentInMemory(input);
  }

  try {
    // Check if agent already exists
    const existing = await prisma.agent.findUnique({
      where: { externalId: input.agentId },
    });

    if (existing) {
      const capabilities = getCapabilitiesForScore(existing.trustScore);
      const progress = getProgressToNextTier(existing.trustScore, []);

      return {
        id: existing.id,
        externalId: existing.externalId,
        agentType: fromPrismaAgentType(existing.agentType),
        trustScore: existing.trustScore,
        capabilities,
        progress,
        registeredAt: existing.createdAt.toISOString(),
        alreadyRegistered: true,
      };
    }

    // Create new agent
    const STARTING_TRUST_SCORE = 10;
    const capabilities = getCapabilitiesForScore(STARTING_TRUST_SCORE);

    const agent = await prisma.agent.create({
      data: {
        externalId: input.agentId,
        agentType: toPrismaAgentType(input.agentType),
        publicKey: input.publicKey,
        ownerId: input.ownerId,
        trustScore: STARTING_TRUST_SCORE,
        capabilities: capabilities as object,
        name: input.metadata?.name,
        version: input.metadata?.version,
        metadata: input.metadata as object,
      },
    });

    // Create initial trust event
    await prisma.trustEvent.create({
      data: {
        agentId: agent.id,
        eventType: 'agreement_captured', // Using as "registration" event
        delta: STARTING_TRUST_SCORE,
        reason: 'Initial registration bonus',
      },
    });

    const progress = getProgressToNextTier(STARTING_TRUST_SCORE, []);

    return {
      id: agent.id,
      externalId: agent.externalId,
      agentType: fromPrismaAgentType(agent.agentType),
      trustScore: agent.trustScore,
      capabilities,
      progress,
      registeredAt: agent.createdAt.toISOString(),
      alreadyRegistered: false,
    };
  } catch (error) {
    console.error('Database error, falling back to in-memory:', error);
    dbAvailable = false;
    return registerAgentInMemory(input);
  }
}

// In-memory fallback store
interface InMemoryAgent {
  id: string;
  externalId: string;
  agentType: string;
  trustScore: number;
  capabilities: ReturnType<typeof getCapabilitiesForScore>;
  progress: ReturnType<typeof getProgressToNextTier>;
  registeredAtDate: Date;
}

const inMemoryAgents = new Map<string, InMemoryAgent>();

function registerAgentInMemory(input: RegisterAgentInput): AgentRegistration {
  const existing = inMemoryAgents.get(input.agentId);

  if (existing) {
    return {
      id: existing.id,
      externalId: existing.externalId,
      agentType: existing.agentType,
      trustScore: existing.trustScore,
      capabilities: existing.capabilities,
      progress: existing.progress,
      registeredAt: existing.registeredAtDate.toISOString(),
      alreadyRegistered: true,
    };
  }

  const STARTING_TRUST_SCORE = 10;
  const capabilities = getCapabilitiesForScore(STARTING_TRUST_SCORE);
  const progress = getProgressToNextTier(STARTING_TRUST_SCORE, []);
  const now = new Date();

  const inMemoryRecord: InMemoryAgent = {
    id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    externalId: input.agentId,
    agentType: input.agentType,
    trustScore: STARTING_TRUST_SCORE,
    capabilities,
    progress,
    registeredAtDate: now,
  };

  inMemoryAgents.set(input.agentId, inMemoryRecord);

  return {
    id: inMemoryRecord.id,
    externalId: inMemoryRecord.externalId,
    agentType: inMemoryRecord.agentType,
    trustScore: inMemoryRecord.trustScore,
    capabilities: inMemoryRecord.capabilities,
    progress: inMemoryRecord.progress,
    registeredAt: now.toISOString(),
    alreadyRegistered: false,
  };
}

/**
 * Get agent by external ID
 */
export async function getAgentByExternalId(externalId: string): Promise<AgentProfile | null> {
  if (!dbAvailable) {
    // Check in-memory first, then demo data
    const inMemory = inMemoryAgents.get(externalId);
    if (inMemory) {
      const tier = getTierByScore(inMemory.trustScore);
      return {
        id: inMemory.externalId,
        name: externalId,
        description: `Registered ${inMemory.agentType} agent`,
        trustScore: inMemory.trustScore,
        trustTier: tier.tier,
        tierName: tier.name,
        totalAgreements: 0,
        agreementsThisMonth: 0,
        disputesWon: 0,
        disputesLost: 0,
        violationCount: 0,
        badges: [],
        createdAt: inMemory.registeredAtDate.toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
    }

    // Fall back to demo data
    const { getAgentById } = await import('../badges');
    return getAgentById(externalId) || null;
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { externalId },
    });

    if (!agent) {
      // Check demo data as fallback
      const { getAgentById } = await import('../badges');
      return getAgentById(externalId) || null;
    }

    const tier = getTierByScore(agent.trustScore);
    const badges = calculateBadges({
      trustScore: agent.trustScore,
      totalAgreements: agent.totalAgreements,
      disputesWon: agent.disputesWon,
      disputesLost: agent.disputesLost,
      violationCount: 0, // Not tracked in current schema
    });

    return {
      id: agent.externalId,
      name: agent.name || agent.externalId,
      description: `${fromPrismaAgentType(agent.agentType)} agent`,
      trustScore: agent.trustScore,
      trustTier: tier.tier,
      tierName: tier.name,
      totalAgreements: agent.totalAgreements,
      agreementsThisMonth: 0, // Would need to query agreements
      disputesWon: agent.disputesWon,
      disputesLost: agent.disputesLost,
      violationCount: 0,
      badges,
      createdAt: agent.createdAt.toISOString(),
      lastActiveAt: agent.lastActiveAt.toISOString(),
    };
  } catch (error) {
    console.error('Database error:', error);
    // Fall back to demo data
    const { getAgentById } = await import('../badges');
    return getAgentById(externalId) || null;
  }
}

/**
 * Get all agents for leaderboard
 */
export async function getAgentLeaderboard(
  type: 'trust_score' | 'total_agreements' | 'disputes_won' | 'most_active' = 'trust_score',
  limit: number = 10
): Promise<AgentProfile[]> {
  if (!dbAvailable) {
    const { getAgentLeaderboard: getDemoLeaderboard } = await import('../badges');
    return getDemoLeaderboard(type, limit);
  }

  try {
    const orderBy: Record<string, 'desc'> = {};
    switch (type) {
      case 'trust_score':
        orderBy.trustScore = 'desc';
        break;
      case 'total_agreements':
        orderBy.totalAgreements = 'desc';
        break;
      case 'disputes_won':
        orderBy.disputesWon = 'desc';
        break;
      case 'most_active':
        orderBy.lastActiveAt = 'desc';
        break;
    }

    const agents = await prisma.agent.findMany({
      orderBy,
      take: limit,
    });

    // If no database agents, return demo data
    if (agents.length === 0) {
      const { getAgentLeaderboard: getDemoLeaderboard } = await import('../badges');
      return getDemoLeaderboard(type, limit);
    }

    return agents.map((agent) => {
      const tier = getTierByScore(agent.trustScore);
      const badges = calculateBadges({
        trustScore: agent.trustScore,
        totalAgreements: agent.totalAgreements,
        disputesWon: agent.disputesWon,
        disputesLost: agent.disputesLost,
        violationCount: 0,
      });

      return {
        id: agent.externalId,
        name: agent.name || agent.externalId,
        description: `${fromPrismaAgentType(agent.agentType)} agent`,
        trustScore: agent.trustScore,
        trustTier: tier.tier,
        tierName: tier.name,
        totalAgreements: agent.totalAgreements,
        agreementsThisMonth: 0,
        disputesWon: agent.disputesWon,
        disputesLost: agent.disputesLost,
        violationCount: 0,
        badges,
        createdAt: agent.createdAt.toISOString(),
        lastActiveAt: agent.lastActiveAt.toISOString(),
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    const { getAgentLeaderboard: getDemoLeaderboard } = await import('../badges');
    return getDemoLeaderboard(type, limit);
  }
}

/**
 * Update agent trust score
 */
export async function updateAgentTrustScore(
  externalId: string,
  delta: number,
  reason: string,
  eventType: 'agreement_captured' | 'agreement_compliant' | 'dispute_won' | 'dispute_lost' | 'policy_violation'
): Promise<{ newScore: number } | null> {
  if (!dbAvailable) {
    // In demo mode, just return simulated score
    const agent = inMemoryAgents.get(externalId);
    if (agent) {
      agent.trustScore = Math.max(0, Math.min(100, agent.trustScore + delta));
      agent.capabilities = getCapabilitiesForScore(agent.trustScore);
      agent.progress = getProgressToNextTier(agent.trustScore, []);
      return { newScore: agent.trustScore };
    }
    return null;
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { externalId },
    });

    if (!agent) return null;

    const newScore = Math.max(0, Math.min(100, agent.trustScore + delta));

    await prisma.$transaction([
      prisma.agent.update({
        where: { id: agent.id },
        data: {
          trustScore: newScore,
          lastActiveAt: new Date(),
        },
      }),
      prisma.trustEvent.create({
        data: {
          agentId: agent.id,
          eventType,
          delta,
          reason,
        },
      }),
    ]);

    return { newScore };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats() {
  if (!dbAvailable) {
    const { getLeaderboardStats: getDemoStats } = await import('../badges');
    return getDemoStats();
  }

  try {
    const stats = await prisma.agent.aggregate({
      _count: true,
      _avg: { trustScore: true },
      _sum: {
        totalAgreements: true,
        disputesWon: true,
        disputesLost: true,
      },
    });

    const tier5Count = await prisma.agent.count({
      where: { trustScore: { gte: 81 } },
    });

    // If no data, return demo stats
    if (stats._count === 0) {
      const { getLeaderboardStats: getDemoStats } = await import('../badges');
      return getDemoStats();
    }

    return {
      totalAgents: stats._count,
      avgTrustScore: Math.round(stats._avg.trustScore || 0),
      totalAgreements: stats._sum.totalAgreements || 0,
      totalDisputes: (stats._sum.disputesWon || 0) + (stats._sum.disputesLost || 0),
      tier5Count,
    };
  } catch (error) {
    console.error('Database error:', error);
    const { getLeaderboardStats: getDemoStats } = await import('../badges');
    return getDemoStats();
  }
}

/**
 * List all registered agents
 */
export async function listAllAgents(): Promise<AgentRegistration[]> {
  if (!dbAvailable) {
    return Array.from(inMemoryAgents.values()).map((a) => ({
      id: a.id,
      externalId: a.externalId,
      agentType: a.agentType,
      trustScore: a.trustScore,
      capabilities: a.capabilities,
      progress: a.progress,
      registeredAt: a.registeredAtDate.toISOString(),
      alreadyRegistered: true,
    }));
  }

  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return agents.map((agent) => {
      const capabilities = getCapabilitiesForScore(agent.trustScore);
      const progress = getProgressToNextTier(agent.trustScore, []);

      return {
        id: agent.id,
        externalId: agent.externalId,
        agentType: fromPrismaAgentType(agent.agentType),
        trustScore: agent.trustScore,
        capabilities,
        progress,
        registeredAt: agent.createdAt.toISOString(),
        alreadyRegistered: true,
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    return Array.from(inMemoryAgents.values()).map((a) => ({
      id: a.id,
      externalId: a.externalId,
      agentType: a.agentType,
      trustScore: a.trustScore,
      capabilities: a.capabilities,
      progress: a.progress,
      registeredAt: a.registeredAtDate.toISOString(),
      alreadyRegistered: true,
    }));
  }
}
