import { NextRequest, NextResponse } from 'next/server';
import { getAgentLeaderboard, getLeaderboardStats } from '@/lib/services/agent-service';
import { cacheGetOrSet, CacheKey, CacheTTL } from '@/lib/redis';

/**
 * GET /api/agents/leaderboard
 *
 * Get agent leaderboard sorted by various criteria
 * Results are cached for 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') as
      | 'trust_score'
      | 'total_agreements'
      | 'disputes_won'
      | 'most_active'
      | null;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const validTypes = ['trust_score', 'total_agreements', 'disputes_won', 'most_active'];
    const leaderboardType = validTypes.includes(type || '')
      ? (type as 'trust_score' | 'total_agreements' | 'disputes_won' | 'most_active')
      : 'trust_score';

    // Use cache for leaderboard data
    const cacheKey = `${CacheKey.leaderboard(leaderboardType)}:${limit}`;
    const agents = await cacheGetOrSet(
      cacheKey,
      () => getAgentLeaderboard(leaderboardType, limit),
      CacheTTL.LEADERBOARD
    );

    // Use cache for stats
    const stats = await cacheGetOrSet(
      CacheKey.leaderboardStats(),
      getLeaderboardStats,
      CacheTTL.STATS
    );

    return NextResponse.json({
      agents,
      stats,
      type: leaderboardType,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
