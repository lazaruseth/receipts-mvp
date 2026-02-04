import { NextRequest, NextResponse } from 'next/server';
import {
  getDemoAgent,
  getCapabilitiesForScore,
  getTrustTier,
  getProgressToNextTier,
} from '@/lib/trust-score';
import type { TrustEvent } from '@/types/pao';

/**
 * GET /api/agents/:agentId/reputation
 *
 * Get an agent's trust score, stats, and capabilities.
 * This is what agents query to understand their current standing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // For MVP, use demo agent
    const agent = getDemoAgent(agentId);
    const tier = getTrustTier(agent.trustScore);
    const progress = getProgressToNextTier(agent.trustScore, []);

    // Generate recent activity (mock for demo)
    const recentActivity = generateMockActivity(agentId, agent.trustScore);

    return NextResponse.json({
      agentId,
      trustScore: agent.trustScore,
      tier: {
        name: getTierName(agent.trustScore),
        minScore: tier.minScore,
        maxScore: tier.maxScore,
        perks: tier.perks,
      },
      stats: agent.stats,
      capabilities: agent.capabilities,
      progress: {
        ...progress,
        percentToNextTier: progress.pointsNeeded > 0
          ? Math.round((1 - progress.pointsNeeded / (progress.nextTierScore - tier.minScore)) * 100)
          : 100,
      },
      recentActivity,
      insights: generateInsights(agent.trustScore, agent.stats),
      registeredAt: agent.createdAt.toISOString(),
      lastActiveAt: agent.stats.lastActiveAt.toISOString(),
    });
  } catch (error) {
    console.error('Reputation fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reputation' },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable tier name.
 */
function getTierName(score: number): string {
  if (score >= 81) return 'Trusted Delegate';
  if (score >= 61) return 'Verified Operator';
  if (score >= 41) return 'Active Transactor';
  if (score >= 21) return 'Emerging Agent';
  return 'New Agent';
}

/**
 * Generate mock recent activity for demo.
 */
function generateMockActivity(agentId: string, trustScore: number): Array<{
  type: string;
  description: string;
  delta: number;
  timestamp: string;
}> {
  const activities = [];
  const now = Date.now();

  // Generate some plausible activity based on trust score
  const numActivities = Math.min(10, Math.floor(trustScore / 5));

  for (let i = 0; i < numActivities; i++) {
    const daysAgo = i * 2;
    const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    // Vary activity types
    const types = [
      { type: 'agreement_captured', description: 'Captured agreement', delta: 1 },
      { type: 'agreement_compliant', description: 'Agreement passed policy', delta: 2 },
      { type: 'daily_activity', description: 'Daily activity bonus', delta: 0.1 },
    ];

    const activity = types[i % types.length];
    activities.push({
      ...activity,
      timestamp,
    });
  }

  return activities;
}

/**
 * Generate insights and recommendations for the agent.
 */
function generateInsights(
  trustScore: number,
  stats: { totalAgreements: number; compliantAgreements: number; disputesWon: number; disputesLost: number }
): string[] {
  const insights: string[] = [];

  // Compliance rate
  const complianceRate = stats.totalAgreements > 0
    ? Math.round((stats.compliantAgreements / stats.totalAgreements) * 100)
    : 0;

  if (complianceRate >= 90) {
    insights.push(`✨ Excellent compliance rate (${complianceRate}%) - keep it up!`);
  } else if (complianceRate >= 70) {
    insights.push(`📈 Good compliance rate (${complianceRate}%) - room for improvement`);
  } else if (stats.totalAgreements > 0) {
    insights.push(`⚠️ Low compliance rate (${complianceRate}%) - review your policy settings`);
  }

  // Trust score insights
  if (trustScore < 21) {
    insights.push(`💡 Capture ${Math.ceil((21 - trustScore) / 3)} more agreements to unlock $50/tx limit`);
  } else if (trustScore < 61) {
    insights.push(`💡 Reach score 61 to unlock on-chain anchoring`);
  } else if (trustScore < 81) {
    insights.push(`💡 Reach score 81 for near-full autonomy`);
  } else {
    insights.push(`🏆 You've achieved Trusted Delegate status - maximum autonomy unlocked`);
  }

  // Dispute insights
  if (stats.disputesLost > 0) {
    insights.push(`⚠️ ${stats.disputesLost} lost dispute(s) impacted your score. Review captured agreements for evidence.`);
  }
  if (stats.disputesWon > 0) {
    insights.push(`✅ ${stats.disputesWon} dispute(s) won - Agreement Guard protected you!`);
  }

  // Activity insights
  if (stats.totalAgreements === 0) {
    insights.push(`🚀 Start capturing agreements to build your trust score`);
  } else if (stats.totalAgreements < 5) {
    insights.push(`📊 ${stats.totalAgreements} agreement(s) captured - you're getting started!`);
  }

  return insights;
}
