'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { RiskBadgeList } from './RiskBadge';
import type { Agreement } from '@/types';

interface AgreementCardProps {
  agreement: Agreement;
}

export function AgreementCard({ agreement }: AgreementCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
    disputed: 'bg-danger-100 text-danger-800',
  };

  const categoryIcons: Record<string, string> = {
    Travel: '✈️',
    Hospitality: '🏨',
    Software: '💻',
    'Cloud Services': '☁️',
    Retail: '🛒',
    Finance: '💳',
  };

  return (
    <Link href={`/dashboard/agreements/${agreement.id}`}>
      <div className="card hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryIcons[agreement.merchantCategory] || '📄'}</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {agreement.merchantName}
              </h3>
              <p className="text-sm text-gray-500">{agreement.merchantCategory}</p>
            </div>
          </div>
          <span className={`badge ${statusColors[agreement.status]}`}>{agreement.status}</span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agreement.plainSummary}</p>

        {agreement.riskFlags.length > 0 && (
          <div className="mb-4">
            <RiskBadgeList flags={agreement.riskFlags} limit={3} />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <span>Captured {format(new Date(agreement.capturedAt), 'MMM d, yyyy')}</span>
          {agreement.agentId && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Agent: {agreement.agentId.slice(0, 12)}...
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
