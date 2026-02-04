import { NextRequest, NextResponse } from 'next/server';
import { getNetworkMerchants, getNetworkStats } from '@/lib/merchant-network';

/**
 * GET /api/network/merchants
 *
 * List all merchants in the RECEIPTS Acceptance Network.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get('category');
    const minTier = searchParams.get('minTier');
    const sortBy = searchParams.get('sortBy') as 'name' | 'totalAgents' | 'avgSatisfaction' | 'joinedAt' | null;

    const merchants = getNetworkMerchants({
      category: category || undefined,
      minTier: minTier ? parseInt(minTier) : undefined,
      sortBy: sortBy || 'totalAgents',
    });

    const stats = getNetworkStats();

    return NextResponse.json({
      merchants,
      stats,
      totalResults: merchants.length,
    });
  } catch (error) {
    console.error('Network merchants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network merchants' },
      { status: 500 }
    );
  }
}
