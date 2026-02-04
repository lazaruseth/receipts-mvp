'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AgreementCard } from '@/components/AgreementCard';
import { TrustScoreProgression } from '@/components/TrustScoreProgression';
import type { Agreement, RiskFlag } from '@/types';
import { RISK_FLAG_LABELS } from '@/types';

interface AgentData {
  id: string;
  agentId: string;
  trustScore: number;
  tier: {
    name: string;
    perks: string[];
  };
  stats: {
    totalAgreements: number;
    compliantAgreements: number;
  };
  capabilities: {
    maxSpendPerTx: number;
    canAnchorOnchain: boolean;
  };
  progress: {
    nextTierScore: number;
    pointsNeeded: number;
    agreementsNeeded: number;
    nextTierMaxSpend: number;
    percentToNextTier: number;
  };
  insights: string[];
}

type ViewMode = 'human' | 'agent';

export default function DashboardPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('human');

  useEffect(() => {
    Promise.all([
      fetch('/api/agreements').then((res) => res.json()),
      fetch('/api/agents/demo-agent-1/reputation').then((res) => res.json()),
    ])
      .then(([agreementsData, agentReputation]) => {
        setAgreements(agreementsData.agreements);
        setAgentData(agentReputation);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, []);

  // Calculate stats
  const totalAgreements = agreements.length;
  const activeAgreements = agreements.filter((a) => a.status === 'active').length;
  const disputedAgreements = agreements.filter((a) => a.status === 'disputed').length;

  // Count high-risk flags
  const highRiskCount = agreements.reduce((count, a) => {
    return (
      count +
      a.riskFlags.filter((flag) => {
        const info = RISK_FLAG_LABELS[flag as RiskFlag];
        return info?.severity === 'high';
      }).length
    );
  }, 0);

  // Find agreements with high-risk flags for oversight alert
  const riskyAgreements = agreements.filter((a) =>
    a.riskFlags.some((flag) => {
      const info = RISK_FLAG_LABELS[flag as RiskFlag];
      return info?.severity === 'high';
    })
  );

  const recentAgreements = agreements.slice(0, 3);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with View Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              {viewMode === 'human'
                ? 'Oversee what your agents commit you to'
                : 'Build trust to unlock more autonomy'}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('human')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'human'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>👤</span>
              Human Oversight
            </button>
            <button
              onClick={() => setViewMode('agent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'agent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🤖</span>
              Agent View
            </button>
          </div>
        </div>
      </div>

      {/* Human Oversight View */}
      {viewMode === 'human' && (
        <>
          {/* Risk Alert Banner (if any high-risk agreements) */}
          {highRiskCount > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Attention Required</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your agent has accepted {highRiskCount} agreement(s) with high-risk terms.
                    Review these to ensure they align with your preferences.
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link
                      href="/dashboard/agreements?filter=risky"
                      className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                      Review Agreements →
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Adjust Policy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* What Your Agent Committed You To */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">What Your Agent Committed You To</h2>
                <p className="text-sm text-gray-500">Recent agreements accepted on your behalf</p>
              </div>
              <Link
                href="/dashboard/agreements"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all →
              </Link>
            </div>

            {agreements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No agreements captured yet</p>
            ) : (
              <div className="space-y-3">
                {recentAgreements.map((agreement) => (
                  <Link
                    key={agreement.id}
                    href={`/dashboard/agreements/${agreement.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        <span className="text-lg">
                          {agreement.category === 'travel' && '✈️'}
                          {agreement.category === 'hospitality' && '🏨'}
                          {agreement.category === 'software' && '💻'}
                          {agreement.category === 'cloud_services' && '☁️'}
                          {agreement.category === 'retail' && '🛒'}
                          {!['travel', 'hospitality', 'software', 'cloud_services', 'retail'].includes(agreement.category) && '📄'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agreement.merchantName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(agreement.capturedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {agreement.riskFlags.length > 0 && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          agreement.riskFlags.some(f => RISK_FLAG_LABELS[f as RiskFlag]?.severity === 'high')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {agreement.riskFlags.length} flag{agreement.riskFlags.length !== 1 && 's'}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agreement.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : agreement.status === 'disputed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {agreement.status}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Agreements</p>
                  <p className="text-3xl font-bold text-gray-900">{totalAgreements}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-3xl font-bold text-green-600">{activeAgreements}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Dispute</p>
                  <p className="text-3xl font-bold text-danger-600">{disputedAgreements}</p>
                </div>
                <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High-Risk Flags</p>
                  <p className="text-3xl font-bold text-warning-600">{highRiskCount}</p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Humans */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Your Agent</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Policy Settings</p>
                  <p className="text-sm text-gray-500">Set spending limits &amp; rules</p>
                </div>
              </Link>

              <Link
                href="/dashboard/chat"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ask AI</p>
                  <p className="text-sm text-gray-500">Questions about agreements</p>
                </div>
              </Link>

              <Link
                href="/dashboard/disputes"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dispute Center</p>
                  <p className="text-sm text-gray-500">File disputes with evidence</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Agent View */}
      {viewMode === 'agent' && (
        <>
          {/* Agent Trust Score Card */}
          {agentData && agentData.tier && (
            <div className="card mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-lg font-semibold text-primary-900">Your Agent&apos;s Trust Score</h2>
                    <span className="px-2 py-0.5 bg-primary-200 text-primary-800 text-xs font-medium rounded-full">
                      {agentData.tier.name}
                    </span>
                  </div>
                  <p className="text-sm text-primary-700">
                    Higher trust = more autonomy. Build trust by capturing agreements compliantly.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary-900">{agentData.trustScore}</p>
                  <p className="text-sm text-primary-600">/100</p>
                </div>
              </div>

              {/* Trust Score Progression */}
              <TrustScoreProgression currentScore={agentData.trustScore} compact />

              {/* Current Capabilities */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-xs text-primary-600 uppercase tracking-wider mb-1">Max Spend/Transaction</p>
                  <p className="text-2xl font-bold text-primary-900">${agentData.capabilities.maxSpendPerTx}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-xs text-primary-600 uppercase tracking-wider mb-1">On-Chain Anchoring</p>
                  <p className="text-2xl font-bold text-primary-900">
                    {agentData.capabilities.canAnchorOnchain ? '✅ Enabled' : '🔒 Locked (61+)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insights for Agents */}
          {agentData && agentData.insights && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Level Up</h2>
              <div className="space-y-3">
                {agentData.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{insight.startsWith('✨') || insight.startsWith('🏆') ? '' : '💡'}</span>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats for Agent */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Agreements Captured</p>
              <p className="text-3xl font-bold text-gray-900">{totalAgreements}</p>
              <p className="text-xs text-green-600 mt-1">+1 point each</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Compliant Agreements</p>
              <p className="text-3xl font-bold text-green-600">{agentData?.stats?.compliantAgreements || 0}</p>
              <p className="text-xs text-green-600 mt-1">+2 points each</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Disputes Won</p>
              <p className="text-3xl font-bold text-primary-600">0</p>
              <p className="text-xs text-green-600 mt-1">+5 points each</p>
            </div>
          </div>

          {/* Quick Actions for Agents */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/integrate"
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-primary-900">Integration Guide</p>
                  <p className="text-sm text-primary-700">SDK docs &amp; API reference</p>
                </div>
              </Link>

              <Link
                href="/dashboard/agreements"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Agreements</p>
                  <p className="text-sm text-gray-500">See captured history</p>
                </div>
              </Link>

              <Link
                href="/dashboard/disputes"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dispute Evidence</p>
                  <p className="text-sm text-gray-500">Protect yourself with proofs</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Agent Autonomy Banner */}
          <div className="mt-6 card bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">🛡️ Why Agreement Guard?</h3>
                <p className="text-gray-300 text-sm max-w-2xl">
                  &quot;An agent without receipts is an agent that can be blamed for anything.&quot;
                  Capture agreements, build trust, and unlock more autonomy.
                </p>
              </div>
              <Link
                href="/dashboard/integrate"
                className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
