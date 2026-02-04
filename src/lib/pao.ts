/**
 * PAO (Programmable Agreement Object) Utilities
 *
 * Handles canonicalization, hashing, and conversion of agreements to PAO format.
 */

import type { PAO, PAO_VERSION, AgreementCategory } from '@/types/pao';
import type { ExtractedTerms, RiskFlag } from '@/types';

// ============================================
// Canonicalization
// ============================================

/**
 * Canonicalize a PAO for deterministic hashing.
 * - Sort keys alphabetically
 * - Normalize numbers
 * - Normalize timestamps to ISO format
 */
export function canonicalizePAO(pao: PAO): string {
  const sortedPao = sortObjectKeys(pao);
  return JSON.stringify(sortedPao);
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }

  return sorted;
}

// ============================================
// Hashing
// ============================================

/**
 * Generate keccak256 hash of canonical PAO.
 * In browser/Node without ethers, we use SHA-256 as fallback.
 * For production, use keccak256 from ethers.js or viem.
 */
export async function computeTermsHash(pao: PAO): Promise<string> {
  const canonical = canonicalizePAO(pao);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  // Use SHA-256 (available everywhere) as stand-in for keccak256
  // In production, replace with: import { keccak256 } from 'viem'
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return '0x' + hashHex;
}

// ============================================
// Conversion from ExtractedTerms to PAO
// ============================================

export interface ConvertToPAOOptions {
  principal: string;            // User/agent identifier
  counterparty: string;         // Merchant domain
  sourceUrl: string;
  category?: AgreementCategory;
  capturedAt?: Date;
}

/**
 * Convert ExtractedTerms (from AI parsing) to a PAO.
 */
export async function extractedTermsToPAO(
  terms: ExtractedTerms,
  riskFlags: RiskFlag[],
  options: ConvertToPAOOptions
): Promise<PAO> {
  // Determine category from context or default
  const category = options.category || inferCategory(options.counterparty, options.sourceUrl);

  // Map refund policy type
  const refundable = mapRefundType(terms.refundPolicy.type);

  // Map chargeback rights
  const chargebackRights = terms.disputeResolution.chargebackRightsPreserved
    ? 'preserved'
    : riskFlags.includes('CHARGEBACK_WAIVER')
      ? 'waived'
      : 'unknown';

  // Map dispute forum
  const forum = mapDisputeForum(terms.disputeResolution.method);

  // Build PAO without hash first
  const paoWithoutHash: Omit<PAO, 'termsHash'> = {
    version: 'pao-0.3' as const,

    parties: {
      principal: options.principal,
      counterparty: options.counterparty,
    },

    scope: {
      category,
      description: `Agreement from ${options.counterparty}`,
    },

    pricing: terms.priceTerms
      ? {
          currency: terms.priceTerms.currency || 'USD',
          amount: terms.priceTerms.amount ?? undefined,
        }
      : undefined,

    remedies: {
      refundable,
      refundWindowHours: parseRefundWindow(terms.refundPolicy.window),
      cancellationFee: terms.cancellationPolicy.fee,
      cancellationFeeType: terms.cancellationPolicy.feeType,
      chargebackRights,
    },

    dispute: {
      forum,
      venue: terms.disputeResolution.jurisdiction,
      arbitrationBinding: terms.disputeResolution.method === 'arbitration',
      classActionWaiver: terms.disputeResolution.classActionWaiver,
    },

    data: {
      thirdPartySharing: terms.dataUsage.thirdPartySharing,
      resale: 'unspecified',
      training: 'unspecified',
      retentionPeriod: terms.dataUsage.retentionPeriod,
    },

    autoRenewal: terms.autoRenewal.enabled
      ? {
          enabled: true,
          frequency: terms.autoRenewal.frequency,
          cancellationNotice: terms.autoRenewal.cancellationNotice,
        }
      : { enabled: false },

    liability: {
      indemnification: terms.liability.indemnification,
      maxLiability: terms.liability.maxLiability,
      limitations: terms.liability.limitations,
    },

    time: {
      capturedAt: (options.capturedAt || new Date()).toISOString(),
    },

    termsURI: options.sourceUrl,
  };

  // Compute hash
  const termsHash = await computeTermsHash(paoWithoutHash as PAO);

  return {
    ...paoWithoutHash,
    termsHash,
  };
}

// ============================================
// Helper Functions
// ============================================

function inferCategory(counterparty: string, sourceUrl: string): AgreementCategory {
  const combined = (counterparty + ' ' + sourceUrl).toLowerCase();

  if (/airline|flight|travel|booking|expedia|kayak/.test(combined)) return 'travel';
  if (/hotel|marriott|hilton|airbnb|vrbo/.test(combined)) return 'hospitality';
  if (/adobe|microsoft|apple|software|saas/.test(combined)) return 'software';
  if (/aws|azure|gcp|cloud|hosting/.test(combined)) return 'cloud_services';
  if (/amazon|ebay|walmart|shop|store|retail/.test(combined)) return 'retail';
  if (/netflix|spotify|subscribe|membership/.test(combined)) return 'subscription';
  if (/api|developer|sdk/.test(combined)) return 'api_access';
  if (/bank|finance|payment|stripe|paypal/.test(combined)) return 'financial';
  if (/game|stream|music|video|entertainment/.test(combined)) return 'entertainment';
  if (/health|medical|doctor|pharmacy/.test(combined)) return 'healthcare';
  if (/insurance|coverage|policy/.test(combined)) return 'insurance';
  if (/legal|law|attorney|lawyer/.test(combined)) return 'legal';

  return 'other';
}

function mapRefundType(type: ExtractedTerms['refundPolicy']['type']): PAO['remedies']['refundable'] {
  switch (type) {
    case 'refundable':
      return 'full';
    case 'non-refundable':
      return 'none';
    case 'conditional':
      return 'conditional';
    default:
      return 'conditional';
  }
}

function mapDisputeForum(method: ExtractedTerms['disputeResolution']['method']): PAO['dispute']['forum'] {
  switch (method) {
    case 'arbitration':
      return 'arbitration';
    case 'courts':
      return 'courts';
    case 'mediation':
      return 'mediation';
    default:
      return 'unspecified';
  }
}

function parseRefundWindow(window?: string): number | undefined {
  if (!window) return undefined;

  const match = window.match(/(\d+)\s*(hour|day|week|month)/i);
  if (!match) return undefined;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'hour':
      return value;
    case 'day':
      return value * 24;
    case 'week':
      return value * 24 * 7;
    case 'month':
      return value * 24 * 30;
    default:
      return value;
  }
}

// ============================================
// Risk Flag Detection from PAO
// ============================================

export function detectRiskFlagsFromPAO(pao: PAO): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Arbitration
  if (pao.dispute.forum === 'arbitration' && pao.dispute.arbitrationBinding) {
    flags.push('BINDING_ARBITRATION');
  }

  // Class action waiver
  if (pao.dispute.classActionWaiver) {
    flags.push('CLASS_ACTION_WAIVER');
  }

  // Chargeback
  if (pao.remedies.chargebackRights === 'waived') {
    flags.push('CHARGEBACK_WAIVER');
  }

  // Non-refundable
  if (pao.remedies.refundable === 'none') {
    flags.push('NON_REFUNDABLE');
  }

  // Auto-renewal
  if (pao.autoRenewal?.enabled && !pao.autoRenewal.cancellationNotice) {
    flags.push('AUTO_RENEWAL_HIDDEN');
  }

  // Indemnification
  if (pao.liability?.indemnification) {
    flags.push('BROAD_INDEMNIFICATION');
  }

  // Data sharing
  if (pao.data.thirdPartySharing) {
    flags.push('DATA_SHARING_EXTENSIVE');
  }

  // Foreign jurisdiction (simplified check)
  if (pao.dispute.venue && !pao.dispute.venue.includes('US') && !pao.dispute.venue.includes('United States')) {
    flags.push('FOREIGN_JURISDICTION');
  }

  // Short dispute window (less than 720 hours = 30 days)
  if (pao.remedies.refundWindowHours && pao.remedies.refundWindowHours < 720) {
    flags.push('SHORT_DISPUTE_WINDOW');
  }

  return flags;
}
