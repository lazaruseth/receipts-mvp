/**
 * Policy Engine
 *
 * Evaluates PAOs against user policies (agency budgets).
 * Determines if an agent can proceed with an agreement.
 */

import type {
  PAO,
  AgencyPolicy,
  PolicyValidationResult,
  PolicyViolation,
  PolicyWarning,
  ForbiddenClause,
  AgreementCategory,
} from '@/types/pao';
import { getTrustTier, getCapabilitiesForScore } from './trust-score';

// ============================================
// Policy Validation
// ============================================

/**
 * Validate a PAO against user policy and agent capabilities.
 */
export function validatePolicy(
  pao: PAO,
  policy: AgencyPolicy,
  agentTrustScore: number
): PolicyValidationResult {
  const violations: PolicyViolation[] = [];
  const warnings: PolicyWarning[] = [];

  const capabilities = getCapabilitiesForScore(agentTrustScore);
  const tier = getTrustTier(agentTrustScore);

  // ============================================
  // Check forbidden clauses
  // ============================================

  for (const forbidden of policy.forbiddenClauses) {
    const violation = checkForbiddenClause(pao, forbidden);
    if (violation) {
      violations.push(violation);
    }
  }

  // ============================================
  // Check spending limits
  // ============================================

  if (pao.pricing?.amount) {
    // Check against policy limit
    if (pao.pricing.amount > policy.maxSpendPerTx) {
      violations.push({
        rule: 'SPEND_LIMIT_EXCEEDED',
        severity: 'block',
        description: `Amount $${pao.pricing.amount} exceeds policy limit of $${policy.maxSpendPerTx}`,
      });
    }

    // Check against trust-based limit
    if (pao.pricing.amount > capabilities.maxSpendPerTx) {
      violations.push({
        rule: 'TRUST_SPEND_LIMIT',
        severity: 'block',
        description: `Amount $${pao.pricing.amount} exceeds trust-based limit of $${capabilities.maxSpendPerTx} (trust score: ${agentTrustScore})`,
      });
    }
  }

  // ============================================
  // Check category restrictions
  // ============================================

  const category = pao.scope.category;

  // Blocked by policy
  if (policy.blockedCategories?.includes(category)) {
    violations.push({
      rule: 'BLOCKED_CATEGORY',
      severity: 'block',
      description: `Category "${category}" is blocked by user policy`,
    });
  }

  // Allowed categories check (if specified)
  if (policy.allowedCategories && !policy.allowedCategories.includes(category)) {
    violations.push({
      rule: 'CATEGORY_NOT_ALLOWED',
      severity: 'block',
      description: `Category "${category}" is not in allowed list`,
    });
  }

  // Requires approval based on trust
  if (capabilities.requiresHumanApproval.includes(category)) {
    warnings.push({
      type: 'REQUIRES_APPROVAL',
      description: `Category "${category}" requires human approval at trust score ${agentTrustScore}`,
      recommendation: `Increase trust score to ${getMinScoreForAutoApprove(category)} for auto-approval`,
    });
  }

  // ============================================
  // Check counterparty restrictions
  // ============================================

  const counterparty = pao.parties.counterparty;

  if (policy.blockedMerchants?.some(m => counterparty.includes(m))) {
    violations.push({
      rule: 'BLOCKED_MERCHANT',
      severity: 'block',
      description: `Merchant "${counterparty}" is blocked by user policy`,
    });
  }

  // ============================================
  // Check remedy requirements
  // ============================================

  if (policy.requireChargebackRights && pao.remedies.chargebackRights === 'waived') {
    violations.push({
      rule: 'CHARGEBACK_REQUIRED',
      severity: 'block',
      description: 'Agreement waives chargeback rights, but policy requires them',
    });
  }

  if (policy.minRefundWindowHours && pao.remedies.refundWindowHours) {
    if (pao.remedies.refundWindowHours < policy.minRefundWindowHours) {
      warnings.push({
        type: 'SHORT_REFUND_WINDOW',
        description: `Refund window of ${pao.remedies.refundWindowHours} hours is shorter than policy minimum of ${policy.minRefundWindowHours} hours`,
        recommendation: 'Consider negotiating longer refund window or proceed with caution',
      });
    }
  }

  // ============================================
  // Determine recommendation
  // ============================================

  const hasBlockingViolations = violations.some(v => v.severity === 'block');
  const requiresApproval = warnings.some(w => w.type === 'REQUIRES_APPROVAL');

  let recommendation: PolicyValidationResult['recommendation'];
  let allowed: boolean;

  if (hasBlockingViolations) {
    recommendation = 'block';
    allowed = false;
  } else if (requiresApproval) {
    recommendation = 'require_approval';
    allowed = true; // Can proceed if human approves
  } else {
    recommendation = 'proceed';
    allowed = true;
  }

  // ============================================
  // Generate summary
  // ============================================

  let summary: string;

  if (recommendation === 'block') {
    summary = `Agreement blocked: ${violations.filter(v => v.severity === 'block').map(v => v.description).join('; ')}`;
  } else if (recommendation === 'require_approval') {
    summary = `Agreement requires human approval for ${category} category at current trust level (${agentTrustScore}/100)`;
  } else {
    summary = `Agreement validated successfully. Trust score ${agentTrustScore}/100 allows auto-approval for ${category}.`;
  }

  return {
    allowed,
    recommendation,
    trustScoreRequired: getMinScoreForAutoApprove(category),
    agentTrustScore,
    violations,
    warnings,
    summary,
  };
}

// ============================================
// Forbidden Clause Checks
// ============================================

function checkForbiddenClause(pao: PAO, clause: ForbiddenClause): PolicyViolation | null {
  switch (clause) {
    case 'BINDING_ARBITRATION':
      if (pao.dispute.forum === 'arbitration' && pao.dispute.arbitrationBinding) {
        return {
          rule: clause,
          severity: 'block',
          description: 'Agreement requires binding arbitration',
          clause: `Dispute resolution: ${pao.dispute.forum}, binding: ${pao.dispute.arbitrationBinding}`,
        };
      }
      break;

    case 'CHARGEBACK_WAIVER':
      if (pao.remedies.chargebackRights === 'waived') {
        return {
          rule: clause,
          severity: 'block',
          description: 'Agreement waives chargeback rights',
          clause: `Chargeback rights: ${pao.remedies.chargebackRights}`,
        };
      }
      break;

    case 'CLASS_ACTION_WAIVER':
      if (pao.dispute.classActionWaiver) {
        return {
          rule: clause,
          severity: 'block',
          description: 'Agreement waives class action rights',
          clause: `Class action waiver: ${pao.dispute.classActionWaiver}`,
        };
      }
      break;

    case 'AUTO_RENEWAL_HIDDEN':
      if (pao.autoRenewal?.enabled && !pao.autoRenewal.cancellationNotice) {
        return {
          rule: clause,
          severity: 'warn',
          description: 'Agreement has auto-renewal without clear cancellation notice',
          clause: `Auto-renewal: enabled, cancellation notice: not specified`,
        };
      }
      break;

    case 'NON_REFUNDABLE':
      if (pao.remedies.refundable === 'none') {
        return {
          rule: clause,
          severity: 'block',
          description: 'Agreement is non-refundable',
          clause: `Refundable: ${pao.remedies.refundable}`,
        };
      }
      break;

    case 'FOREIGN_JURISDICTION':
      if (pao.dispute.venue && !pao.dispute.venue.includes('US')) {
        return {
          rule: clause,
          severity: 'warn',
          description: `Agreement requires foreign jurisdiction: ${pao.dispute.venue}`,
          clause: `Venue: ${pao.dispute.venue}`,
        };
      }
      break;

    case 'BROAD_INDEMNIFICATION':
      if (pao.liability?.indemnification) {
        return {
          rule: clause,
          severity: 'warn',
          description: 'Agreement requires broad indemnification',
          clause: `Indemnification: ${pao.liability.indemnification}`,
        };
      }
      break;

    case 'DATA_RESALE':
      if (pao.data.resale === 'allowed') {
        return {
          rule: clause,
          severity: 'block',
          description: 'Agreement allows data resale',
          clause: `Data resale: ${pao.data.resale}`,
        };
      }
      break;

    case 'AI_TRAINING_OPT_IN':
      if (pao.data.training === 'allowed') {
        return {
          rule: clause,
          severity: 'warn',
          description: 'Agreement allows AI training on your data',
          clause: `AI training: ${pao.data.training}`,
        };
      }
      break;
  }

  return null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get minimum trust score needed to auto-approve a category.
 */
function getMinScoreForAutoApprove(category: AgreementCategory): number {
  const categoryTiers: Record<AgreementCategory, number> = {
    retail: 21,
    entertainment: 21,
    api_access: 21,
    software: 41,
    subscription: 41,
    hospitality: 61,
    cloud_services: 61,
    travel: 81,
    other: 81,
    financial: 101, // Never auto-approved
    healthcare: 101,
    insurance: 101,
    legal: 101,
  };

  return categoryTiers[category] || 101;
}

// ============================================
// Default Policy
// ============================================

/**
 * Get a default policy for new users.
 */
export function getDefaultPolicy(userId: string): AgencyPolicy {
  return {
    id: `policy_${userId}`,
    userId,
    forbiddenClauses: ['CHARGEBACK_WAIVER', 'DATA_RESALE'], // Most restrictive defaults
    maxSpendPerTx: 100,
    maxSpendPerDay: 500,
    maxSpendPerMonth: 2000,
    minRefundWindowHours: 24,
    requireChargebackRights: true,
    requireApprovalAbove: 50,
    requireApprovalFor: ['travel', 'financial', 'healthcare', 'insurance', 'legal'],
  };
}

/**
 * Get a demo policy for testing.
 */
export function getDemoPolicy(userId: string): AgencyPolicy {
  return {
    id: `demo_policy_${userId}`,
    userId,
    forbiddenClauses: ['CHARGEBACK_WAIVER'],
    maxSpendPerTx: 500,
    maxSpendPerDay: 1000,
    maxSpendPerMonth: 5000,
    minRefundWindowHours: 24,
    requireChargebackRights: true,
    allowedCategories: ['travel', 'hospitality', 'software', 'retail', 'subscription', 'api_access', 'entertainment', 'other', 'cloud_services'],
    blockedCategories: [],
    requireApprovalFor: ['financial', 'healthcare', 'insurance', 'legal'],
    blockedMerchants: [],
  };
}
