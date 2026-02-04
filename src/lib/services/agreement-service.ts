/**
 * Agreement Service
 *
 * Handles agreement operations with Prisma database.
 * Falls back to demo data when database is not available.
 */

import { prisma, AgreementStatus } from '../db';
import { getDemoAgreements, DEMO_AGREEMENTS } from '../demo-data';
import type { Agreement, ExtractedTerms, RiskFlag } from '@/types';

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

// In-memory store for captured agreements (fallback)
const inMemoryAgreements: Map<string, Agreement> = new Map();

// Map Prisma status to API status
function mapAgreementStatus(status: AgreementStatus): Agreement['status'] {
  return status as Agreement['status'];
}

// Map API status to Prisma status
function mapStatusToPrisma(status: Agreement['status']): AgreementStatus {
  return status as AgreementStatus;
}

export interface GetAgreementsOptions {
  userId: string;
  status?: 'active' | 'expired' | 'disputed';
  category?: string;
  search?: string;
  sort?: 'capturedAt' | 'merchantName' | 'riskCount';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CreateAgreementInput {
  userId: string;
  agentId?: string;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  sourceUrl: string;
  documentHash: string;
  rawText: string;
  documentTitle: string;
  extractedTerms: ExtractedTerms;
  riskFlags: RiskFlag[];
  plainSummary: string;
  blockchainTxId?: string;
  termsHash?: string;
  paoData?: object;
}

/**
 * Get agreements for a user with filtering and sorting
 */
export async function getAgreements(
  options: GetAgreementsOptions
): Promise<{ agreements: Agreement[]; total: number }> {
  const { userId, status, category, search, sort = 'capturedAt', order = 'desc', limit = 50, offset = 0 } = options;

  if (!dbAvailable) {
    return getAgreementsFromDemo(options);
  }

  try {
    // Build where clause
    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = mapStatusToPrisma(status);
    }

    if (category) {
      where.merchantCategory = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { merchantName: { contains: search, mode: 'insensitive' } },
        { plainSummary: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort === 'capturedAt') {
      orderBy.capturedAt = order;
    } else if (sort === 'merchantName') {
      orderBy.merchantName = order;
    }
    // Note: riskCount sort needs to be done post-query since it's an array length

    const [agreements, total] = await Promise.all([
      prisma.agreement.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          agent: true,
        },
      }),
      prisma.agreement.count({ where }),
    ]);

    // If no database agreements, fall back to demo
    if (agreements.length === 0 && offset === 0) {
      return getAgreementsFromDemo(options);
    }

    let mappedAgreements = agreements.map((a) => ({
      id: a.id,
      userId: a.userId,
      agentId: a.agentId || undefined,
      merchantId: a.merchantId,
      merchantName: a.merchantName,
      merchantCategory: a.merchantCategory,
      category: a.merchantCategory.toLowerCase().replace(/\s+/g, '_'),
      sourceUrl: a.sourceUrl,
      documentHash: a.documentHash,
      blockchainTxId: a.blockchainTxId || undefined,
      capturedAt: a.capturedAt,
      rawText: a.rawText,
      documentTitle: a.documentTitle,
      extractedTerms: a.extractedTerms as unknown as ExtractedTerms,
      riskFlags: a.riskFlags as unknown as RiskFlag[],
      plainSummary: a.plainSummary,
      status: mapAgreementStatus(a.status),
      expiresAt: a.expiresAt || undefined,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    // Handle riskCount sort
    if (sort === 'riskCount') {
      mappedAgreements.sort((a, b) => {
        const comparison = a.riskFlags.length - b.riskFlags.length;
        return order === 'desc' ? -comparison : comparison;
      });
    }

    return { agreements: mappedAgreements, total };
  } catch (error) {
    console.error('Database error, falling back to demo:', error);
    dbAvailable = false;
    return getAgreementsFromDemo(options);
  }
}

function getAgreementsFromDemo(options: GetAgreementsOptions): { agreements: Agreement[]; total: number } {
  const { userId, status, category, search, sort = 'capturedAt', order = 'desc' } = options;

  // Combine demo data and in-memory agreements
  let agreements = [
    ...getDemoAgreements(userId),
    ...Array.from(inMemoryAgreements.values()).filter((a) => a.userId === userId),
  ];

  // Filter by status
  if (status) {
    agreements = agreements.filter((a) => a.status === status);
  }

  // Filter by category
  if (category) {
    agreements = agreements.filter(
      (a) => a.merchantCategory.toLowerCase() === category.toLowerCase()
    );
  }

  // Search by merchant name or summary
  if (search) {
    const searchLower = search.toLowerCase();
    agreements = agreements.filter(
      (a) =>
        a.merchantName.toLowerCase().includes(searchLower) ||
        a.plainSummary.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  agreements.sort((a, b) => {
    let comparison = 0;

    if (sort === 'capturedAt') {
      comparison = new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime();
    } else if (sort === 'merchantName') {
      comparison = a.merchantName.localeCompare(b.merchantName);
    } else if (sort === 'riskCount') {
      comparison = a.riskFlags.length - b.riskFlags.length;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return { agreements, total: agreements.length };
}

/**
 * Get a single agreement by ID
 */
export async function getAgreementById(
  id: string,
  userId: string
): Promise<Agreement | null> {
  if (!dbAvailable) {
    return getAgreementByIdFromDemo(id, userId);
  }

  try {
    const agreement = await prisma.agreement.findFirst({
      where: { id, userId },
      include: { agent: true },
    });

    if (!agreement) {
      return getAgreementByIdFromDemo(id, userId);
    }

    return {
      id: agreement.id,
      userId: agreement.userId,
      agentId: agreement.agentId || undefined,
      merchantId: agreement.merchantId,
      merchantName: agreement.merchantName,
      merchantCategory: agreement.merchantCategory,
      category: agreement.merchantCategory.toLowerCase().replace(/\s+/g, '_'),
      sourceUrl: agreement.sourceUrl,
      documentHash: agreement.documentHash,
      blockchainTxId: agreement.blockchainTxId || undefined,
      capturedAt: agreement.capturedAt,
      rawText: agreement.rawText,
      documentTitle: agreement.documentTitle,
      extractedTerms: agreement.extractedTerms as unknown as ExtractedTerms,
      riskFlags: agreement.riskFlags as unknown as RiskFlag[],
      plainSummary: agreement.plainSummary,
      status: mapAgreementStatus(agreement.status),
      expiresAt: agreement.expiresAt || undefined,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return getAgreementByIdFromDemo(id, userId);
  }
}

function getAgreementByIdFromDemo(id: string, userId: string): Agreement | null {
  // Check in-memory first
  const inMemory = inMemoryAgreements.get(id);
  if (inMemory && inMemory.userId === userId) {
    return inMemory;
  }

  // Then check demo data
  const demo = getDemoAgreements(userId).find((a) => a.id === id);
  return demo || null;
}

/**
 * Create a new agreement
 */
export async function createAgreement(input: CreateAgreementInput): Promise<Agreement> {
  const now = new Date();

  if (!dbAvailable) {
    return createAgreementInMemory(input, now);
  }

  try {
    // If agentId is provided as external ID, find the internal ID
    let internalAgentId: string | undefined;
    if (input.agentId) {
      const agent = await prisma.agent.findUnique({
        where: { externalId: input.agentId },
      });
      internalAgentId = agent?.id;
    }

    const agreement = await prisma.agreement.create({
      data: {
        userId: input.userId,
        agentId: internalAgentId,
        merchantId: input.merchantId,
        merchantName: input.merchantName,
        merchantCategory: input.merchantCategory,
        sourceUrl: input.sourceUrl,
        documentHash: input.documentHash,
        rawText: input.rawText,
        documentTitle: input.documentTitle,
        extractedTerms: input.extractedTerms as object,
        riskFlags: input.riskFlags,
        plainSummary: input.plainSummary,
        blockchainTxId: input.blockchainTxId,
        termsHash: input.termsHash,
        paoData: input.paoData,
        status: 'active',
      },
      include: { agent: true },
    });

    // Update agent stats if agent is provided
    if (internalAgentId) {
      await prisma.agent.update({
        where: { id: internalAgentId },
        data: {
          totalAgreements: { increment: 1 },
          lastActiveAt: now,
        },
      });
    }

    return {
      id: agreement.id,
      userId: agreement.userId,
      agentId: agreement.agentId || undefined,
      merchantId: agreement.merchantId,
      merchantName: agreement.merchantName,
      merchantCategory: agreement.merchantCategory,
      category: agreement.merchantCategory.toLowerCase().replace(/\s+/g, '_'),
      sourceUrl: agreement.sourceUrl,
      documentHash: agreement.documentHash,
      blockchainTxId: agreement.blockchainTxId || undefined,
      capturedAt: agreement.capturedAt,
      rawText: agreement.rawText,
      documentTitle: agreement.documentTitle,
      extractedTerms: agreement.extractedTerms as unknown as ExtractedTerms,
      riskFlags: agreement.riskFlags as unknown as RiskFlag[],
      plainSummary: agreement.plainSummary,
      status: mapAgreementStatus(agreement.status),
      expiresAt: agreement.expiresAt || undefined,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    };
  } catch (error) {
    console.error('Database error, falling back to in-memory:', error);
    dbAvailable = false;
    return createAgreementInMemory(input, now);
  }
}

function createAgreementInMemory(input: CreateAgreementInput, now: Date): Agreement {
  const agreement: Agreement = {
    id: `agreement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: input.userId,
    agentId: input.agentId,
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    merchantCategory: input.merchantCategory,
    category: input.merchantCategory.toLowerCase().replace(/\s+/g, '_'),
    sourceUrl: input.sourceUrl,
    documentHash: input.documentHash,
    blockchainTxId: input.blockchainTxId,
    capturedAt: now,
    rawText: input.rawText,
    documentTitle: input.documentTitle,
    extractedTerms: input.extractedTerms,
    riskFlags: input.riskFlags,
    plainSummary: input.plainSummary,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  inMemoryAgreements.set(agreement.id, agreement);
  return agreement;
}

/**
 * Update agreement status
 */
export async function updateAgreementStatus(
  id: string,
  userId: string,
  status: Agreement['status']
): Promise<Agreement | null> {
  if (!dbAvailable) {
    return updateAgreementStatusInMemory(id, userId, status);
  }

  try {
    const agreement = await prisma.agreement.update({
      where: { id },
      data: {
        status: mapStatusToPrisma(status),
        updatedAt: new Date(),
      },
    });

    if (!agreement || agreement.userId !== userId) {
      return null;
    }

    return {
      id: agreement.id,
      userId: agreement.userId,
      agentId: agreement.agentId || undefined,
      merchantId: agreement.merchantId,
      merchantName: agreement.merchantName,
      merchantCategory: agreement.merchantCategory,
      category: agreement.merchantCategory.toLowerCase().replace(/\s+/g, '_'),
      sourceUrl: agreement.sourceUrl,
      documentHash: agreement.documentHash,
      blockchainTxId: agreement.blockchainTxId || undefined,
      capturedAt: agreement.capturedAt,
      rawText: agreement.rawText,
      documentTitle: agreement.documentTitle,
      extractedTerms: agreement.extractedTerms as unknown as ExtractedTerms,
      riskFlags: agreement.riskFlags as unknown as RiskFlag[],
      plainSummary: agreement.plainSummary,
      status: mapAgreementStatus(agreement.status),
      expiresAt: agreement.expiresAt || undefined,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return updateAgreementStatusInMemory(id, userId, status);
  }
}

function updateAgreementStatusInMemory(
  id: string,
  userId: string,
  status: Agreement['status']
): Agreement | null {
  const agreement = inMemoryAgreements.get(id);
  if (!agreement || agreement.userId !== userId) {
    return null;
  }

  agreement.status = status;
  agreement.updatedAt = new Date();
  inMemoryAgreements.set(id, agreement);
  return agreement;
}

/**
 * Get agreement statistics for a user
 */
export async function getAgreementStats(userId: string): Promise<{
  total: number;
  active: number;
  expired: number;
  disputed: number;
  byCategory: Record<string, number>;
  riskFlagCounts: Record<string, number>;
}> {
  if (!dbAvailable) {
    return getAgreementStatsFromDemo(userId);
  }

  try {
    const [agreements, statusCounts] = await Promise.all([
      prisma.agreement.findMany({
        where: { userId },
        select: {
          merchantCategory: true,
          riskFlags: true,
          status: true,
        },
      }),
      prisma.agreement.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    // If no data, fall back to demo
    if (agreements.length === 0) {
      return getAgreementStatsFromDemo(userId);
    }

    // Calculate category counts
    const byCategory: Record<string, number> = {};
    const riskFlagCounts: Record<string, number> = {};

    for (const a of agreements) {
      byCategory[a.merchantCategory] = (byCategory[a.merchantCategory] || 0) + 1;
      for (const flag of a.riskFlags) {
        riskFlagCounts[flag] = (riskFlagCounts[flag] || 0) + 1;
      }
    }

    // Map status counts
    const statusMap: Record<string, number> = {};
    for (const sc of statusCounts) {
      statusMap[sc.status] = sc._count;
    }

    return {
      total: agreements.length,
      active: statusMap.active || 0,
      expired: statusMap.expired || 0,
      disputed: statusMap.disputed || 0,
      byCategory,
      riskFlagCounts,
    };
  } catch (error) {
    console.error('Database error:', error);
    return getAgreementStatsFromDemo(userId);
  }
}

function getAgreementStatsFromDemo(userId: string): {
  total: number;
  active: number;
  expired: number;
  disputed: number;
  byCategory: Record<string, number>;
  riskFlagCounts: Record<string, number>;
} {
  const agreements = [
    ...getDemoAgreements(userId),
    ...Array.from(inMemoryAgreements.values()).filter((a) => a.userId === userId),
  ];

  const byCategory: Record<string, number> = {};
  const riskFlagCounts: Record<string, number> = {};
  let active = 0;
  let expired = 0;
  let disputed = 0;

  for (const a of agreements) {
    byCategory[a.merchantCategory] = (byCategory[a.merchantCategory] || 0) + 1;
    for (const flag of a.riskFlags) {
      riskFlagCounts[flag] = (riskFlagCounts[flag] || 0) + 1;
    }
    if (a.status === 'active') active++;
    else if (a.status === 'expired') expired++;
    else if (a.status === 'disputed') disputed++;
  }

  return {
    total: agreements.length,
    active,
    expired,
    disputed,
    byCategory,
    riskFlagCounts,
  };
}

/**
 * Check for duplicate agreement by document hash
 */
export async function findByDocumentHash(
  documentHash: string,
  userId: string
): Promise<Agreement | null> {
  if (!dbAvailable) {
    // Check in-memory
    const inMemory = Array.from(inMemoryAgreements.values()).find(
      (a) => a.documentHash === documentHash && a.userId === userId
    );
    if (inMemory) return inMemory;

    // Check demo data
    const demo = getDemoAgreements(userId).find((a) => a.documentHash === documentHash);
    return demo || null;
  }

  try {
    const agreement = await prisma.agreement.findFirst({
      where: { documentHash, userId },
    });

    if (!agreement) return null;

    return {
      id: agreement.id,
      userId: agreement.userId,
      agentId: agreement.agentId || undefined,
      merchantId: agreement.merchantId,
      merchantName: agreement.merchantName,
      merchantCategory: agreement.merchantCategory,
      category: agreement.merchantCategory.toLowerCase().replace(/\s+/g, '_'),
      sourceUrl: agreement.sourceUrl,
      documentHash: agreement.documentHash,
      blockchainTxId: agreement.blockchainTxId || undefined,
      capturedAt: agreement.capturedAt,
      rawText: agreement.rawText,
      documentTitle: agreement.documentTitle,
      extractedTerms: agreement.extractedTerms as unknown as ExtractedTerms,
      riskFlags: agreement.riskFlags as unknown as RiskFlag[],
      plainSummary: agreement.plainSummary,
      status: mapAgreementStatus(agreement.status),
      expiresAt: agreement.expiresAt || undefined,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}
