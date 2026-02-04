import { NextRequest, NextResponse } from 'next/server';
import { getIntelFeed, type IntelType, type IntelSeverity } from '@/lib/intel-engine';
import { cacheGetOrSet, CacheKey, CacheTTL } from '@/lib/redis';

/**
 * GET /api/intel/feed
 *
 * Get the real-time agreement intelligence feed.
 * Shows ToS changes, risk spikes, dispute clusters, and more.
 * Results are cached for 30 seconds
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get('type') as IntelType | null;
    const severity = searchParams.get('severity') as IntelSeverity | null;
    const merchant = searchParams.get('merchant');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build cache key based on filters
    const cacheKeyParts = [
      CacheKey.intelFeed(),
      type || 'all',
      severity || 'all',
      merchant || 'all',
      category || 'all',
      String(limit),
    ];
    const cacheKey = cacheKeyParts.join(':');

    const feed = await cacheGetOrSet(
      cacheKey,
      () =>
        Promise.resolve(
          getIntelFeed({
            type: type || undefined,
            severity: severity || undefined,
            merchant: merchant || undefined,
            category: category || undefined,
            limit,
          })
        ),
      CacheTTL.INTEL_FEED
    );

    return NextResponse.json(feed);
  } catch (error) {
    console.error('Intel feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intel feed' },
      { status: 500 }
    );
  }
}
