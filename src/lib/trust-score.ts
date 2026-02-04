/**
 * Trust Score Calculation Engine
 *
 * Calculates agent trust scores based on their agreement history.
 * Higher trust = more autonomy, higher spending limits, fewer interruptions.
 */

import type {
  Agent,
  AgentCapabilities,
  AgentStats,
  TrustEvent,
  TrustEventType,
  TrustTier,
  AgreementCategory,
} from '@/types/pao';

import { TRUST_TIERS, TRUST_SCORE_DELTAS } from '@/types/pao';

// Re-export for convenience
export { TRUST_TIERS, TRUST_SCORE_DELTAS } from '@/types/pao';

// ============================================
// Trust Score Calculation
// ============================================

/**
 * Calculate trust score from events.
 * Score is clamped between 0 and 100.
 */
export function calculateTrustScore(events: TrustEvent[]): number {
  const BASE_SCORE = 10; // Starting score for new agents

  let score = BASE_SCORE;

  // Apply caps for certain event types
  let agreementCapturedCount = 0;
  let compliantCount = 0;
  let dailyActivityDays = new Set<string>();

  for (const event of events) {
    switch (event.eventType) {
      case 'agreement_captured':
        // Cap at 30 points from captures
        if (agreementCapturedCount < 30) {
          score += TRUST_SCORE_DELTAS.agreement_captured;
          agreementCapturedCount++;
        }
        break;

      case 'agreement_compliant':
        // Cap at 40 points from compliant agreements
        if (compliantCount < 20) {
          score += TRUST_SCORE_DELTAS.agreement_compliant;
          compliantCount++;
        }
        break;

      case 'daily_activity':
        // Cap at 20 points from daily activity (200 days)
        const day = event.createdAt.toISOString().split('T')[0];
        if (!dailyActivityDays.has(day) && dailyActivityDays.size < 200) {
          score += TRUST_SCORE_DELTAS.daily_activity;
          dailyActivityDays.add(day);
        }
        break;

      default:
        // No cap on disputes won/lost or policy violations
        score += event.delta;
    }
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Get the trust tier for a given score.
 */
export function getTrustTier(score: number): TrustTier {
  // Import from types to avoid circular dependency
  const tiers: TrustTier[] = [
    {
      minScore: 0,
      maxScore: 20,
      maxSpendPerTx: 10,
      autoApproveCategories: [],
      requireApprovalCategories: ['travel', 'financial', 'healthcare', 'insurance', 'legal', 'hospitality', 'software', 'cloud_services', 'retail', 'subscription', 'api_access', 'entertainment', 'other'],
      perks: ['Basic agreement capture', 'Manual approval for all categories'],
    },
    {
      minScore: 21,
      maxScore: 40,
      maxSpendPerTx: 50,
      autoApproveCategories: ['retail', 'entertainment', 'api_access'],
      requireApprovalCategories: ['travel', 'financial', 'healthcare', 'insurance', 'legal', 'hospitality', 'software', 'cloud_services', 'subscription', 'other'],
      perks: ['Low-risk auto-approval', 'Basic dispute support'],
    },
    {
      minScore: 41,
      maxScore: 60,
      maxSpendPerTx: 200,
      autoApproveCategories: ['retail', 'entertainment', 'api_access', 'software', 'subscription'],
      requireApprovalCategories: ['travel', 'financial', 'healthcare', 'insurance', 'legal', 'hospitality', 'cloud_services', 'other'],
      perks: ['Medium-risk auto-approval', 'Priority dispute support'],
    },
    {
      minScore: 61,
      maxScore: 80,
      maxSpendPerTx: 500,
      autoApproveCategories: ['retail', 'entertainment', 'api_access', 'software', 'subscription', 'hospitality', 'cloud_services'],
      requireApprovalCategories: ['travel', 'financial', 'healthcare', 'insurance', 'legal', 'other'],
      perks: ['Most categories auto-approved', 'On-chain anchoring', 'Dispute evidence generation'],
    },
    {
      minScore: 81,
      maxScore: 100,
      maxSpendPerTx: 1000,
      autoApproveCategories: ['retail', 'entertainment', 'api_access', 'software', 'subscription', 'hospitality', 'cloud_services', 'travel', 'other'],
      requireApprovalCategories: ['financial', 'healthcare', 'insurance', 'legal'],
      perks: ['Full autonomy for most categories', 'Priority support', 'Beta features access'],
    },
  ];

  for (const tier of tiers) {
    if (score >= tier.minScore && score <= tier.maxScore) {
      return tier;
    }
  }

  // Default to lowest tier
  return tiers[0];
}

/**
 * Get capabilities for an agent based on their trust score.
 */
export function getCapabilitiesForScore(score: number): AgentCapabilities {
  const tier = getTrustTier(score);

  return {
    maxSpendPerTx: tier.maxSpendPerTx,
    allowedCategories: tier.autoApproveCategories as AgreementCategory[],
    requiresHumanApproval: tier.requireApprovalCategories as AgreementCategory[],
    canAnchorOnchain: score >= 61, // Unlocked at tier 4
  };
}

/**
 * Calculate how many more agreements needed to reach next tier.
 */
export function getProgressToNextTier(score: number, currentEvents: TrustEvent[]): {
  nextTierScore: number;
  pointsNeeded: number;
  agreementsNeeded: number;
  nextTierMaxSpend: number;
} {
  const tiers = [
    { minScore: 21, maxSpend: 50 },
    { minScore: 41, maxSpend: 200 },
    { minScore: 61, maxSpend: 500 },
    { minScore: 81, maxSpend: 1000 },
  ];

  for (const tier of tiers) {
    if (score < tier.minScore) {
      const pointsNeeded = tier.minScore - score;
      // Each compliant agreement = 2 points, capture = 1 point
      // Assume average of 3 points per agreement cycle
      const agreementsNeeded = Math.ceil(pointsNeeded / 3);

      return {
        nextTierScore: tier.minScore,
        pointsNeeded,
        agreementsNeeded,
        nextTierMaxSpend: tier.maxSpend,
      };
    }
  }

  // Already at max tier
  return {
    nextTierScore: 100,
    pointsNeeded: 0,
    agreementsNeeded: 0,
    nextTierMaxSpend: 1000,
  };
}

// ============================================
// Trust Event Creation
// ============================================

/**
 * Create a trust event for an agent action.
 */
export function createTrustEvent(
  agentId: string,
  eventType: TrustEventType,
  options?: {
    reason?: string;
    relatedAgreementId?: string;
    relatedDisputeId?: string;
  }
): Omit<TrustEvent, 'id'> {
  const delta = TRUST_SCORE_DELTAS[eventType];

  const reasons: Record<TrustEventType, string> = {
    agreement_captured: 'Captured an agreement',
    agreement_compliant: 'Agreement passed policy validation',
    agreement_risky_accepted: 'Accepted agreement with risk flags',
    dispute_won: 'Won a dispute',
    dispute_lost: 'Lost a dispute',
    policy_violation: 'Violated policy rules',
    daily_activity: 'Daily activity bonus',
  };

  return {
    agentId,
    eventType,
    delta,
    reason: options?.reason || reasons[eventType],
    relatedAgreementId: options?.relatedAgreementId,
    relatedDisputeId: options?.relatedDisputeId,
    createdAt: new Date(),
  };
}

// ============================================
// Agent Stats Calculation
// ============================================

/**
 * Calculate agent stats from events and agreements.
 */
export function calculateAgentStats(
  events: TrustEvent[],
  agreements: { riskFlags: string[] }[]
): AgentStats {
  const stats: AgentStats = {
    totalAgreements: 0,
    compliantAgreements: 0,
    disputesWon: 0,
    disputesLost: 0,
    avgRiskScore: 0,
    lastActiveAt: new Date(),
  };

  let totalRisk = 0;

  for (const event of events) {
    if (event.eventType === 'agreement_captured') {
      stats.totalAgreements++;
    } else if (event.eventType === 'agreement_compliant') {
      stats.compliantAgreements++;
    } else if (event.eventType === 'dispute_won') {
      stats.disputesWon++;
    } else if (event.eventType === 'dispute_lost') {
      stats.disputesLost++;
    }

    if (event.createdAt > stats.lastActiveAt) {
      stats.lastActiveAt = event.createdAt;
    }
  }

  // Calculate average risk score from agreements
  for (const agreement of agreements) {
    totalRisk += agreement.riskFlags.length;
  }
  stats.avgRiskScore = agreements.length > 0 ? totalRisk / agreements.length : 0;

  return stats;
}

// ============================================
// Demo Agent Data
// ============================================

/**
 * Get demo agent data for testing/demos.
 */
export function getDemoAgent(agentId: string): Agent {
  // Simulate different trust levels based on agent ID
  const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trustScore = 10 + (hash % 80); // 10-90 range

  const stats = {
    totalAgreements: Math.floor(trustScore / 2),
    compliantAgreements: Math.floor(trustScore / 2.5),
    disputesWon: Math.floor(trustScore / 20),
    disputesLost: Math.floor(trustScore / 40),
    avgRiskScore: 2 + Math.random() * 3,
    lastActiveAt: new Date(),
  };

  return {
    id: `agent_${agentId}`,
    externalId: agentId,
    agentType: 'openclaw',
    trustScore,
    capabilities: getCapabilitiesForScore(trustScore),
    stats,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(),
  };
}
