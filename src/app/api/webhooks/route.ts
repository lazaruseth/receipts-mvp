import { NextRequest, NextResponse } from 'next/server';
import {
  getWebhooks,
  createWebhook,
  EVENT_TYPES,
  WebhookEventType,
} from '@/lib/webhook-dispatcher';

/**
 * GET /api/webhooks
 *
 * List all webhooks for the current user
 */
export async function GET() {
  try {
    // In production, get userId from session
    const userId = 'user_demo';
    const webhooks = getWebhooks(userId);

    return NextResponse.json({
      webhooks,
      eventTypes: EVENT_TYPES,
    });
  } catch (error) {
    console.error('Webhook list error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

/**
 * POST /api/webhooks
 *
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, events } = body;

    // Validate required fields
    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Name, URL, and at least one event are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate events
    const validEvents = Object.keys(EVENT_TYPES) as WebhookEventType[];
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEventType));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid event types: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // In production, get userId from session
    const userId = 'user_demo';
    const webhook = createWebhook(userId, { name, url, events });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Webhook create error:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
