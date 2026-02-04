import { NextRequest, NextResponse } from 'next/server';
import { getSession, createApiKey, listApiKeys } from '@/lib/auth';

/**
 * GET /api/keys
 * List all API keys for the authenticated user
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const keys = await listApiKeys(session.user.id);

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, scopes, expiresInDays } = body;

    // Check key limit based on subscription tier
    const existingKeys = await listApiKeys(session.user.id);
    const keyLimits: Record<string, number> = {
      free: 2,
      pro: 10,
      scale: 50,
      enterprise: 1000,
    };
    const limit = keyLimits[session.user.subscriptionTier] || 2;

    if (existingKeys.length >= limit) {
      return NextResponse.json(
        {
          error: `API key limit reached (${limit} keys for ${session.user.subscriptionTier} tier). Upgrade your plan or revoke existing keys.`
        },
        { status: 403 }
      );
    }

    const { id, rawKey, keyPrefix } = await createApiKey(
      session.user.id,
      name || 'API Key',
      scopes || ['read', 'write'],
      expiresInDays
    );

    return NextResponse.json({
      id,
      key: rawKey, // ⚠️ Only shown once!
      prefix: keyPrefix,
      message: 'Save this key now - you will not be able to see it again!',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
