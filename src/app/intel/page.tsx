'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  type IntelFeedResponse,
  type IntelType,
  type IntelSeverity,
  INTEL_TYPE_LABELS,
  SEVERITY_LABELS,
} from '@/lib/intel-engine';

export default function IntelPage() {
  const [feed, setFeed] = useState<IntelFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<IntelType | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<IntelSeverity | ''>('');

  useEffect(() => {
    fetchFeed();
    // Refresh every 30 seconds
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [filterType, filterSeverity]);

  const fetchFeed = async () => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterSeverity) params.set('severity', filterSeverity);

    const res = await fetch(`/api/intel/feed?${params.toString()}`);
    const data = await res.json();
    setFeed(data);
    setLoading(false);
  };

  const getSeverityBadge = (severity: IntelSeverity) => {
    const config = SEVERITY_LABELS[severity];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: IntelType) => {
    return INTEL_TYPE_LABELS[type]?.icon || '📌';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-white">REMASTER</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              Updated {feed?.lastUpdated ? formatTimeAgo(feed.lastUpdated) : '...'}
            </span>
            <Link href="/dashboard" className="text-sm text-primary-400 hover:text-primary-300">
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🔍 Agreement Intel Feed
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Know what everyone else is signing. Collective intelligence from the REMASTER network.
          </p>
        </div>

        {/* Active Alerts */}
        {feed && feed.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Active Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feed.alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-900/20 border-red-800'
                      : alert.severity === 'warning'
                        ? 'bg-yellow-900/20 border-yellow-800'
                        : 'bg-blue-900/20 border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg">{getTypeIcon(alert.type)}</span>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{alert.title}</h3>
                  <p className="text-sm text-gray-400">{alert.message}</p>
                  {alert.merchant && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">{alert.merchant}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {feed && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">Intel Today</p>
              <p className="text-2xl font-bold text-white">{feed.stats.totalIntelToday}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-400">{feed.stats.criticalAlerts}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">Merchants Affected</p>
              <p className="text-2xl font-bold text-white">{feed.stats.merchantsAffected}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">Top Risk Flag</p>
              <p className="text-lg font-bold text-yellow-400">
                {feed.stats.topRiskFlags[0]?.flag.replace(/_/g, ' ') || 'None'}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as IntelType | '')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {Object.entries(INTEL_TYPE_LABELS).map(([type, config]) => (
              <option key={type} value={type}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as IntelSeverity | '')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Severities</option>
            {Object.entries(SEVERITY_LABELS).map(([severity, config]) => (
              <option key={severity} value={severity}>
                {config.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchFeed}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Intel Feed */}
        <div className="space-y-4">
          {feed?.items.map(item => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      {INTEL_TYPE_LABELS[item.type]?.label} • {formatTimeAgo(item.detectedAt)}
                    </p>
                  </div>
                </div>
                {getSeverityBadge(item.severity)}
              </div>

              <p className="text-gray-300 mb-4">{item.description}</p>

              {/* Related Flags */}
              {item.relatedFlags && item.relatedFlags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.relatedFlags.map(flag => (
                    <span
                      key={flag}
                      className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-mono"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                {item.merchant && (
                  <span>
                    🏪 {item.merchant}
                  </span>
                )}
                <span>👥 {item.affectedAgents} agents affected</span>
                <span>📊 {item.reportCount} reports</span>
                {item.category && (
                  <span className="capitalize">📁 {item.category.replace(/_/g, ' ')}</span>
                )}
              </div>

              {/* Recommended Action */}
              {item.recommendedAction && (
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommended Action</p>
                  <p className="text-sm text-gray-300">{item.recommendedAction}</p>
                </div>
              )}
            </div>
          ))}

          {feed?.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No intel matching your filters.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-900 to-purple-900 rounded-xl p-8 text-center border border-primary-700">
          <h3 className="text-2xl font-bold text-white mb-2">Get Intel Alerts in Real-Time</h3>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Set up webhooks to receive instant alerts when something happens in your categories.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/webhooks"
              className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Configure Webhooks
            </Link>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>REMASTER Intel Feed - Collective Intelligence for AI Agent Commerce</p>
        </div>
      </footer>
    </div>
  );
}
