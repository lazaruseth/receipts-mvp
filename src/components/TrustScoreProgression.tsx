'use client';

import Link from 'next/link';

interface TrustTier {
  name: string;
  minScore: number;
  maxScore: number;
  maxSpend: number;
  icon: string;
  color: string;
  perks: string[];
}

const TRUST_TIERS: TrustTier[] = [
  {
    name: 'New Agent',
    minScore: 0,
    maxScore: 20,
    maxSpend: 10,
    icon: '🌱',
    color: 'gray',
    perks: ['Basic capture', 'All approvals required'],
  },
  {
    name: 'Emerging Agent',
    minScore: 21,
    maxScore: 40,
    maxSpend: 50,
    icon: '🌿',
    color: 'green',
    perks: ['$50/tx', 'Low-risk auto-approval'],
  },
  {
    name: 'Active Transactor',
    minScore: 41,
    maxScore: 60,
    maxSpend: 200,
    icon: '🌳',
    color: 'blue',
    perks: ['$200/tx', 'Most auto-approved'],
  },
  {
    name: 'Verified Operator',
    minScore: 61,
    maxScore: 80,
    maxSpend: 500,
    icon: '🏛️',
    color: 'purple',
    perks: ['$500/tx', 'On-chain anchoring'],
  },
  {
    name: 'Trusted Delegate',
    minScore: 81,
    maxScore: 100,
    maxSpend: 1000,
    icon: '👑',
    color: 'yellow',
    perks: ['$1000/tx', 'Full autonomy'],
  },
];

interface TrustScoreProgressionProps {
  currentScore: number;
  compact?: boolean;
  showLevelUp?: boolean;
}

export function TrustScoreProgression({
  currentScore,
  compact = false,
  showLevelUp = true,
}: TrustScoreProgressionProps) {
  // Find current tier
  const currentTierIndex = TRUST_TIERS.findIndex(
    (tier) => currentScore >= tier.minScore && currentScore <= tier.maxScore
  );
  const currentTier = TRUST_TIERS[currentTierIndex] || TRUST_TIERS[0];
  const nextTier = TRUST_TIERS[currentTierIndex + 1];

  // Calculate progress within current tier
  const tierProgress =
    ((currentScore - currentTier.minScore) / (currentTier.maxScore - currentTier.minScore + 1)) * 100;

  // Points to next tier
  const pointsToNext = nextTier ? nextTier.minScore - currentScore : 0;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Tier badges inline */}
        <div className="flex items-center justify-between">
          {TRUST_TIERS.map((tier, index) => {
            const isCurrentTier = index === currentTierIndex;
            const isPast = index < currentTierIndex;
            const isFuture = index > currentTierIndex;

            return (
              <div
                key={tier.name}
                className={`flex flex-col items-center ${
                  isCurrentTier ? 'scale-110' : isFuture ? 'opacity-40' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    isCurrentTier
                      ? 'bg-primary-100 ring-2 ring-primary-500'
                      : isPast
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {tier.icon}
                </div>
                <span className={`text-xs mt-1 ${isCurrentTier ? 'font-semibold text-primary-700' : 'text-gray-500'}`}>
                  {tier.minScore}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentScore / 100) * 100}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow"
            style={{ left: `calc(${currentScore}% - 8px)` }}
          />
        </div>

        {/* Next tier info */}
        {nextTier && showLevelUp && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {pointsToNext} points to {nextTier.name}
            </span>
            <Link href="/dashboard/integrate" className="text-primary-600 hover:text-primary-700 font-medium">
              Level up →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentTier.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{currentTier.name}</h3>
            <p className="text-sm text-gray-500">Trust Score: {currentScore}/100</p>
          </div>
        </div>
        {nextTier && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Next: {nextTier.name}</p>
            <p className="text-sm font-medium text-primary-600">{pointsToNext} points away</p>
          </div>
        )}
      </div>

      {/* Visual tier progression */}
      <div className="relative pt-8 pb-4">
        {/* Connection line */}
        <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-12 left-0 h-1 bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${(currentScore / 100) * 100}%` }}
        />

        {/* Tier markers */}
        <div className="relative flex justify-between">
          {TRUST_TIERS.map((tier, index) => {
            const isCurrentTier = index === currentTierIndex;
            const isPast = index < currentTierIndex;
            const isFuture = index > currentTierIndex;

            return (
              <div key={tier.name} className="flex flex-col items-center" style={{ width: '18%' }}>
                {/* Icon bubble */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    isCurrentTier
                      ? 'bg-primary-100 ring-4 ring-primary-300 scale-110'
                      : isPast
                        ? 'bg-green-100 ring-2 ring-green-300'
                        : 'bg-gray-100'
                  }`}
                >
                  {tier.icon}
                  {isPast && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Tier name and score */}
                <div className={`mt-2 text-center ${isFuture ? 'opacity-50' : ''}`}>
                  <p className={`text-xs font-medium ${isCurrentTier ? 'text-primary-700' : 'text-gray-700'}`}>
                    {tier.name}
                  </p>
                  <p className="text-xs text-gray-500">{tier.minScore}+</p>
                </div>

                {/* Unlocks */}
                {isCurrentTier && (
                  <div className="mt-2 p-2 bg-primary-50 rounded-lg w-full">
                    <p className="text-xs font-medium text-primary-800 mb-1">Current perks:</p>
                    <ul className="text-xs text-primary-600 space-y-0.5">
                      {tier.perks.map((perk, i) => (
                        <li key={i}>✓ {perk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next tier preview */}
                {isCurrentTier && nextTier && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg w-full border border-dashed border-gray-300">
                    <p className="text-xs font-medium text-gray-600 mb-1">Unlock next:</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {nextTier.perks.map((perk, i) => (
                        <li key={i}>🔒 {perk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level up CTA */}
      {showLevelUp && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
          <div>
            <p className="font-medium text-primary-900">Want to level up faster?</p>
            <p className="text-sm text-primary-700">
              Capture more agreements compliantly to increase your trust score.
            </p>
          </div>
          <Link
            href="/dashboard/integrate"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            View Guide
          </Link>
        </div>
      )}
    </div>
  );
}
