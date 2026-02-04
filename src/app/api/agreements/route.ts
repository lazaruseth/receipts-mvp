import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgreements, createAgreement } from '@/lib/services/agreement-service';
import { getSession } from '@/lib/auth';
import type { RiskFlag } from '@/types';

// For MVP demo mode when no session
const DEMO_USER_ID = 'demo-user-1';

const querySchema = z.object({
  status: z.enum(['active', 'expired', 'disputed']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['capturedAt', 'merchantName', 'riskCount']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get session for authenticated user or use demo user
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const result = await getAgreements({
      userId,
      ...query,
    });

    return NextResponse.json({
      agreements: result.agreements,
      total: result.total,
    });
  } catch (error) {
    console.error('Error fetching agreements:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch agreements' }, { status: 500 });
  }
}

// Create a new agreement
const createAgreementSchema = z.object({
  merchantName: z.string().min(1),
  merchantCategory: z.string().min(1),
  sourceUrl: z.string().url(),
  rawText: z.string().min(50),
  documentTitle: z.string().min(1),
  extractedTerms: z.any(),
  riskFlags: z.array(z.string()),
  plainSummary: z.string(),
  agentId: z.string().optional(),
  blockchainTxId: z.string().optional(),
  termsHash: z.string().optional(),
  paoData: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get session for authenticated user or use demo user
    const session = await getSession();
    const userId = session?.user?.id || DEMO_USER_ID;

    const body = await request.json();
    const data = createAgreementSchema.parse(body);

    // Generate document hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.rawText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentHash = 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const newAgreement = await createAgreement({
      userId,
      agentId: data.agentId,
      merchantId: data.merchantName.toLowerCase().replace(/\s+/g, '-'),
      merchantName: data.merchantName,
      merchantCategory: data.merchantCategory,
      sourceUrl: data.sourceUrl,
      documentHash,
      rawText: data.rawText,
      documentTitle: data.documentTitle,
      extractedTerms: data.extractedTerms,
      riskFlags: data.riskFlags as RiskFlag[],
      plainSummary: data.plainSummary,
      blockchainTxId: data.blockchainTxId,
      termsHash: data.termsHash,
      paoData: data.paoData,
    });

    return NextResponse.json(newAgreement, { status: 201 });
  } catch (error) {
    console.error('Error creating agreement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create agreement' }, { status: 500 });
  }
}
