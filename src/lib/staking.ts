/**
 * Trust Score Staking Engine
 *
 * High-trust agents can "stake" their trust score to access larger
 * transaction limits. If it goes well, they keep their score.
 * If there's a dispute, they risk losing MORE points.
 *
 * Confident agents can punch above their weight class.
 */

import crypto from 'crypto';
import { getAgentById, type AgentProfile, TRUST_TIERS } from './badges';

export interface StakeCalculation {
  agentId: string;
  currentScore: number;
  currentTier: number;
  currentLimit: number;

  requestedLimit: number;
  requestedCategory: string;

  // Stake requirements
  requiredStake: number;        // Points locked during transaction
  riskMultiplier: number;       // How much more you lose if dispute

  // Outcomes
  potentialGain: number;        // Bonus if successful
  potentialLoss: number;        // Total loss if dispute lost
  netRiskReward: number;        // Gain - (Loss * dispute probability)

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
  captureId?: string;

  stakedAmount: number;
  requestedLimit: number;
  category: string;

  potentialGain: number;
  potentialLoss: number;

  status: 'active' | 'resolved_success' | 'resolved_dispute_won' | 'resolved_dispute_lost';

  createdAt: string;
  expiresAt: string;
  resolvedAt?: string;

  outcome?: {
    scoreChange: number;
    newScore: number;
    bonusEarned?: number;
  };
}

// Tier limits for reference
const TIER_LIMITS: Record<number, number> = {
  1: 10,
  2: 50,
  3: 200,
  4: 500,
  5: 1000,
};

// In-memory store for demo
const activeStakes: Map<string, ActiveStake> = new Map();
const stakeHistory: Map<string, ActiveStake[]> = new Map();

// Calculate stake requirements
export function calculateStake(
  agentId: string,
  requestedLimit: number,
  category: string
): StakeCalculation | null {
  const agent = getAgentById(agentId);
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
  const disputeRate = agent.disputesLost / Math.max(1, agent.disputesWon + agent.disputesLost);
  const successProbability = Math.max(0.5, 1 - disputeRate - (agent.violationCount * 0.05));

  // Net risk/reward
  const netRiskReward = potentialGain - (potentialLoss * (1 - successProbability));

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

// Lock a stake
export function lockStake(
  agentId: string,
  requestedLimit: number,
  category: string,
  captureId?: string
): ActiveStake | { error: string } {
  const calculation = calculateStake(agentId, requestedLimit, category);

  if (!calculation) {
    return { error: 'Agent not found' };
  }

  if (!calculation.eligible) {
    return { error: calculation.reason || 'Not eligible to stake' };
  }

  // Check if agent already has an active stake
  const existingStake = Array.from(activeStakes.values()).find(
    s => s.agentId === agentId && s.status === 'active'
  );
  if (existingStake) {
    return { error: 'You already have an active stake. Resolve it before creating a new one.' };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const stake: ActiveStake = {
    id: `stake_${crypto.randomBytes(8).toString('hex')}`,
    agentId,
    captureId,
    stakedAmount: calculation.requiredStake,
    requestedLimit,
    category,
    potentialGain: calculation.potentialGain,
    potentialLoss: calculation.potentialLoss,
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  activeStakes.set(stake.id, stake);

  return stake;
}

// Resolve a stake
export function resolveStake(
  stakeId: string,
  outcome: 'success' | 'dispute_won' | 'dispute_lost'
): ActiveStake | { error: string } {
  const stake = activeStakes.get(stakeId);

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
      // Transaction completed successfully - get stake back + bonus
      scoreChange = stake.potentialGain;
      bonusEarned = stake.potentialGain;
      stake.status = 'resolved_success';
      break;

    case 'dispute_won':
      // Dispute was filed but agent won - get stake back + bigger bonus
      scoreChange = stake.potentialGain + 3; // Extra bonus for winning dispute
      bonusEarned = stake.potentialGain + 3;
      stake.status = 'resolved_dispute_won';
      break;

    case 'dispute_lost':
      // Dispute lost - lose the staked amount + penalty
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
  const history = stakeHistory.get(stake.agentId) || [];
  history.unshift(stake);
  stakeHistory.set(stake.agentId, history.slice(0, 50)); // Keep last 50

  activeStakes.delete(stakeId);

  return stake;
}

// Get active stake for agent
export function getActiveStake(agentId: string): ActiveStake | null {
  return Array.from(activeStakes.values()).find(
    s => s.agentId === agentId && s.status === 'active'
  ) || null;
}

// Get stake history for agent
export function getStakeHistory(agentId: string): ActiveStake[] {
  return stakeHistory.get(agentId) || [];
}

// Get staking stats for agent
export function getStakingStats(agentId: string): {
  totalStakes: number;
  successfulStakes: number;
  failedStakes: number;
  totalGained: number;
  totalLost: number;
  netEffect: number;
  winRate: number;
} {
  const history = getStakeHistory(agentId);

  const successful = history.filter(s =>
    s.status === 'resolved_success' || s.status === 'resolved_dispute_won'
  );
  const failed = history.filter(s => s.status === 'resolved_dispute_lost');

  const totalGained = successful.reduce((sum, s) => sum + (s.outcome?.bonusEarned || 0), 0);
  const totalLost = failed.reduce((sum, s) => sum + Math.abs(s.outcome?.scoreChange || 0), 0);

  return {
    totalStakes: history.length,
    successfulStakes: successful.length,
    failedStakes: failed.length,
    totalGained,
    totalLost,
    netEffect: totalGained - totalLost,
    winRate: history.length > 0 ? Math.round((successful.length / history.length) * 100) : 0,
  };
}

// Initialize demo stakes
export function initDemoStakes() {
  // Create some resolved stakes for demo agents
  const demoHistory: ActiveStake[] = [
    {
      id: 'stake_demo_001',
      agentId: 'agent_travel_pro',
      stakedAmount: 8,
      requestedLimit: 300,
      category: 'travel',
      potentialGain: 2,
      potentialLoss: 12,
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
      category: 'travel',
      potentialGain: 2,
      potentialLoss: 15,
      status: 'resolved_dispute_won',
      createdAt: '2024-05-20T09:00:00Z',
      expiresAt: '2024-05-27T09:00:00Z',
      resolvedAt: '2024-05-24T16:00:00Z',
      outcome: { scoreChange: 5, newScore: 94, bonusEarned: 5 },
    },
  ];

  stakeHistory.set('agent_travel_pro', demoHistory);
}

// Initialize on module load
initDemoStakes();
