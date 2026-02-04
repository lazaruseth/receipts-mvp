import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getDisputes, createDispute } from '@/lib/services/dispute-service';
import type { Dispute } from '@/types';

const DEMO_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const disputes = await getDisputes(userId);

    return NextResponse.json({
      disputes,
      total: disputes.length,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

const createDisputeSchema = z.object({
  agreementId: z.string().min(1),
  issueType: z.enum(['cancelled', 'not_delivered', 'different_than_agreed', 'unauthorized', 'other']),
  description: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const body = await request.json();
    const { agreementId, issueType, description } = createDisputeSchema.parse(body);

    const dispute = await createDispute({
      agreementId,
      userId,
      issueType,
      description,
    });

    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error('Error creating dispute:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'Agreement not found') {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }
}
