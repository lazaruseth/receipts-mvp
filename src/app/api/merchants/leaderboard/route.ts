import { NextRequest, NextResponse } from 'next/server';
import { getMerchantLeaderboard } from '@/lib/merchant-intelligence';

/**
 * GET /api/merchants/leaderboard
 *
 * Get merchant leaderboard by type
 */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') as
      | 'safest'
      | 'riskiest'
      | 'most_disputes'
      | 'trending'
      | null;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const validTypes = ['safest', 'riskiest', 'most_disputes', 'trending'];
    const leaderboardType = validTypes.includes(type || '') ? type! : 'riskiest';

    const leaderboard = getMerchantLeaderboard(leaderboardType, limit);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
