'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Agreement, Dispute } from '@/types';

function NewDisputeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialAgreementId = searchParams.get('agreementId');

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    agreementId: initialAgreementId || '',
    issueType: '' as Dispute['issueType'] | '',
    description: '',
  });

  useEffect(() => {
    fetch('/api/agreements')
      .then((res) => res.json())
      .then((data) => {
        setAgreements(data.agreements);
        setLoading(false);
      });
  }, []);

  const selectedAgreement = agreements.find((a) => a.id === formData.agreementId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreementId || !formData.issueType || !formData.description) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/disputes');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      alert('Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
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
            <Link href="/dashboard/disputes" className="text-gray-500 hover:text-gray-700">
              Disputes
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">New Dispute</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Start a Dispute</h1>
        <p className="text-gray-600">Create an evidence package to dispute an agreement violation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agreement Selection */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-900 mb-3">Select Agreement</label>
          <select
            className="input"
            value={formData.agreementId}
            onChange={(e) => setFormData({ ...formData, agreementId: e.target.value })}
            required
          >
            <option value="">Choose an agreement...</option>
            {agreements.map((agreement) => (
              <option key={agreement.id} value={agreement.id}>
                {agreement.merchantName} - {agreement.documentTitle}
              </option>
            ))}
          </select>

          {selectedAgreement && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{selectedAgreement.merchantName}</p>
              <p className="text-sm text-gray-600">{selectedAgreement.documentTitle}</p>
              <p className="text-xs text-gray-500 mt-2">{selectedAgreement.plainSummary}</p>
              {selectedAgreement.riskFlags.length > 0 && (
                <p className="text-xs text-warning-600 mt-2">
                  {selectedAgreement.riskFlags.length} risk flag{selectedAgreement.riskFlags.length !== 1 ? 's' : ''}{' '}
                  identified
                </p>
              )}
            </div>
          )}
        </div>

        {/* Issue Type */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-900 mb-3">Issue Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'cancelled', label: 'Service Cancelled', icon: '❌', desc: 'Service was cancelled unexpectedly' },
              { value: 'not_delivered', label: 'Not Delivered', icon: '📦', desc: 'Never received what was promised' },
              {
                value: 'different_than_agreed',
                label: 'Different Than Agreed',
                icon: '⚠️',
                desc: 'Received something different',
              },
              {
                value: 'unauthorized',
                label: 'Unauthorized',
                icon: '🚫',
                desc: 'Transaction was not authorized',
              },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, issueType: type.value as Dispute['issueType'] })}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.issueType === type.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">{type.icon}</span>
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-900 mb-3">Describe the Issue</label>
          <textarea
            className="input min-h-[150px]"
            placeholder="Explain what happened and why you believe the agreement terms were violated..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            minLength={10}
          />
          <p className="text-xs text-gray-500 mt-2">
            Be specific about dates, amounts, and how the merchant violated the agreed terms.
          </p>
        </div>

        {/* Evidence Preview */}
        {formData.agreementId && formData.issueType && formData.description.length >= 10 && (
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Evidence Package Preview
            </h3>
            <p className="text-sm text-primary-800 mb-3">
              When you submit this dispute, we&apos;ll automatically generate an evidence package including:
            </p>
            <ul className="text-sm text-primary-700 space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Original agreement document with timestamp proof
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Extracted terms showing merchant&apos;s commitments
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI-generated violation analysis
              </li>
              {selectedAgreement?.blockchainTxId && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Blockchain timestamp proof (immutable)
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || !formData.agreementId || !formData.issueType || formData.description.length < 10}
            className="btn-primary flex-1"
          >
            {submitting ? 'Creating Dispute...' : 'Create Dispute'}
          </button>
          <Link href="/dashboard/disputes" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewDisputePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewDisputeContent />
    </Suspense>
  );
}
