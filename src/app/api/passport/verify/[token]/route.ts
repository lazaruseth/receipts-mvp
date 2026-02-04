import { NextRequest, NextResponse } from 'next/server';
import {
  decodePassportToken,
  verifyPassport,
  getPassportStatus,
  checkPassportAccess,
} from '@/lib/passport';

/**
 * GET /api/passport/verify/[token]
 *
 * Verify an Agent Trust Passport.
 * Merchants use this endpoint to validate an agent's credentials.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Decode the passport from token
    const passport = decodePassportToken(token);

    if (!passport) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid passport token - could not decode',
        },
        { status: 400 }
      );
    }

    // Verify the passport
    const verification = verifyPassport(passport);

    if (!verification.valid) {
      return NextResponse.json({
        valid: false,
        expired: verification.expired,
        tampered: verification.tampered,
        error: verification.error,
        passport: verification.passport ? {
          agentId: verification.passport.agentId,
          agentName: verification.passport.agentName,
          trustScore: verification.passport.trustScore,
          tier: verification.passport.tier,
        } : null,
      });
    }

    // Get status
    const status = getPassportStatus(passport);

    // Check optional tier requirements from query params
    const minTier = parseInt(request.nextUrl.searchParams.get('minTier') || '0');
    const minScore = parseInt(request.nextUrl.searchParams.get('minScore') || '0');

    let accessCheck = null;
    if (minTier > 0 || minScore > 0) {
      accessCheck = checkPassportAccess(passport, { minTier, minScore });
    }

    return NextResponse.json({
      valid: true,
      status: status.status,
      statusMessage: status.message,
      hoursRemaining: Math.round(status.hoursRemaining * 10) / 10,

      // Agent credentials
      agent: {
        id: passport.agentId,
        name: passport.agentName,
        trustScore: passport.trustScore,
        tier: passport.tier,
        tierName: passport.tierName,
      },

      // Track record
      trackRecord: {
        agreementCount: passport.agreementCount,
        disputeWinRate: passport.disputeWinRate,
        complianceRate: passport.complianceRate,
        violationCount: passport.violationCount,
      },

      // Achievements
      badges: passport.badges,
      badgeCount: passport.badges.length,

      // Timestamps
      issuedAt: passport.issuedAt,
      expiresAt: passport.expiresAt,

      // Access check (if requirements provided)
      accessCheck: accessCheck ? {
        granted: accessCheck.granted,
        reason: accessCheck.reason,
        upgradeNeeded: accessCheck.upgradeNeeded,
      } : null,

      // Verification metadata
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'REMASTER Agreement Rail',
    });
  } catch (error) {
    console.error('Passport verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify passport' },
      { status: 500 }
    );
  }
}
