import { NextRequest, NextResponse } from 'next/server';
import { checkAgentAccess, getAccessibleMerchants } from '@/lib/merchant-network';

/**
 * POST /api/network/check-access
 *
 * Check if an agent can access a specific merchant in the network.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, merchantDomain } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // If merchantDomain provided, check specific access
    if (merchantDomain) {
      const access = checkAgentAccess(agentId, merchantDomain);

      if (!access) {
        return NextResponse.json(
          { error: 'Agent or merchant not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(access);
    }

    // Otherwise, return all accessible merchants
    const { accessible, locked } = getAccessibleMerchants(agentId);

    return NextResponse.json({
      accessible,
      locked,
      summary: {
        totalAccessible: accessible.length,
        totalLocked: locked.length,
        nextUnlock: locked.length > 0 ? locked.sort((a, b) =>
          (a.upgradePath?.pointsNeeded || 999) - (b.upgradePath?.pointsNeeded || 999)
        )[0] : null,
      },
    });
  } catch (error) {
    console.error('Access check error:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
