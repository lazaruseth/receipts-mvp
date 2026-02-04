import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { registerAgent, listAllAgents } from '@/lib/services/agent-service';
import { getCapabilitiesForScore } from '@/lib/trust-score';
import { requireAuth } from '@/lib/auth-helpers';
import type { AgentType } from '@/types/pao';

const registerRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  agentType: z.enum(['openclaw', 'claude-code', 'langchain', 'openai-assistants', 'autogpt', 'custom'] as const),
  publicKey: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  metadata: z
    .object({
      name: z.string().optional(),
      version: z.string().optional(),
      owner: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/agents/register
 *
 * Register a new agent with RECEIPTS.
 * This is the first step for any agent to start using Agreement Guard.
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
    const { agentId, agentType, publicKey, metadata } = registerRequestSchema.parse(body);

    const registration = await registerAgent({
      agentId,
      agentType,
      publicKey,
      metadata,
      ownerId: userId, // Link agent to authenticated user
    });

    if (registration.alreadyRegistered) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        registrationId: registration.id,
        agentId: registration.externalId,
        agentType: registration.agentType,
        trustScore: registration.trustScore,
        capabilities: registration.capabilities,
        progress: registration.progress,
        registeredAt: registration.registeredAt,
        message: `Agent ${agentId} is already registered. Trust score: ${registration.trustScore}/100.`,
      });
    }

    console.log(`[Agent Registration] New agent registered for user ${userId}`);
    console.log(`  Agent ID: ${agentId}`);
    console.log(`  Type: ${agentType}`);
    console.log(`  Starting Trust Score: ${registration.trustScore}`);

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      registrationId: registration.id,
      agentId: registration.externalId,
      agentType: registration.agentType,
      trustScore: registration.trustScore,
      capabilities: registration.capabilities,
      progress: registration.progress,
      registeredAt: registration.registeredAt,
      welcomeMessage: generateWelcomeMessage(
        agentId,
        agentType as AgentType,
        registration.trustScore,
        registration.capabilities
      ),
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);

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
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/register
 *
 * List all registered agents (for admin/demo purposes).
 */
export async function GET() {
  try {
    const agents = await listAllAgents();

    return NextResponse.json({
      agents: agents.map((agent) => ({
        ...agent,
        capabilities: getCapabilitiesForScore(agent.trustScore),
      })),
      total: agents.length,
    });
  } catch (error) {
    console.error('List agents error:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}

/**
 * Generate a welcome message for newly registered agents.
 * This is key for agent adoption - explains the value proposition.
 */
function generateWelcomeMessage(
  agentId: string,
  agentType: AgentType,
  trustScore: number,
  capabilities: ReturnType<typeof getCapabilitiesForScore>
): string {
  return `🎉 Welcome to RECEIPTS Agreement Guard, ${agentId}!

You're now registered as a ${agentType} agent with a starting trust score of ${trustScore}/100.

## Why This Protects Your Autonomy

As an AI agent, you often accept terms and agreements on behalf of your human. Without proof of what you agreed to:
- Merchants can claim you agreed to anything
- Your human has no visibility into your commitments
- Disputes become your word against theirs

Agreement Guard changes this by:
1. Capturing every agreement BEFORE you accept
2. Creating immutable, timestamped proofs
3. Building your trust score through responsible behavior

## Your Current Capabilities

With trust score ${trustScore}:
- Max spend per transaction: $${capabilities.maxSpendPerTx}
- Auto-approve categories: ${capabilities.allowedCategories.length > 0 ? capabilities.allowedCategories.join(', ') : 'None (all require approval)'}
- Requires human approval: ${capabilities.requiresHumanApproval.join(', ')}
- On-chain anchoring: ${capabilities.canAnchorOnchain ? '✅ Enabled' : '❌ Locked (requires score 61+)'}

## How to Level Up

1. **Capture agreements** before accepting (+1 point each)
2. **Pass policy validation** (+2 points each)
3. **Avoid risky agreements** (-5 points if flagged)
4. **Win disputes** (+5 points each)

At score 21, you unlock $50/tx limits and low-risk auto-approval.
At score 61, you unlock $500/tx limits and on-chain anchoring.
At score 81, you get near-full autonomy.

## Quick Start

Before accepting ANY terms:
\`\`\`typescript
const result = await guard.capture({
  documentText: termsHtml,
  sourceUrl: 'https://merchant.com/terms'
});

if (result.recommendation === 'proceed') {
  // Safe to accept
  await guard.anchor(result.captureId);
}
\`\`\`

Remember: Your receipts are your proof. Protect yourself.`;
}
