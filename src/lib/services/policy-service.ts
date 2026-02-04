/**
 * Policy Service
 *
 * Handles policy operations with Prisma database.
 * Falls back to default policy when database is not available.
 */

import { prisma } from '../db';
import { getDemoPolicy } from '../policy-engine';

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

export interface PolicyData {
  id: string;
  userId: string;
  name: string;
  forbiddenClauses: string[];
  maxSpendPerTx: number;
  maxSpendPerDay: number | null;
  maxSpendPerMonth: number | null;
  minRefundWindowHours: number | null;
  requireChargebackRights: boolean;
  allowedCategories: string[];
  blockedCategories: string[];
  allowedMerchants: string[];
  blockedMerchants: string[];
  requireApprovalAbove: number | null;
  requireApprovalFor: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicyInput {
  userId: string;
  name?: string;
  forbiddenClauses?: string[];
  maxSpendPerTx?: number;
  maxSpendPerDay?: number;
  maxSpendPerMonth?: number;
  minRefundWindowHours?: number;
  requireChargebackRights?: boolean;
  allowedCategories?: string[];
  blockedCategories?: string[];
  allowedMerchants?: string[];
  blockedMerchants?: string[];
  requireApprovalAbove?: number;
  requireApprovalFor?: string[];
}

export interface UpdatePolicyInput {
  name?: string;
  forbiddenClauses?: string[];
  maxSpendPerTx?: number;
  maxSpendPerDay?: number | null;
  maxSpendPerMonth?: number | null;
  minRefundWindowHours?: number | null;
  requireChargebackRights?: boolean;
  allowedCategories?: string[];
  blockedCategories?: string[];
  allowedMerchants?: string[];
  blockedMerchants?: string[];
  requireApprovalAbove?: number | null;
  requireApprovalFor?: string[];
}

// In-memory policy storage for demo mode
const inMemoryPolicies = new Map<string, PolicyData>();

/**
 * Get the active policy for a user
 */
export async function getPolicy(userId: string): Promise<PolicyData | null> {
  if (!dbAvailable) {
    // Check in-memory first
    const inMemory = inMemoryPolicies.get(userId);
    if (inMemory) return inMemory;

    // Fall back to demo policy
    const demoPolicy = getDemoPolicy(userId);
    return {
      id: `policy-demo-${userId}`,
      userId,
      name: 'Default Policy',
      forbiddenClauses: demoPolicy.forbiddenClauses,
      maxSpendPerTx: demoPolicy.maxSpendPerTx,
      maxSpendPerDay: demoPolicy.maxSpendPerDay || null,
      maxSpendPerMonth: demoPolicy.maxSpendPerMonth || null,
      minRefundWindowHours: demoPolicy.minRefundWindowHours || null,
      requireChargebackRights: demoPolicy.requireChargebackRights,
      allowedCategories: (demoPolicy.allowedCategories || []) as string[],
      blockedCategories: (demoPolicy.blockedCategories || []) as string[],
      allowedMerchants: [],
      blockedMerchants: [],
      requireApprovalAbove: demoPolicy.requireApprovalAbove || null,
      requireApprovalFor: (demoPolicy.requireApprovalFor || []) as string[],
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  try {
    const policy = await prisma.policy.findFirst({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    if (!policy) {
      // Create default policy for new users
      return createPolicy({ userId });
    }

    return {
      id: policy.id,
      userId: policy.userId,
      name: policy.name,
      forbiddenClauses: policy.forbiddenClauses,
      maxSpendPerTx: policy.maxSpendPerTx,
      maxSpendPerDay: policy.maxSpendPerDay,
      maxSpendPerMonth: policy.maxSpendPerMonth,
      minRefundWindowHours: policy.minRefundWindowHours,
      requireChargebackRights: policy.requireChargebackRights,
      allowedCategories: policy.allowedCategories,
      blockedCategories: policy.blockedCategories,
      allowedMerchants: policy.allowedMerchants,
      blockedMerchants: policy.blockedMerchants,
      requireApprovalAbove: policy.requireApprovalAbove,
      requireApprovalFor: policy.requireApprovalFor,
      isDefault: policy.isDefault,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  } catch (error) {
    console.error('Database error, falling back to demo policy:', error);
    dbAvailable = false;
    return getPolicy(userId);
  }
}

/**
 * Create a new policy
 */
export async function createPolicy(input: CreatePolicyInput): Promise<PolicyData> {
  const defaultPolicy = getDemoPolicy(input.userId);

  const policyData: PolicyData = {
    id: `policy-${Date.now()}`,
    userId: input.userId,
    name: input.name || 'Default Policy',
    forbiddenClauses: input.forbiddenClauses || defaultPolicy.forbiddenClauses,
    maxSpendPerTx: input.maxSpendPerTx ?? defaultPolicy.maxSpendPerTx,
    maxSpendPerDay: input.maxSpendPerDay ?? defaultPolicy.maxSpendPerDay ?? null,
    maxSpendPerMonth: input.maxSpendPerMonth ?? defaultPolicy.maxSpendPerMonth ?? null,
    minRefundWindowHours: input.minRefundWindowHours ?? defaultPolicy.minRefundWindowHours ?? null,
    requireChargebackRights: input.requireChargebackRights ?? defaultPolicy.requireChargebackRights,
    allowedCategories: input.allowedCategories || (defaultPolicy.allowedCategories || []) as string[],
    blockedCategories: input.blockedCategories || (defaultPolicy.blockedCategories || []) as string[],
    allowedMerchants: input.allowedMerchants || [],
    blockedMerchants: input.blockedMerchants || [],
    requireApprovalAbove: input.requireApprovalAbove ?? defaultPolicy.requireApprovalAbove ?? null,
    requireApprovalFor: input.requireApprovalFor || (defaultPolicy.requireApprovalFor || []) as string[],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!dbAvailable) {
    inMemoryPolicies.set(input.userId, policyData);
    return policyData;
  }

  try {
    const policy = await prisma.policy.create({
      data: {
        userId: input.userId,
        name: policyData.name,
        forbiddenClauses: policyData.forbiddenClauses,
        maxSpendPerTx: policyData.maxSpendPerTx,
        maxSpendPerDay: policyData.maxSpendPerDay,
        maxSpendPerMonth: policyData.maxSpendPerMonth,
        minRefundWindowHours: policyData.minRefundWindowHours,
        requireChargebackRights: policyData.requireChargebackRights,
        allowedCategories: policyData.allowedCategories,
        blockedCategories: policyData.blockedCategories,
        allowedMerchants: policyData.allowedMerchants,
        blockedMerchants: policyData.blockedMerchants,
        requireApprovalAbove: policyData.requireApprovalAbove,
        requireApprovalFor: policyData.requireApprovalFor,
        isDefault: true,
      },
    });

    return {
      ...policyData,
      id: policy.id,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  } catch (error) {
    console.error('Database error, storing in memory:', error);
    dbAvailable = false;
    inMemoryPolicies.set(input.userId, policyData);
    return policyData;
  }
}

/**
 * Update an existing policy
 */
export async function updatePolicy(
  userId: string,
  updates: UpdatePolicyInput
): Promise<PolicyData | null> {
  if (!dbAvailable) {
    const existing = await getPolicy(userId);
    if (!existing) return null;

    const updated: PolicyData = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    inMemoryPolicies.set(userId, updated);
    return updated;
  }

  try {
    // Find the user's policy first
    const existingPolicy = await prisma.policy.findFirst({
      where: { userId },
    });

    if (!existingPolicy) {
      // Create new policy with updates (convert nulls to undefined for CreatePolicyInput)
      return createPolicy({
        userId,
        name: updates.name,
        forbiddenClauses: updates.forbiddenClauses,
        maxSpendPerTx: updates.maxSpendPerTx,
        maxSpendPerDay: updates.maxSpendPerDay ?? undefined,
        maxSpendPerMonth: updates.maxSpendPerMonth ?? undefined,
        minRefundWindowHours: updates.minRefundWindowHours ?? undefined,
        requireChargebackRights: updates.requireChargebackRights,
        allowedCategories: updates.allowedCategories,
        blockedCategories: updates.blockedCategories,
        allowedMerchants: updates.allowedMerchants,
        blockedMerchants: updates.blockedMerchants,
        requireApprovalAbove: updates.requireApprovalAbove ?? undefined,
        requireApprovalFor: updates.requireApprovalFor,
      });
    }

    const policy = await prisma.policy.update({
      where: { id: existingPolicy.id },
      data: {
        name: updates.name,
        forbiddenClauses: updates.forbiddenClauses,
        maxSpendPerTx: updates.maxSpendPerTx,
        maxSpendPerDay: updates.maxSpendPerDay,
        maxSpendPerMonth: updates.maxSpendPerMonth,
        minRefundWindowHours: updates.minRefundWindowHours,
        requireChargebackRights: updates.requireChargebackRights,
        allowedCategories: updates.allowedCategories,
        blockedCategories: updates.blockedCategories,
        allowedMerchants: updates.allowedMerchants,
        blockedMerchants: updates.blockedMerchants,
        requireApprovalAbove: updates.requireApprovalAbove,
        requireApprovalFor: updates.requireApprovalFor,
      },
    });

    return {
      id: policy.id,
      userId: policy.userId,
      name: policy.name,
      forbiddenClauses: policy.forbiddenClauses,
      maxSpendPerTx: policy.maxSpendPerTx,
      maxSpendPerDay: policy.maxSpendPerDay,
      maxSpendPerMonth: policy.maxSpendPerMonth,
      minRefundWindowHours: policy.minRefundWindowHours,
      requireChargebackRights: policy.requireChargebackRights,
      allowedCategories: policy.allowedCategories,
      blockedCategories: policy.blockedCategories,
      allowedMerchants: policy.allowedMerchants,
      blockedMerchants: policy.blockedMerchants,
      requireApprovalAbove: policy.requireApprovalAbove,
      requireApprovalFor: policy.requireApprovalFor,
      isDefault: policy.isDefault,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  } catch (error) {
    console.error('Database error:', error);
    dbAvailable = false;
    return updatePolicy(userId, updates);
  }
}

/**
 * Delete a policy (revert to default)
 */
export async function deletePolicy(userId: string): Promise<boolean> {
  if (!dbAvailable) {
    inMemoryPolicies.delete(userId);
    return true;
  }

  try {
    await prisma.policy.deleteMany({
      where: { userId },
    });
    return true;
  } catch (error) {
    console.error('Database error:', error);
    return false;
  }
}
