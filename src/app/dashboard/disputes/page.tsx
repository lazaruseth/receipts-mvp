'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Dispute, Agreement } from '@/types';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/disputes').then((res) => res.json()),
      fetch('/api/agreements').then((res) => res.json()),
    ]).then(([disputesData, agreementsData]) => {
      setDisputes(disputesData.disputes);
      setAgreements(agreementsData.agreements);
      setLoading(false);
    });
  }, []);

  const getAgreement = (agreementId: string) => agreements.find((a) => a.id === agreementId);

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-primary-100 text-primary-700',
    in_review: 'bg-warning-100 text-warning-700',
    resolved: 'bg-green-100 text-green-700',
    rejected: 'bg-danger-100 text-danger-700',
  };

  const issueTypeLabels = {
    cancelled: 'Service Cancelled',
    not_delivered: 'Not Delivered',
    different_than_agreed: 'Different Than Agreed',
    unauthorized: 'Unauthorized Transaction',
    other: 'Other',
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Center</h1>
          <p className="text-gray-600">Manage and track your agreement disputes</p>
        </div>
        <Link href="/dashboard/disputes/new" className="btn-primary">
          Start New Dispute
        </Link>
      </div>

      {disputes.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes yet</h3>
          <p className="text-gray-500 mb-6">When you need to dispute an agreement, you can start the process here.</p>
          <Link href="/dashboard/disputes/new" className="btn-primary">
            Start a Dispute
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const agreement = getAgreement(dispute.agreementId);
            return (
              <div key={dispute.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{agreement?.merchantName || 'Unknown Merchant'}</h3>
                      <span className={`badge ${statusColors[dispute.status]}`}>{dispute.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{issueTypeLabels[dispute.issueType]}</p>
                    <p className="text-gray-600 line-clamp-2">{dispute.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span>Created {format(new Date(dispute.createdAt), 'MMM d, yyyy')}</span>
                      {dispute.submittedTo && <span>Submitted to: {dispute.submittedTo}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {dispute.status === 'draft' && (
                      <Link href={`/dashboard/disputes/${dispute.id}`} className="btn-primary text-sm">
                        Submit Dispute
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/agreements/${dispute.agreementId}`}
                      className="btn-secondary text-sm"
                    >
                      View Agreement
                    </Link>
                  </div>
                </div>

                {/* Evidence Package Preview */}
                {dispute.evidencePackage && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Evidence Package</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{dispute.evidencePackage.violationAnalysis}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
