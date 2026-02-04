import { NextRequest, NextResponse } from 'next/server';
import { generatePassport, encodePassportToken } from '@/lib/passport';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * POST /api/passport/generate
 *
 * Generate a new Agent Trust Passport for an agent.
 * Passports are valid for 24 hours and must be refreshed.
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
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // TODO: In production, verify that the authenticated user owns this agent
    // const agent = await prisma.agent.findUnique({ where: { externalId: agentId, ownerId: userId } });
    // if (!agent) return NextResponse.json({ error: 'Agent not found or not owned by you' }, { status: 403 });

    const passport = generatePassport(agentId);

    if (!passport) {
      return NextResponse.json(
        { error: 'Agent not found in RECEIPTS registry' },
        { status: 404 }
      );
    }

    // Generate token for easy transport
    const token = encodePassportToken(passport);

    return NextResponse.json({
      passport,
      token,
      verificationUrl: `/api/passport/verify/${token}`,
      publicUrl: `/passport/${agentId}`,
      expiresIn: '24 hours',
      usage: {
        description: 'Present this passport to merchants for verification',
        header: 'X-RECEIPTS-Passport: <token>',
        apiVerify: `GET /api/passport/verify/${token}`,
      },
    });
  } catch (error) {
    console.error('Passport generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate passport' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/passport/generate
 *
 * Get information about passport generation.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/passport/generate',
    method: 'POST',
    description: 'Generate a new Agent Trust Passport',
    body: {
      agentId: 'string (required) - The agent ID to generate passport for',
    },
    response: {
      passport: 'AgentTrustPassport object',
      token: 'Base64URL encoded passport for transport',
      verificationUrl: 'URL for merchants to verify the passport',
      publicUrl: 'Public passport view page',
    },
    example: {
      request: { agentId: 'agent_travel_pro' },
    },
  });
}
