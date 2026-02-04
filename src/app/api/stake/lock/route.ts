import { NextRequest, NextResponse } from 'next/server';
import { lockStake, getActiveStake } from '@/lib/services/staking-service';

/**
 * POST /api/stake/lock
 *
 * Lock a stake for a transaction above current tier limit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, requestedLimit, category, captureId } = body;

    if (!agentId || !requestedLimit || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, requestedLimit, category' },
        { status: 400 }
      );
    }

    const result = await lockStake(agentId, requestedLimit, category, captureId);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      stake: result,
      message: `Stake locked! ${result.stakedAmount} points at risk for $${result.requestedLimit} ${result.category} transaction.`,
    });
  } catch (error) {
    console.error('Stake lock error:', error);
    return NextResponse.json(
      { error: 'Failed to lock stake' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stake/lock?agentId=xxx
 *
 * Get current active stake for agent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' },
        { status: 400 }
      );
    }

    const activeStake = await getActiveStake(agentId);

    return NextResponse.json({
      hasActiveStake: !!activeStake,
      stake: activeStake,
    });
  } catch (error) {
    console.error('Get stake error:', error);
    return NextResponse.json(
      { error: 'Failed to get stake' },
      { status: 500 }
    );
  }
}
