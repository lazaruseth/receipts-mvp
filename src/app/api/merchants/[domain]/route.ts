import { NextRequest, NextResponse } from 'next/server';
import { getMerchantProfile } from '@/lib/merchant-intelligence';

/**
 * GET /api/merchants/:domain
 *
 * Get a specific merchant's risk profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await params;

    const profile = getMerchantProfile(domain);

    if (!profile) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Merchant profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 });
  }
}
