import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openai, CHAT_SYSTEM_PROMPT } from '@/lib/openai';
import { getDemoAgreements } from '@/lib/demo-data';

const DEMO_USER_ID = 'demo-user-1';

const chatRequestSchema = z.object({
  message: z.string().min(1),
  agreementId: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

// Mock responses for demo without API key
const MOCK_RESPONSES: Record<string, string> = {
  refund:
    "Based on the agreement terms, you have a conditional refund policy. You can get a full refund if you cancel within 24 hours of booking. After that, the fare rules apply and a $200 change fee may be charged. For specific situations, I'd recommend checking the exact fare rules for your ticket type.",
  cancel:
    "You can cancel your booking, but the terms depend on timing. Within 24 hours of booking, you get a full refund. After that, cancellation fees apply - typically $200 for this type of agreement. Make sure to cancel at least 2 hours before departure to avoid being marked as a no-show.",
  arbitration:
    "This agreement includes a binding arbitration clause. This means if you have a dispute with the merchant, you cannot sue them in court - instead, you must go through arbitration. You've also waived your right to join class action lawsuits. This is a significant limitation of your legal rights.",
  data: "According to the data usage terms, your personal information is shared with third parties including partner airlines for marketing purposes. Your data is retained for 7 years. The agreement allows them to use your data for marketing, analytics, and sharing with affiliated companies.",
  default:
    "I've reviewed the agreement terms. Could you be more specific about what you'd like to know? I can help explain refund policies, cancellation terms, dispute resolution procedures, data usage, or any specific clause you're concerned about.",
};

function getMockResponse(message: string): string {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('refund')) return MOCK_RESPONSES.refund;
  if (messageLower.includes('cancel')) return MOCK_RESPONSES.cancel;
  if (messageLower.includes('arbitration') || messageLower.includes('sue') || messageLower.includes('lawsuit'))
    return MOCK_RESPONSES.arbitration;
  if (messageLower.includes('data') || messageLower.includes('privacy') || messageLower.includes('share'))
    return MOCK_RESPONSES.data;

  return MOCK_RESPONSES.default;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, agreementId, history } = chatRequestSchema.parse(body);

    // Get the agreement
    const agreements = getDemoAgreements(DEMO_USER_ID);
    const agreement = agreements.find((a) => a.id === agreementId);

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        response: getMockResponse(message),
        citations: ['Agreement Summary', 'Extracted Terms'],
      });
    }

    // Build context about the agreement
    const agreementContext = `
Agreement Details:
- Merchant: ${agreement.merchantName} (${agreement.merchantCategory})
- Document: ${agreement.documentTitle}
- Captured: ${new Date(agreement.capturedAt).toLocaleDateString()}

Summary: ${agreement.plainSummary}

Key Terms:
- Refund Policy: ${JSON.stringify(agreement.extractedTerms.refundPolicy)}
- Cancellation: ${JSON.stringify(agreement.extractedTerms.cancellationPolicy)}
- Dispute Resolution: ${JSON.stringify(agreement.extractedTerms.disputeResolution)}
- Auto-Renewal: ${JSON.stringify(agreement.extractedTerms.autoRenewal)}
- Data Usage: ${JSON.stringify(agreement.extractedTerms.dataUsage)}
- Liability: ${JSON.stringify(agreement.extractedTerms.liability)}

Risk Flags: ${agreement.riskFlags.join(', ')}
    `.trim();

    // Build conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: `${CHAT_SYSTEM_PROMPT}\n\nHere is the agreement the user is asking about:\n\n${agreementContext}`,
      },
    ];

    // Add history
    if (history) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

    return NextResponse.json({
      response,
      citations: ['Agreement Terms', agreement.documentTitle],
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}
