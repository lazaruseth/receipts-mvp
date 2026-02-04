import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPolicy, updatePolicy, deletePolicy } from '@/lib/services/policy-service';

const DEMO_USER_ID = 'demo-user-1';

/**
 * GET /api/policies
 *
 * Get the current user's policy settings.
 * Returns default policy if no custom policy is set.
 */
export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const policy = await getPolicy(userId);

    return NextResponse.json({
      policy,
      isDefault: policy?.isDefault ?? true,
      message: policy?.isDefault
        ? 'Using default policy'
        : 'Custom policy loaded',
    });
  } catch (error) {
    console.error('Policy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/policies
 *
 * Update the user's policy settings.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const body = await request.json();

    // Validate required fields
    if (body.maxSpendPerTx !== undefined && (typeof body.maxSpendPerTx !== 'number' || body.maxSpendPerTx < 0)) {
      return NextResponse.json(
        { error: 'Invalid maxSpendPerTx value' },
        { status: 400 }
      );
    }

    const updated = await updatePolicy(userId, {
      name: body.name,
      forbiddenClauses: body.forbiddenClauses,
      maxSpendPerTx: body.maxSpendPerTx,
      maxSpendPerDay: body.maxSpendPerDay,
      maxSpendPerMonth: body.maxSpendPerMonth,
      minRefundWindowHours: body.minRefundWindowHours,
      requireChargebackRights: body.requireChargebackRights,
      allowedCategories: body.allowedCategories,
      blockedCategories: body.blockedCategories,
      allowedMerchants: body.allowedMerchants,
      blockedMerchants: body.blockedMerchants,
      requireApprovalAbove: body.requireApprovalAbove,
      requireApprovalFor: body.requireApprovalFor,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      policy: updated,
      message: 'Policy updated successfully',
    });
  } catch (error) {
    console.error('Policy update error:', error);
    return NextResponse.json(
      { error: 'Failed to update policy' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/policies
 *
 * Reset to default policy.
 */
export async function DELETE() {
  try {
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    await deletePolicy(userId);

    // Get the new default policy
    const defaultPolicy = await getPolicy(userId);

    return NextResponse.json({
      policy: defaultPolicy,
      message: 'Policy reset to defaults',
    });
  } catch (error) {
    console.error('Policy reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset policy' },
      { status: 500 }
    );
  }
}
