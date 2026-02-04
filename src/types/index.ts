// Core Types for RECEIPTS Agreement Rail

export interface ExtractedTerms {
  refundPolicy: {
    type: 'refundable' | 'non-refundable' | 'conditional';
    window?: string;
    conditions?: string[];
  };
  cancellationPolicy: {
    fee?: number;
    feeType?: 'flat' | 'percentage';
    window?: string;
    conditions?: string[];
  };
  disputeResolution: {
    method: 'arbitration' | 'courts' | 'mediation' | 'unspecified';
    jurisdiction?: string;
    classActionWaiver: boolean;
    chargebackRightsPreserved: boolean;
  };
  autoRenewal: {
    enabled: boolean;
    frequency?: string;
    cancellationNotice?: string;
  };
  dataUsage: {
    thirdPartySharing: boolean;
    retentionPeriod?: string;
    purposes?: string[];
  };
  liability: {
    limitations: string[];
    indemnification: boolean;
    maxLiability?: string;
  };
  priceTerms?: {
    amount?: number;
    currency?: string;
    priceGuarantee?: boolean;
    dynamicPricing?: boolean;
  };
}

export type RiskFlag =
  | 'BINDING_ARBITRATION'
  | 'CHARGEBACK_WAIVER'
  | 'CLASS_ACTION_WAIVER'
  | 'AUTO_RENEWAL_HIDDEN'
  | 'NON_REFUNDABLE'
  | 'FOREIGN_JURISDICTION'
  | 'BROAD_INDEMNIFICATION'
  | 'DATA_SHARING_EXTENSIVE'
  | 'SHORT_DISPUTE_WINDOW'
  | 'PRICE_NOT_GUARANTEED';

export const RISK_FLAG_LABELS: Record<RiskFlag, { label: string; description: string; severity: 'high' | 'medium' | 'low' }> = {
  BINDING_ARBITRATION: {
    label: 'Binding Arbitration',
    description: 'Waives your right to sue in court',
    severity: 'high',
  },
  CHARGEBACK_WAIVER: {
    label: 'Chargeback Waiver',
    description: 'Waives payment dispute rights',
    severity: 'high',
  },
  CLASS_ACTION_WAIVER: {
    label: 'Class Action Waiver',
    description: 'Cannot join class action lawsuits',
    severity: 'medium',
  },
  AUTO_RENEWAL_HIDDEN: {
    label: 'Hidden Auto-Renewal',
    description: 'Unclear automatic renewal terms',
    severity: 'medium',
  },
  NON_REFUNDABLE: {
    label: 'Non-Refundable',
    description: 'No refunds under any circumstances',
    severity: 'high',
  },
  FOREIGN_JURISDICTION: {
    label: 'Foreign Jurisdiction',
    description: 'Disputes handled in inconvenient location',
    severity: 'medium',
  },
  BROAD_INDEMNIFICATION: {
    label: 'Broad Indemnification',
    description: "You may be liable for merchant's issues",
    severity: 'high',
  },
  DATA_SHARING_EXTENSIVE: {
    label: 'Extensive Data Sharing',
    description: 'Your data shared with many third parties',
    severity: 'medium',
  },
  SHORT_DISPUTE_WINDOW: {
    label: 'Short Dispute Window',
    description: 'Limited time to raise concerns',
    severity: 'medium',
  },
  PRICE_NOT_GUARANTEED: {
    label: 'Price Not Guaranteed',
    description: 'Price may change after agreement',
    severity: 'low',
  },
};

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agreement {
  id: string;
  userId: string;
  agentId?: string;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  category: string;

  // Capture data
  sourceUrl: string;
  documentHash: string;
  blockchainTxId?: string;
  capturedAt: Date;

  // Raw content
  rawText: string;
  documentTitle: string;

  // Parsed data
  extractedTerms: ExtractedTerms;
  riskFlags: RiskFlag[];
  plainSummary: string;

  // Status
  status: 'active' | 'expired' | 'disputed';
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface Dispute {
  id: string;
  agreementId: string;
  userId: string;

  issueType: 'cancelled' | 'not_delivered' | 'different_than_agreed' | 'unauthorized' | 'other';
  description: string;

  evidencePackage?: {
    originalAgreement: string;
    timestampProof?: string;
    extractedTerms: ExtractedTerms;
    violationAnalysis: string;
  };

  status: 'draft' | 'submitted' | 'in_review' | 'resolved' | 'rejected';
  submittedTo?: 'mastercard' | 'merchant' | 'other';
  resolution?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: string[];
}

export interface ParsedAgreementResponse {
  success: boolean;
  extractedTerms?: ExtractedTerms;
  riskFlags?: RiskFlag[];
  plainSummary?: string;
  error?: string;
}
