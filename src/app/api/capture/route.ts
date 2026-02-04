import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CaptureResponse } from '@/types/pao';
import { requireAuth } from '@/lib/auth-helpers';
import { createCapture, findCaptureByHash, getCaptureById } from '@/lib/services/capture-service';

const captureRequestSchema = z.object({
  documentText: z.string().min(50, 'Document text must be at least 50 characters'),
  sourceUrl: z.string().url('Must be a valid URL'),
  merchantName: z.string().optional(),
  merchantDomain: z.string().optional(),
  agentId: z.string().min(1, 'Agent ID is required'),
  agentType: z.enum(['openclaw', 'claude-code', 'langchain', 'openai-assistants', 'autogpt', 'custom'] as const),
});

/**
 * POST /api/capture
 *
 * Capture an agreement artifact in real-time.
 * This is the first step in the Agreement Guard flow:
 * 1. Agent detects a ToS/terms page
 * 2. Agent calls this endpoint with the raw document
 * 3. We hash it, timestamp it, store it, and return a captureId
 * 4. Agent then calls /api/parse to extract structured terms
 *
 * AUTHENTICATION REQUIRED: API key (Bearer rmsm_xxx) or session
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth; // Return 401 response
    }
    const { userId } = auth;

    const body = await request.json();
    const data = captureRequestSchema.parse(body);

    // Generate document hash (SHA-256)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.documentText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentHash = 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Check for duplicate capture
    const existingCapture = await findCaptureByHash(documentHash, data.agentId);
    if (existingCapture) {
      console.log(`[Agreement Capture] Duplicate detected for agent ${data.agentId}`);
      console.log(`  Existing Capture ID: ${existingCapture.id}`);

      return NextResponse.json({
        captureId: existingCapture.id,
        documentHash: existingCapture.documentHash,
        timestamp: existingCapture.createdAt.toISOString(),
        status: existingCapture.status,
        duplicate: true,
        message: 'This document has already been captured',
      }, { status: 200 });
    }

    // Extract merchant domain from URL if not provided
    let merchantDomain = data.merchantDomain;
    if (!merchantDomain && data.sourceUrl) {
      try {
        merchantDomain = new URL(data.sourceUrl).hostname;
      } catch {
        // Ignore URL parsing errors
      }
    }

    // Create capture in database
    const capture = await createCapture({
      agentId: data.agentId,
      documentHash,
      sourceUrl: data.sourceUrl,
      merchantDomain,
      merchantName: data.merchantName,
      rawText: data.documentText,
    });

    const response: CaptureResponse = {
      captureId: capture.id,
      documentHash: capture.documentHash,
      timestamp: capture.createdAt.toISOString(),
      status: 'captured',
    };

    console.log(`[Agreement Capture] User ${userId} - Agent ${data.agentId} captured agreement from ${data.sourceUrl}`);
    console.log(`  Hash: ${documentHash}`);
    console.log(`  Capture ID: ${capture.id}`);
    console.log(`  Stored in database: true`);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Capture error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'failed',
          error: 'Invalid request: ' + error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to capture agreement',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/capture?captureId=xxx
 *
 * Retrieve a previously captured agreement by ID.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(request.url);
    const captureId = searchParams.get('captureId');

    if (!captureId) {
      return NextResponse.json(
        { error: 'captureId query parameter is required' },
        { status: 400 }
      );
    }

    const capture = await getCaptureById(captureId);

    if (!capture) {
      return NextResponse.json(
        { error: 'Capture not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      capture: {
        id: capture.id,
        agentId: capture.agentId,
        documentHash: capture.documentHash,
        sourceUrl: capture.sourceUrl,
        merchantName: capture.merchantName,
        merchantDomain: capture.merchantDomain,
        status: capture.status,
        termsHash: capture.termsHash,
        blockchainTxId: capture.blockchainTxId,
        createdAt: capture.createdAt.toISOString(),
        parsedAt: capture.parsedAt?.toISOString() || null,
        anchoredAt: capture.anchoredAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get capture error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve capture' },
      { status: 500 }
    );
  }
}
