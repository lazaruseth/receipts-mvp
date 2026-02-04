import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openai, EXTRACTION_SYSTEM_PROMPT } from '@/lib/openai';
import { extractedTermsToPAO } from '@/lib/pao';
import { validatePolicy, getDemoPolicy } from '@/lib/policy-engine';
import { getDemoAgent } from '@/lib/trust-score';
import { requireAuth } from '@/lib/auth-helpers';
import type { ExtractedTerms, RiskFlag, ParsedAgreementResponse } from '@/types';
import type { PAO, ParseResponseWithPAO, AgentType } from '@/types/pao';

const parseRequestSchema = z.object({
  documentText: z.string().min(50, 'Document text must be at least 50 characters'),
  merchantName: z.string().optional(),
  sourceUrl: z.string().url().optional(),

  // New fields for PAO generation
  returnPAO: z.boolean().optional().default(false),
  agentId: z.string().optional(),
  agentType: z.enum(['openclaw', 'claude-code', 'langchain', 'openai-assistants', 'autogpt', 'custom'] as const).optional(),
  validatePolicy: z.boolean().optional().default(false),
  userId: z.string().optional(), // For policy lookup
});

// Mock response for demo/development without API key
const getMockResponse = (merchantName?: string): { extractedTerms: ExtractedTerms; riskFlags: RiskFlag[]; plainSummary: string } => ({
  extractedTerms: {
    refundPolicy: {
      type: 'conditional',
      window: '24 hours',
      conditions: ['Must cancel more than 24 hours before service', 'No refund for used portions'],
    },
    cancellationPolicy: {
      fee: 50,
      feeType: 'flat',
      window: '24 hours',
      conditions: ['Fee waived for cancellations more than 7 days in advance'],
    },
    disputeResolution: {
      method: 'arbitration',
      jurisdiction: 'Delaware, USA',
      classActionWaiver: true,
      chargebackRightsPreserved: false,
    },
    autoRenewal: {
      enabled: false,
    },
    dataUsage: {
      thirdPartySharing: true,
      retentionPeriod: '3 years',
      purposes: ['Marketing', 'Analytics', 'Service improvement'],
    },
    liability: {
      limitations: ['Not liable for indirect damages', 'Maximum liability limited to purchase price'],
      indemnification: true,
      maxLiability: 'Amount paid for service',
    },
    priceTerms: {
      priceGuarantee: false,
      dynamicPricing: true,
    },
  },
  riskFlags: [
    'BINDING_ARBITRATION',
    'CLASS_ACTION_WAIVER',
    'CHARGEBACK_WAIVER',
    'BROAD_INDEMNIFICATION',
    'DATA_SHARING_EXTENSIVE',
  ],
  plainSummary: `This agreement with ${merchantName || 'the merchant'} includes binding arbitration (you cannot sue in court), waives your right to join class actions, and may limit your chargeback rights. Data is shared with third parties for marketing. Cancellation is possible within 24 hours but may incur a $50 fee.`,
});

/**
 * POST /api/parse
 *
 * Parse agreement text and extract structured terms using GPT-4.
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
    const { userId: authenticatedUserId } = auth;

    const body = await request.json();
    const {
      documentText,
      merchantName,
      sourceUrl,
      returnPAO,
      agentId,
      agentType,
      validatePolicy: shouldValidate,
      userId, // Optional override for policy lookup
    } = parseRequestSchema.parse(body);

    // Use authenticated user ID, falling back to provided userId for policy lookup
    const effectiveUserId = authenticatedUserId || userId;

    let extractedTerms: ExtractedTerms;
    let riskFlags: RiskFlag[];
    let plainSummary: string;

    // Check if we have an API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key - returning mock response');
      const mock = getMockResponse(merchantName);
      extractedTerms = mock.extractedTerms;
      riskFlags = mock.riskFlags;
      plainSummary = mock.plainSummary;
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: EXTRACTION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Please analyze the following legal agreement${merchantName ? ` from ${merchantName}` : ''}${sourceUrl ? ` (source: ${sourceUrl})` : ''}:\n\n---\n\n${documentText}\n\n---\n\nExtract the structured terms, identify risk flags, and provide a plain English summary.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(responseText);
      extractedTerms = parsed.extractedTerms as ExtractedTerms;
      riskFlags = parsed.riskFlags as RiskFlag[];
      plainSummary = parsed.plainSummary as string;
    }

    // Build base response
    const response: ParseResponseWithPAO = {
      success: true,
      extractedTerms,
      riskFlags,
      plainSummary,
    };

    // Generate PAO if requested
    if (returnPAO) {
      const counterparty = merchantName || (sourceUrl ? new URL(sourceUrl).hostname : 'unknown');

      const pao = await extractedTermsToPAO(extractedTerms, riskFlags, {
        principal: agentId || 'anonymous',
        counterparty,
        sourceUrl: sourceUrl || 'unknown',
        capturedAt: new Date(),
      });

      response.pao = pao;

      // Validate against policy if requested
      if (shouldValidate && agentId) {
        // In production, fetch user's policy from database
        // For demo, use default policy
        const policy = getDemoPolicy(effectiveUserId || 'demo-user');
        const agent = getDemoAgent(agentId);

        const validationResult = validatePolicy(pao, policy, agent.trustScore);
        response.policyResult = validationResult;

        // Log for demo purposes
        console.log(`[Agreement Parse] Agent ${agentId} parsed agreement from ${counterparty}`);
        console.log(`  PAO Hash: ${pao.termsHash}`);
        console.log(`  Risk Flags: ${riskFlags.join(', ')}`);
        console.log(`  Policy Result: ${validationResult.recommendation}`);
        if (validationResult.violations.length > 0) {
          console.log(`  Violations: ${validationResult.violations.map((v) => v.rule).join(', ')}`);
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Parse error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse document',
      },
      { status: 500 }
    );
  }
}
