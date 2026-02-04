'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MerchantProfile {
  id: string;
  domain: string;
  name: string;
  category: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalAgreements: number;
  disputeCount: number;
  topFlags: Array<{ flag: string; percentage: number }>;
}

interface MerchantStats {
  totalMerchants: number;
  avgRiskScore: number;
  highRiskCount: number;
  lowRiskCount: number;
  mostCommonFlags: Array<{ flag: string; count: number; percentage: number }>;
}

const RISK_FLAG_LABELS: Record<string, string> = {
  BINDING_ARBITRATION: 'Binding Arbitration',
  CHARGEBACK_WAIVER: 'Chargeback Waiver',
  CLASS_ACTION_WAIVER: 'Class Action Waiver',
  AUTO_RENEWAL_HIDDEN: 'Hidden Auto-Renewal',
  NON_REFUNDABLE: 'Non-Refundable',
  BROAD_INDEMNIFICATION: 'Broad Indemnification',
  DATA_SHARING_EXTENSIVE: 'Data Sharing',
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'riskiest' | 'safest'>('riskiest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/merchants?stats=true')
      .then((res) => res.json())
      .then((data) => {
        setMerchants(data.merchants || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sortedMerchants = [...merchants].sort((a, b) =>
    activeTab === 'riskiest' ? a.riskScore - b.riskScore : b.riskScore - a.riskScore
  );

  const filteredMerchants = searchQuery
    ? sortedMerchants.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedMerchants;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
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
            <Link
              href="/playground"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Risk Scanner
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Merchant Risk Directory
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The Yelp for Terms of Service. See which companies have the most
            consumer-friendly (or predatory) terms.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Merchants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMerchants}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Avg Risk Score</p>
              <p className={`text-2xl font-bold ${getRiskScoreColor(stats.avgRiskScore)}`}>
                {stats.avgRiskScore}/100
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{stats.highRiskCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">{stats.lowRiskCount}</p>
            </div>
          </div>
        )}

        {/* Most Common Flags */}
        {stats && stats.mostCommonFlags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Most Common Risk Flags
            </h2>
            <div className="flex flex-wrap gap-3">
              {stats.mostCommonFlags.map((item) => (
                <div
                  key={item.flag}
                  className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
                >
                  <span className="font-medium text-red-700">
                    {RISK_FLAG_LABELS[item.flag] || item.flag}
                  </span>
                  <span className="text-red-500 text-sm ml-2">
                    {item.percentage}% of merchants
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('riskiest')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'riskiest'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Most Risky
            </button>
            <button
              onClick={() => setActiveTab('safest')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'safest'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Safest
            </button>
          </div>
        </div>

        {/* Merchant List */}
        <div className="space-y-4">
          {filteredMerchants.map((merchant, index) => (
            <div
              key={merchant.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-300 w-8">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {merchant.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {merchant.category} • {merchant.domain}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getRiskScoreColor(merchant.riskScore)}`}>
                    {merchant.riskScore}
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskColor(
                      merchant.riskLevel
                    )}`}
                  >
                    {merchant.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              {/* Risk Flags */}
              {merchant.topFlags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {merchant.topFlags.map((flag) => (
                      <span
                        key={flag.flag}
                        className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm"
                      >
                        {RISK_FLAG_LABELS[flag.flag] || flag.flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* View Details Link */}
              <div className="mt-4">
                <Link
                  href={`/caught/demo-${merchant.id.split('_').pop()?.replace(/[^0-9]/g, '') || '1'}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View captured clauses →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No merchants found matching your search.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Help Build This Database</h3>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Every agreement you scan contributes to our merchant intelligence.
            Help protect others by sharing what you find.
          </p>
          <Link
            href="/playground"
            className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Scan an Agreement
          </Link>
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
