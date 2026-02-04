'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Webhook, WebhookEventType, EVENT_TYPES } from '@/lib/webhook-dispatcher';

type EventTypes = Record<WebhookEventType, { name: string; description: string }>;

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypes>(EVENT_TYPES);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<WebhookEventType[]>([]);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
      setEventTypes(data.eventTypes || EVENT_TYPES);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newUrl || newEvents.length === 0) return;

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, url: newUrl, events: newEvents }),
      });

      if (res.ok) {
        fetchWebhooks();
        setShowCreateModal(false);
        setNewName('');
        setNewUrl('');
        setNewEvents([]);
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleToggle = async (webhookId: string, isActive: boolean) => {
    try {
      await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await fetch(`/api/webhooks/${webhookId}`, { method: 'DELETE' });
      fetchWebhooks();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleTest = async (eventType: WebhookEventType) => {
    setTestingWebhook(eventType);
    try {
      await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType }),
      });
      // Refresh to show delivery
      fetchWebhooks();
    } catch (error) {
      console.error('Test error:', error);
    }
    setTimeout(() => setTestingWebhook(null), 2000);
  };

  const toggleEvent = (event: WebhookEventType) => {
    if (newEvents.includes(event)) {
      setNewEvents(newEvents.filter(e => e !== event));
    } else {
      setNewEvents([...newEvents, event]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Webhooks</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + New Webhook
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-blue-900 mb-1">Real-Time Event Notifications</h3>
          <p className="text-sm text-blue-700">
            Webhooks let you receive real-time notifications when events occur in your REMASTER
            account. Use them to trigger workflows, send alerts, or sync with other systems.
          </p>
        </div>

        {/* Webhooks List */}
        {webhooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
            <p className="text-gray-500 mb-6">
              Create your first webhook to start receiving real-time event notifications.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Webhook
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{webhook.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          webhook.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {webhook.isActive ? 'Active' : 'Paused'}
                      </span>
                      {webhook.failureCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {webhook.failureCount} failures
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-mono mt-1">{webhook.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(webhook.id, !webhook.isActive)}
                      className={`px-3 py-1 rounded text-sm ${
                        webhook.isActive
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {webhook.isActive ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm"
                    >
                      {eventTypes[event]?.name || event}
                    </span>
                  ))}
                </div>

                {/* Last triggered & Secret */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <span>
                    {webhook.lastTriggeredAt
                      ? `Last triggered: ${new Date(webhook.lastTriggeredAt).toLocaleString()}`
                      : 'Never triggered'}
                  </span>
                  <span className="font-mono text-xs">
                    Secret: {webhook.secret.slice(0, 12)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Test Events Section */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Events</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">
              Send a test event to all active webhooks subscribed to that event type.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(eventTypes) as WebhookEventType[]).map(eventType => (
                <button
                  key={eventType}
                  onClick={() => handleTest(eventType)}
                  disabled={testingWebhook === eventType}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    testingWebhook === eventType
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {testingWebhook === eventType ? '✓ Sent!' : eventTypes[eventType].name}
                  </p>
                  <p className="text-xs text-gray-500">{eventTypes[eventType].description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center text-white font-bold">
                  S
                </div>
                <h3 className="font-semibold text-gray-900">Slack</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Send alerts to a Slack channel when high-risk agreements are detected.
              </p>
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Get Slack Webhook URL →
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#5865F2] rounded-lg flex items-center justify-center text-white font-bold">
                  D
                </div>
                <h3 className="font-semibold text-gray-900">Discord</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Post notifications to a Discord channel for your team.
              </p>
              <a
                href="https://support.discord.com/hc/en-us/articles/228383668"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Create Discord Webhook →
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#FF4F00] rounded-lg flex items-center justify-center text-white font-bold">
                  Z
                </div>
                <h3 className="font-semibold text-gray-900">Zapier</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Connect to 5,000+ apps via Zapier webhooks.
              </p>
              <a
                href="https://zapier.com/apps/webhook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Setup Zapier Webhook →
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Webhook</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Slack Alerts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(Object.keys(eventTypes) as WebhookEventType[]).map(event => (
                    <label
                      key={event}
                      className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {eventTypes[event].name}
                        </p>
                        <p className="text-xs text-gray-500">{eventTypes[event].description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName || !newUrl || newEvents.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
