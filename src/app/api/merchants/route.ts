import { NextRequest, NextResponse } from 'next/server';
import {
  getMerchantProfiles,
  searchMerchants,
  getMerchantStats,
} from '@/lib/merchant-intelligence';

/**
 * GET /api/merchants
 *
 * Get all merchants or search by query
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    const includeStats = request.nextUrl.searchParams.get('stats') === 'true';

    let merchants;

    if (query) {
      merchants = searchMerchants(query);
    } else {
      merchants = getMerchantProfiles();
    }

    const response: {
      merchants: typeof merchants;
      count: number;
      stats?: ReturnType<typeof getMerchantStats>;
    } = {
      merchants,
      count: merchants.length,
    };

    if (includeStats) {
      response.stats = getMerchantStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Merchants fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
  }
}
