/**
 * Agreement Guard SDK Types
 */

export type AgentType =
  | 'openclaw'
  | 'claude-code'
  | 'langchain'
  | 'openai-assistants'
  | 'autogpt'
  | 'custom';

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

export interface AgreementGuardConfig {
  /**
   * Your REMASTER API key
   */
  apiKey?: string;

  /**
   * Base URL for REMASTER API (defaults to production)
   */
  baseUrl?: string;

  /**
   * Your agent's unique identifier
   */
  agentId: string;

  /**
   * Type of agent runtime
   */
  agentType: AgentType;

  /**
   * User ID for policy lookup (optional)
   */
  userId?: string;

  /**
   * Enable verbose logging
   */
  debug?: boolean;

  /**
   * Timeout for API calls in milliseconds
   */
  timeout?: number;
}

export interface CaptureOptions {
  /**
   * Raw text content of the agreement (HTML, PDF text, etc.)
   */
  documentText: string;

  /**
   * Source URL where the agreement was found
   */
  sourceUrl: string;

  /**
   * Merchant/service name (optional, will be inferred)
   */
  merchantName?: string;

  /**
   * Category hint for better classification
   */
  category?: AgreementCategory;
}

export interface CaptureResult {
  /**
   * Whether the capture was successful
   */
  success: boolean;

  /**
   * Unique capture ID for this agreement
   */
  captureId: string;

  /**
   * SHA-256 hash of the document
   */
  documentHash: string;

  /**
   * ISO timestamp of capture
   */
  timestamp: string;

  /**
   * Recommendation: 'proceed', 'require_approval', or 'block'
   */
  recommendation: 'proceed' | 'require_approval' | 'block';

  /**
   * Terms hash (keccak256 of canonical PAO)
   */
  termsHash?: string;

  /**
   * Risk flags detected
   */
  riskFlags: string[];

  /**
   * Plain English summary
   */
  summary: string;

  /**
   * Violations that caused 'block' recommendation
   */
  violations: Array<{
    rule: string;
    severity: 'block' | 'warn';
    description: string;
  }>;

  /**
   * Warnings that suggest caution
   */
  warnings: Array<{
    type: string;
    description: string;
    recommendation: string;
  }>;

  /**
   * Agent-facing message explaining the result
   */
  agentMessage: string;

  /**
   * Your current trust score
   */
  trustScore: number;

  /**
   * Your current capabilities
   */
  capabilities: {
    maxSpendPerTx: number;
    allowedCategories: string[];
    requiresHumanApproval: string[];
    canAnchorOnchain: boolean;
  };
}

export interface AnchorResult {
  /**
   * Whether the anchor was successful
   */
  success: boolean;

  /**
   * Blockchain transaction hash
   */
  blockchainTxId: string;

  /**
   * Anchor timestamp
   */
  anchorTimestamp: string;

  /**
   * Link to blockchain explorer
   */
  explorerUrl: string;

  /**
   * Chain used (base or base-sepolia)
   */
  chain: 'base' | 'base-sepolia';

  /**
   * Cost information
   */
  cost?: {
    estimatedGas: number;
    gasPriceGwei: number;
    estimatedCostUSD: number;
  };
}

export interface ReputationResult {
  /**
   * Current trust score (0-100)
   */
  trustScore: number;

  /**
   * Current tier information
   */
  tier: {
    name: string;
    minScore: number;
    maxScore: number;
    perks: string[];
  };

  /**
   * Aggregate stats
   */
  stats: {
    totalAgreements: number;
    compliantAgreements: number;
    disputesWon: number;
    disputesLost: number;
    avgRiskScore: number;
  };

  /**
   * Current capabilities
   */
  capabilities: {
    maxSpendPerTx: number;
    allowedCategories: string[];
    requiresHumanApproval: string[];
    canAnchorOnchain: boolean;
  };

  /**
   * Progress to next tier
   */
  progress: {
    nextTierScore: number;
    pointsNeeded: number;
    agreementsNeeded: number;
    nextTierMaxSpend: number;
    percentToNextTier: number;
  };

  /**
   * Personalized insights
   */
  insights: string[];
}

export interface RegistrationResult {
  /**
   * Whether registration was successful
   */
  success: boolean;

  /**
   * Whether agent was already registered
   */
  alreadyRegistered: boolean;

  /**
   * Registration ID
   */
  registrationId: string;

  /**
   * Starting trust score
   */
  trustScore: number;

  /**
   * Initial capabilities
   */
  capabilities: {
    maxSpendPerTx: number;
    allowedCategories: string[];
    requiresHumanApproval: string[];
    canAnchorOnchain: boolean;
  };

  /**
   * Welcome message for the agent
   */
  welcomeMessage?: string;
}
