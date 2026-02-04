import { NextRequest, NextResponse } from 'next/server';
import {
  dispatchEvent,
  getSamplePayload,
  WebhookEventType,
  EVENT_TYPES,
} from '@/lib/webhook-dispatcher';

/**
 * POST /api/webhooks/test
 *
 * Test webhook delivery with a sample event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType } = body;

    // Validate event type
    const validEvents = Object.keys(EVENT_TYPES) as WebhookEventType[];
    if (!eventType || !validEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Valid types: ${validEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate sample event
    const event = getSamplePayload(eventType);

    // Dispatch to all matching webhooks (simulated for demo)
    const userId = 'user_demo';
    const result = await dispatchEvent(userId, event);

    return NextResponse.json({
      success: true,
      event,
      delivery: {
        sent: result.sent,
        failed: result.failed,
      },
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Failed to test webhook' }, { status: 500 });
  }
}
