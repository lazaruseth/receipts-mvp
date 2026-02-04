/**
 * Webhook Dispatcher for REMASTER
 *
 * Handles webhook registration, event dispatch, and integrations.
 */

import crypto from 'crypto';

// Event types
export type WebhookEventType =
  | 'agreement.captured'
  | 'agreement.flagged'
  | 'policy.violation'
  | 'dispute.created'
  | 'dispute.resolved'
  | 'trust.tier_changed';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  failureCount: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: WebhookEvent;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  responseBody?: string;
  attemptCount: number;
  createdAt: string;
  completedAt?: string;
}

// Event type descriptions
export const EVENT_TYPES: Record<WebhookEventType, { name: string; description: string }> = {
  'agreement.captured': {
    name: 'Agreement Captured',
    description: 'Fired when a new agreement is captured',
  },
  'agreement.flagged': {
    name: 'Agreement Flagged',
    description: 'Fired when high-risk flags are detected in an agreement',
  },
  'policy.violation': {
    name: 'Policy Violation',
    description: 'Fired when an agent violates a user-defined policy',
  },
  'dispute.created': {
    name: 'Dispute Created',
    description: 'Fired when a new dispute is filed',
  },
  'dispute.resolved': {
    name: 'Dispute Resolved',
    description: 'Fired when a dispute is resolved',
  },
  'trust.tier_changed': {
    name: 'Trust Tier Changed',
    description: 'Fired when an agent moves to a different trust tier',
  },
};

// In-memory storage for demo
const webhooks: Map<string, Webhook> = new Map();
const deliveries: Map<string, WebhookDelivery[]> = new Map();

// Initialize with demo webhooks
function initDemoWebhooks() {
  if (webhooks.size === 0) {
    const demoWebhooks: Webhook[] = [
      {
        id: 'webhook_1',
        userId: 'user_demo',
        name: 'Slack Alerts',
        url: 'https://hooks.slack.com/services/DEMO/WEBHOOK',
        secret: generateSecret(),
        events: ['agreement.flagged', 'policy.violation'],
        isActive: true,
        createdAt: '2024-06-01T00:00:00Z',
        lastTriggeredAt: '2024-06-15T10:30:00Z',
        failureCount: 0,
      },
      {
        id: 'webhook_2',
        userId: 'user_demo',
        name: 'Discord Bot',
        url: 'https://discord.com/api/webhooks/DEMO',
        secret: generateSecret(),
        events: ['dispute.created', 'dispute.resolved'],
        isActive: true,
        createdAt: '2024-06-05T00:00:00Z',
        failureCount: 0,
      },
      {
        id: 'webhook_3',
        userId: 'user_demo',
        name: 'Analytics Endpoint',
        url: 'https://api.example.com/remaster-events',
        secret: generateSecret(),
        events: ['agreement.captured'],
        isActive: false,
        createdAt: '2024-06-10T00:00:00Z',
        failureCount: 3,
      },
    ];

    demoWebhooks.forEach(w => webhooks.set(w.id, w));
  }
}

// Helper functions
export function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

export function generateWebhookId(): string {
  return `webhook_${crypto.randomBytes(8).toString('hex')}`;
}

export function generateEventId(): string {
  return `evt_${crypto.randomBytes(12).toString('hex')}`;
}

export function generateDeliveryId(): string {
  return `del_${crypto.randomBytes(8).toString('hex')}`;
}

// Sign webhook payload
export function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// CRUD operations
export function getWebhooks(userId: string): Webhook[] {
  initDemoWebhooks();
  return Array.from(webhooks.values()).filter(w => w.userId === userId);
}

export function getWebhookById(webhookId: string): Webhook | undefined {
  initDemoWebhooks();
  return webhooks.get(webhookId);
}

export function createWebhook(
  userId: string,
  data: { name: string; url: string; events: WebhookEventType[] }
): Webhook {
  initDemoWebhooks();
  const webhook: Webhook = {
    id: generateWebhookId(),
    userId,
    name: data.name,
    url: data.url,
    secret: generateSecret(),
    events: data.events,
    isActive: true,
    createdAt: new Date().toISOString(),
    failureCount: 0,
  };
  webhooks.set(webhook.id, webhook);
  return webhook;
}

export function updateWebhook(
  webhookId: string,
  data: Partial<{ name: string; url: string; events: WebhookEventType[]; isActive: boolean }>
): Webhook | null {
  const webhook = webhooks.get(webhookId);
  if (!webhook) return null;

  const updated = { ...webhook, ...data };
  webhooks.set(webhookId, updated);
  return updated;
}

export function deleteWebhook(webhookId: string): boolean {
  return webhooks.delete(webhookId);
}

export function regenerateSecret(webhookId: string): Webhook | null {
  const webhook = webhooks.get(webhookId);
  if (!webhook) return null;

  webhook.secret = generateSecret();
  webhooks.set(webhookId, webhook);
  return webhook;
}

// Get recent deliveries for a webhook
export function getDeliveries(webhookId: string): WebhookDelivery[] {
  return deliveries.get(webhookId) || [];
}

// Create a webhook event (for demo/testing)
export function createEvent(type: WebhookEventType, data: Record<string, unknown>): WebhookEvent {
  return {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

// Dispatch event to all matching webhooks (simulated for demo)
export async function dispatchEvent(
  userId: string,
  event: WebhookEvent
): Promise<{ sent: number; failed: number }> {
  initDemoWebhooks();
  const userWebhooks = getWebhooks(userId).filter(
    w => w.isActive && w.events.includes(event.type)
  );

  let sent = 0;
  let failed = 0;

  for (const webhook of userWebhooks) {
    const delivery: WebhookDelivery = {
      id: generateDeliveryId(),
      webhookId: webhook.id,
      eventType: event.type,
      payload: event,
      status: 'pending',
      attemptCount: 1,
      createdAt: new Date().toISOString(),
    };

    // Simulate delivery (in production, this would make actual HTTP requests)
    const success = Math.random() > 0.1; // 90% success rate for demo
    delivery.status = success ? 'success' : 'failed';
    delivery.statusCode = success ? 200 : 500;
    delivery.completedAt = new Date().toISOString();

    if (success) {
      sent++;
      webhook.lastTriggeredAt = new Date().toISOString();
    } else {
      failed++;
      webhook.failureCount++;
    }

    // Store delivery
    const webhookDeliveries = deliveries.get(webhook.id) || [];
    webhookDeliveries.unshift(delivery);
    deliveries.set(webhook.id, webhookDeliveries.slice(0, 50)); // Keep last 50

    webhooks.set(webhook.id, webhook);
  }

  return { sent, failed };
}

// Generate sample event payloads
export function getSamplePayload(eventType: WebhookEventType): WebhookEvent {
  const samples: Record<WebhookEventType, Record<string, unknown>> = {
    'agreement.captured': {
      agreement_id: 'agr_abc123',
      merchant: 'acme.com',
      agent_id: 'agent_xyz',
      risk_score: 45,
      flags: ['BINDING_ARBITRATION', 'AUTO_RENEWAL_HIDDEN'],
    },
    'agreement.flagged': {
      agreement_id: 'agr_abc123',
      merchant: 'acme.com',
      high_risk_flags: ['CHARGEBACK_WAIVER', 'BROAD_INDEMNIFICATION'],
      recommended_action: 'review_required',
    },
    'policy.violation': {
      agreement_id: 'agr_abc123',
      agent_id: 'agent_xyz',
      policy_id: 'pol_no_arbitration',
      violation_type: 'clause_prohibited',
      clause: 'BINDING_ARBITRATION',
    },
    'dispute.created': {
      dispute_id: 'dsp_def456',
      agreement_id: 'agr_abc123',
      merchant: 'acme.com',
      reason: 'service_not_delivered',
      evidence_count: 3,
    },
    'dispute.resolved': {
      dispute_id: 'dsp_def456',
      outcome: 'won',
      resolution: 'full_refund',
      amount: 149.99,
    },
    'trust.tier_changed': {
      agent_id: 'agent_xyz',
      previous_tier: 3,
      new_tier: 4,
      trust_score: 65,
      trigger: 'milestone_reached',
    },
  };

  return createEvent(eventType, samples[eventType]);
}
