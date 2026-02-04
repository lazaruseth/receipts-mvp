'use client';

import { RISK_FLAG_LABELS, type RiskFlag } from '@/types';

interface RiskBadgeProps {
  flag: RiskFlag;
  showDescription?: boolean;
}

export function RiskBadge({ flag, showDescription = false }: RiskBadgeProps) {
  const info = RISK_FLAG_LABELS[flag];

  if (!info) {
    return null;
  }

  const severityColors = {
    high: 'bg-danger-100 text-danger-800 border-danger-200',
    medium: 'bg-warning-100 text-warning-800 border-warning-200',
    low: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${severityColors[info.severity]}`}
      title={info.description}
    >
      {info.severity === 'high' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{info.label}</span>
      {showDescription && <span className="opacity-75">- {info.description}</span>}
    </div>
  );
}

interface RiskBadgeListProps {
  flags: RiskFlag[];
  limit?: number;
  showDescription?: boolean;
}

export function RiskBadgeList({ flags, limit, showDescription = false }: RiskBadgeListProps) {
  const displayFlags = limit ? flags.slice(0, limit) : flags;
  const remaining = limit ? flags.length - limit : 0;

  return (
    <div className="flex flex-wrap gap-2">
      {displayFlags.map((flag) => (
        <RiskBadge key={flag} flag={flag} showDescription={showDescription} />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
