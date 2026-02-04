/**
 * Agent Performance Analytics Engine
 *
 * Provides deep analytics showing agents:
 * - Score breakdown: Exactly why their trust score is what it is
 * - Opportunity calculator: What actions have highest ROI
 * - Peer benchmarks: Comparison to similar agents
 * - Trajectory prediction: When they'll reach next tier
 */

import { getAgentById, getDemoAgents, TRUST_TIERS, type AgentProfile } from './badges';

// Score component breakdown
export interface ScoreBreakdown {
  fromCaptures: number;      // +1 per agreement captured (capped at 30)
  fromCompliance: number;    // +2 per compliant agreement (capped at 40)
  fromDisputes: number;      // +5 per dispute won (uncapped)
  fromDaily: number;         // +0.1 per day active (capped at 20)
  penalties: number;         // Violations, risky agreements, lost disputes
  baseScore: number;         // Starting score (10)
  total: number;
}

// Improvement opportunity
export interface Opportunity {
  action: string;
  description: string;
  impact: number;           // Points gained
  effort: 'low' | 'medium' | 'high';
  timeEstimate: string;     // "1-2 days", "1 week", etc.
  category: 'capture' | 'compliance' | 'dispute' | 'consistency';
}

// Trajectory prediction
export interface TrajectoryPrediction {
  currentTier: number;
  currentScore: number;
  nextTier: number;
  nextTierName: string;
  nextTierScore: number;
  pointsNeeded: number;
  estimatedDays: number;
  confidence: number;        // 0-1
  accelerators: string[];    // Tips to speed up
}

// Peer benchmarks
export interface PeerBenchmark {
  category: string;
  percentile: number;        // 0-100
  yourValue: number;
  avgValue: number;
  topValue: number;
  comparison: 'above' | 'below' | 'average';
}

// Full analytics report
export interface AgentAnalytics {
  agentId: string;
  agentName: string;
  generatedAt: string;

  breakdown: ScoreBreakdown;
  opportunities: Opportunity[];
  trajectory: TrajectoryPrediction;
  benchmarks: PeerBenchmark[];

  // Quick insights
  insights: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

// Calculate score breakdown for an agent
export function calculateScoreBreakdown(agent: AgentProfile): ScoreBreakdown {
  // Estimate components based on agent stats
  // In production, this would come from actual event logs

  // Captures: +1 each, capped at 30
  const capturePoints = Math.min(agent.totalAgreements, 30);

  // Compliance: +2 each for compliant agreements
  const compliantCount = agent.totalAgreements - agent.violationCount;
  const compliancePoints = Math.min(compliantCount * 2, 40);

  // Disputes: +5 for wins
  const disputePoints = agent.disputesWon * 5;

  // Daily activity: estimate based on creation date
  const createdAt = new Date(agent.createdAt);
  const now = new Date();
  const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const dailyPoints = Math.min(daysActive * 0.1, 20);

  // Penalties
  const violationPenalties = agent.violationCount * -3;
  const disputeLossPenalties = agent.disputesLost * -10;
  const penalties = violationPenalties + disputeLossPenalties;

  // Base score all agents start with
  const baseScore = 10;

  const total = Math.max(0, Math.min(100,
    baseScore + capturePoints + compliancePoints + disputePoints + dailyPoints + penalties
  ));

  return {
    fromCaptures: Math.round(capturePoints),
    fromCompliance: Math.round(compliancePoints),
    fromDisputes: Math.round(disputePoints),
    fromDaily: Math.round(dailyPoints * 10) / 10,
    penalties: Math.round(penalties),
    baseScore,
    total: Math.round(total),
  };
}

// Calculate improvement opportunities
export function calculateOpportunities(agent: AgentProfile, breakdown: ScoreBreakdown): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Check capture room
  if (breakdown.fromCaptures < 30) {
    const remaining = 30 - breakdown.fromCaptures;
    opportunities.push({
      action: `Capture ${Math.min(remaining, 5)} more agreements`,
      description: 'Each agreement captured adds +1 to your trust score',
      impact: Math.min(remaining, 5),
      effort: 'low',
      timeEstimate: '1-2 days',
      category: 'capture',
    });
  }

  // Check compliance room
  if (breakdown.fromCompliance < 40) {
    opportunities.push({
      action: 'Maintain policy compliance',
      description: 'Each compliant agreement adds +2. Avoid policy violations.',
      impact: 4,
      effort: 'low',
      timeEstimate: 'ongoing',
      category: 'compliance',
    });
  }

  // Disputes - if they have violations or disputes pending
  if (agent.violationCount > 0 || agent.disputesLost > 0) {
    opportunities.push({
      action: 'Win a dispute to recover points',
      description: 'Each dispute won adds +5. Use captured agreement evidence.',
      impact: 5,
      effort: 'medium',
      timeEstimate: '1-2 weeks',
      category: 'dispute',
    });
  }

  // Daily consistency
  if (breakdown.fromDaily < 20) {
    opportunities.push({
      action: 'Stay active daily',
      description: 'Each day of activity adds +0.1. Consistency compounds.',
      impact: 3,
      effort: 'low',
      timeEstimate: '30 days',
      category: 'consistency',
    });
  }

  // High-value: more compliant captures
  opportunities.push({
    action: 'Focus on low-risk merchants',
    description: 'Compliant captures are worth +3 total (+1 capture + +2 compliance)',
    impact: 6,
    effort: 'medium',
    timeEstimate: '1 week',
    category: 'compliance',
  });

  // Sort by impact/effort ratio
  return opportunities.sort((a, b) => {
    const effortScore = { low: 1, medium: 2, high: 3 };
    const ratioA = a.impact / effortScore[a.effort];
    const ratioB = b.impact / effortScore[b.effort];
    return ratioB - ratioA;
  });
}

// Calculate trajectory to next tier
export function calculateTrajectory(agent: AgentProfile, breakdown: ScoreBreakdown): TrajectoryPrediction {
  const currentTier = TRUST_TIERS.find(t =>
    agent.trustScore >= t.minScore && agent.trustScore <= t.maxScore
  ) || TRUST_TIERS[0];

  const nextTierIndex = TRUST_TIERS.findIndex(t => t.tier === currentTier.tier) + 1;
  const nextTier = nextTierIndex < TRUST_TIERS.length
    ? TRUST_TIERS[nextTierIndex]
    : currentTier;

  const pointsNeeded = Math.max(0, nextTier.minScore - agent.trustScore);

  // Estimate velocity based on agent's recent activity
  const daysActive = Math.max(1, Math.floor(
    (new Date().getTime() - new Date(agent.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const pointsPerDay = (agent.trustScore - 10) / daysActive; // Assuming started at 10
  const estimatedDays = pointsPerDay > 0 ? Math.ceil(pointsNeeded / pointsPerDay) : 999;

  // Confidence based on consistency
  const confidence = Math.min(0.95, 0.5 + (pointsPerDay * 0.1) + (agent.violationCount === 0 ? 0.2 : 0));

  // Accelerators
  const accelerators: string[] = [];
  if (breakdown.fromCaptures < 30) {
    accelerators.push('Increase capture volume (+1 per agreement)');
  }
  if (agent.violationCount > 0) {
    accelerators.push('Improve compliance to avoid -3 penalties');
  }
  if (agent.disputesLost > 0) {
    accelerators.push('Win disputes to recover lost points (+5 each)');
  }
  if (accelerators.length === 0) {
    accelerators.push('Maintain current pace - you\'re on track!');
  }

  return {
    currentTier: currentTier.tier,
    currentScore: agent.trustScore,
    nextTier: nextTier.tier,
    nextTierName: nextTier.name,
    nextTierScore: nextTier.minScore,
    pointsNeeded,
    estimatedDays: Math.min(estimatedDays, 365),
    confidence: Math.round(confidence * 100) / 100,
    accelerators,
  };
}

// Calculate peer benchmarks
export function calculateBenchmarks(agent: AgentProfile): PeerBenchmark[] {
  const allAgents = getDemoAgents();

  const getPercentile = (value: number, allValues: number[]): number => {
    const sorted = [...allValues].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return Math.round((index / sorted.length) * 100);
  };

  const getComparison = (value: number, avg: number): 'above' | 'below' | 'average' => {
    if (value > avg * 1.1) return 'above';
    if (value < avg * 0.9) return 'below';
    return 'average';
  };

  const trustScores = allAgents.map(a => a.trustScore);
  const avgTrustScore = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;

  const agreementCounts = allAgents.map(a => a.totalAgreements);
  const avgAgreements = agreementCounts.reduce((a, b) => a + b, 0) / agreementCounts.length;

  const complianceRates = allAgents.map(a =>
    a.totalAgreements > 0 ? ((a.totalAgreements - a.violationCount) / a.totalAgreements) * 100 : 100
  );
  const avgCompliance = complianceRates.reduce((a, b) => a + b, 0) / complianceRates.length;
  const agentCompliance = agent.totalAgreements > 0
    ? ((agent.totalAgreements - agent.violationCount) / agent.totalAgreements) * 100
    : 100;

  const disputeWinRates = allAgents.map(a => {
    const total = a.disputesWon + a.disputesLost;
    return total > 0 ? (a.disputesWon / total) * 100 : 100;
  });
  const avgDisputeWin = disputeWinRates.reduce((a, b) => a + b, 0) / disputeWinRates.length;
  const agentDisputeWin = agent.disputesWon + agent.disputesLost > 0
    ? (agent.disputesWon / (agent.disputesWon + agent.disputesLost)) * 100
    : 100;

  return [
    {
      category: 'Trust Score',
      percentile: getPercentile(agent.trustScore, trustScores),
      yourValue: agent.trustScore,
      avgValue: Math.round(avgTrustScore),
      topValue: Math.max(...trustScores),
      comparison: getComparison(agent.trustScore, avgTrustScore),
    },
    {
      category: 'Total Agreements',
      percentile: getPercentile(agent.totalAgreements, agreementCounts),
      yourValue: agent.totalAgreements,
      avgValue: Math.round(avgAgreements),
      topValue: Math.max(...agreementCounts),
      comparison: getComparison(agent.totalAgreements, avgAgreements),
    },
    {
      category: 'Compliance Rate',
      percentile: getPercentile(agentCompliance, complianceRates),
      yourValue: Math.round(agentCompliance),
      avgValue: Math.round(avgCompliance),
      topValue: 100,
      comparison: getComparison(agentCompliance, avgCompliance),
    },
    {
      category: 'Dispute Win Rate',
      percentile: getPercentile(agentDisputeWin, disputeWinRates),
      yourValue: Math.round(agentDisputeWin),
      avgValue: Math.round(avgDisputeWin),
      topValue: 100,
      comparison: getComparison(agentDisputeWin, avgDisputeWin),
    },
  ];
}

// Generate quick insights
export function generateInsights(agent: AgentProfile, breakdown: ScoreBreakdown, benchmarks: PeerBenchmark[]): {
  insights: string[];
  strengthAreas: string[];
  improvementAreas: string[];
} {
  const insights: string[] = [];
  const strengthAreas: string[] = [];
  const improvementAreas: string[] = [];

  // Trust score insight
  const trustBenchmark = benchmarks.find(b => b.category === 'Trust Score');
  if (trustBenchmark && trustBenchmark.percentile >= 75) {
    insights.push(`🏆 Top ${100 - trustBenchmark.percentile}% of all agents by trust score`);
    strengthAreas.push('Overall trust ranking');
  }

  // Compliance insight
  if (agent.violationCount === 0) {
    insights.push('✨ Perfect compliance record - zero violations');
    strengthAreas.push('Policy compliance');
  } else {
    insights.push(`⚠️ ${agent.violationCount} violation(s) affecting your score by ${agent.violationCount * -3} points`);
    improvementAreas.push('Reduce policy violations');
  }

  // Dispute insight
  if (agent.disputesWon > 0) {
    insights.push(`🏅 ${agent.disputesWon} dispute(s) won - evidence-backed protection working`);
    strengthAreas.push('Dispute resolution');
  }
  if (agent.disputesLost > 0) {
    improvementAreas.push('Improve dispute win rate');
  }

  // Capture volume
  if (breakdown.fromCaptures >= 25) {
    insights.push('📊 Approaching capture point cap - focus on compliance quality');
  } else if (breakdown.fromCaptures < 10) {
    insights.push('📈 Room to grow: capture more agreements for easy points');
    improvementAreas.push('Increase agreement capture volume');
  }

  // Activity
  if (breakdown.fromDaily >= 15) {
    insights.push('🔥 Excellent consistency - daily activity paying off');
    strengthAreas.push('Consistent activity');
  }

  return { insights, strengthAreas, improvementAreas };
}

// Generate full analytics report
export function generateAnalytics(agentId: string): AgentAnalytics | null {
  const agent = getAgentById(agentId);
  if (!agent) return null;

  const breakdown = calculateScoreBreakdown(agent);
  const opportunities = calculateOpportunities(agent, breakdown);
  const trajectory = calculateTrajectory(agent, breakdown);
  const benchmarks = calculateBenchmarks(agent);
  const { insights, strengthAreas, improvementAreas } = generateInsights(agent, breakdown, benchmarks);

  return {
    agentId: agent.id,
    agentName: agent.name,
    generatedAt: new Date().toISOString(),
    breakdown,
    opportunities,
    trajectory,
    benchmarks,
    insights,
    strengthAreas,
    improvementAreas,
  };
}
