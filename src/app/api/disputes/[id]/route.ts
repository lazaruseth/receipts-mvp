import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDisputeById, updateDisputeStatus } from '@/lib/services/dispute-service';
import type { Dispute } from '@/types';

// Demo user ID for unauthenticated access
const DEMO_USER_ID = 'demo-user-123';

/**
 * GET /api/disputes/[id]
 * Fetch a single dispute by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || DEMO_USER_ID;
    const { id: disputeId } = await params;

    const dispute = await getDisputeById(disputeId, userId);

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispute' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/disputes/[id]
 * Update dispute status, resolution, etc.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || DEMO_USER_ID;
    const { id: disputeId } = await params;

    const body = await request.json();
    const { status, submittedTo, resolution } = body;

    // Validate status if provided
    const validStatuses: Dispute['status'][] = ['draft', 'submitted', 'in_review', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // First check if dispute exists
    const existingDispute = await getDisputeById(disputeId, userId);
    if (!existingDispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    const updatedDispute = await updateDisputeStatus(
      disputeId,
      userId,
      status || existingDispute.status,
      submittedTo,
      resolution
    );

    if (!updatedDispute) {
      return NextResponse.json(
        { error: 'Failed to update dispute' },
        { status: 500 }
      );
    }

    return NextResponse.json({ dispute: updatedDispute });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
}
