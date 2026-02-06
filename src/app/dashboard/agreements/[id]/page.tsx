'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { RiskBadgeList } from '@/components/RiskBadge';
import type { Agreement } from '@/types';

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'terms' | 'raw'>('summary');

  useEffect(() => {
    fetch(`/api/agreements/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push('/dashboard/agreements');
          return;
        }
        setAgreement(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch agreement:', err);
        router.push('/dashboard/agreements');
      });
  }, [params.id, router]);

  if (loading || !agreement) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
    disputed: 'bg-danger-100 text-danger-800',
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/dashboard/agreements" className="text-gray-500 hover:text-gray-700">
              Agreements
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{agreement.merchantName}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{agreement.merchantName}</h1>
              <span className={`badge ${statusColors[agreement.status]}`}>{agreement.status}</span>
            </div>
            <p className="text-gray-600">{agreement.documentTitle}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/caught/demo-${agreement.id.replace('demo-', '')}`}
              className="btn-secondary flex items-center gap-2"
              target="_blank"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </Link>
            <Link
              href={`/dashboard/chat?agreementId=${agreement.id}`}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Ask AI
            </Link>
            {agreement.status !== 'disputed' && (
              <Link href={`/dashboard/disputes/new?agreementId=${agreement.id}`} className="btn-danger">
                Start Dispute
              </Link>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
            <p className="font-medium text-gray-900">{agreement.merchantCategory}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Captured</p>
            <p className="font-medium text-gray-900">{format(new Date(agreement.capturedAt), 'MMM d, yyyy h:mm a')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Agent ID</p>
            <p className="font-medium text-gray-900 font-mono text-sm">{agreement.agentId || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Document Hash</p>
            <p className="font-medium text-gray-900 font-mono text-sm truncate" title={agreement.documentHash}>
              {agreement.documentHash.slice(0, 20)}...
            </p>
          </div>
        </div>

        {/* Verification Hash */}
        {agreement.blockchainTxId && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary-800">Verification Hash</p>
              <p className="text-xs text-primary-600 font-mono">{agreement.blockchainTxId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Risk Flags */}
      {agreement.riskFlags.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Risk Flags ({agreement.riskFlags.length})
          </h2>
          <RiskBadgeList flags={agreement.riskFlags} showDescription />
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {(['summary', 'terms', 'raw'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'summary' && 'Plain English Summary'}
                {tab === 'terms' && 'Extracted Terms'}
                {tab === 'raw' && 'Original Document'}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed">{agreement.plainSummary}</p>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            {/* Refund Policy */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Refund Policy</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Type:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.refundPolicy.type === 'refundable'
                      ? 'badge-success'
                      : agreement.extractedTerms.refundPolicy.type === 'non-refundable'
                        ? 'badge-danger'
                        : 'badge-warning'
                  }`}
                >
                  {agreement.extractedTerms.refundPolicy.type}
                </span>
              </p>
              {agreement.extractedTerms.refundPolicy.window && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Window:</span> {agreement.extractedTerms.refundPolicy.window}
                </p>
              )}
              {agreement.extractedTerms.refundPolicy.conditions && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Conditions:</span>
                  <ul className="list-disc list-inside mt-1">
                    {agreement.extractedTerms.refundPolicy.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Cancellation Policy */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
              {agreement.extractedTerms.cancellationPolicy.fee !== undefined && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Fee:</span> ${agreement.extractedTerms.cancellationPolicy.fee}
                  {agreement.extractedTerms.cancellationPolicy.feeType === 'percentage' && '%'}
                </p>
              )}
              {agreement.extractedTerms.cancellationPolicy.window && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Window:</span> {agreement.extractedTerms.cancellationPolicy.window}
                </p>
              )}
              {agreement.extractedTerms.cancellationPolicy.conditions && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Conditions:</span>
                  <ul className="list-disc list-inside mt-1">
                    {agreement.extractedTerms.cancellationPolicy.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Dispute Resolution */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Dispute Resolution</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Method:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.disputeResolution.method === 'arbitration'
                      ? 'badge-danger'
                      : agreement.extractedTerms.disputeResolution.method === 'courts'
                        ? 'badge-success'
                        : 'badge-neutral'
                  }`}
                >
                  {agreement.extractedTerms.disputeResolution.method}
                </span>
              </p>
              {agreement.extractedTerms.disputeResolution.jurisdiction && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Jurisdiction:</span>{' '}
                  {agreement.extractedTerms.disputeResolution.jurisdiction}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Class Action Waiver:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.disputeResolution.classActionWaiver ? 'badge-danger' : 'badge-success'
                  }`}
                >
                  {agreement.extractedTerms.disputeResolution.classActionWaiver ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Chargeback Rights Preserved:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.disputeResolution.chargebackRightsPreserved
                      ? 'badge-success'
                      : 'badge-danger'
                  }`}
                >
                  {agreement.extractedTerms.disputeResolution.chargebackRightsPreserved ? 'Yes' : 'No'}
                </span>
              </p>
            </div>

            {/* Auto-Renewal */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Auto-Renewal</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Enabled:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.autoRenewal.enabled ? 'badge-warning' : 'badge-success'
                  }`}
                >
                  {agreement.extractedTerms.autoRenewal.enabled ? 'Yes' : 'No'}
                </span>
              </p>
              {agreement.extractedTerms.autoRenewal.frequency && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Frequency:</span> {agreement.extractedTerms.autoRenewal.frequency}
                </p>
              )}
              {agreement.extractedTerms.autoRenewal.cancellationNotice && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cancellation Notice:</span>{' '}
                  {agreement.extractedTerms.autoRenewal.cancellationNotice}
                </p>
              )}
            </div>

            {/* Data Usage */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Data Usage</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Third-Party Sharing:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.dataUsage.thirdPartySharing ? 'badge-warning' : 'badge-success'
                  }`}
                >
                  {agreement.extractedTerms.dataUsage.thirdPartySharing ? 'Yes' : 'No'}
                </span>
              </p>
              {agreement.extractedTerms.dataUsage.retentionPeriod && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Retention Period:</span>{' '}
                  {agreement.extractedTerms.dataUsage.retentionPeriod}
                </p>
              )}
              {agreement.extractedTerms.dataUsage.purposes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Purposes:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {agreement.extractedTerms.dataUsage.purposes.map((p, i) => (
                      <span key={i} className="badge badge-neutral">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Liability */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Liability</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Indemnification Required:</span>{' '}
                <span
                  className={`badge ${
                    agreement.extractedTerms.liability.indemnification ? 'badge-danger' : 'badge-success'
                  }`}
                >
                  {agreement.extractedTerms.liability.indemnification ? 'Yes' : 'No'}
                </span>
              </p>
              {agreement.extractedTerms.liability.maxLiability && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Max Liability:</span> {agreement.extractedTerms.liability.maxLiability}
                </p>
              )}
              {agreement.extractedTerms.liability.limitations.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Limitations:</span>
                  <ul className="list-disc list-inside mt-1">
                    {agreement.extractedTerms.liability.limitations.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="bg-gray-900 rounded-lg p-6 overflow-auto max-h-[600px]">
            <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">{agreement.rawText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
