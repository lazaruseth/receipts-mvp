/**
 * Merchant Intelligence System
 *
 * Aggregates risk data across all captured agreements to build
 * merchant risk profiles and leaderboards.
 */

import { DEMO_AGREEMENTS } from './demo-data';
import type { RiskFlag } from '@/types';

export interface MerchantProfile {
  id: string;
  domain: string;
  name: string;
  category: string;

  // Risk metrics (0-100, higher = safer)
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';

  // Agreement stats
  totalAgreements: number;
  disputeCount: number;
  disputeWinRate: number;

  // Common risk flags (percentage of agreements containing each)
  flagPrevalence: Record<string, number>;
  topFlags: Array<{ flag: RiskFlag; percentage: number }>;

  // Metadata
  lastUpdated: string;
}

export interface MerchantLeaderboard {
  type: 'safest' | 'riskiest' | 'most_disputes' | 'trending';
  merchants: MerchantProfile[];
}

// Calculate risk score from flags (higher = safer)
function calculateRiskScore(flags: RiskFlag[]): number {
  const flagWeights: Record<string, number> = {
    BINDING_ARBITRATION: 20,
    CHARGEBACK_WAIVER: 25,
    CLASS_ACTION_WAIVER: 15,
    NON_REFUNDABLE: 20,
    BROAD_INDEMNIFICATION: 15,
    DATA_SHARING_EXTENSIVE: 10,
    AUTO_RENEWAL_HIDDEN: 10,
    FOREIGN_JURISDICTION: 5,
    SHORT_DISPUTE_WINDOW: 10,
    PRICE_NOT_GUARANTEED: 5,
  };

  let penalty = 0;
  for (const flag of flags) {
    penalty += flagWeights[flag] || 5;
  }

  return Math.max(0, 100 - penalty);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'low';
  if (score >= 40) return 'medium';
  return 'high';
}

// Generate merchant profiles from demo data
export function getMerchantProfiles(): MerchantProfile[] {
  const merchantMap = new Map<string, MerchantProfile>();

  for (const agreement of DEMO_AGREEMENTS) {
    const domain = agreement.sourceUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    if (!merchantMap.has(domain)) {
      const riskScore = calculateRiskScore(agreement.riskFlags);
      const flagPrevalence: Record<string, number> = {};

      for (const flag of agreement.riskFlags) {
        flagPrevalence[flag] = 100; // Single agreement = 100%
      }

      const topFlags = agreement.riskFlags.map((flag) => ({
        flag,
        percentage: 100,
      }));

      merchantMap.set(domain, {
        id: `merchant_${domain.replace(/\./g, '_')}`,
        domain,
        name: agreement.merchantName,
        category: agreement.merchantCategory,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        totalAgreements: 1,
        disputeCount: agreement.status === 'disputed' ? 1 : 0,
        disputeWinRate: 0,
        flagPrevalence,
        topFlags,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  return Array.from(merchantMap.values());
}

// Get a single merchant profile
export function getMerchantProfile(domain: string): MerchantProfile | null {
  const profiles = getMerchantProfiles();
  return profiles.find((p) => p.domain === domain || p.domain.includes(domain)) || null;
}

// Get merchant leaderboard
export function getMerchantLeaderboard(
  type: 'safest' | 'riskiest' | 'most_disputes' | 'trending',
  limit: number = 10
): MerchantLeaderboard {
  const profiles = getMerchantProfiles();

  let sorted: MerchantProfile[];

  switch (type) {
    case 'safest':
      sorted = [...profiles].sort((a, b) => b.riskScore - a.riskScore);
      break;
    case 'riskiest':
      sorted = [...profiles].sort((a, b) => a.riskScore - b.riskScore);
      break;
    case 'most_disputes':
      sorted = [...profiles].sort((a, b) => b.disputeCount - a.disputeCount);
      break;
    case 'trending':
      // For demo, just randomize
      sorted = [...profiles].sort(() => Math.random() - 0.5);
      break;
    default:
      sorted = profiles;
  }

  return {
    type,
    merchants: sorted.slice(0, limit),
  };
}

// Search merchants
export function searchMerchants(query: string): MerchantProfile[] {
  const profiles = getMerchantProfiles();
  const lowerQuery = query.toLowerCase();

  return profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.domain.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}

// Get summary stats across all merchants
export function getMerchantStats() {
  const profiles = getMerchantProfiles();

  const totalMerchants = profiles.length;
  const avgRiskScore = profiles.reduce((sum, p) => sum + p.riskScore, 0) / totalMerchants;
  const highRiskCount = profiles.filter((p) => p.riskLevel === 'high').length;
  const lowRiskCount = profiles.filter((p) => p.riskLevel === 'low').length;

  // Most common flags
  const flagCounts: Record<string, number> = {};
  for (const profile of profiles) {
    for (const flag of Object.keys(profile.flagPrevalence)) {
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    }
  }

  const mostCommonFlags = Object.entries(flagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flag, count]) => ({
      flag,
      count,
      percentage: Math.round((count / totalMerchants) * 100),
    }));

  return {
    totalMerchants,
    avgRiskScore: Math.round(avgRiskScore),
    highRiskCount,
    lowRiskCount,
    mostCommonFlags,
  };
}
