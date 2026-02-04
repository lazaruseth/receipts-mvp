/**
 * Real-Time Agreement Intel Engine
 *
 * Provides collective intelligence across the REMASTER network:
 * - ToS changes detected
 * - Risk flag spikes
 * - Dispute clusters
 * - Novel clause patterns
 *
 * Agents get intel that solo agents can't access.
 */

export type IntelType =
  | 'tos_change'
  | 'flag_spike'
  | 'dispute_cluster'
  | 'new_clause_pattern'
  | 'merchant_alert'
  | 'trending_risk';

export type IntelSeverity = 'info' | 'warning' | 'critical';

export interface IntelItem {
  id: string;
  type: IntelType;
  severity: IntelSeverity;
  title: string;
  description: string;
  merchant?: string;
  merchantDomain?: string;
  category?: string;

  // Stats
  affectedAgents: number;
  reportCount: number;

  // Timestamps
  detectedAt: string;
  lastUpdated: string;

  // Related data
  relatedFlags?: string[];
  recommendedAction?: string;
}

export interface IntelAlert {
  id: string;
  type: IntelType;
  severity: IntelSeverity;
  title: string;
  message: string;
  merchant?: string;
  actionRequired: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface IntelFeedResponse {
  items: IntelItem[];
  alerts: IntelAlert[];
  stats: {
    totalIntelToday: number;
    criticalAlerts: number;
    merchantsAffected: number;
    topRiskFlags: Array<{ flag: string; count: number }>;
  };
  lastUpdated: string;
}

// Generate demo intel items based on realistic scenarios
function generateDemoIntel(): IntelItem[] {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      id: 'intel_001',
      type: 'tos_change',
      severity: 'critical',
      title: 'Amazon Web Services updated Terms of Service',
      description: 'AWS updated their terms to include new binding arbitration clause for disputes over $10,000. This affects enterprise agreements.',
      merchant: 'Amazon Web Services',
      merchantDomain: 'aws.amazon.com',
      category: 'cloud_services',
      affectedAgents: 47,
      reportCount: 23,
      detectedAt: hourAgo.toISOString(),
      lastUpdated: now.toISOString(),
      relatedFlags: ['BINDING_ARBITRATION', 'CLASS_ACTION_WAIVER'],
      recommendedAction: 'Review existing AWS agreements and consider negotiating enterprise terms',
    },
    {
      id: 'intel_002',
      type: 'flag_spike',
      severity: 'warning',
      title: 'Spike in chargeback waiver clauses',
      description: 'Travel industry merchants showing 40% increase in chargeback waiver clauses this week. Airlines and hotels affected.',
      category: 'travel',
      affectedAgents: 156,
      reportCount: 89,
      detectedAt: threeHoursAgo.toISOString(),
      lastUpdated: now.toISOString(),
      relatedFlags: ['CHARGEBACK_WAIVER', 'NON_REFUNDABLE'],
      recommendedAction: 'Enable strict chargeback protection in policy settings',
    },
    {
      id: 'intel_003',
      type: 'dispute_cluster',
      severity: 'critical',
      title: 'Multiple disputes against FlyFast Airlines',
      description: '12 disputes filed in last 48 hours for service not rendered. Pattern suggests systematic overbooking issue.',
      merchant: 'FlyFast Airlines',
      merchantDomain: 'flyfast.com',
      category: 'travel',
      affectedAgents: 12,
      reportCount: 12,
      detectedAt: sixHoursAgo.toISOString(),
      lastUpdated: hourAgo.toISOString(),
      relatedFlags: ['NON_REFUNDABLE', 'SHORT_DISPUTE_WINDOW'],
      recommendedAction: 'Avoid FlyFast bookings or require full prepayment protection',
    },
    {
      id: 'intel_004',
      type: 'new_clause_pattern',
      severity: 'warning',
      title: 'New AI training opt-in clause detected',
      description: 'SaaS providers adding "AI training data" clauses allowing use of your data for model training. 15 merchants affected.',
      category: 'software',
      affectedAgents: 234,
      reportCount: 67,
      detectedAt: dayAgo.toISOString(),
      lastUpdated: threeHoursAgo.toISOString(),
      relatedFlags: ['DATA_SHARING_EXTENSIVE'],
      recommendedAction: 'Add AI_TRAINING_OPT_IN to forbidden clauses list',
    },
    {
      id: 'intel_005',
      type: 'merchant_alert',
      severity: 'info',
      title: 'Marriott improved refund policy',
      description: 'Marriott extended cancellation window from 24h to 48h and removed arbitration requirement. Consumer-friendly update.',
      merchant: 'Marriott Hotels',
      merchantDomain: 'marriott.com',
      category: 'hospitality',
      affectedAgents: 89,
      reportCount: 34,
      detectedAt: dayAgo.toISOString(),
      lastUpdated: dayAgo.toISOString(),
      relatedFlags: [],
      recommendedAction: 'Marriott now recommended for hospitality bookings',
    },
    {
      id: 'intel_006',
      type: 'trending_risk',
      severity: 'warning',
      title: 'Binding arbitration trending in retail',
      description: 'E-commerce platforms increasingly adding binding arbitration. Amazon, eBay, Shopify merchants affected.',
      category: 'retail',
      affectedAgents: 312,
      reportCount: 145,
      detectedAt: threeHoursAgo.toISOString(),
      lastUpdated: now.toISOString(),
      relatedFlags: ['BINDING_ARBITRATION'],
      recommendedAction: 'Consider enabling auto-reject for arbitration clauses',
    },
  ];
}

// Generate active alerts
function generateDemoAlerts(): IntelAlert[] {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return [
    {
      id: 'alert_001',
      type: 'tos_change',
      severity: 'critical',
      title: 'AWS Terms Changed',
      message: 'Binding arbitration clause added. Review your AWS agreements.',
      merchant: 'aws.amazon.com',
      actionRequired: true,
      createdAt: now.toISOString(),
      expiresAt: in24Hours.toISOString(),
    },
    {
      id: 'alert_002',
      type: 'dispute_cluster',
      severity: 'critical',
      title: 'FlyFast Airlines Risk',
      message: '12 disputes in 48h. Avoid new bookings.',
      merchant: 'flyfast.com',
      actionRequired: true,
      createdAt: now.toISOString(),
      expiresAt: in48Hours.toISOString(),
    },
    {
      id: 'alert_003',
      type: 'flag_spike',
      severity: 'warning',
      title: 'Travel Industry Alert',
      message: 'Chargeback waivers up 40% this week.',
      actionRequired: false,
      createdAt: now.toISOString(),
      expiresAt: in48Hours.toISOString(),
    },
  ];
}

// Get intel feed
export function getIntelFeed(options?: {
  type?: IntelType;
  severity?: IntelSeverity;
  merchant?: string;
  category?: string;
  limit?: number;
}): IntelFeedResponse {
  let items = generateDemoIntel();
  const alerts = generateDemoAlerts();

  // Filter by options
  if (options?.type) {
    items = items.filter(i => i.type === options.type);
  }
  if (options?.severity) {
    items = items.filter(i => i.severity === options.severity);
  }
  if (options?.merchant) {
    items = items.filter(i =>
      i.merchant?.toLowerCase().includes(options.merchant!.toLowerCase()) ||
      i.merchantDomain?.toLowerCase().includes(options.merchant!.toLowerCase())
    );
  }
  if (options?.category) {
    items = items.filter(i => i.category === options.category);
  }

  // Sort by severity and recency
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });

  // Limit
  if (options?.limit) {
    items = items.slice(0, options.limit);
  }

  // Calculate stats
  const allFlags = items.flatMap(i => i.relatedFlags || []);
  const flagCounts = allFlags.reduce((acc, flag) => {
    acc[flag] = (acc[flag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topRiskFlags = Object.entries(flagCounts)
    .map(([flag, count]) => ({ flag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const uniqueMerchants = new Set(items.filter(i => i.merchantDomain).map(i => i.merchantDomain));

  return {
    items,
    alerts: alerts.filter(a => new Date(a.expiresAt) > new Date()),
    stats: {
      totalIntelToday: items.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      merchantsAffected: uniqueMerchants.size,
      topRiskFlags,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Get specific alert
export function getAlert(alertId: string): IntelAlert | undefined {
  return generateDemoAlerts().find(a => a.id === alertId);
}

// Get intel for specific merchant
export function getMerchantIntel(merchantDomain: string): IntelItem[] {
  return generateDemoIntel().filter(i =>
    i.merchantDomain?.toLowerCase() === merchantDomain.toLowerCase()
  );
}

// Intel type labels
export const INTEL_TYPE_LABELS: Record<IntelType, { label: string; icon: string; description: string }> = {
  tos_change: {
    label: 'Terms Changed',
    icon: '📝',
    description: 'Merchant updated their terms of service',
  },
  flag_spike: {
    label: 'Risk Spike',
    icon: '📈',
    description: 'Sudden increase in risk flags detected',
  },
  dispute_cluster: {
    label: 'Dispute Cluster',
    icon: '⚠️',
    description: 'Multiple disputes against same merchant',
  },
  new_clause_pattern: {
    label: 'New Pattern',
    icon: '🔍',
    description: 'Novel clause pattern detected in agreements',
  },
  merchant_alert: {
    label: 'Merchant Update',
    icon: '🏪',
    description: 'Important merchant policy change',
  },
  trending_risk: {
    label: 'Trending Risk',
    icon: '🔥',
    description: 'Risk type becoming more common',
  },
};

// Severity labels
export const SEVERITY_LABELS: Record<IntelSeverity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
  warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-700' },
  info: { label: 'Info', color: 'bg-blue-100 text-blue-700' },
};
