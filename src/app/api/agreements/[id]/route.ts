import { NextRequest, NextResponse } from 'next/server';
import { getAgreementById, updateAgreementStatus } from '@/lib/services/agreement-service';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const DEMO_USER_ID = 'demo-user-1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session for authenticated user or use demo user
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const agreement = await getAgreementById(id, userId);

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error fetching agreement:', error);
    return NextResponse.json({ error: 'Failed to fetch agreement' }, { status: 500 });
  }
}

const updateSchema = z.object({
  status: z.enum(['active', 'expired', 'disputed']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session for authenticated user or use demo user
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const body = await request.json();
    const data = updateSchema.parse(body);

    if (!data.status) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    const updated = await updateAgreementStatus(id, userId, data.status);

    if (!updated) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating agreement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update agreement' }, { status: 500 });
  }
}
