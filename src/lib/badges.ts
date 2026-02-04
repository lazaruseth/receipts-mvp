/**
 * Badge System for REMASTER Agents
 *
 * Badges are achievements that agents earn through their behavior.
 * They serve as trust signals and competitive motivation.
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'trust' | 'milestone' | 'special';
  requirement: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface AgentProfile {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;

  // Trust metrics
  trustScore: number;
  trustTier: number;
  tierName: string;

  // Activity stats
  totalAgreements: number;
  agreementsThisMonth: number;
  disputesWon: number;
  disputesLost: number;
  violationCount: number;

  // Badges
  badges: string[];

  // Timestamps
  createdAt: string;
  lastActiveAt: string;
}

// Badge definitions
export const BADGES: Badge[] = [
  // Achievement badges
  {
    id: 'first_capture',
    name: 'First Capture',
    description: 'Captured your first agreement',
    icon: '🎯',
    category: 'achievement',
    requirement: 'Capture 1 agreement',
    rarity: 'common',
  },
  {
    id: 'ten_club',
    name: '10 Club',
    description: 'Captured 10 agreements',
    icon: '🔟',
    category: 'milestone',
    requirement: 'Capture 10 agreements',
    rarity: 'common',
  },
  {
    id: 'hundred_club',
    name: '100 Club',
    description: 'Captured 100 agreements',
    icon: '💯',
    category: 'milestone',
    requirement: 'Capture 100 agreements',
    rarity: 'uncommon',
  },
  {
    id: 'thousand_club',
    name: '1K Club',
    description: 'Captured 1,000 agreements',
    icon: '🏅',
    category: 'milestone',
    requirement: 'Capture 1,000 agreements',
    rarity: 'rare',
  },

  // Trust badges
  {
    id: 'clean_record',
    name: 'Clean Record',
    description: 'Maintained zero violations across 50+ agreements',
    icon: '✨',
    category: 'trust',
    requirement: '50 agreements with 0 violations',
    rarity: 'uncommon',
  },
  {
    id: 'trusted_agent',
    name: 'Trusted Agent',
    description: 'Reached Trust Tier 3 (Established)',
    icon: '🛡️',
    category: 'trust',
    requirement: 'Reach trust score 41+',
    rarity: 'uncommon',
  },
  {
    id: 'trusted_elite',
    name: 'Trusted Elite',
    description: 'Reached Trust Tier 5 (Trusted)',
    icon: '👑',
    category: 'trust',
    requirement: 'Reach trust score 81+',
    rarity: 'legendary',
  },

  // Dispute badges
  {
    id: 'dispute_winner',
    name: 'Dispute Champion',
    description: 'Won your first dispute',
    icon: '🏆',
    category: 'achievement',
    requirement: 'Win 1 dispute',
    rarity: 'uncommon',
  },
  {
    id: 'dispute_master',
    name: 'Dispute Master',
    description: 'Won 10 disputes with evidence',
    icon: '⚔️',
    category: 'achievement',
    requirement: 'Win 10 disputes',
    rarity: 'rare',
  },

  // Special badges
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined REMASTER in the first month',
    icon: '🌟',
    category: 'special',
    requirement: 'Sign up in first month',
    rarity: 'epic',
  },
  {
    id: 'risk_hunter',
    name: 'Risk Hunter',
    description: 'Flagged 50+ high-risk clauses',
    icon: '🔍',
    category: 'achievement',
    requirement: 'Flag 50 high-risk clauses',
    rarity: 'rare',
  },
  {
    id: 'community_guardian',
    name: 'Community Guardian',
    description: 'Shared 10+ caught clauses publicly',
    icon: '🦸',
    category: 'special',
    requirement: 'Share 10 caught clauses',
    rarity: 'rare',
  },
];

// Trust tier definitions
export const TRUST_TIERS = [
  { tier: 1, name: 'New', minScore: 0, maxScore: 20, color: 'gray', capabilities: ['Basic capture', 'View agreements'] },
  { tier: 2, name: 'Verified', minScore: 21, maxScore: 40, color: 'blue', capabilities: ['...Tier 1', 'Policy validation', 'Basic disputes'] },
  { tier: 3, name: 'Established', minScore: 41, maxScore: 60, color: 'green', capabilities: ['...Tier 2', 'Priority support', 'Merchant insights'] },
  { tier: 4, name: 'Premium', minScore: 61, maxScore: 80, color: 'purple', capabilities: ['...Tier 3', 'Advanced analytics', 'Bulk operations'] },
  { tier: 5, name: 'Trusted', minScore: 81, maxScore: 100, color: 'gold', capabilities: ['...Tier 4', 'Auto-approval', 'White-glove support'] },
];

// Helper functions
export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}

export function getTierByScore(score: number): typeof TRUST_TIERS[0] {
  return TRUST_TIERS.find(t => score >= t.minScore && score <= t.maxScore) || TRUST_TIERS[0];
}

export function getTierColor(tier: number): string {
  const colors: Record<number, string> = {
    1: 'bg-gray-100 text-gray-700 border-gray-300',
    2: 'bg-blue-100 text-blue-700 border-blue-300',
    3: 'bg-green-100 text-green-700 border-green-300',
    4: 'bg-purple-100 text-purple-700 border-purple-300',
    5: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  };
  return colors[tier] || colors[1];
}

export function getRarityColor(rarity: Badge['rarity']): string {
  const colors: Record<Badge['rarity'], string> = {
    common: 'bg-gray-100 text-gray-600',
    uncommon: 'bg-green-100 text-green-700',
    rare: 'bg-blue-100 text-blue-700',
    epic: 'bg-purple-100 text-purple-700',
    legendary: 'bg-yellow-100 text-yellow-700',
  };
  return colors[rarity];
}

// Calculate badges for an agent based on their stats
export function calculateBadges(profile: Partial<AgentProfile>): string[] {
  const badges: string[] = [];

  // Milestone badges
  if ((profile.totalAgreements || 0) >= 1) badges.push('first_capture');
  if ((profile.totalAgreements || 0) >= 10) badges.push('ten_club');
  if ((profile.totalAgreements || 0) >= 100) badges.push('hundred_club');
  if ((profile.totalAgreements || 0) >= 1000) badges.push('thousand_club');

  // Trust badges
  if ((profile.trustScore || 0) >= 41) badges.push('trusted_agent');
  if ((profile.trustScore || 0) >= 81) badges.push('trusted_elite');

  // Clean record
  if ((profile.totalAgreements || 0) >= 50 && (profile.violationCount || 0) === 0) {
    badges.push('clean_record');
  }

  // Dispute badges
  if ((profile.disputesWon || 0) >= 1) badges.push('dispute_winner');
  if ((profile.disputesWon || 0) >= 10) badges.push('dispute_master');

  return badges;
}

// Demo agent data for the leaderboard
export function getDemoAgents(): AgentProfile[] {
  return [
    {
      id: 'agent_travel_pro',
      name: 'TravelBot Pro',
      description: 'Autonomous travel booking agent specializing in flights and hotels',
      trustScore: 87,
      trustTier: 5,
      tierName: 'Trusted',
      totalAgreements: 1247,
      agreementsThisMonth: 89,
      disputesWon: 12,
      disputesLost: 1,
      violationCount: 0,
      badges: ['first_capture', 'ten_club', 'hundred_club', 'thousand_club', 'trusted_elite', 'clean_record', 'dispute_winner', 'dispute_master', 'early_adopter'],
      createdAt: '2024-01-15T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_shop_assistant',
      name: 'ShopAssist AI',
      description: 'E-commerce purchasing agent for consumer goods',
      trustScore: 72,
      trustTier: 4,
      tierName: 'Premium',
      totalAgreements: 856,
      agreementsThisMonth: 124,
      disputesWon: 5,
      disputesLost: 2,
      violationCount: 3,
      badges: ['first_capture', 'ten_club', 'hundred_club', 'dispute_winner', 'early_adopter'],
      createdAt: '2024-02-01T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_finance_guard',
      name: 'FinanceGuard',
      description: 'Financial services agent with strict compliance focus',
      trustScore: 94,
      trustTier: 5,
      tierName: 'Trusted',
      totalAgreements: 432,
      agreementsThisMonth: 45,
      disputesWon: 8,
      disputesLost: 0,
      violationCount: 0,
      badges: ['first_capture', 'ten_club', 'hundred_club', 'trusted_elite', 'clean_record', 'dispute_winner', 'risk_hunter'],
      createdAt: '2024-01-20T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_auto_buyer',
      name: 'AutoBuyer',
      description: 'Automated procurement agent for enterprise supplies',
      trustScore: 56,
      trustTier: 3,
      tierName: 'Established',
      totalAgreements: 234,
      agreementsThisMonth: 67,
      disputesWon: 2,
      disputesLost: 4,
      violationCount: 8,
      badges: ['first_capture', 'ten_club', 'hundred_club', 'trusted_agent'],
      createdAt: '2024-03-01T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_subscription_mgr',
      name: 'SubManager',
      description: 'Subscription and SaaS management agent',
      trustScore: 45,
      trustTier: 3,
      tierName: 'Established',
      totalAgreements: 178,
      agreementsThisMonth: 23,
      disputesWon: 1,
      disputesLost: 1,
      violationCount: 5,
      badges: ['first_capture', 'ten_club', 'hundred_club', 'trusted_agent', 'dispute_winner'],
      createdAt: '2024-03-15T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_new_starter',
      name: 'NewBot',
      description: 'Recently onboarded agent building trust',
      trustScore: 28,
      trustTier: 2,
      tierName: 'Verified',
      totalAgreements: 34,
      agreementsThisMonth: 34,
      disputesWon: 0,
      disputesLost: 0,
      violationCount: 1,
      badges: ['first_capture', 'ten_club'],
      createdAt: '2024-06-01T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    },
  ];
}

// Get agent by ID
export function getAgentById(agentId: string): AgentProfile | undefined {
  return getDemoAgents().find(a => a.id === agentId);
}

// Get leaderboard
export function getAgentLeaderboard(
  type: 'trust_score' | 'total_agreements' | 'disputes_won' | 'most_active' = 'trust_score',
  limit: number = 10
): AgentProfile[] {
  const agents = getDemoAgents();

  switch (type) {
    case 'trust_score':
      return agents.sort((a, b) => b.trustScore - a.trustScore).slice(0, limit);
    case 'total_agreements':
      return agents.sort((a, b) => b.totalAgreements - a.totalAgreements).slice(0, limit);
    case 'disputes_won':
      return agents.sort((a, b) => b.disputesWon - a.disputesWon).slice(0, limit);
    case 'most_active':
      return agents.sort((a, b) => b.agreementsThisMonth - a.agreementsThisMonth).slice(0, limit);
    default:
      return agents.slice(0, limit);
  }
}

// Get leaderboard stats
export function getLeaderboardStats() {
  const agents = getDemoAgents();
  return {
    totalAgents: agents.length,
    avgTrustScore: Math.round(agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length),
    totalAgreements: agents.reduce((sum, a) => sum + a.totalAgreements, 0),
    totalDisputes: agents.reduce((sum, a) => sum + a.disputesWon + a.disputesLost, 0),
    tier5Count: agents.filter(a => a.trustTier === 5).length,
  };
}
