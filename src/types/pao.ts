/**
 * Programmable Agreement Object (PAO) Types
 *
 * The PAO is the canonical machine-readable representation of a legal agreement.
 * It bridges legal terms (PDF/HTML) with deterministic enforcement.
 */

export const PAO_VERSION = 'pao-0.3';

// ============================================
// Core PAO Schema
// ============================================

export interface PAO {
  version: typeof PAO_VERSION;
  termsHash: string; // keccak256 of canonical PAO encoding

  parties: {
    principal: string;      // User/agent DID or wallet address
    counterparty: string;   // Merchant domain or identifier
  };

  scope: {
    category: AgreementCategory;
    item?: string;          // Specific product/service
    description?: string;
  };

  pricing?: {
    currency: string;       // USD, USDC, ETH, etc.
    amount?: number;        // If known at acceptance time
    maxTotal?: number;      // Spending cap
  };

  remedies: {
    refundable: 'full' | 'partial' | 'none' | 'conditional';
    refundWindowHours?: number;
    cancellationFee?: number;
    cancellationFeeType?: 'flat' | 'percentage';
    chargebackRights: 'preserved' | 'waived' | 'limited' | 'unknown';
  };

  dispute: {
    forum: 'courts' | 'arbitration' | 'mediation' | 'unspecified';
    venue?: string;         // Jurisdiction
    arbitrationBinding?: boolean;
    classActionWaiver: boolean;
  };

  data: {
    thirdPartySharing: boolean;
    resale: 'allowed' | 'forbidden' | 'unspecified';
    training: 'allowed' | 'opt_out' | 'forbidden' | 'unspecified';
    retentionPeriod?: string;
  };

  autoRenewal?: {
    enabled: boolean;
    frequency?: string;
    cancellationNotice?: string;
  };

  liability?: {
    indemnification: boolean;
    maxLiability?: string;
    limitations?: string[];
  };

  time: {
    capturedAt: string;     // ISO timestamp of capture
    acceptedAt?: string;    // ISO timestamp of acceptance
    expiresAt?: string;     // When agreement expires
  };

  termsURI: string;         // Link to original terms (IPFS or hosted)
}

// ============================================
// Agreement Categories
// ============================================

export type AgreementCategory =
  | 'travel'
  | 'hospitality'
  | 'software'
  | 'cloud_services'
  | 'retail'
  | 'subscription'
  | 'api_access'
  | 'financial'
  | 'entertainment'
  | 'healthcare'
  | 'insurance'
  | 'legal'
  | 'other';

export const CATEGORY_RISK_LEVELS: Record<AgreementCategory, 'low' | 'medium' | 'high'> = {
  travel: 'high',           // Often non-refundable, arbitration
  hospitality: 'medium',
  software: 'medium',
  cloud_services: 'medium',
  retail: 'low',
  subscription: 'medium',   // Auto-renewal risks
  api_access: 'low',
  financial: 'high',        // Critical data, liability
  entertainment: 'low',
  healthcare: 'high',       // Privacy, liability
  insurance: 'high',        // Complex terms
  legal: 'high',
  other: 'medium',
};

// ============================================
// Policy / Agency Budget
// ============================================

export interface AgencyPolicy {
  id: string;
  userId: string;

  // Forbidden clauses - agreements with these are blocked
  forbiddenClauses: ForbiddenClause[];

  // Spending limits
  maxSpendPerTx: number;
  maxSpendPerDay?: number;
  maxSpendPerMonth?: number;

  // Required remedies
  minRefundWindowHours?: number;
  requireChargebackRights: boolean;

  // Category restrictions
  allowedCategories?: AgreementCategory[];
  blockedCategories?: AgreementCategory[];

  // Counterparty restrictions
  allowedMerchants?: string[];
  blockedMerchants?: string[];

  // Escalation rules
  requireApprovalAbove?: number;  // $ amount requiring human approval
  requireApprovalFor?: AgreementCategory[];
}

export type ForbiddenClause =
  | 'BINDING_ARBITRATION'
  | 'CHARGEBACK_WAIVER'
  | 'CLASS_ACTION_WAIVER'
  | 'AUTO_RENEWAL_HIDDEN'
  | 'NON_REFUNDABLE'
  | 'FOREIGN_JURISDICTION'
  | 'BROAD_INDEMNIFICATION'
  | 'DATA_RESALE'
  | 'AI_TRAINING_OPT_IN';

// ============================================
// Validation Results
// ============================================

export interface PolicyValidationResult {
  allowed: boolean;
  recommendation: 'proceed' | 'require_approval' | 'block';

  trustScoreRequired: number;
  agentTrustScore: number;

  violations: PolicyViolation[];
  warnings: PolicyWarning[];

  summary: string;
}

export interface PolicyViolation {
  rule: ForbiddenClause | string;
  severity: 'block' | 'warn';
  description: string;
  clause?: string;  // The specific clause that triggered this
}

export interface PolicyWarning {
  type: string;
  description: string;
  recommendation: string;
}

// ============================================
// Agent Identity & Trust
// ============================================

export interface Agent {
  id: string;
  externalId: string;       // Agent's self-reported ID
  agentType: AgentType;
  publicKey?: string;       // For future cryptographic signing

  trustScore: number;       // 0-100
  capabilities: AgentCapabilities;

  stats: AgentStats;

  createdAt: Date;
  updatedAt: Date;
}

export type AgentType =
  | 'openclaw'
  | 'claude-code'
  | 'langchain'
  | 'openai-assistants'
  | 'autogpt'
  | 'custom';

export interface AgentCapabilities {
  maxSpendPerTx: number;
  allowedCategories: AgreementCategory[];
  requiresHumanApproval: AgreementCategory[];
  canAnchorOnchain: boolean;
}

export interface AgentStats {
  totalAgreements: number;
  compliantAgreements: number;
  disputesWon: number;
  disputesLost: number;
  avgRiskScore: number;
  lastActiveAt: Date;
}

// ============================================
// Trust Score Tiers
// ============================================

export interface TrustTier {
  minScore: number;
  maxScore: number;
  maxSpendPerTx: number;
  autoApproveCategories: AgreementCategory[];
  requireApprovalCategories: AgreementCategory[];
  perks: string[];
}

export const TRUST_TIERS: TrustTier[] = [
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

// ============================================
// Trust Score Events
// ============================================

export type TrustEventType =
  | 'agreement_captured'
  | 'agreement_compliant'
  | 'agreement_risky_accepted'
  | 'dispute_won'
  | 'dispute_lost'
  | 'policy_violation'
  | 'daily_activity';

export interface TrustEvent {
  id: string;
  agentId: string;
  eventType: TrustEventType;
  delta: number;            // Score change (+ or -)
  reason: string;
  relatedAgreementId?: string;
  relatedDisputeId?: string;
  createdAt: Date;
}

export const TRUST_SCORE_DELTAS: Record<TrustEventType, number> = {
  agreement_captured: 1,
  agreement_compliant: 2,
  agreement_risky_accepted: -5,
  dispute_won: 5,
  dispute_lost: -10,
  policy_violation: -3,
  daily_activity: 0.1,
};

// ============================================
// Capture & Anchor Types
// ============================================

export interface CaptureRequest {
  documentText: string;
  sourceUrl: string;
  merchantName?: string;
  merchantDomain?: string;
  agentId: string;
  agentType: AgentType;
}

export interface CaptureResponse {
  captureId: string;
  documentHash: string;
  timestamp: string;
  status: 'captured' | 'failed';
}

export interface AnchorRequest {
  termsHash: string;
  captureId: string;
  agentId: string;
}

export interface AnchorResponse {
  blockchainTxId: string;
  anchorTimestamp: string;
  explorerUrl: string;
  chain: 'base' | 'base-sepolia';
}

// ============================================
// Parse Response Extensions
// ============================================

export interface ParseResponseWithPAO {
  success: boolean;

  // Original fields
  extractedTerms?: import('./index').ExtractedTerms;
  riskFlags?: import('./index').RiskFlag[];
  plainSummary?: string;

  // New PAO fields
  pao?: PAO;
  policyResult?: PolicyValidationResult;

  error?: string;
}
