import { NextRequest, NextResponse } from 'next/server';
import {
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  getDeliveries,
} from '@/lib/webhook-dispatcher';

/**
 * GET /api/webhooks/[webhookId]
 *
 * Get webhook details and recent deliveries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;
    const webhook = getWebhookById(webhookId);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const deliveries = getDeliveries(webhookId);

    return NextResponse.json({
      webhook,
      deliveries: deliveries.slice(0, 20),
    });
  } catch (error) {
    console.error('Webhook fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
  }
}

/**
 * PATCH /api/webhooks/[webhookId]
 *
 * Update webhook settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;
    const body = await request.json();

    const webhook = getWebhookById(webhookId);
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Handle special actions
    if (body.action === 'regenerate_secret') {
      const updated = regenerateSecret(webhookId);
      return NextResponse.json(updated);
    }

    // Normal update
    const { name, url, events, isActive } = body;
    const updated = updateWebhook(webhookId, { name, url, events, isActive });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/[webhookId]
 *
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;

    const webhook = getWebhookById(webhookId);
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    deleteWebhook(webhookId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook delete error:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
