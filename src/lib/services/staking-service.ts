/**
 * Staking Service
 *
 * Handles stake operations with Prisma database.
 * Falls back to in-memory data when database is not available.
 */

import crypto from 'crypto';
import {
  prisma,
  StakeStatus as PrismaStakeStatus,
  StakeOutcome as PrismaStakeOutcome,
} from '../db';
import { getAgentById, type AgentProfile, TRUST_TIERS } from '../badges';
import { getAgentByExternalId, updateAgentTrustScore } from './agent-service';

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

// Tier limits for reference
const TIER_LIMITS: Record<number, number> = {
  1: 10,
  2: 50,
  3: 200,
  4: 500,
  5: 1000,
};

export interface StakeCalculation {
  agentId: string;
  currentScore: number;
  currentTier: number;
  currentLimit: number;

  requestedLimit: number;
  requestedCategory: string;

  // Stake requirements
  requiredStake: number; // Points locked during transaction
  riskMultiplier: number; // How much more you lose if dispute

  // Outcomes
  potentialGain: number; // Bonus if successful
  potentialLoss: number; // Total loss if dispute lost
  netRiskReward: number; // Gain - (Loss * dispute probability)

  // Eligibility
  eligible: boolean;
  reason?: string;

  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  successProbability: number;
}

export interface ActiveStake {
  id: string;
  agentId: string;
  captureId?: string | null;

  stakedAmount: number;
  requestedLimit: number;
  currentLimit: number;
  category: string;

  potentialGain: number;
  potentialLoss: number;
  riskMultiplier: number;

  status: 'active' | 'resolved_success' | 'resolved_dispute_won' | 'resolved_dispute_lost';

  createdAt: string;
  expiresAt: string;
  resolvedAt?: string | null;

  outcome?: {
    scoreChange: number;
    newScore: number;
    bonusEarned?: number;
  };
}

export interface StakingStats {
  totalStakes: number;
  successfulStakes: number;
  failedStakes: number;
  totalGained: number;
  totalLost: number;
  netEffect: number;
  winRate: number;
}

// In-memory fallback store
const inMemoryStakes: Map<string, ActiveStake> = new Map();
const inMemoryStakeHistory: Map<string, ActiveStake[]> = new Map();

// Map status from Prisma to API format
function mapStakeStatus(
  status: PrismaStakeStatus,
  outcome?: PrismaStakeOutcome | null
): ActiveStake['status'] {
  if (status === 'active') return 'active';
  if (status === 'expired') return 'active'; // Treat expired as still active for API
  // status === 'resolved'
  switch (outcome) {
    case 'success':
      return 'resolved_success';
    case 'dispute_won':
      return 'resolved_dispute_won';
    case 'dispute_lost':
      return 'resolved_dispute_lost';
    default:
      return 'resolved_success';
  }
}

// Map outcome from API to Prisma format
function mapOutcomeToPrisma(outcome: 'success' | 'dispute_won' | 'dispute_lost'): PrismaStakeOutcome {
  return outcome as PrismaStakeOutcome;
}

// Initialize demo stakes
function initDemoStakes() {
  const demoHistory: ActiveStake[] = [
    {
      id: 'stake_demo_001',
      agentId: 'agent_travel_pro',
      stakedAmount: 8,
      requestedLimit: 300,
      currentLimit: 200,
      category: 'travel',
      potentialGain: 2,
      potentialLoss: 12,
      riskMultiplier: 1.5,
      status: 'resolved_success',
      createdAt: '2024-05-15T10:00:00Z',
      expiresAt: '2024-05-22T10:00:00Z',
      resolvedAt: '2024-05-16T14:30:00Z',
      outcome: { scoreChange: 2, newScore: 89, bonusEarned: 2 },
    },
    {
      id: 'stake_demo_002',
      agentId: 'agent_travel_pro',
      stakedAmount: 10,
      requestedLimit: 400,
      currentLimit: 200,
      category: 'travel',
      potentialGain: 2,
      potentialLoss: 15,
      riskMultiplier: 1.5,
      status: 'resolved_dispute_won',
      createdAt: '2024-05-20T09:00:00Z',
      expiresAt: '2024-05-27T09:00:00Z',
      resolvedAt: '2024-05-24T16:00:00Z',
      outcome: { scoreChange: 5, newScore: 94, bonusEarned: 5 },
    },
  ];

  inMemoryStakeHistory.set('agent_travel_pro', demoHistory);
}

// Initialize on module load
initDemoStakes();

/**
 * Calculate stake requirements for a transaction above current tier limit
 */
export async function calculateStake(
  agentId: string,
  requestedLimit: number,
  category: string
): Promise<StakeCalculation | null> {
  // Try to get agent from database first, then fall back to demo data
  const dbAgent = await getAgentByExternalId(agentId);
  const demoAgent = getAgentById(agentId);
  const agent = dbAgent || demoAgent;

  if (!agent) return null;

  const currentLimit = TIER_LIMITS[agent.trustTier] || 10;

  // Can't stake below current limit
  if (requestedLimit <= currentLimit) {
    return {
      agentId,
      currentScore: agent.trustScore,
      currentTier: agent.trustTier,
      currentLimit,
      requestedLimit,
      requestedCategory: category,
      requiredStake: 0,
      riskMultiplier: 1,
      potentialGain: 0,
      potentialLoss: 0,
      netRiskReward: 0,
      eligible: false,
      reason: `Requested limit ($${requestedLimit}) is within your current tier limit ($${currentLimit}). No stake needed.`,
      riskLevel: 'low',
      successProbability: 1,
    };
  }

  // Can't stake more than 2 tiers above
  const maxStakeLimit = TIER_LIMITS[Math.min(agent.trustTier + 2, 5)] || 1000;
  if (requestedLimit > maxStakeLimit) {
    return {
      agentId,
      currentScore: agent.trustScore,
      currentTier: agent.trustTier,
      currentLimit,
      requestedLimit,
      requestedCategory: category,
      requiredStake: 0,
      riskMultiplier: 0,
      potentialGain: 0,
      potentialLoss: 0,
      netRiskReward: 0,
      eligible: false,
      reason: `Requested limit ($${requestedLimit}) exceeds maximum stakeable limit ($${maxStakeLimit}). Max 2 tiers above current.`,
      riskLevel: 'extreme',
      successProbability: 0,
    };
  }

  // Minimum score to stake
  if (agent.trustScore < 30) {
    return {
      agentId,
      currentScore: agent.trustScore,
      currentTier: agent.trustTier,
      currentLimit,
      requestedLimit,
      requestedCategory: category,
      requiredStake: 0,
      riskMultiplier: 0,
      potentialGain: 0,
      potentialLoss: 0,
      netRiskReward: 0,
      eligible: false,
      reason: 'Minimum trust score of 30 required to stake. Keep building your reputation.',
      riskLevel: 'high',
      successProbability: 0,
    };
  }

  // Calculate stake amount based on limit gap
  const limitGap = requestedLimit - currentLimit;
  const gapPercentage = limitGap / currentLimit;

  // Base stake: 5% of gap for every $100 above limit
  const baseStake = Math.ceil((limitGap / 100) * 5);

  // Risk multiplier based on gap
  let riskMultiplier = 1;
  if (gapPercentage > 0.5) riskMultiplier = 1.5;
  if (gapPercentage > 1) riskMultiplier = 2;
  if (gapPercentage > 2) riskMultiplier = 2.5;

  const requiredStake = Math.min(baseStake, Math.floor(agent.trustScore * 0.3)); // Max 30% of score

  // Success bonus: 20% of stake
  const potentialGain = Math.ceil(requiredStake * 0.2);

  // Loss: stake + (stake * multiplier)
  const potentialLoss = Math.ceil(requiredStake * (1 + riskMultiplier));

  // Success probability based on agent's track record
  const disputeRate =
    agent.disputesLost / Math.max(1, agent.disputesWon + agent.disputesLost);
  const successProbability = Math.max(
    0.5,
    1 - disputeRate - agent.violationCount * 0.05
  );

  // Net risk/reward
  const netRiskReward =
    potentialGain - potentialLoss * (1 - successProbability);

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
  if (gapPercentage > 0.3) riskLevel = 'medium';
  if (gapPercentage > 0.7) riskLevel = 'high';
  if (gapPercentage > 1.5) riskLevel = 'extreme';

  return {
    agentId,
    currentScore: agent.trustScore,
    currentTier: agent.trustTier,
    currentLimit,
    requestedLimit,
    requestedCategory: category,
    requiredStake,
    riskMultiplier,
    potentialGain,
    potentialLoss,
    netRiskReward: Math.round(netRiskReward * 10) / 10,
    eligible: true,
    riskLevel,
    successProbability: Math.round(successProbability * 100) / 100,
  };
}

/**
 * Lock a stake for a transaction above current tier limit
 */
export async function lockStake(
  agentId: string,
  requestedLimit: number,
  category: string,
  captureId?: string
): Promise<ActiveStake | { error: string }> {
  const calculation = await calculateStake(agentId, requestedLimit, category);

  if (!calculation) {
    return { error: 'Agent not found' };
  }

  if (!calculation.eligible) {
    return { error: calculation.reason || 'Not eligible to stake' };
  }

  // Check for existing active stake
  const existingStake = await getActiveStake(agentId);
  if (existingStake) {
    return {
      error: 'You already have an active stake. Resolve it before creating a new one.',
    };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (!dbAvailable) {
    return lockStakeInMemory(
      agentId,
      calculation,
      category,
      captureId,
      now,
      expiresAt
    );
  }

  try {
    // Get the agent's internal ID
    const agent = await prisma.agent.findUnique({
      where: { externalId: agentId },
    });

    if (!agent) {
      // Fall back to in-memory if agent not in database
      return lockStakeInMemory(
        agentId,
        calculation,
        category,
        captureId,
        now,
        expiresAt
      );
    }

    const stake = await prisma.stake.create({
      data: {
        agentId: agent.id,
        requestedLimit,
        currentLimit: calculation.currentLimit,
        category,
        captureId,
        stakedAmount: calculation.requiredStake,
        potentialGain: calculation.potentialGain,
        potentialLoss: calculation.potentialLoss,
        riskMultiplier: calculation.riskMultiplier,
        status: 'active',
        lockedAt: now,
        expiresAt,
      },
      include: {
        agent: true,
      },
    });

    return {
      id: stake.id,
      agentId: stake.agent.externalId,
      captureId: stake.captureId,
      stakedAmount: stake.stakedAmount,
      requestedLimit: stake.requestedLimit,
      currentLimit: stake.currentLimit,
      category: stake.category,
      potentialGain: stake.potentialGain,
      potentialLoss: stake.potentialLoss,
      riskMultiplier: stake.riskMultiplier,
      status: 'active',
      createdAt: stake.createdAt.toISOString(),
      expiresAt: stake.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Database error, falling back to in-memory:', error);
    dbAvailable = false;
    return lockStakeInMemory(
      agentId,
      calculation,
      category,
      captureId,
      now,
      expiresAt
    );
  }
}

function lockStakeInMemory(
  agentId: string,
  calculation: StakeCalculation,
  category: string,
  captureId: string | undefined,
  now: Date,
  expiresAt: Date
): ActiveStake {
  const stake: ActiveStake = {
    id: `stake_${crypto.randomBytes(8).toString('hex')}`,
    agentId,
    captureId,
    stakedAmount: calculation.requiredStake,
    requestedLimit: calculation.requestedLimit,
    currentLimit: calculation.currentLimit,
    category,
    potentialGain: calculation.potentialGain,
    potentialLoss: calculation.potentialLoss,
    riskMultiplier: calculation.riskMultiplier,
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  inMemoryStakes.set(stake.id, stake);
  return stake;
}

/**
 * Resolve an active stake after transaction completes
 */
export async function resolveStake(
  stakeId: string,
  outcome: 'success' | 'dispute_won' | 'dispute_lost'
): Promise<ActiveStake | { error: string }> {
  if (!dbAvailable) {
    return resolveStakeInMemory(stakeId, outcome);
  }

  try {
    const stake = await prisma.stake.findUnique({
      where: { id: stakeId },
      include: { agent: true },
    });

    if (!stake) {
      // Try in-memory
      return resolveStakeInMemory(stakeId, outcome);
    }

    if (stake.status !== 'active') {
      return { error: 'Stake already resolved' };
    }

    let scoreChange = 0;
    let bonusEarned = 0;

    switch (outcome) {
      case 'success':
        scoreChange = stake.potentialGain;
        bonusEarned = stake.potentialGain;
        break;
      case 'dispute_won':
        scoreChange = stake.potentialGain + 3;
        bonusEarned = stake.potentialGain + 3;
        break;
      case 'dispute_lost':
        scoreChange = -stake.potentialLoss;
        break;
    }

    const newScore = Math.max(
      0,
      Math.min(100, stake.agent.trustScore + scoreChange)
    );
    const resolvedAt = new Date();

    // Update stake and agent in a transaction
    await prisma.$transaction([
      prisma.stake.update({
        where: { id: stakeId },
        data: {
          status: 'resolved',
          outcome: mapOutcomeToPrisma(outcome),
          scoreChange,
          bonusEarned: bonusEarned > 0 ? bonusEarned : null,
          resolvedAt,
        },
      }),
      prisma.agent.update({
        where: { id: stake.agentId },
        data: {
          trustScore: newScore,
          lastActiveAt: resolvedAt,
        },
      }),
      prisma.trustEvent.create({
        data: {
          agentId: stake.agentId,
          eventType:
            outcome === 'dispute_lost' ? 'dispute_lost' : 'dispute_won',
          delta: scoreChange,
          reason: `Stake ${stakeId} resolved: ${outcome}`,
        },
      }),
    ]);

    const apiStatus = mapStakeStatus('resolved', mapOutcomeToPrisma(outcome));

    return {
      id: stake.id,
      agentId: stake.agent.externalId,
      captureId: stake.captureId,
      stakedAmount: stake.stakedAmount,
      requestedLimit: stake.requestedLimit,
      currentLimit: stake.currentLimit,
      category: stake.category,
      potentialGain: stake.potentialGain,
      potentialLoss: stake.potentialLoss,
      riskMultiplier: stake.riskMultiplier,
      status: apiStatus,
      createdAt: stake.createdAt.toISOString(),
      expiresAt: stake.expiresAt.toISOString(),
      resolvedAt: resolvedAt.toISOString(),
      outcome: {
        scoreChange,
        newScore,
        bonusEarned: bonusEarned > 0 ? bonusEarned : undefined,
      },
    };
  } catch (error) {
    console.error('Database error, falling back to in-memory:', error);
    dbAvailable = false;
    return resolveStakeInMemory(stakeId, outcome);
  }
}

function resolveStakeInMemory(
  stakeId: string,
  outcome: 'success' | 'dispute_won' | 'dispute_lost'
): ActiveStake | { error: string } {
  const stake = inMemoryStakes.get(stakeId);

  if (!stake) {
    return { error: 'Stake not found' };
  }

  if (stake.status !== 'active') {
    return { error: 'Stake already resolved' };
  }

  const agent = getAgentById(stake.agentId);
  if (!agent) {
    return { error: 'Agent not found' };
  }

  let scoreChange = 0;
  let bonusEarned = 0;

  switch (outcome) {
    case 'success':
      scoreChange = stake.potentialGain;
      bonusEarned = stake.potentialGain;
      stake.status = 'resolved_success';
      break;
    case 'dispute_won':
      scoreChange = stake.potentialGain + 3;
      bonusEarned = stake.potentialGain + 3;
      stake.status = 'resolved_dispute_won';
      break;
    case 'dispute_lost':
      scoreChange = -stake.potentialLoss;
      stake.status = 'resolved_dispute_lost';
      break;
  }

  stake.resolvedAt = new Date().toISOString();
  stake.outcome = {
    scoreChange,
    newScore: Math.max(0, Math.min(100, agent.trustScore + scoreChange)),
    bonusEarned: bonusEarned > 0 ? bonusEarned : undefined,
  };

  // Move to history
  const history = inMemoryStakeHistory.get(stake.agentId) || [];
  history.unshift(stake);
  inMemoryStakeHistory.set(stake.agentId, history.slice(0, 50));

  inMemoryStakes.delete(stakeId);

  return stake;
}

/**
 * Get active stake for agent
 */
export async function getActiveStake(agentId: string): Promise<ActiveStake | null> {
  if (!dbAvailable) {
    return getActiveStakeInMemory(agentId);
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { externalId: agentId },
    });

    if (!agent) {
      return getActiveStakeInMemory(agentId);
    }

    const stake = await prisma.stake.findFirst({
      where: {
        agentId: agent.id,
        status: 'active',
      },
      include: { agent: true },
    });

    if (!stake) {
      return getActiveStakeInMemory(agentId);
    }

    return {
      id: stake.id,
      agentId: stake.agent.externalId,
      captureId: stake.captureId,
      stakedAmount: stake.stakedAmount,
      requestedLimit: stake.requestedLimit,
      currentLimit: stake.currentLimit,
      category: stake.category,
      potentialGain: stake.potentialGain,
      potentialLoss: stake.potentialLoss,
      riskMultiplier: stake.riskMultiplier,
      status: 'active',
      createdAt: stake.createdAt.toISOString(),
      expiresAt: stake.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Database error:', error);
    return getActiveStakeInMemory(agentId);
  }
}

function getActiveStakeInMemory(agentId: string): ActiveStake | null {
  return (
    Array.from(inMemoryStakes.values()).find(
      (s) => s.agentId === agentId && s.status === 'active'
    ) || null
  );
}

/**
 * Get stake history for agent
 */
export async function getStakeHistory(agentId: string): Promise<ActiveStake[]> {
  if (!dbAvailable) {
    return getStakeHistoryInMemory(agentId);
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { externalId: agentId },
    });

    if (!agent) {
      return getStakeHistoryInMemory(agentId);
    }

    const stakes = await prisma.stake.findMany({
      where: {
        agentId: agent.id,
        status: 'resolved',
      },
      orderBy: { resolvedAt: 'desc' },
      take: 50,
      include: { agent: true },
    });

    if (stakes.length === 0) {
      return getStakeHistoryInMemory(agentId);
    }

    return stakes.map((stake) => ({
      id: stake.id,
      agentId: stake.agent.externalId,
      captureId: stake.captureId,
      stakedAmount: stake.stakedAmount,
      requestedLimit: stake.requestedLimit,
      currentLimit: stake.currentLimit,
      category: stake.category,
      potentialGain: stake.potentialGain,
      potentialLoss: stake.potentialLoss,
      riskMultiplier: stake.riskMultiplier,
      status: mapStakeStatus(stake.status, stake.outcome),
      createdAt: stake.createdAt.toISOString(),
      expiresAt: stake.expiresAt.toISOString(),
      resolvedAt: stake.resolvedAt?.toISOString() || null,
      outcome: stake.scoreChange !== null
        ? {
            scoreChange: stake.scoreChange,
            newScore: 0, // Would need to calculate from history
            bonusEarned: stake.bonusEarned || undefined,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('Database error:', error);
    return getStakeHistoryInMemory(agentId);
  }
}

function getStakeHistoryInMemory(agentId: string): ActiveStake[] {
  return inMemoryStakeHistory.get(agentId) || [];
}

/**
 * Get staking stats for agent
 */
export async function getStakingStats(agentId: string): Promise<StakingStats> {
  const history = await getStakeHistory(agentId);

  const successful = history.filter(
    (s) => s.status === 'resolved_success' || s.status === 'resolved_dispute_won'
  );
  const failed = history.filter((s) => s.status === 'resolved_dispute_lost');

  const totalGained = successful.reduce(
    (sum, s) => sum + (s.outcome?.bonusEarned || 0),
    0
  );
  const totalLost = failed.reduce(
    (sum, s) => sum + Math.abs(s.outcome?.scoreChange || 0),
    0
  );

  return {
    totalStakes: history.length,
    successfulStakes: successful.length,
    failedStakes: failed.length,
    totalGained,
    totalLost,
    netEffect: totalGained - totalLost,
    winRate:
      history.length > 0
        ? Math.round((successful.length / history.length) * 100)
        : 0,
  };
}
