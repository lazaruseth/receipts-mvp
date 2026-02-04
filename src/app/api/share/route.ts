import { NextRequest, NextResponse } from 'next/server';
import { DEMO_AGREEMENTS } from '@/lib/demo-data';
import crypto from 'crypto';

// In-memory storage for MVP (would use database in production)
const sharedClauses = new Map<
  string,
  {
    id: string;
    shareToken: string;
    agreementId: string;
    merchantName: string;
    clauseType: string;
    clauseExcerpt: string;
    userComment?: string;
    riskFlags: string[];
    plainSummary: string;
    viewCount: number;
    createdAt: string;
  }
>();

// Generate URL-safe share token
function generateShareToken(): string {
  return crypto.randomBytes(8).toString('base64url');
}

/**
 * POST /api/share
 * Create a shareable clause highlight
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agreementId, clauseType, clauseExcerpt, userComment } = body;

    if (!agreementId || !clauseType) {
      return NextResponse.json(
        { error: 'agreementId and clauseType are required' },
        { status: 400 }
      );
    }

    // Find the agreement
    const agreement = DEMO_AGREEMENTS.find((a) => a.id === agreementId);
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Create share record
    const shareToken = generateShareToken();
    const shareId = `share_${crypto.randomUUID().slice(0, 8)}`;

    const sharedClause = {
      id: shareId,
      shareToken,
      agreementId,
      merchantName: agreement.merchantName,
      clauseType,
      clauseExcerpt: clauseExcerpt || getDefaultExcerpt(agreement, clauseType),
      userComment,
      riskFlags: agreement.riskFlags,
      plainSummary: agreement.plainSummary,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    sharedClauses.set(shareToken, sharedClause);

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl: `/caught/${shareToken}`,
      shareData: sharedClause,
    });
  } catch (error) {
    console.error('Share creation error:', error);
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
  }
}

/**
 * GET /api/share?token=xxx
 * Retrieve a shared clause by token
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Share token required' }, { status: 400 });
  }

  // First check in-memory storage
  let sharedClause = sharedClauses.get(token);

  // If not found, generate from demo data for demo tokens
  if (!sharedClause && token.startsWith('demo-')) {
    const demoId = token.replace('demo-', '');
    const demoAgreement = DEMO_AGREEMENTS.find((a) => a.id === `demo-${demoId}` || a.id === demoId);

    if (demoAgreement && demoAgreement.riskFlags.length > 0) {
      const primaryFlag = demoAgreement.riskFlags[0];
      sharedClause = {
        id: `demo_share_${demoId}`,
        shareToken: token,
        agreementId: demoAgreement.id,
        merchantName: demoAgreement.merchantName,
        clauseType: primaryFlag,
        clauseExcerpt: getDefaultExcerpt(demoAgreement, primaryFlag),
        userComment: 'Found this in their terms - watch out!',
        riskFlags: demoAgreement.riskFlags,
        plainSummary: demoAgreement.plainSummary,
        viewCount: Math.floor(Math.random() * 500) + 50,
        createdAt: demoAgreement.capturedAt.toISOString(),
      };
    }
  }

  if (!sharedClause) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  // Increment view count
  sharedClause.viewCount++;

  return NextResponse.json({
    success: true,
    share: sharedClause,
  });
}

// Helper to extract relevant clause text from agreement
function getDefaultExcerpt(
  agreement: (typeof DEMO_AGREEMENTS)[0],
  clauseType: string
): string {
  const excerpts: Record<string, string> = {
    BINDING_ARBITRATION:
      'ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THIS CONTRACT SHALL BE RESOLVED EXCLUSIVELY BY BINDING ARBITRATION.',
    CLASS_ACTION_WAIVER:
      'You waive any right to participate in a class action lawsuit or class-wide arbitration.',
    CHARGEBACK_WAIVER:
      'You agree not to initiate any chargeback or payment dispute with your financial institution for fees properly charged under this Agreement.',
    AUTO_RENEWAL_HIDDEN:
      'YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW at the end of each subscription term unless you cancel.',
    NON_REFUNDABLE: 'All fees are non-refundable except as expressly set forth herein.',
    BROAD_INDEMNIFICATION:
      'You agree to indemnify, defend, and hold harmless the Company from any third-party claims arising from your use of the service.',
    DATA_SHARING_EXTENSIVE:
      'Your personal information may be shared with third parties, marketing partners, and affiliated companies.',
  };

  return excerpts[clauseType] || `Clause related to ${clauseType} found in agreement.`;
}
