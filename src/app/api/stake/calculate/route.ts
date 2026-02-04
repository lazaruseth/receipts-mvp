import { NextRequest, NextResponse } from 'next/server';
import { calculateStake } from '@/lib/services/staking-service';

/**
 * POST /api/stake/calculate
 *
 * Calculate stake requirements for a transaction above current tier limit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, requestedLimit, category } = body;

    if (!agentId || !requestedLimit || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, requestedLimit, category' },
        { status: 400 }
      );
    }

    const calculation = await calculateStake(agentId, requestedLimit, category);

    if (!calculation) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(calculation);
  } catch (error) {
    console.error('Stake calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stake' },
      { status: 500 }
    );
  }
}
