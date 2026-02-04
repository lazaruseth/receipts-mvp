'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type NetworkMerchant, MERCHANT_BADGES } from '@/lib/merchant-network';

interface NetworkData {
  merchants: NetworkMerchant[];
  stats: {
    totalMerchants: number;
    totalAgentsConnected: number;
    avgSatisfaction: number;
    categories: string[];
    tier2Merchants: number;
    tier3Merchants: number;
    tier4Merchants: number;
    tier5Merchants: number;
  };
}

export default function NetworkPage() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTier, setFilterTier] = useState('');

  useEffect(() => {
    fetchMerchants();
  }, [filterCategory, filterTier]);

  const fetchMerchants = async () => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (filterTier) params.set('minTier', filterTier);

    const res = await fetch(`/api/network/merchants?${params.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      retail: '🛒',
      travel: '✈️',
      hospitality: '🏨',
      software: '💻',
      cloud_services: '☁️',
    };
    return icons[category] || '📦';
  };

  const getTierBadge = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'bg-gray-100 text-gray-600',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-green-100 text-green-700',
      4: 'bg-purple-100 text-purple-700',
      5: 'bg-yellow-100 text-yellow-700',
    };
    const names: Record<number, string> = {
      1: 'New',
      2: 'Verified',
      3: 'Established',
      4: 'Premium',
      5: 'Trusted',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        Tier {tier}+ ({names[tier]})
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
            <Link href="/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">
              Agent Leaderboard
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
            🤝 Merchant Acceptance Network
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verified merchants who offer preferential treatment to high-trust agents.
            Climb tiers to unlock exclusive perks.
          </p>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{data.stats.totalMerchants}</p>
              <p className="text-sm text-gray-500">Network Merchants</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-primary-600">{data.stats.totalAgentsConnected.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Connected Agents</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">⭐ {data.stats.avgSatisfaction}</p>
              <p className="text-sm text-gray-500">Avg Satisfaction</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{data.stats.categories.length}</p>
              <p className="text-sm text-gray-500">Categories</p>
            </div>
          </div>
        )}

        {/* Tier Distribution */}
        {data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Merchants by Minimum Tier</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex gap-1 h-8">
                  <div
                    className="bg-blue-400 rounded-l"
                    style={{ width: `${(data.stats.tier2Merchants / data.stats.totalMerchants) * 100}%` }}
                    title={`Tier 2: ${data.stats.tier2Merchants}`}
                  />
                  <div
                    className="bg-green-400"
                    style={{ width: `${(data.stats.tier3Merchants / data.stats.totalMerchants) * 100}%` }}
                    title={`Tier 3: ${data.stats.tier3Merchants}`}
                  />
                  <div
                    className="bg-purple-400"
                    style={{ width: `${(data.stats.tier4Merchants / data.stats.totalMerchants) * 100}%` }}
                    title={`Tier 4: ${data.stats.tier4Merchants}`}
                  />
                  <div
                    className="bg-yellow-400 rounded-r"
                    style={{ width: `${(data.stats.tier5Merchants / data.stats.totalMerchants) * 100}%` }}
                    title={`Tier 5: ${data.stats.tier5Merchants}`}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-400 rounded" /> T2: {data.stats.tier2Merchants}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-400 rounded" /> T3: {data.stats.tier3Merchants}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-400 rounded" /> T4: {data.stats.tier4Merchants}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-yellow-400 rounded" /> T5: {data.stats.tier5Merchants}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {data?.stats.categories.map(cat => (
              <option key={cat} value={cat}>
                {getCategoryIcon(cat)} {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Tiers</option>
            <option value="2">Tier 2+ accessible</option>
            <option value="3">Tier 3+ accessible</option>
            <option value="4">Tier 4+ accessible</option>
            <option value="5">Tier 5 only</option>
          </select>
        </div>

        {/* Merchant List */}
        <div className="space-y-4">
          {data?.merchants.map(merchant => (
            <div
              key={merchant.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                    {getCategoryIcon(merchant.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{merchant.name}</h3>
                      {getTierBadge(merchant.minTier)}
                    </div>
                    <p className="text-sm text-gray-500 font-mono">{merchant.domain}</p>
                    <p className="text-sm text-gray-600 mt-1">{merchant.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">⭐ {merchant.avgSatisfaction}</p>
                  <p className="text-sm text-gray-500">{merchant.totalAgents.toLocaleString()} agents</p>
                </div>
              </div>

              {/* Badges */}
              {merchant.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {merchant.badges.map(badge => {
                    const badgeInfo = MERCHANT_BADGES[badge];
                    if (!badgeInfo) return null;
                    return (
                      <span
                        key={badge}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {badgeInfo.icon} {badgeInfo.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Perks by Tier */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-3">Perks by Tier</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(merchant.tierPerks).map(([tier, perks]) => (
                    <div key={tier} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-2">Tier {tier}</p>
                      <ul className="text-sm space-y-1">
                        {perks.skipApproval && (
                          <li className="text-green-600">✓ Skip approval</li>
                        )}
                        {perks.maxTransaction && (
                          <li className="text-gray-700">${perks.maxTransaction} limit</li>
                        )}
                        {perks.feeDiscount && (
                          <li className="text-gray-700">{perks.feeDiscount} off</li>
                        )}
                        {perks.prioritySupport && (
                          <li className="text-green-600">✓ Priority support</li>
                        )}
                        {perks.earlyAccess && (
                          <li className="text-purple-600">✓ Early access</li>
                        )}
                        {perks.customTerms && (
                          <li className="text-yellow-600">✓ Custom terms</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {data?.merchants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No merchants match your filters.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Want Access to Premium Merchants?</h3>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Build your trust score by capturing agreements compliantly.
            Higher tiers unlock better perks.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/analytics"
              className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Analytics
            </Link>
            <Link
              href="/leaderboard"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              See Leaderboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RECEIPTS Merchant Acceptance Network - Preferential Treatment for Trusted Agents</p>
        </div>
      </footer>
    </div>
  );
}
