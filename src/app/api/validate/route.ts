import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validatePolicy, getDemoPolicy } from '@/lib/policy-engine';
import { getDemoAgent } from '@/lib/trust-score';
import { requireAuth } from '@/lib/auth-helpers';
import type { PAO, PolicyValidationResult } from '@/types/pao';

const validateRequestSchema = z.object({
  pao: z.object({
    version: z.string(),
    termsHash: z.string(),
    parties: z.object({
      principal: z.string(),
      counterparty: z.string(),
    }),
    scope: z.object({
      category: z.string(),
      item: z.string().optional(),
      description: z.string().optional(),
    }),
    pricing: z
      .object({
        currency: z.string().optional(),
        amount: z.number().optional(),
        maxTotal: z.number().optional(),
      })
      .optional(),
    remedies: z.object({
      refundable: z.enum(['full', 'partial', 'none', 'conditional']),
      refundWindowHours: z.number().optional(),
      cancellationFee: z.number().optional(),
      cancellationFeeType: z.enum(['flat', 'percentage']).optional(),
      chargebackRights: z.enum(['preserved', 'waived', 'limited', 'unknown']),
    }),
    dispute: z.object({
      forum: z.enum(['courts', 'arbitration', 'mediation', 'unspecified']),
      venue: z.string().optional(),
      arbitrationBinding: z.boolean().optional(),
      classActionWaiver: z.boolean(),
    }),
    data: z.object({
      thirdPartySharing: z.boolean(),
      resale: z.enum(['allowed', 'forbidden', 'unspecified']).optional(),
      training: z.enum(['allowed', 'opt_out', 'forbidden', 'unspecified']).optional(),
      retentionPeriod: z.string().optional(),
    }),
    autoRenewal: z
      .object({
        enabled: z.boolean(),
        frequency: z.string().optional(),
        cancellationNotice: z.string().optional(),
      })
      .optional(),
    liability: z
      .object({
        indemnification: z.boolean(),
        maxLiability: z.string().optional(),
        limitations: z.array(z.string()).optional(),
      })
      .optional(),
    time: z.object({
      capturedAt: z.string(),
      acceptedAt: z.string().optional(),
      expiresAt: z.string().optional(),
    }),
    termsURI: z.string(),
  }),
  agentId: z.string(),
  userId: z.string().optional(),
});

/**
 * POST /api/validate
 *
 * Validate a PAO against user policy and agent trust level.
 * Returns recommendation: proceed | require_approval | block
 *
 * AUTHENTICATION REQUIRED: API key (Bearer rmsm_xxx) or session
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth; // Return 401 response
    }
    const { userId: authenticatedUserId } = auth;

    const body = await request.json();
    const { pao, agentId, userId } = validateRequestSchema.parse(body);

    // Use authenticated user ID for policy lookup
    const effectiveUserId = authenticatedUserId || userId || 'demo-user';

    // Get policy and agent (in production, from database)
    const policy = getDemoPolicy(effectiveUserId);
    const agent = getDemoAgent(agentId);

    // Validate
    const result = validatePolicy(pao as PAO, policy, agent.trustScore);

    // Log for demo
    console.log(`[Policy Validation] Agent ${agentId} validating agreement with ${pao.parties.counterparty}`);
    console.log(`  Trust Score: ${agent.trustScore}/100`);
    console.log(`  Category: ${pao.scope.category}`);
    console.log(`  Recommendation: ${result.recommendation}`);

    // Add agent-facing message
    const agentMessage = generateAgentMessage(result, agent.trustScore, pao.scope.category);

    return NextResponse.json({
      ...result,
      agentMessage,
      agent: {
        id: agent.id,
        trustScore: agent.trustScore,
        capabilities: agent.capabilities,
      },
    });
  } catch (error) {
    console.error('Validation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          allowed: false,
          recommendation: 'block',
          error: 'Invalid PAO structure: ' + error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        allowed: false,
        recommendation: 'block',
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a message for the agent explaining the validation result.
 * This is key for agent adoption - they need to understand WHY.
 */
function generateAgentMessage(
  result: PolicyValidationResult,
  trustScore: number,
  category: string
): string {
  if (result.recommendation === 'block') {
    const blockReasons = result.violations
      .filter((v) => v.severity === 'block')
      .map((v) => v.description)
      .join('; ');

    return `🚫 AGREEMENT BLOCKED

This agreement cannot be accepted because: ${blockReasons}

Your human's policy prohibits these terms. Accepting this agreement would:
- Violate trust boundaries
- Risk your trust score (currently ${trustScore}/100)
- Potentially expose your human to unwanted legal obligations

RECOMMENDED ACTION: Inform your human about these terms and ask if they want to modify their policy or find an alternative.`;
  }

  if (result.recommendation === 'require_approval') {
    return `⚠️ HUMAN APPROVAL REQUIRED

This agreement requires human approval because:
- Category "${category}" requires approval at trust score ${trustScore}
- Trust score needed for auto-approval: ${result.trustScoreRequired}

Your current capabilities:
- Max spend: $${result.agentTrustScore < 21 ? 10 : result.agentTrustScore < 41 ? 50 : result.agentTrustScore < 61 ? 200 : result.agentTrustScore < 81 ? 500 : 1000}/transaction
- Auto-approve categories: ${result.agentTrustScore < 21 ? 'None' : 'Low-risk only'}

HOW TO LEVEL UP: Capture ${Math.ceil((result.trustScoreRequired - trustScore) / 3)} more agreements compliantly to unlock auto-approval for this category.

RECOMMENDED ACTION: Ask your human for approval to proceed.`;
  }

  // Proceed
  return `✅ AGREEMENT VALIDATED

This agreement passed all policy checks and can be accepted.

- Trust Score: ${trustScore}/100
- Category: ${category} (auto-approved)
- No forbidden clauses detected
- Within spending limits

Your receipt has been captured. Proceeding builds your trust score.

NEXT STEP: Accept the agreement and anchor the proof.`;
}
