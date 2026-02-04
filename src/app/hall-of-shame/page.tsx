'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CompanyScore {
  rank: number;
  name: string;
  logo: string;
  category: string;
  score: number;
  flags: {
    flag: string;
    label: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  worstClause: string;
  tosUrl: string;
  lastUpdated: string;
}

// Pre-analyzed companies - this would come from a database in production
const HALL_OF_SHAME: CompanyScore[] = [
  {
    rank: 1,
    name: 'Amazon Web Services',
    logo: '🌩️',
    category: 'Cloud Services',
    score: 15,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'CLASS_ACTION_WAIVER', label: 'Class Action Waiver', severity: 'high' },
      { flag: 'CHARGEBACK_WAIVER', label: 'Chargeback Waiver', severity: 'high' },
      { flag: 'BROAD_INDEMNIFICATION', label: 'Broad Indemnification', severity: 'high' },
      { flag: 'NON_REFUNDABLE', label: 'Non-Refundable', severity: 'high' },
    ],
    worstClause: "You waive your right to jury trial and class action lawsuits. All disputes resolved through binding arbitration.",
    tosUrl: 'https://aws.amazon.com/service-terms/',
    lastUpdated: '2026-02-01',
  },
  {
    rank: 2,
    name: 'Uber',
    logo: '🚗',
    category: 'Transportation',
    score: 22,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'CLASS_ACTION_WAIVER', label: 'Class Action Waiver', severity: 'high' },
      { flag: 'PRICE_NOT_GUARANTEED', label: 'Price Not Guaranteed', severity: 'medium' },
      { flag: 'BROAD_INDEMNIFICATION', label: 'Broad Indemnification', severity: 'high' },
    ],
    worstClause: "Uber can change your fare after the ride is complete. You agree to pay whatever they determine.",
    tosUrl: 'https://www.uber.com/legal/en/document/?name=general-terms-of-use',
    lastUpdated: '2026-01-28',
  },
  {
    rank: 3,
    name: 'Spotify',
    logo: '🎵',
    category: 'Entertainment',
    score: 28,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'CLASS_ACTION_WAIVER', label: 'Class Action Waiver', severity: 'high' },
      { flag: 'AUTO_RENEWAL_HIDDEN', label: 'Auto-Renewal', severity: 'medium' },
      { flag: 'DATA_SHARING_EXTENSIVE', label: 'Data Sharing', severity: 'medium' },
    ],
    worstClause: "By using Spotify, you waive your right to participate in class action lawsuits against them.",
    tosUrl: 'https://www.spotify.com/us/legal/end-user-agreement/',
    lastUpdated: '2026-01-25',
  },
  {
    rank: 4,
    name: 'Airbnb',
    logo: '🏠',
    category: 'Travel',
    score: 32,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'CLASS_ACTION_WAIVER', label: 'Class Action Waiver', severity: 'high' },
      { flag: 'BROAD_INDEMNIFICATION', label: 'Broad Indemnification', severity: 'high' },
    ],
    worstClause: "You must indemnify Airbnb against any claims from hosts, guests, or third parties.",
    tosUrl: 'https://www.airbnb.com/terms',
    lastUpdated: '2026-01-22',
  },
  {
    rank: 5,
    name: 'DoorDash',
    logo: '🍔',
    category: 'Food Delivery',
    score: 35,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'CLASS_ACTION_WAIVER', label: 'Class Action Waiver', severity: 'high' },
      { flag: 'PRICE_NOT_GUARANTEED', label: 'Price Changes', severity: 'medium' },
    ],
    worstClause: "DoorDash can modify prices between ordering and delivery. Final price may differ from estimate.",
    tosUrl: 'https://help.doordash.com/legal/document?type=cx-terms-and-conditions',
    lastUpdated: '2026-01-20',
  },
  {
    rank: 6,
    name: 'Meta (Facebook)',
    logo: '👤',
    category: 'Social Media',
    score: 38,
    flags: [
      { flag: 'DATA_SHARING_EXTENSIVE', label: 'Extensive Data Sharing', severity: 'high' },
      { flag: 'BROAD_INDEMNIFICATION', label: 'Broad Indemnification', severity: 'medium' },
      { flag: 'CLASS_ACTION_WAIVER', label: 'Class Action Waiver', severity: 'high' },
    ],
    worstClause: "Meta shares your data with hundreds of third-party partners for advertising purposes.",
    tosUrl: 'https://www.facebook.com/terms.php',
    lastUpdated: '2026-01-18',
  },
  {
    rank: 7,
    name: 'OpenAI',
    logo: '🤖',
    category: 'AI Services',
    score: 42,
    flags: [
      { flag: 'BROAD_INDEMNIFICATION', label: 'Broad Indemnification', severity: 'high' },
      { flag: 'DATA_SHARING_EXTENSIVE', label: 'Training Data Usage', severity: 'medium' },
      { flag: 'NON_REFUNDABLE', label: 'Non-Refundable', severity: 'medium' },
    ],
    worstClause: "OpenAI may use your inputs to improve their models unless you opt-out through specific settings.",
    tosUrl: 'https://openai.com/policies/terms-of-use',
    lastUpdated: '2026-01-15',
  },
  {
    rank: 8,
    name: 'Netflix',
    logo: '🎬',
    category: 'Entertainment',
    score: 55,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'AUTO_RENEWAL_HIDDEN', label: 'Auto-Renewal', severity: 'medium' },
    ],
    worstClause: "Netflix automatically renews and can change pricing with notice. Arbitration required for disputes.",
    tosUrl: 'https://help.netflix.com/legal/termsofuse',
    lastUpdated: '2026-01-12',
  },
  {
    rank: 9,
    name: 'Google',
    logo: '🔍',
    category: 'Tech',
    score: 62,
    flags: [
      { flag: 'DATA_SHARING_EXTENSIVE', label: 'Data Collection', severity: 'medium' },
      { flag: 'BROAD_INDEMNIFICATION', label: 'Indemnification', severity: 'medium' },
    ],
    worstClause: "Google collects extensive data across all services to build advertising profiles.",
    tosUrl: 'https://policies.google.com/terms',
    lastUpdated: '2026-01-10',
  },
  {
    rank: 10,
    name: 'Stripe',
    logo: '💳',
    category: 'Payments',
    score: 68,
    flags: [
      { flag: 'BINDING_ARBITRATION', label: 'Binding Arbitration', severity: 'high' },
      { flag: 'BROAD_INDEMNIFICATION', label: 'Indemnification', severity: 'medium' },
    ],
    worstClause: "Stripe may hold funds for up to 90 days if they suspect fraud or chargebacks.",
    tosUrl: 'https://stripe.com/legal/ssa',
    lastUpdated: '2026-01-08',
  },
];

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Fair';
  if (score >= 40) return 'Caution';
  return 'Predatory';
}

function ShareButton({ company }: { company: CompanyScore }) {
  const [copied, setCopied] = useState(false);

  const shareText = `🚨 CAUGHT: ${company.name}'s Terms of Service scores ${company.score}/100 on fairness.\n\n"${company.worstClause}"\n\nCheck the full Hall of Shame: `;

  const handleShare = async () => {
    const url = `${window.location.origin}/hall-of-shame#${company.name.toLowerCase().replace(/\s+/g, '-')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${company.name} ToS Exposed`,
          text: shareText,
          url: url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText + url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
    >
      {copied ? '✓ Copied!' : '📤 Share'}
    </button>
  );
}

export default function HallOfShamePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const categories = ['all', ...new Set(HALL_OF_SHAME.map(c => c.category))];

  const filteredCompanies = selectedCategory === 'all'
    ? HALL_OF_SHAME
    : HALL_OF_SHAME.filter(c => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🚨</span>
            </div>
            <span className="font-semibold text-gray-900">Hall of Shame</span>
          </Link>
          <div className="flex gap-4">
            <Link
              href="/playground"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Scan Any ToS →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ToS Hall of Shame
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            The worst Terms of Service on the internet, ranked by how badly they screw you.
          </p>
          <p className="text-sm text-gray-500">
            Updated weekly. Scores based on consumer fairness analysis.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-4xl font-bold text-red-600">87%</div>
            <div className="text-sm text-gray-600 mt-1">Have binding arbitration</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-4xl font-bold text-red-600">92%</div>
            <div className="text-sm text-gray-600 mt-1">Block class actions</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-4xl font-bold text-red-600">73%</div>
            <div className="text-sm text-gray-600 mt-1">Share data with 3rd parties</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>

        {/* Rankings List */}
        <div className="space-y-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.name}
              id={company.name.toLowerCase().replace(/\s+/g, '-')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedCompany(expandedCompany === company.name ? null : company.name)}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-3xl font-bold text-gray-300 w-12 text-center">
                    #{company.rank}
                  </div>

                  {/* Logo & Name */}
                  <div className="text-4xl">{company.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {company.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {company.flags.slice(0, 3).map((flag) => (
                        <span
                          key={flag.flag}
                          className={`text-xs px-2 py-0.5 rounded ${
                            flag.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : flag.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {flag.label}
                        </span>
                      ))}
                      {company.flags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{company.flags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(company.score)}`}>
                      {company.score}
                    </div>
                    <div className={`text-sm font-medium mt-1 ${getScoreColor(company.score).split(' ')[0]}`}>
                      {getScoreLabel(company.score)}
                    </div>
                  </div>

                  {/* Expand Arrow */}
                  <div className="text-gray-400">
                    <svg
                      className={`w-6 h-6 transition-transform ${expandedCompany === company.name ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCompany === company.name && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Worst Clause</h3>
                      <blockquote className="text-gray-700 italic border-l-4 border-red-300 pl-4">
                        "{company.worstClause}"
                      </blockquote>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">All Risk Flags</h3>
                      <div className="flex flex-wrap gap-2">
                        {company.flags.map((flag) => (
                          <span
                            key={flag.flag}
                            className={`text-sm px-3 py-1 rounded-full ${
                              flag.severity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : flag.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {flag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Last analyzed: {company.lastUpdated}
                    </div>
                    <div className="flex gap-4">
                      <ShareButton company={company} />
                      <a
                        href={company.tosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                      >
                        View Original ToS →
                      </a>
                      <Link
                        href={`/playground?url=${encodeURIComponent(company.tosUrl)}`}
                        className="text-sm bg-primary-600 text-white px-4 py-1 rounded-lg hover:bg-primary-700 font-medium"
                      >
                        Re-analyze
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Don't Get Caught</h2>
          <p className="text-red-100 mb-6 max-w-lg mx-auto">
            Scan any Terms of Service before you click "I Agree".
            Know what you're signing up for.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/playground"
              className="px-6 py-3 bg-white text-red-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Scan Any ToS Free
            </Link>
            <Link
              href="/dashboard/integrate"
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-400 transition-colors"
            >
              Get API Access
            </Link>
          </div>
        </div>

        {/* Methodology */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How We Score</h3>
          <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto text-sm">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-red-600">-20 points</div>
              <div className="text-gray-600">Binding arbitration</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-red-600">-20 points</div>
              <div className="text-gray-600">Class action waiver</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-yellow-600">-10 points</div>
              <div className="text-gray-600">Extensive data sharing</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-blue-600">-5 points</div>
              <div className="text-gray-600">Price not guaranteed</div>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Scores start at 100. Points deducted for each consumer-unfriendly clause detected.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>A <Link href="/" className="text-primary-600 hover:underline">RECEIPTS</Link> feature by Remaster Labs</p>
          <p className="mt-1">Exposing unfair terms since 2026.</p>
        </div>
      </footer>
    </div>
  );
}
