/**
 * Capture Service
 *
 * Handles capture operations with Prisma database.
 * Captures are pre-acceptance snapshots of ToS/agreements.
 */

import { prisma } from '../db';

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

// In-memory fallback for demo mode
const inMemoryCaptures = new Map<string, CaptureData>();

export interface CaptureData {
  id: string;
  agentId: string;
  documentHash: string;
  sourceUrl: string;
  merchantDomain: string | null;
  merchantName: string | null;
  rawText: string | null;
  status: 'captured' | 'parsing' | 'parsed' | 'anchoring' | 'anchored' | 'failed';
  termsHash: string | null;
  paoData: Record<string, unknown> | null;
  blockchainTxId: string | null;
  createdAt: Date;
  parsedAt: Date | null;
  anchoredAt: Date | null;
}

export interface CreateCaptureInput {
  agentId: string;
  documentHash: string;
  sourceUrl: string;
  merchantDomain?: string;
  merchantName?: string;
  rawText?: string;
}

/**
 * Create a new capture
 */
export async function createCapture(input: CreateCaptureInput): Promise<CaptureData> {
  const captureId = `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const captureData: CaptureData = {
    id: captureId,
    agentId: input.agentId,
    documentHash: input.documentHash,
    sourceUrl: input.sourceUrl,
    merchantDomain: input.merchantDomain || null,
    merchantName: input.merchantName || null,
    rawText: input.rawText || null,
    status: 'captured',
    termsHash: null,
    paoData: null,
    blockchainTxId: null,
    createdAt: now,
    parsedAt: null,
    anchoredAt: null,
  };

  if (!dbAvailable) {
    inMemoryCaptures.set(captureId, captureData);
    return captureData;
  }

  try {
    // Find or create agent by externalId
    let agent = await prisma.agent.findUnique({
      where: { externalId: input.agentId },
    });

    if (!agent) {
      // Auto-register agent if not found (basic registration)
      agent = await prisma.agent.create({
        data: {
          externalId: input.agentId,
          agentType: 'custom',
          trustScore: 10,
          capabilities: {},
        },
      });
    }

    const capture = await prisma.capture.create({
      data: {
        agentId: agent.id, // Use internal agent ID
        documentHash: input.documentHash,
        sourceUrl: input.sourceUrl,
        merchantDomain: input.merchantDomain,
        merchantName: input.merchantName,
        rawText: input.rawText,
        status: 'captured',
      },
    });

    return {
      id: capture.id,
      agentId: input.agentId, // Return external agent ID for API consistency
      documentHash: capture.documentHash,
      sourceUrl: capture.sourceUrl,
      merchantDomain: capture.merchantDomain,
      merchantName: capture.merchantName,
      rawText: capture.rawText,
      status: capture.status as CaptureData['status'],
      termsHash: capture.termsHash,
      paoData: capture.paoData as Record<string, unknown> | null,
      blockchainTxId: capture.blockchainTxId,
      createdAt: capture.createdAt,
      parsedAt: capture.parsedAt,
      anchoredAt: capture.anchoredAt,
    };
  } catch (error) {
    console.error('Database error, falling back to in-memory:', error);
    dbAvailable = false;
    inMemoryCaptures.set(captureId, captureData);
    return captureData;
  }
}

/**
 * Get a capture by ID
 */
export async function getCaptureById(captureId: string): Promise<CaptureData | null> {
  if (!dbAvailable) {
    return inMemoryCaptures.get(captureId) || null;
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
      include: { agent: true },
    });

    if (!capture) {
      // Check in-memory fallback
      return inMemoryCaptures.get(captureId) || null;
    }

    return {
      id: capture.id,
      agentId: capture.agent.externalId,
      documentHash: capture.documentHash,
      sourceUrl: capture.sourceUrl,
      merchantDomain: capture.merchantDomain,
      merchantName: capture.merchantName,
      rawText: capture.rawText,
      status: capture.status as CaptureData['status'],
      termsHash: capture.termsHash,
      paoData: capture.paoData as Record<string, unknown> | null,
      blockchainTxId: capture.blockchainTxId,
      createdAt: capture.createdAt,
      parsedAt: capture.parsedAt,
      anchoredAt: capture.anchoredAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return inMemoryCaptures.get(captureId) || null;
  }
}

/**
 * Update capture status and data after parsing
 */
export async function updateCaptureAfterParse(
  captureId: string,
  termsHash: string,
  paoData: Record<string, unknown>
): Promise<CaptureData | null> {
  const now = new Date();

  if (!dbAvailable) {
    const capture = inMemoryCaptures.get(captureId);
    if (!capture) return null;

    capture.status = 'parsed';
    capture.termsHash = termsHash;
    capture.paoData = paoData;
    capture.parsedAt = now;
    inMemoryCaptures.set(captureId, capture);
    return capture;
  }

  try {
    const capture = await prisma.capture.update({
      where: { id: captureId },
      data: {
        status: 'parsed',
        termsHash,
        paoData: paoData as object,
        parsedAt: now,
      },
      include: { agent: true },
    });

    return {
      id: capture.id,
      agentId: capture.agent.externalId,
      documentHash: capture.documentHash,
      sourceUrl: capture.sourceUrl,
      merchantDomain: capture.merchantDomain,
      merchantName: capture.merchantName,
      rawText: capture.rawText,
      status: capture.status as CaptureData['status'],
      termsHash: capture.termsHash,
      paoData: capture.paoData as Record<string, unknown> | null,
      blockchainTxId: capture.blockchainTxId,
      createdAt: capture.createdAt,
      parsedAt: capture.parsedAt,
      anchoredAt: capture.anchoredAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Update capture after blockchain anchoring
 */
export async function updateCaptureAfterAnchor(
  captureId: string,
  blockchainTxId: string,
  chain: string = 'base-sepolia'
): Promise<CaptureData | null> {
  const now = new Date();

  if (!dbAvailable) {
    const capture = inMemoryCaptures.get(captureId);
    if (!capture) return null;

    capture.status = 'anchored';
    capture.blockchainTxId = blockchainTxId;
    capture.anchoredAt = now;
    inMemoryCaptures.set(captureId, capture);
    return capture;
  }

  try {
    const capture = await prisma.capture.update({
      where: { id: captureId },
      data: {
        status: 'anchored',
        blockchainTxId,
        blockchainChain: chain,
        anchoredAt: now,
      },
      include: { agent: true },
    });

    return {
      id: capture.id,
      agentId: capture.agent.externalId,
      documentHash: capture.documentHash,
      sourceUrl: capture.sourceUrl,
      merchantDomain: capture.merchantDomain,
      merchantName: capture.merchantName,
      rawText: capture.rawText,
      status: capture.status as CaptureData['status'],
      termsHash: capture.termsHash,
      paoData: capture.paoData as Record<string, unknown> | null,
      blockchainTxId: capture.blockchainTxId,
      createdAt: capture.createdAt,
      parsedAt: capture.parsedAt,
      anchoredAt: capture.anchoredAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Get captures for an agent
 */
export async function getCapturesForAgent(
  agentExternalId: string,
  limit: number = 50
): Promise<CaptureData[]> {
  if (!dbAvailable) {
    return Array.from(inMemoryCaptures.values())
      .filter((c) => c.agentId === agentExternalId)
      .slice(0, limit);
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { externalId: agentExternalId },
    });

    if (!agent) {
      return [];
    }

    const captures = await prisma.capture.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { agent: true },
    });

    return captures.map((capture) => ({
      id: capture.id,
      agentId: capture.agent.externalId,
      documentHash: capture.documentHash,
      sourceUrl: capture.sourceUrl,
      merchantDomain: capture.merchantDomain,
      merchantName: capture.merchantName,
      rawText: capture.rawText,
      status: capture.status as CaptureData['status'],
      termsHash: capture.termsHash,
      paoData: capture.paoData as Record<string, unknown> | null,
      blockchainTxId: capture.blockchainTxId,
      createdAt: capture.createdAt,
      parsedAt: capture.parsedAt,
      anchoredAt: capture.anchoredAt,
    }));
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

/**
 * Check for duplicate capture by document hash
 */
export async function findCaptureByHash(
  documentHash: string,
  agentExternalId: string
): Promise<CaptureData | null> {
  if (!dbAvailable) {
    const captures = Array.from(inMemoryCaptures.values());
    return captures.find(
      (c) => c.documentHash === documentHash && c.agentId === agentExternalId
    ) || null;
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { externalId: agentExternalId },
    });

    if (!agent) return null;

    const capture = await prisma.capture.findFirst({
      where: {
        documentHash,
        agentId: agent.id,
      },
      include: { agent: true },
    });

    if (!capture) return null;

    return {
      id: capture.id,
      agentId: capture.agent.externalId,
      documentHash: capture.documentHash,
      sourceUrl: capture.sourceUrl,
      merchantDomain: capture.merchantDomain,
      merchantName: capture.merchantName,
      rawText: capture.rawText,
      status: capture.status as CaptureData['status'],
      termsHash: capture.termsHash,
      paoData: capture.paoData as Record<string, unknown> | null,
      blockchainTxId: capture.blockchainTxId,
      createdAt: capture.createdAt,
      parsedAt: capture.parsedAt,
      anchoredAt: capture.anchoredAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}
