/**
 * Merchant Acceptance Network
 *
 * A network of "RECEIPTS Verified Merchants" who offer preferential
 * treatment to high-trust agents:
 * - Skip human approval requirements
 * - Higher transaction limits
 * - Lower fees / Better rates
 * - Priority support
 *
 * The economic carrot that makes agents DESPERATE to climb tiers.
 */

import { getAgentById, type AgentProfile } from './badges';

export interface NetworkPerks {
  skipApproval: boolean;
  maxTransaction: number;
  feeDiscount: string;
  prioritySupport: boolean;
  earlyAccess: boolean;
  customTerms: boolean;
}

export interface NetworkMerchant {
  id: string;
  domain: string;
  name: string;
  logo?: string;
  category: string;
  description: string;

  // Tier requirements
  minTier: number;
  minScore: number;

  // Perks at each tier
  perks: NetworkPerks;
  tierPerks: Record<number, Partial<NetworkPerks>>;

  // Network stats
  totalAgents: number;
  avgSatisfaction: number;
  joinedAt: string;

  // Badges
  badges: string[];
}

export interface AgentAccess {
  granted: boolean;
  merchant: NetworkMerchant;
  currentTier: number;
  currentScore: number;
  perksUnlocked: string[];
  perksLocked: string[];
  upgradePath?: {
    nextTier: number;
    pointsNeeded: number;
    perksToUnlock: string[];
  };
}

// Demo network merchants
const NETWORK_MERCHANTS: NetworkMerchant[] = [
  {
    id: 'nm_amazon',
    domain: 'amazon.com',
    name: 'Amazon',
    category: 'retail',
    description: 'World\'s largest online marketplace. Verified agents get faster checkout and better dispute support.',
    minTier: 2,
    minScore: 25,
    perks: {
      skipApproval: true,
      maxTransaction: 500,
      feeDiscount: '5%',
      prioritySupport: true,
      earlyAccess: false,
      customTerms: false,
    },
    tierPerks: {
      2: { skipApproval: false, maxTransaction: 100 },
      3: { skipApproval: true, maxTransaction: 250, feeDiscount: '3%' },
      4: { maxTransaction: 500, feeDiscount: '5%', prioritySupport: true },
      5: { maxTransaction: 1000, feeDiscount: '8%', earlyAccess: true, customTerms: true },
    },
    totalAgents: 1247,
    avgSatisfaction: 4.6,
    joinedAt: '2024-01-15',
    badges: ['founding_partner', 'high_volume', 'top_rated'],
  },
  {
    id: 'nm_delta',
    domain: 'delta.com',
    name: 'Delta Airlines',
    category: 'travel',
    description: 'Premium airline partner. Tier 3+ agents get priority booking and flexible changes.',
    minTier: 3,
    minScore: 45,
    perks: {
      skipApproval: true,
      maxTransaction: 1000,
      feeDiscount: '0%',
      prioritySupport: true,
      earlyAccess: true,
      customTerms: false,
    },
    tierPerks: {
      3: { skipApproval: true, maxTransaction: 500 },
      4: { maxTransaction: 1000, prioritySupport: true },
      5: { maxTransaction: 2000, earlyAccess: true, customTerms: true },
    },
    totalAgents: 456,
    avgSatisfaction: 4.3,
    joinedAt: '2024-02-01',
    badges: ['premium_partner', 'travel_leader'],
  },
  {
    id: 'nm_marriott',
    domain: 'marriott.com',
    name: 'Marriott Hotels',
    category: 'hospitality',
    description: 'Global hotel chain. Verified agents get instant booking and late cancellation.',
    minTier: 2,
    minScore: 30,
    perks: {
      skipApproval: true,
      maxTransaction: 800,
      feeDiscount: '10%',
      prioritySupport: true,
      earlyAccess: false,
      customTerms: false,
    },
    tierPerks: {
      2: { skipApproval: false, maxTransaction: 200, feeDiscount: '5%' },
      3: { skipApproval: true, maxTransaction: 400, feeDiscount: '8%' },
      4: { maxTransaction: 800, feeDiscount: '10%', prioritySupport: true },
      5: { maxTransaction: 1500, feeDiscount: '15%', earlyAccess: true },
    },
    totalAgents: 892,
    avgSatisfaction: 4.7,
    joinedAt: '2024-01-20',
    badges: ['founding_partner', 'hospitality_leader', 'top_rated'],
  },
  {
    id: 'nm_github',
    domain: 'github.com',
    name: 'GitHub',
    category: 'software',
    description: 'Developer platform. Tier 4+ agents get enterprise terms and API priority.',
    minTier: 4,
    minScore: 65,
    perks: {
      skipApproval: true,
      maxTransaction: 500,
      feeDiscount: '15%',
      prioritySupport: true,
      earlyAccess: true,
      customTerms: true,
    },
    tierPerks: {
      4: { skipApproval: true, maxTransaction: 500, feeDiscount: '10%', prioritySupport: true },
      5: { maxTransaction: 1000, feeDiscount: '15%', earlyAccess: true, customTerms: true },
    },
    totalAgents: 234,
    avgSatisfaction: 4.8,
    joinedAt: '2024-03-01',
    badges: ['tech_partner', 'developer_favorite'],
  },
  {
    id: 'nm_aws',
    domain: 'aws.amazon.com',
    name: 'Amazon Web Services',
    category: 'cloud_services',
    description: 'Cloud infrastructure. Trusted agents get reserved capacity and premium support.',
    minTier: 4,
    minScore: 70,
    perks: {
      skipApproval: true,
      maxTransaction: 2000,
      feeDiscount: '5%',
      prioritySupport: true,
      earlyAccess: true,
      customTerms: true,
    },
    tierPerks: {
      4: { skipApproval: true, maxTransaction: 1000, feeDiscount: '3%', prioritySupport: true },
      5: { maxTransaction: 2000, feeDiscount: '5%', earlyAccess: true, customTerms: true },
    },
    totalAgents: 178,
    avgSatisfaction: 4.5,
    joinedAt: '2024-02-15',
    badges: ['enterprise_partner', 'cloud_leader'],
  },
  {
    id: 'nm_shopify',
    domain: 'shopify.com',
    name: 'Shopify',
    category: 'software',
    description: 'E-commerce platform. Verified agents get extended trial and priority onboarding.',
    minTier: 2,
    minScore: 25,
    perks: {
      skipApproval: true,
      maxTransaction: 300,
      feeDiscount: '20%',
      prioritySupport: true,
      earlyAccess: true,
      customTerms: false,
    },
    tierPerks: {
      2: { skipApproval: false, maxTransaction: 100, feeDiscount: '10%' },
      3: { skipApproval: true, maxTransaction: 200, feeDiscount: '15%', prioritySupport: true },
      4: { maxTransaction: 300, feeDiscount: '20%', earlyAccess: true },
      5: { maxTransaction: 500, feeDiscount: '25%', customTerms: true },
    },
    totalAgents: 567,
    avgSatisfaction: 4.6,
    joinedAt: '2024-01-25',
    badges: ['startup_friendly', 'growth_partner'],
  },
];

// Get all network merchants
export function getNetworkMerchants(options?: {
  category?: string;
  minTier?: number;
  sortBy?: 'name' | 'totalAgents' | 'avgSatisfaction' | 'joinedAt';
}): NetworkMerchant[] {
  let merchants = [...NETWORK_MERCHANTS];

  // Filter by category
  if (options?.category) {
    merchants = merchants.filter(m => m.category === options.category);
  }

  // Filter by min tier
  if (options?.minTier) {
    merchants = merchants.filter(m => m.minTier <= options.minTier!);
  }

  // Sort
  if (options?.sortBy) {
    switch (options.sortBy) {
      case 'name':
        merchants.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'totalAgents':
        merchants.sort((a, b) => b.totalAgents - a.totalAgents);
        break;
      case 'avgSatisfaction':
        merchants.sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);
        break;
      case 'joinedAt':
        merchants.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        break;
    }
  }

  return merchants;
}

// Get merchant by domain
export function getNetworkMerchant(domain: string): NetworkMerchant | undefined {
  return NETWORK_MERCHANTS.find(m => m.domain === domain);
}

// Check agent access to a merchant
export function checkAgentAccess(agentId: string, merchantDomain: string): AgentAccess | null {
  const agent = getAgentById(agentId);
  const merchant = getNetworkMerchant(merchantDomain);

  if (!agent || !merchant) return null;

  const granted = agent.trustTier >= merchant.minTier && agent.trustScore >= merchant.minScore;

  // Calculate perks at current tier
  const currentTierPerks = merchant.tierPerks[agent.trustTier] || {};
  const perksUnlocked: string[] = [];
  const perksLocked: string[] = [];

  // Check each perk
  if (currentTierPerks.skipApproval) perksUnlocked.push('Skip approval');
  else if (merchant.perks.skipApproval) perksLocked.push('Skip approval');

  if (currentTierPerks.maxTransaction) perksUnlocked.push(`$${currentTierPerks.maxTransaction} limit`);

  if (currentTierPerks.feeDiscount) perksUnlocked.push(`${currentTierPerks.feeDiscount} fee discount`);
  else if (merchant.perks.feeDiscount !== '0%') perksLocked.push(`${merchant.perks.feeDiscount} fee discount`);

  if (currentTierPerks.prioritySupport) perksUnlocked.push('Priority support');
  else if (merchant.perks.prioritySupport) perksLocked.push('Priority support');

  if (currentTierPerks.earlyAccess) perksUnlocked.push('Early access');
  else if (merchant.perks.earlyAccess) perksLocked.push('Early access');

  if (currentTierPerks.customTerms) perksUnlocked.push('Custom terms');
  else if (merchant.perks.customTerms) perksLocked.push('Custom terms');

  // Calculate upgrade path
  let upgradePath: AgentAccess['upgradePath'];
  if (agent.trustTier < 5) {
    const nextTier = agent.trustTier + 1;
    const nextTierPerks = merchant.tierPerks[nextTier];
    if (nextTierPerks) {
      const tierScores = [0, 21, 41, 61, 81];
      const pointsNeeded = Math.max(0, tierScores[nextTier] - agent.trustScore);

      const perksToUnlock: string[] = [];
      if (nextTierPerks.skipApproval && !currentTierPerks.skipApproval) perksToUnlock.push('Skip approval');
      if (nextTierPerks.maxTransaction && nextTierPerks.maxTransaction > (currentTierPerks.maxTransaction || 0)) {
        perksToUnlock.push(`$${nextTierPerks.maxTransaction} limit`);
      }
      if (nextTierPerks.feeDiscount) perksToUnlock.push(`${nextTierPerks.feeDiscount} fee discount`);
      if (nextTierPerks.prioritySupport && !currentTierPerks.prioritySupport) perksToUnlock.push('Priority support');
      if (nextTierPerks.earlyAccess && !currentTierPerks.earlyAccess) perksToUnlock.push('Early access');

      upgradePath = {
        nextTier,
        pointsNeeded,
        perksToUnlock,
      };
    }
  }

  return {
    granted,
    merchant,
    currentTier: agent.trustTier,
    currentScore: agent.trustScore,
    perksUnlocked,
    perksLocked,
    upgradePath,
  };
}

// Get all accessible merchants for an agent
export function getAccessibleMerchants(agentId: string): {
  accessible: AgentAccess[];
  locked: AgentAccess[];
} {
  const agent = getAgentById(agentId);
  if (!agent) return { accessible: [], locked: [] };

  const accessible: AgentAccess[] = [];
  const locked: AgentAccess[] = [];

  for (const merchant of NETWORK_MERCHANTS) {
    const access = checkAgentAccess(agentId, merchant.domain);
    if (access) {
      if (access.granted) {
        accessible.push(access);
      } else {
        locked.push(access);
      }
    }
  }

  return { accessible, locked };
}

// Network stats
export function getNetworkStats() {
  const merchants = NETWORK_MERCHANTS;
  const totalMerchants = merchants.length;
  const totalAgents = merchants.reduce((sum, m) => sum + m.totalAgents, 0);
  const avgSatisfaction = merchants.reduce((sum, m) => sum + m.avgSatisfaction, 0) / totalMerchants;
  const categories = [...new Set(merchants.map(m => m.category))];

  return {
    totalMerchants,
    totalAgentsConnected: totalAgents,
    avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    categories,
    tier2Merchants: merchants.filter(m => m.minTier === 2).length,
    tier3Merchants: merchants.filter(m => m.minTier === 3).length,
    tier4Merchants: merchants.filter(m => m.minTier === 4).length,
    tier5Merchants: merchants.filter(m => m.minTier === 5).length,
  };
}

// Merchant badges
export const MERCHANT_BADGES: Record<string, { label: string; icon: string }> = {
  founding_partner: { label: 'Founding Partner', icon: '🏆' },
  premium_partner: { label: 'Premium Partner', icon: '⭐' },
  enterprise_partner: { label: 'Enterprise Partner', icon: '🏢' },
  tech_partner: { label: 'Tech Partner', icon: '💻' },
  high_volume: { label: 'High Volume', icon: '📈' },
  top_rated: { label: 'Top Rated', icon: '❤️' },
  travel_leader: { label: 'Travel Leader', icon: '✈️' },
  hospitality_leader: { label: 'Hospitality Leader', icon: '🏨' },
  cloud_leader: { label: 'Cloud Leader', icon: '☁️' },
  developer_favorite: { label: 'Developer Favorite', icon: '👨‍💻' },
  startup_friendly: { label: 'Startup Friendly', icon: '🚀' },
  growth_partner: { label: 'Growth Partner', icon: '📊' },
};
