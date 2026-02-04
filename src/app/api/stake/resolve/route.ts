import { NextRequest, NextResponse } from 'next/server';
import { resolveStake, getStakingStats } from '@/lib/services/staking-service';

/**
 * POST /api/stake/resolve
 *
 * Resolve an active stake after transaction completes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stakeId, outcome } = body;

    if (!stakeId || !outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: stakeId, outcome' },
        { status: 400 }
      );
    }

    const validOutcomes = ['success', 'dispute_won', 'dispute_lost'];
    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json(
        { error: `Invalid outcome. Valid values: ${validOutcomes.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await resolveStake(stakeId, outcome);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const outcomeMessages = {
      success: `Stake resolved successfully! You earned +${result.outcome?.bonusEarned} points.`,
      dispute_won: `Dispute won! You earned +${result.outcome?.bonusEarned} points (including bonus for winning).`,
      dispute_lost: `Dispute lost. You lost ${Math.abs(result.outcome?.scoreChange || 0)} points.`,
    };

    return NextResponse.json({
      success: true,
      stake: result,
      message: outcomeMessages[outcome as keyof typeof outcomeMessages],
    });
  } catch (error) {
    console.error('Stake resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve stake' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stake/resolve?agentId=xxx
 *
 * Get staking stats/history for agent
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

    const stats = await getStakingStats(agentId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get staking stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get staking stats' },
      { status: 500 }
    );
  }
}
