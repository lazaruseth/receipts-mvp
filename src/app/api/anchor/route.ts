import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { anchorOnBase, estimateAnchorCost } from '@/lib/base-anchor';
import { getDemoAgent } from '@/lib/trust-score';
import { requireAuth } from '@/lib/auth-helpers';
import type { AnchorResponse } from '@/types/pao';

const anchorRequestSchema = z.object({
  termsHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a valid 32-byte hex hash'),
  captureId: z.string().min(1, 'Capture ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
});

/**
 * POST /api/anchor
 *
 * Anchor a termsHash on Base L2 for immutable timestamping.
 * This creates an on-chain proof that the agreement existed at a specific time.
 *
 * Requirements:
 * - Agent must have trust score >= 61 (or pay for anchoring)
 * - termsHash must be valid (from /api/parse with returnPAO: true)
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
    const { userId } = auth;

    const body = await request.json();
    const { termsHash, captureId, agentId } = anchorRequestSchema.parse(body);

    // Check agent trust level
    const agent = getDemoAgent(agentId);

    if (!agent.capabilities.canAnchorOnchain) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient trust score for on-chain anchoring',
          details: {
            currentScore: agent.trustScore,
            requiredScore: 61,
            message: `On-chain anchoring is unlocked at trust score 61. You're at ${agent.trustScore}. Capture ${Math.ceil((61 - agent.trustScore) / 3)} more agreements compliantly to unlock this feature.`,
          },
        },
        { status: 403 }
      );
    }

    // Get cost estimate
    const cost = await estimateAnchorCost();

    // Anchor on Base
    const result = await anchorOnBase(termsHash, captureId, agentId);

    console.log(`[Anchor Success] User ${userId} - Agreement anchored on Base`);
    console.log(`  Agent: ${agentId} (trust: ${agent.trustScore})`);
    console.log(`  Terms Hash: ${termsHash}`);
    console.log(`  Tx: ${result.blockchainTxId}`);

    return NextResponse.json({
      success: true,
      ...result,
      cost,
      agent: {
        id: agent.id,
        trustScore: agent.trustScore,
      },
      message: `Agreement proof anchored on Base ${result.chain}. This creates an immutable timestamp that can be used as evidence in disputes.`,
    });
  } catch (error) {
    console.error('Anchor error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to anchor agreement',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/anchor?termsHash=0x...
 *
 * Verify an existing anchor.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const termsHash = searchParams.get('termsHash');

    if (!termsHash) {
      return NextResponse.json(
        { error: 'termsHash query parameter is required' },
        { status: 400 }
      );
    }

    // In production, verify on-chain
    // For MVP, return simulated verification

    return NextResponse.json({
      verified: true,
      termsHash,
      message: 'Anchor verification not implemented in MVP. In production, this would query the Base blockchain to verify the anchor exists.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
