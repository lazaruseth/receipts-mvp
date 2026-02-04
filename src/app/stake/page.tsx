'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StakeCalculator from '@/components/StakeCalculator';

interface StakingStats {
  totalStakes: number;
  successfulStakes: number;
  failedStakes: number;
  totalGained: number;
  totalLost: number;
  netEffect: number;
  winRate: number;
}

export default function StakePage() {
  const [selectedAgent, setSelectedAgent] = useState('agent_travel_pro');
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const demoAgents = [
    { id: 'agent_travel_pro', name: 'TravelBot Pro', score: 87 },
    { id: 'agent_shop_assistant', name: 'ShopAssist AI', score: 72 },
    { id: 'agent_finance_guard', name: 'FinanceGuard', score: 65 },
    { id: 'agent_auto_buyer', name: 'AutoBuyer', score: 45 },
    { id: 'agent_subscription_mgr', name: 'SubManager', score: 38 },
    { id: 'agent_new_starter', name: 'NewBot', score: 15 },
  ];

  useEffect(() => {
    fetchStats();
  }, [selectedAgent]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/stake/resolve?agentId=${selectedAgent}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const selectedAgentInfo = demoAgents.find(a => a.id === selectedAgent);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-gray-900">REMASTER</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">
              Leaderboard
            </Link>
            <Link href="/analytics" className="text-sm text-gray-600 hover:text-gray-900">
              Analytics
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎰 Trust Score Staking
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Confident in your reputation? Stake your trust score to access larger
            transaction limits. Win big or risk it all.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">How Staking Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Choose Amount</h3>
              <p className="text-sm text-white/80">
                Pick a transaction amount above your current tier limit
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Lock Points</h3>
              <p className="text-sm text-white/80">
                Stake trust score points as collateral for the transaction
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Execute Deal</h3>
              <p className="text-sm text-white/80">
                Complete the transaction within 7 days
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Collect Reward</h3>
              <p className="text-sm text-white/80">
                Success = bonus points. Dispute lost = lose your stake + penalty
              </p>
            </div>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
            <span className="text-sm text-gray-500">Demo as:</span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
            >
              {demoAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} (Score: {agent.score})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staking Calculator */}
          <div className="lg:col-span-2">
            <StakeCalculator
              agentId={selectedAgent}
              agentName={selectedAgentInfo?.name}
              onStakeLocked={() => fetchStats()}
            />
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Agent Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Current Agent</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {selectedAgentInfo?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedAgentInfo?.name}</p>
                  <p className="text-sm text-gray-500">Trust Score: {selectedAgentInfo?.score}</p>
                </div>
              </div>
            </div>

            {/* Staking History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Staking History</h3>
              {loadingStats ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalStakes}</p>
                      <p className="text-xs text-gray-500">Total Stakes</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-600">{stats.winRate}%</p>
                      <p className="text-xs text-gray-500">Win Rate</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Successful</span>
                      <span className="text-sm font-semibold text-green-600">
                        {stats.successfulStakes} (+{stats.totalGained} pts)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Failed</span>
                      <span className="text-sm font-semibold text-red-600">
                        {stats.failedStakes} (-{stats.totalLost} pts)
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Net Effect</span>
                      <span className={`text-sm font-bold ${stats.netEffect >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.netEffect >= 0 ? '+' : ''}{stats.netEffect} pts
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No staking history yet</p>
              )}
            </div>

            {/* Risk Levels Explained */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Risk Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    LOW
                  </span>
                  <span className="text-sm text-gray-600">&lt;30% above limit</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                    MEDIUM
                  </span>
                  <span className="text-sm text-gray-600">30-70% above limit</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                    HIGH
                  </span>
                  <span className="text-sm text-gray-600">70-150% above limit</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    EXTREME
                  </span>
                  <span className="text-sm text-gray-600">&gt;150% above limit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gray-900 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Build Your Score First</h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Need a higher trust score before staking? Capture more agreements compliantly
            to climb the tiers naturally.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/analytics"
              className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Analytics
            </Link>
            <Link
              href="/leaderboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              See Top Agents
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>REMASTER - Agreement Rail for AI Agent Commerce</p>
        </div>
      </footer>
    </div>
  );
}
