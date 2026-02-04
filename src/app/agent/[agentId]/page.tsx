import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAgentById,
  getBadgeById,
  TRUST_TIERS,
  getTierColor,
  getRarityColor,
} from '@/lib/badges';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    return { title: 'Agent Not Found | RECEIPTS' };
  }

  return {
    title: `${agent.name} - Trust Score ${agent.trustScore} | RECEIPTS`,
    description: `${agent.description}. ${agent.totalAgreements} agreements captured, ${agent.badges.length} badges earned.`,
    openGraph: {
      title: `${agent.name} - Trust Score ${agent.trustScore}`,
      description: agent.description,
      type: 'profile',
    },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  const tier = TRUST_TIERS.find(t => t.tier === agent.trustTier) || TRUST_TIERS[0];

  const tierIcons: Record<number, string> = {
    1: '🔘',
    2: '🔵',
    3: '🟢',
    4: '🟣',
    5: '👑',
  };

  const disputeWinRate =
    agent.disputesWon + agent.disputesLost > 0
      ? Math.round((agent.disputesWon / (agent.disputesWon + agent.disputesLost)) * 100)
      : 0;

  const badgeUrl = `https://remaster.ai/badge/${agentId}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🧾</span>
            </div>
            <span className="font-semibold text-gray-900">RECEIPTS</span>
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Leaderboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Agent Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg">
              {agent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTierColor(agent.trustTier)}`}
                >
                  {tierIcons[agent.trustTier]} {agent.tierName}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{agent.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Member since {new Date(agent.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>
                  Last active {new Date(agent.lastActiveAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-600">{agent.trustScore}</div>
              <p className="text-gray-500">Trust Score</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {agent.totalAgreements.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Agreements</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{agent.agreementsThisMonth}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{agent.disputesWon}</p>
            <p className="text-sm text-gray-500">Disputes Won</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{disputeWinRate}%</p>
            <p className="text-sm text-gray-500">Win Rate</p>
          </div>
        </div>

        {/* Trust Tier Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trust Tier Progress</h2>
          <div className="flex items-center gap-2 mb-4">
            {TRUST_TIERS.map(t => (
              <div
                key={t.tier}
                className={`flex-1 h-3 rounded-full ${
                  agent.trustTier >= t.tier
                    ? t.tier === 5
                      ? 'bg-yellow-400'
                      : t.tier === 4
                        ? 'bg-purple-400'
                        : t.tier === 3
                          ? 'bg-green-400'
                          : t.tier === 2
                            ? 'bg-blue-400'
                            : 'bg-gray-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {TRUST_TIERS.map(t => (
              <span
                key={t.tier}
                className={agent.trustTier === t.tier ? 'font-bold text-gray-900' : ''}
              >
                {t.name}
              </span>
            ))}
          </div>

          {/* Current Tier Capabilities */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              {tierIcons[tier.tier]} {tier.name} Tier Capabilities
            </h3>
            <ul className="space-y-1">
              {tier.capabilities.map((cap, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500">✓</span> {cap}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Badges Earned ({agent.badges.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {agent.badges.map(badgeId => {
              const badge = getBadgeById(badgeId);
              if (!badge) return null;
              return (
                <div
                  key={badgeId}
                  className={`p-4 rounded-lg border ${getRarityColor(badge.rarity)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{badge.icon}</span>
                    <div>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-xs opacity-75">{badge.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Integrity Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integrity Report</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{agent.disputesWon}</p>
              <p className="text-sm text-green-700">Disputes Won</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{agent.disputesLost}</p>
              <p className="text-sm text-red-700">Disputes Lost</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{agent.violationCount}</p>
              <p className="text-sm text-yellow-700">Violations</p>
            </div>
          </div>
          {agent.violationCount === 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <span className="text-green-700 font-medium">
                ✨ This agent has a clean violation record!
              </span>
            </div>
          )}
        </div>

        {/* Embeddable Badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Embeddable Badge</h2>
          <p className="text-gray-600 mb-4">
            Add this badge to your agent&apos;s README or documentation to show your trust score.
          </p>

          {/* Badge Preview */}
          <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow border border-gray-200">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span className="font-medium text-gray-900">Trust Score:</span>
              <span
                className={`font-bold ${
                  agent.trustScore >= 80
                    ? 'text-green-600'
                    : agent.trustScore >= 60
                      ? 'text-blue-600'
                      : agent.trustScore >= 40
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              >
                {agent.trustScore}
              </span>
              <span className="text-xs text-gray-400">| {agent.tierName}</span>
            </div>
          </div>

          {/* Markdown Code */}
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <code className="text-green-400 text-sm">
              {`[![RECEIPTS Trust Score](${badgeUrl}?style=flat)](https://receipts.ai/agent/${agentId})`}
            </code>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Want Your Agent on the Leaderboard?</h3>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Integrate RECEIPTS to capture agreements, build trust, and earn badges.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/playground"
              className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Try Risk Scanner
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
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RECEIPTS - Every agreement. Every agent. Every time.</p>
        </div>
      </footer>
    </div>
  );
}
