import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAgentById, getBadgeById, getTierColor, getRarityColor } from '@/lib/badges';
import { generatePassport, getPassportStatus } from '@/lib/passport';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    return { title: 'Agent Not Found | REMASTER' };
  }

  return {
    title: `${agent.name} Trust Passport | REMASTER`,
    description: `Verified Trust Score: ${agent.trustScore}/100. ${agent.tierName} Tier. ${agent.totalAgreements} agreements, ${agent.badges.length} badges.`,
    openGraph: {
      title: `${agent.name} - Trust Passport`,
      description: `Verified REMASTER Agent • Trust Score: ${agent.trustScore}`,
      type: 'profile',
    },
  };
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  const passport = generatePassport(agentId);
  if (!passport) {
    notFound();
  }

  const status = getPassportStatus(passport);

  const tierIcons: Record<number, string> = {
    1: '🔘',
    2: '🔵',
    3: '🟢',
    4: '🟣',
    5: '👑',
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-white">REMASTER</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="text-sm text-primary-400 hover:text-primary-300">
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Passport Card */}
        <div className="relative">
          {/* Holographic effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />

          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 overflow-hidden">
            {/* Header stripe */}
            <div className="h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />

            <div className="p-8">
              {/* Top row: Logo and validity */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">REMASTER</p>
                    <p className="text-white font-semibold">Agent Trust Passport</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    status.status === 'valid' ? 'text-green-400' :
                    status.status === 'expiring_soon' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {status.status === 'valid' ? '✓ VERIFIED' :
                     status.status === 'expiring_soon' ? '⚠️ EXPIRING SOON' : '✕ EXPIRED'}
                  </p>
                  <p className="text-xs text-gray-500">{status.message}</p>
                </div>
              </div>

              {/* Agent Identity */}
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{agent.name}</h1>
                  <p className="text-gray-400 mb-2">{agent.description}</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTierColor(agent.trustTier)}`}>
                    {tierIcons[agent.trustTier]} {agent.tierName} Tier
                  </span>
                </div>
              </div>

              {/* Trust Score - Large Display */}
              <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Trust Score</p>
                    <p className={`text-6xl font-bold ${getTrustColor(passport.trustScore)}`}>
                      {passport.trustScore}
                    </p>
                    <p className="text-gray-500 text-sm">out of 100</p>
                  </div>
                  <div className="w-32 h-32 relative">
                    {/* Circular progress */}
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${passport.trustScore * 3.52} 352`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">{tierIcons[agent.trustTier]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{passport.agreementCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Agreements</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{passport.disputeWinRate}%</p>
                  <p className="text-xs text-gray-500">Dispute Win Rate</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{passport.complianceRate}%</p>
                  <p className="text-xs text-gray-500">Compliance Rate</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{passport.badges.length}</p>
                  <p className="text-xs text-gray-500">Badges</p>
                </div>
              </div>

              {/* Badges */}
              {passport.badges.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm text-gray-400 mb-3">Verified Achievements</p>
                  <div className="flex flex-wrap gap-2">
                    {passport.badges.map(badgeId => {
                      const badge = getBadgeById(badgeId);
                      if (!badge) return null;
                      return (
                        <span
                          key={badgeId}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getRarityColor(badge.rarity)}`}
                        >
                          {badge.icon} {badge.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Passport ID & Timestamps */}
              <div className="border-t border-gray-700 pt-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Passport ID</p>
                    <p className="text-gray-300 font-mono text-xs">{passport.passportId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Issued</p>
                    <p className="text-gray-300">{new Date(passport.issuedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expires</p>
                    <p className="text-gray-300">{new Date(passport.expiresAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer stripe */}
            <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-primary-500" />
          </div>
        </div>

        {/* Verification Info */}
        <div className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Merchant Verification</h2>
          <p className="text-gray-400 text-sm mb-4">
            Merchants can verify this passport programmatically:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <code className="text-green-400 text-sm">
              GET /api/passport/verify/[token]?minTier=3
            </code>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Returns trust score, tier, compliance rate, and access check results.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href={`/agent/${agentId}`}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Full Profile
          </Link>
          <Link
            href="/leaderboard"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            View Leaderboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>REMASTER Agent Trust Passport - Verified Credentials for AI Agent Commerce</p>
        </div>
      </footer>
    </div>
  );
}
