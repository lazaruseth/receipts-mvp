'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Agreement, ExtractedTerms } from '@/types';

// Local type for API response (more flexible than frontend Dispute type)
interface DisputeData {
  id: string;
  agreementId: string;
  userId: string;
  issueType: 'cancelled' | 'not_delivered' | 'different_than_agreed' | 'unauthorized' | 'other';
  description: string;
  evidencePackage?: {
    originalAgreement: string;
    timestampProof?: string;
    extractedTerms: ExtractedTerms;
    violationAnalysis: string;
  };
  status: 'draft' | 'submitted' | 'in_review' | 'resolved' | 'rejected';
  submittedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<'merchant' | 'issuer'>('merchant');
  const [merchantEmail, setMerchantEmail] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [disputeRes, agreementsRes] = await Promise.all([
          fetch(`/api/disputes/${disputeId}`),
          fetch('/api/agreements'),
        ]);

        if (!disputeRes.ok) {
          router.push('/dashboard/disputes');
          return;
        }

        const disputeData = await disputeRes.json();
        const agreementsData = await agreementsRes.json();

        setDispute(disputeData.dispute);
        const relatedAgreement = agreementsData.agreements?.find(
          (a: Agreement) => a.id === disputeData.dispute.agreementId
        );
        setAgreement(relatedAgreement || null);
      } catch (error) {
        console.error('Failed to fetch dispute:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [disputeId, router]);

  const handleSubmit = async () => {
    if (!dispute) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/disputes/${disputeId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: submitTarget,
          merchantEmail: submitTarget === 'merchant' ? merchantEmail : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDispute(data.dispute);
        setShowSubmitModal(false);
      }
    } catch (error) {
      console.error('Failed to submit dispute:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    submitted: 'bg-blue-100 text-blue-700 border-blue-200',
    in_review: 'bg-amber-100 text-amber-700 border-amber-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusIcons: Record<string, JSX.Element> = {
    draft: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    submitted: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    in_review: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    resolved: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    rejected: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const issueTypeLabels: Record<string, string> = {
    cancelled: 'Service Cancelled',
    not_delivered: 'Not Delivered',
    different_than_agreed: 'Different Than Agreed',
    unauthorized: 'Unauthorized Transaction',
    other: 'Other Issue',
  };

  const timelineSteps = [
    { status: 'draft', label: 'Draft Created', description: 'Evidence package prepared' },
    { status: 'submitted', label: 'Submitted', description: 'Sent to merchant/issuer' },
    { status: 'in_review', label: 'In Review', description: 'Awaiting response' },
    { status: 'resolved', label: 'Resolved', description: 'Dispute concluded' },
  ];

  const getStepStatus = (stepStatus: string, currentStatus: string) => {
    const order = ['draft', 'submitted', 'in_review', 'resolved'];
    const stepIndex = order.indexOf(stepStatus);
    const currentIndex = order.indexOf(currentStatus);

    if (currentStatus === 'rejected') {
      return stepIndex <= 1 ? 'completed' : stepStatus === 'resolved' ? 'rejected' : 'pending';
    }
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Dispute not found</h2>
          <p className="text-gray-600 mt-2">This dispute may have been deleted or you don&apos;t have access.</p>
          <Link href="/dashboard/disputes" className="btn-primary mt-4 inline-block">
            Back to Disputes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/disputes"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Disputes
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {agreement?.merchantName || 'Unknown Merchant'}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[dispute.status]}`}>
                {dispute.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600">{issueTypeLabels[dispute.issueType]}</p>
            <p className="text-sm text-gray-500 mt-1">
              Created {format(new Date(dispute.createdAt), 'MMMM d, yyyy')} • ID: {dispute.id.slice(0, 8)}...
            </p>
          </div>

          {dispute.status === 'draft' && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary"
            >
              Submit Dispute
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispute Timeline</h2>
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-10"></div>
          <div
            className="absolute left-0 top-5 h-0.5 bg-primary-500 -z-10 transition-all duration-500"
            style={{
              width: dispute.status === 'draft' ? '0%' :
                     dispute.status === 'submitted' ? '33%' :
                     dispute.status === 'in_review' ? '66%' : '100%'
            }}
          ></div>

          {timelineSteps.map((step, index) => {
            const stepStatus = getStepStatus(step.status, dispute.status);
            return (
              <div key={step.status} className="flex flex-col items-center text-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    stepStatus === 'completed'
                      ? 'bg-primary-500 text-white'
                      : stepStatus === 'current'
                      ? 'bg-primary-100 text-primary-600 ring-4 ring-primary-100'
                      : stepStatus === 'rejected'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {stepStatus === 'completed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : stepStatus === 'rejected' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    statusIcons[step.status]
                  )}
                </div>
                <p className={`text-sm font-medium ${
                  stepStatus === 'pending' ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>
            );
          })}
        </div>

        {dispute.submittedTo && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Submitted to:</span> {dispute.submittedTo}
            </p>
          </div>
        )}
      </div>

      {/* Resolution (if resolved or rejected) */}
      {(dispute.status === 'resolved' || dispute.status === 'rejected') && dispute.resolution && (
        <div className={`card mb-6 ${dispute.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            {dispute.status === 'resolved' ? (
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <h3 className={`font-semibold ${dispute.status === 'resolved' ? 'text-green-800' : 'text-red-800'}`}>
                {dispute.status === 'resolved' ? 'Dispute Resolved' : 'Dispute Rejected'}
              </h3>
              <p className={`mt-1 ${dispute.status === 'resolved' ? 'text-green-700' : 'text-red-700'}`}>
                {dispute.resolution}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
      </div>

      {/* Evidence Package */}
      {dispute.evidencePackage && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence Package</h2>
          <div className="space-y-4">
            {/* Violation Analysis */}
            {dispute.evidencePackage.violationAnalysis && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI-Generated Violation Analysis
                </h3>
                <p className="text-amber-900">{dispute.evidencePackage.violationAnalysis}</p>
              </div>
            )}

            {/* Original Agreement */}
            {dispute.evidencePackage.originalAgreement && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Original Agreement</p>
                    <p className="text-sm text-gray-500">Timestamped and immutable</p>
                  </div>
                </div>
                <a
                  href={dispute.evidencePackage.originalAgreement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  View Document
                </a>
              </div>
            )}

            {/* Timestamp Proof */}
            {dispute.evidencePackage.timestampProof && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Timestamp Proof</p>
                    <p className="text-sm text-gray-500 font-mono">{dispute.evidencePackage.timestampProof}</p>
                  </div>
                </div>
                <span className="badge bg-green-100 text-green-700">Verified</span>
              </div>
            )}

            {/* Extracted Terms */}
            {dispute.evidencePackage.extractedTerms && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Extracted Terms</h3>
                <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(dispute.evidencePackage.extractedTerms, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Agreement */}
      {agreement && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Agreement</h2>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{agreement.merchantName}</h3>
              <p className="text-sm text-gray-500">{agreement.documentTitle}</p>
              <p className="text-sm text-gray-500 mt-1">
                Captured {format(new Date(agreement.capturedAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <Link
              href={`/dashboard/agreements/${agreement.id}`}
              className="btn-secondary text-sm"
            >
              View Agreement
            </Link>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Dispute</h2>
            <p className="text-gray-600 mb-6">
              Choose where to submit your dispute. RECEIPTS will include your complete evidence package.
            </p>

            <div className="space-y-3 mb-6">
              <label
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  submitTarget === 'merchant'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="submitTarget"
                  value="merchant"
                  checked={submitTarget === 'merchant'}
                  onChange={() => setSubmitTarget('merchant')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Submit to Merchant</p>
                  <p className="text-sm text-gray-500">
                    Send directly to {agreement?.merchantName || 'the merchant'}. Recommended first step.
                  </p>
                  {submitTarget === 'merchant' && (
                    <input
                      type="email"
                      placeholder="Merchant support email address"
                      value={merchantEmail}
                      onChange={(e) => setMerchantEmail(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  )}
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  submitTarget === 'issuer'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="submitTarget"
                  value="issuer"
                  checked={submitTarget === 'issuer'}
                  onChange={() => setSubmitTarget('issuer')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Escalate to Card Issuer</p>
                  <p className="text-sm text-gray-500">
                    File a chargeback with your payment provider. Use if merchant is unresponsive.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1"
                disabled={submitting || (submitTarget === 'merchant' && !merchantEmail)}
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
