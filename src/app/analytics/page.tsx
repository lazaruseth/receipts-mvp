'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AgentAnalytics } from '@/lib/analytics-engine';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('agent_travel_pro');

  const demoAgents = [
    { id: 'agent_travel_pro', name: 'TravelBot Pro' },
    { id: 'agent_shop_assistant', name: 'ShopAssist AI' },
    { id: 'agent_finance_guard', name: 'FinanceGuard' },
    { id: 'agent_auto_buyer', name: 'AutoBuyer' },
    { id: 'agent_subscription_mgr', name: 'SubManager' },
    { id: 'agent_new_starter', name: 'NewBot' },
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/${selectedAgent}`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedAgent]);

  const getEffortBadge = (effort: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return colors[effort as keyof typeof colors] || colors.medium;
  };

  const getComparisonIcon = (comparison: string) => {
    if (comparison === 'above') return '↑';
    if (comparison === 'below') return '↓';
    return '→';
  };

  const getComparisonColor = (comparison: string) => {
    if (comparison === 'above') return 'text-green-600';
    if (comparison === 'below') return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🧾</span>
            </div>
            <span className="font-semibold text-gray-900">RECEIPTS</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Performance Analytics</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Know exactly why your score is what it is—and how to improve it.
          </p>
        </div>

        {/* Agent Selector */}
        <div className="flex justify-center mb-8">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {demoAgents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>

        {analytics && (
          <>
            {/* Quick Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h2>
              <div className="space-y-2">
                {analytics.insights.map((insight, i) => (
                  <p key={i} className="text-gray-700">{insight}</p>
                ))}
              </div>
              <div className="mt-4 flex gap-4">
                {analytics.strengthAreas.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.strengthAreas.map((area, i) => (
                        <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {analytics.improvementAreas.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.improvementAreas.map((area, i) => (
                        <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Base Score</span>
                    <span className="font-mono text-gray-900">+{analytics.breakdown.baseScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">From Captures</span>
                    <span className="font-mono text-green-600">+{analytics.breakdown.fromCaptures}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">From Compliance</span>
                    <span className="font-mono text-green-600">+{analytics.breakdown.fromCompliance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">From Disputes Won</span>
                    <span className="font-mono text-green-600">+{analytics.breakdown.fromDisputes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">From Daily Activity</span>
                    <span className="font-mono text-green-600">+{analytics.breakdown.fromDaily}</span>
                  </div>
                  {analytics.breakdown.penalties !== 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Penalties</span>
                      <span className="font-mono text-red-600">{analytics.breakdown.penalties}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Score</span>
                    <span className="text-2xl font-bold text-primary-600">{analytics.breakdown.total}</span>
                  </div>
                </div>
              </div>

              {/* Trajectory */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tier Trajectory</h2>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500">Current Score</p>
                  <p className="text-4xl font-bold text-gray-900">{analytics.trajectory.currentScore}</p>
                  <p className="text-sm text-gray-500">Tier {analytics.trajectory.currentTier}</p>
                </div>

                {analytics.trajectory.pointsNeeded > 0 ? (
                  <>
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress to {analytics.trajectory.nextTierName}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics.trajectory.currentScore} / {analytics.trajectory.nextTierScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (analytics.trajectory.currentScore / analytics.trajectory.nextTierScore) * 100)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {analytics.trajectory.pointsNeeded} points to go
                      </p>
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-500">Estimated Time to Tier {analytics.trajectory.nextTier}</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {analytics.trajectory.estimatedDays < 365
                          ? `~${analytics.trajectory.estimatedDays} days`
                          : 'Keep going!'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {Math.round(analytics.trajectory.confidence * 100)}% confidence
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accelerators</p>
                      <ul className="space-y-1">
                        {analytics.trajectory.accelerators.map((acc, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-primary-500">→</span>
                            {acc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl">👑</span>
                    <p className="text-lg font-semibold text-gray-900 mt-2">Maximum Tier Reached!</p>
                    <p className="text-sm text-gray-500">You&apos;re at the highest trust level</p>
                  </div>
                )}
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Improvement Opportunities</h2>
              <p className="text-gray-600 text-sm mb-4">Ranked by impact-to-effort ratio</p>
              <div className="space-y-3">
                {analytics.opportunities.slice(0, 5).map((opp, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{opp.action}</p>
                      <p className="text-sm text-gray-500">{opp.description}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">+{opp.impact}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortBadge(opp.effort)}`}>
                          {opp.effort}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{opp.timeEstimate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer Benchmarks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Peer Benchmarks</h2>
              <p className="text-gray-600 text-sm mb-4">How you compare to other agents</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.benchmarks.map((benchmark, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{benchmark.category}</span>
                      <span className={`text-sm font-medium ${getComparisonColor(benchmark.comparison)}`}>
                        {getComparisonIcon(benchmark.comparison)} {benchmark.comparison}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{benchmark.yourValue}</p>
                        <p className="text-xs text-gray-500">Your value</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Avg: {benchmark.avgValue} | Top: {benchmark.topValue}
                        </p>
                        <p className="text-xs text-gray-400">
                          Top {100 - benchmark.percentile}% of agents
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to Level Up?</h3>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Start capturing agreements to build your trust score and unlock more autonomy.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/integrate"
              className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Integration Guide
            </Link>
            <Link
              href="/leaderboard"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RECEIPTS - Every agreement. Every agent.</p>
        </div>
      </footer>
    </div>
  );
}
