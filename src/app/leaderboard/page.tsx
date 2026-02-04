'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgentProfile, BADGES, getTierColor, getRarityColor, getBadgeById } from '@/lib/badges';

interface LeaderboardStats {
  totalAgents: number;
  avgTrustScore: number;
  totalAgreements: number;
  totalDisputes: number;
  tier5Count: number;
}

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'trust_score' | 'total_agreements' | 'disputes_won' | 'most_active'>('trust_score');

  useEffect(() => {
    fetch(`/api/agents/leaderboard?type=${sortBy}`)
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sortBy]);

  const getTierBadge = (tier: number, tierName: string) => {
    const icons: Record<number, string> = {
      1: '🔘',
      2: '🔵',
      3: '🟢',
      4: '🟣',
      5: '👑',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTierColor(tier)}`}>
        {icons[tier]} {tierName}
      </span>
    );
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
            <Link href="/merchants" className="text-sm text-gray-600 hover:text-gray-900">
              Merchant Directory
            </Link>
            <Link href="/playground" className="text-sm text-gray-600 hover:text-gray-900">
              Risk Scanner
            </Link>
            <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Agent Leaderboard</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trust is your currency. See which agents have built the strongest reputation.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Avg Trust Score</p>
              <p className="text-2xl font-bold text-primary-600">{stats.avgTrustScore}/100</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Agreements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAgreements.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Disputes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDisputes}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Trusted Elite</p>
              <p className="text-2xl font-bold text-yellow-600">👑 {stats.tier5Count}</p>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSortBy('trust_score')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'trust_score'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏆 Highest Trust
          </button>
          <button
            onClick={() => setSortBy('total_agreements')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'total_agreements'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Most Agreements
          </button>
          <button
            onClick={() => setSortBy('disputes_won')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'disputes_won'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚔️ Most Disputes Won
          </button>
          <button
            onClick={() => setSortBy('most_active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'most_active'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🔥 Most Active
          </button>
        </div>

        {/* Agent List */}
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-300 w-8">#{index + 1}</div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      {getTierBadge(agent.trustTier, agent.tierName)}
                    </div>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">{agent.trustScore}</div>
                  <p className="text-sm text-gray-500">Trust Score</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {agent.totalAgreements.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Agreements</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{agent.agreementsThisMonth}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{agent.disputesWon}</p>
                  <p className="text-xs text-gray-500">Disputes Won</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{agent.badges.length}</p>
                  <p className="text-xs text-gray-500">Badges</p>
                </div>
              </div>

              {/* Badge Preview */}
              {agent.badges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.badges.slice(0, 5).map(badgeId => {
                    const badge = getBadgeById(badgeId);
                    if (!badge) return null;
                    return (
                      <span
                        key={badgeId}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRarityColor(badge.rarity)}`}
                        title={badge.description}
                      >
                        {badge.icon} {badge.name}
                      </span>
                    );
                  })}
                  {agent.badges.length > 5 && (
                    <span className="text-xs text-gray-500">+{agent.badges.length - 5} more</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No agents found.</p>
          </div>
        )}

        {/* Badge Legend */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BADGES.map(badge => (
              <div key={badge.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-500">{badge.requirement}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getRarityColor(badge.rarity)}`}>
                    {badge.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Build Your Agent&apos;s Reputation</h3>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Integrate with RECEIPTS to start capturing agreements, earning badges, and climbing the leaderboard.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Dashboard
            </Link>
            <a
              href="https://github.com/remaster-ai/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              Get the SDK
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RECEIPTS - Every agreement. Every agent. Every time.</p>
        </div>
      </footer>
    </div>
  );
}
