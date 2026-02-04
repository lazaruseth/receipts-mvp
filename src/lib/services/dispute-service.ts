/**
 * Dispute Service
 *
 * Handles dispute operations with Prisma database.
 * Falls back to demo data when database is not available.
 */

import { prisma, DisputeStatus } from '../db';
import type { DisputeIssueType } from '@prisma/client';
import { getDemoDisputes, getDemoAgreements } from '../demo-data';
import type { Dispute } from '@/types';

// Check if database is available
let dbAvailable = true;

async function checkDb() {
  if (!process.env.DATABASE_URL) {
    dbAvailable = false;
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    dbAvailable = false;
    return false;
  }
}

// Initialize on module load
checkDb().catch(() => {
  dbAvailable = false;
});

// Map API issue types to Prisma enum
type ApiIssueType = 'cancelled' | 'not_delivered' | 'different_than_agreed' | 'unauthorized' | 'other';

function toPrismaIssueType(type: ApiIssueType): DisputeIssueType {
  // The types match directly
  return type as DisputeIssueType;
}

function fromPrismaStatus(status: DisputeStatus): Dispute['status'] {
  const mapping: Record<DisputeStatus, Dispute['status']> = {
    draft: 'draft',
    submitted: 'submitted',
    in_review: 'in_review',
    resolved: 'resolved',
    rejected: 'rejected',
  };
  return mapping[status] || 'draft';
}

export interface CreateDisputeInput {
  agreementId: string;
  userId: string;
  issueType: ApiIssueType;
  description: string;
}

export interface DisputeWithDetails {
  id: string;
  agreementId: string;
  userId: string;
  issueType: string;
  description: string;
  evidencePackage: Record<string, unknown> | null;
  status: Dispute['status'];
  submittedTo: string | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all disputes for a user
 */
export async function getDisputes(userId: string): Promise<DisputeWithDetails[]> {
  if (!dbAvailable) {
    // Fall back to demo data
    const demoDisputes = getDemoDisputes(userId);
    return demoDisputes.map((d) => ({
      id: d.id,
      agreementId: d.agreementId,
      userId: d.userId,
      issueType: d.issueType,
      description: d.description,
      evidencePackage: d.evidencePackage as Record<string, unknown>,
      status: d.status,
      submittedTo: null,
      resolution: null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  try {
    const disputes = await prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return disputes.map((d) => ({
      id: d.id,
      agreementId: d.agreementId,
      userId: d.userId,
      issueType: d.issueType,
      description: d.description,
      evidencePackage: d.evidencePackage as Record<string, unknown> | null,
      status: fromPrismaStatus(d.status),
      submittedTo: d.submittedTo,
      resolution: d.resolution,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  } catch (error) {
    console.error('Database error, falling back to demo data:', error);
    dbAvailable = false;
    return getDisputes(userId);
  }
}

/**
 * Get a single dispute by ID
 */
export async function getDisputeById(
  disputeId: string,
  userId: string
): Promise<DisputeWithDetails | null> {
  if (!dbAvailable) {
    const demoDisputes = getDemoDisputes(userId);
    const dispute = demoDisputes.find((d) => d.id === disputeId);
    if (!dispute) return null;

    return {
      id: dispute.id,
      agreementId: dispute.agreementId,
      userId: dispute.userId,
      issueType: dispute.issueType,
      description: dispute.description,
      evidencePackage: dispute.evidencePackage as Record<string, unknown>,
      status: dispute.status,
      submittedTo: null,
      resolution: null,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }

  try {
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, userId },
    });

    if (!dispute) return null;

    return {
      id: dispute.id,
      agreementId: dispute.agreementId,
      userId: dispute.userId,
      issueType: dispute.issueType,
      description: dispute.description,
      evidencePackage: dispute.evidencePackage as Record<string, unknown> | null,
      status: fromPrismaStatus(dispute.status),
      submittedTo: dispute.submittedTo,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    dbAvailable = false;
    return getDisputeById(disputeId, userId);
  }
}

/**
 * Create a new dispute
 */
export async function createDispute(input: CreateDisputeInput): Promise<DisputeWithDetails> {
  if (!dbAvailable) {
    // Fall back to in-memory for demo
    const agreements = getDemoAgreements(input.userId);
    const agreement = agreements.find((a) => a.id === input.agreementId);

    if (!agreement) {
      throw new Error('Agreement not found');
    }

    // Generate violation analysis
    const violationAnalysis = generateViolationAnalysis(
      input.issueType,
      agreement,
      input.description
    );

    const now = new Date();
    return {
      id: `dispute-${Date.now()}`,
      agreementId: input.agreementId,
      userId: input.userId,
      issueType: input.issueType,
      description: input.description,
      evidencePackage: {
        originalAgreement: `https://storage.remaster.ai/agreements/${input.agreementId}`,
        timestampProof: agreement.blockchainTxId,
        extractedTerms: agreement.extractedTerms,
        violationAnalysis,
      },
      status: 'draft',
      submittedTo: null,
      resolution: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  try {
    // Get agreement for evidence package
    const agreement = await prisma.agreement.findFirst({
      where: { id: input.agreementId, userId: input.userId },
    });

    if (!agreement) {
      throw new Error('Agreement not found');
    }

    const evidencePackage = {
      originalAgreement: `https://storage.remaster.ai/agreements/${input.agreementId}`,
      timestampProof: agreement.blockchainTxId,
      extractedTerms: agreement.extractedTerms,
      documentHash: agreement.documentHash,
    };

    const dispute = await prisma.dispute.create({
      data: {
        agreementId: input.agreementId,
        userId: input.userId,
        issueType: toPrismaIssueType(input.issueType),
        description: input.description,
        evidencePackage,
        status: 'draft',
      },
    });

    return {
      id: dispute.id,
      agreementId: dispute.agreementId,
      userId: dispute.userId,
      issueType: dispute.issueType,
      description: dispute.description,
      evidencePackage: dispute.evidencePackage as Record<string, unknown> | null,
      status: fromPrismaStatus(dispute.status),
      submittedTo: dispute.submittedTo,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  } catch (error) {
    console.error('Database error, falling back to in-memory:', error);
    dbAvailable = false;
    return createDispute(input);
  }
}

/**
 * Update dispute status
 */
export async function updateDisputeStatus(
  disputeId: string,
  userId: string,
  status: Dispute['status'],
  submittedTo?: string,
  resolution?: string
): Promise<DisputeWithDetails | null> {
  if (!dbAvailable) {
    // In demo mode, just return mock updated dispute
    const dispute = await getDisputeById(disputeId, userId);
    if (!dispute) return null;

    return {
      ...dispute,
      status,
      submittedTo: submittedTo || dispute.submittedTo,
      resolution: resolution || dispute.resolution,
      updatedAt: new Date(),
    };
  }

  try {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: status as DisputeStatus,
        submittedTo,
        resolution,
      },
    });

    return {
      id: dispute.id,
      agreementId: dispute.agreementId,
      userId: dispute.userId,
      issueType: dispute.issueType,
      description: dispute.description,
      evidencePackage: dispute.evidencePackage as Record<string, unknown> | null,
      status: fromPrismaStatus(dispute.status),
      submittedTo: dispute.submittedTo,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Generate violation analysis for evidence package
 */
function generateViolationAnalysis(
  issueType: ApiIssueType,
  agreement: ReturnType<typeof getDemoAgreements>[0],
  description: string
): string {
  const analyses: Record<ApiIssueType, string> = {
    cancelled: `The consumer's service was cancelled. According to the captured agreement with ${agreement.merchantName}, the cancellation policy states: ${JSON.stringify(agreement.extractedTerms.cancellationPolicy)}. The refund policy indicates: ${agreement.extractedTerms.refundPolicy.type} refunds with conditions: ${agreement.extractedTerms.refundPolicy.conditions?.join(', ') || 'none specified'}.`,

    not_delivered: `The consumer reports non-delivery of service/goods. The agreement with ${agreement.merchantName} was captured on ${new Date(agreement.capturedAt).toLocaleDateString()} with immutable proof (${agreement.blockchainTxId || 'hash: ' + agreement.documentHash}). The merchant's liability limitations state: ${agreement.extractedTerms.liability.limitations.join('; ')}.`,

    different_than_agreed: `The consumer received service/goods different from what was agreed. The original agreement terms captured on ${new Date(agreement.capturedAt).toLocaleDateString()} document the exact terms that were accepted. Key discrepancies should be compared against: Refund Policy: ${JSON.stringify(agreement.extractedTerms.refundPolicy)}, Price Terms: ${JSON.stringify(agreement.extractedTerms.priceTerms || 'not specified')}.`,

    unauthorized: `The consumer reports an unauthorized transaction. The agreement shows acceptance by agent ID: ${agreement.agentId || 'unknown'}. The dispute resolution terms require: ${agreement.extractedTerms.disputeResolution.method} in ${agreement.extractedTerms.disputeResolution.jurisdiction || 'unspecified jurisdiction'}. ${agreement.extractedTerms.disputeResolution.chargebackRightsPreserved ? 'Chargeback rights are preserved.' : 'WARNING: Chargeback rights may be waived.'}`,

    other: `Consumer dispute regarding: ${description}. Agreement captured with ${agreement.merchantName} on ${new Date(agreement.capturedAt).toLocaleDateString()}. Risk flags identified: ${agreement.riskFlags.join(', ')}. Summary: ${agreement.plainSummary}`,
  };

  return analyses[issueType];
}
