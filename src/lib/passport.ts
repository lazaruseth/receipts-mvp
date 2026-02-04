/**
 * Agent Trust Passport (ATP)
 *
 * A portable, verifiable credential that agents present to ANY merchant.
 * Like a credit score for AI agents.
 *
 * Once merchants start REQUIRING ATP for transactions,
 * agents without REMASTER are locked out.
 */

import crypto from 'crypto';
import { getAgentById, getDemoAgents, type AgentProfile } from './badges';

// Passport configuration
const PASSPORT_VALIDITY_HOURS = 24;

// Get passport secret - REQUIRED in production, fallback only in development
function getPassportSecret(): string {
  const secret = process.env.PASSPORT_SIGNING_KEY || process.env.PASSPORT_SECRET;

  if (secret) {
    return secret;
  }

  // In production, fail hard if secret is not configured
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: PASSPORT_SIGNING_KEY must be set in production!');
    throw new Error('PASSPORT_SIGNING_KEY environment variable is required in production');
  }

  // Development only fallback
  console.warn('⚠️ Using development-only passport secret. Set PASSPORT_SIGNING_KEY in production!');
  return 'dev-only-passport-secret-do-not-use-in-production';
}

const PASSPORT_SECRET = getPassportSecret();

export interface AgentTrustPassport {
  // Core identity
  passportId: string;
  agentId: string;
  agentName: string;

  // Trust metrics (attested by REMASTER)
  trustScore: number;
  tier: number;
  tierName: string;

  // Track record
  agreementCount: number;
  disputeWinRate: number;
  complianceRate: number;
  violationCount: number;

  // Achievements
  badges: string[];

  // Validity
  issuedAt: string;
  expiresAt: string;

  // Cryptographic proof
  signature: string;
}

export interface PassportVerification {
  valid: boolean;
  expired: boolean;
  tampered: boolean;
  passport?: AgentTrustPassport;
  error?: string;
}

// Generate cryptographic signature for passport
function signPassport(data: Omit<AgentTrustPassport, 'signature'>): string {
  const payload = JSON.stringify(data, Object.keys(data).sort());
  return crypto
    .createHmac('sha256', PASSPORT_SECRET)
    .update(payload)
    .digest('hex');
}

// Verify passport signature
function verifySignature(passport: AgentTrustPassport): boolean {
  const { signature, ...data } = passport;
  const expectedSignature = signPassport(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Generate a new Agent Trust Passport
export function generatePassport(agentId: string): AgentTrustPassport | null {
  const agent = getAgentById(agentId);
  if (!agent) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSPORT_VALIDITY_HOURS * 60 * 60 * 1000);

  // Calculate dispute win rate
  const totalDisputes = agent.disputesWon + agent.disputesLost;
  const disputeWinRate = totalDisputes > 0
    ? Math.round((agent.disputesWon / totalDisputes) * 100)
    : 100; // 100% if no disputes (benefit of doubt)

  // Calculate compliance rate (agreements without violations)
  const complianceRate = agent.totalAgreements > 0
    ? Math.round(((agent.totalAgreements - agent.violationCount) / agent.totalAgreements) * 100)
    : 100;

  const passportData: Omit<AgentTrustPassport, 'signature'> = {
    passportId: `atp_${crypto.randomBytes(12).toString('hex')}`,
    agentId: agent.id,
    agentName: agent.name,
    trustScore: agent.trustScore,
    tier: agent.trustTier,
    tierName: agent.tierName,
    agreementCount: agent.totalAgreements,
    disputeWinRate,
    complianceRate,
    violationCount: agent.violationCount,
    badges: agent.badges,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const signature = signPassport(passportData);

  return {
    ...passportData,
    signature,
  };
}

// Verify an Agent Trust Passport
export function verifyPassport(passport: AgentTrustPassport): PassportVerification {
  try {
    // Check signature
    if (!verifySignature(passport)) {
      return {
        valid: false,
        expired: false,
        tampered: true,
        error: 'Passport signature verification failed - may have been tampered with',
      };
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(passport.expiresAt);
    if (now > expiresAt) {
      return {
        valid: false,
        expired: true,
        tampered: false,
        passport,
        error: 'Passport has expired - agent must generate a new one',
      };
    }

    // Verify agent still exists and data is current
    const agent = getAgentById(passport.agentId);
    if (!agent) {
      return {
        valid: false,
        expired: false,
        tampered: false,
        error: 'Agent not found in REMASTER registry',
      };
    }

    // Check if trust score has changed significantly (more than 5 points)
    if (Math.abs(agent.trustScore - passport.trustScore) > 5) {
      return {
        valid: false,
        expired: false,
        tampered: false,
        passport,
        error: 'Trust score has changed significantly - passport should be refreshed',
      };
    }

    return {
      valid: true,
      expired: false,
      tampered: false,
      passport,
    };
  } catch {
    return {
      valid: false,
      expired: false,
      tampered: false,
      error: 'Failed to verify passport',
    };
  }
}

// Encode passport to JWT-like token (base64 encoded)
export function encodePassportToken(passport: AgentTrustPassport): string {
  const json = JSON.stringify(passport);
  return Buffer.from(json).toString('base64url');
}

// Decode passport from token
export function decodePassportToken(token: string): AgentTrustPassport | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(json) as AgentTrustPassport;
  } catch {
    return null;
  }
}

// Get passport status text
export function getPassportStatus(passport: AgentTrustPassport): {
  status: 'valid' | 'expiring_soon' | 'expired';
  message: string;
  hoursRemaining: number;
} {
  const now = new Date();
  const expiresAt = new Date(passport.expiresAt);
  const hoursRemaining = Math.max(0, (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (hoursRemaining === 0) {
    return {
      status: 'expired',
      message: 'Passport expired - generate a new one',
      hoursRemaining: 0,
    };
  }

  if (hoursRemaining < 4) {
    return {
      status: 'expiring_soon',
      message: `Passport expires in ${Math.round(hoursRemaining)} hours`,
      hoursRemaining,
    };
  }

  return {
    status: 'valid',
    message: `Valid for ${Math.round(hoursRemaining)} more hours`,
    hoursRemaining,
  };
}

// Get tier requirements for merchant access
export function getTierRequirements(minTier: number): {
  minScore: number;
  capabilities: string[];
} {
  const tierRequirements: Record<number, { minScore: number; capabilities: string[] }> = {
    1: { minScore: 0, capabilities: ['Basic capture', 'View agreements'] },
    2: { minScore: 21, capabilities: ['Policy validation', 'Basic disputes'] },
    3: { minScore: 41, capabilities: ['Priority support', 'Merchant insights'] },
    4: { minScore: 61, capabilities: ['On-chain anchoring', 'Advanced analytics'] },
    5: { minScore: 81, capabilities: ['Auto-approval', 'White-glove support'] },
  };

  return tierRequirements[minTier] || tierRequirements[1];
}

// Check if passport meets merchant requirements
export function checkPassportAccess(
  passport: AgentTrustPassport,
  requirements: { minTier: number; minScore?: number }
): {
  granted: boolean;
  reason?: string;
  upgradeNeeded?: { currentTier: number; requiredTier: number; pointsNeeded: number };
} {
  const { minTier, minScore } = requirements;
  const tierReqs = getTierRequirements(minTier);
  const effectiveMinScore = minScore || tierReqs.minScore;

  if (passport.tier >= minTier && passport.trustScore >= effectiveMinScore) {
    return { granted: true };
  }

  const pointsNeeded = effectiveMinScore - passport.trustScore;

  return {
    granted: false,
    reason: `Requires Tier ${minTier}+ (score ${effectiveMinScore}+). You have Tier ${passport.tier} (score ${passport.trustScore})`,
    upgradeNeeded: {
      currentTier: passport.tier,
      requiredTier: minTier,
      pointsNeeded: Math.max(0, pointsNeeded),
    },
  };
}

// Get all passports (for demo/listing)
export function getAllAgentPassports(): AgentTrustPassport[] {
  const agents = getDemoAgents();
  return agents
    .map(agent => generatePassport(agent.id))
    .filter((p): p is AgentTrustPassport => p !== null);
}
