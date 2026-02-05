'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AnalysisResult {
  success: boolean;
  merchantName?: string;
  riskScore?: number;
  riskFlags?: Array<{
    flag: string;
    label: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  extractedTerms?: {
    refundPolicy?: { type: string; window?: string };
    cancellationPolicy?: { fee?: number; feeType?: string };
    disputeResolution?: { method: string; classActionWaiver: boolean };
    autoRenewal?: { enabled: boolean; frequency?: string };
    dataUsage?: { thirdPartySharing: boolean };
  };
  plainSummary?: string;
  error?: string;
}

const RISK_FLAG_INFO: Record<string, { label: string; description: string; severity: 'high' | 'medium' | 'low' }> = {
  BINDING_ARBITRATION: { label: 'Binding Arbitration', description: 'Waives your right to sue in court', severity: 'high' },
  CHARGEBACK_WAIVER: { label: 'Chargeback Waiver', description: 'Waives payment dispute rights', severity: 'high' },
  CLASS_ACTION_WAIVER: { label: 'Class Action Waiver', description: 'Cannot join class action lawsuits', severity: 'medium' },
  AUTO_RENEWAL_HIDDEN: { label: 'Hidden Auto-Renewal', description: 'Unclear automatic renewal terms', severity: 'medium' },
  NON_REFUNDABLE: { label: 'Non-Refundable', description: 'No refunds under any circumstances', severity: 'high' },
  FOREIGN_JURISDICTION: { label: 'Foreign Jurisdiction', description: 'Disputes in inconvenient location', severity: 'medium' },
  BROAD_INDEMNIFICATION: { label: 'Broad Indemnification', description: 'You may be liable for merchant issues', severity: 'high' },
  DATA_SHARING_EXTENSIVE: { label: 'Extensive Data Sharing', description: 'Your data shared with many parties', severity: 'medium' },
  SHORT_DISPUTE_WINDOW: { label: 'Short Dispute Window', description: 'Limited time to raise concerns', severity: 'medium' },
  PRICE_NOT_GUARANTEED: { label: 'Price Not Guaranteed', description: 'Price may change after agreement', severity: 'low' },
};

const EXAMPLE_URLS = [
  { name: 'Google ToS', url: 'https://policies.google.com/terms' },
  { name: 'OpenAI Terms', url: 'https://openai.com/policies/terms-of-use' },
  { name: 'AWS Terms', url: 'https://aws.amazon.com/service-terms/' },
  { name: 'Stripe Terms', url: 'https://stripe.com/legal/ssa' },
];

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [revealedFlags, setRevealedFlags] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'terms' | 'raw'>('summary');
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  // Auto-fill and analyze if URL param provided
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !autoAnalyzed) {
      setInput(urlParam);
      setAutoAnalyzed(true);
    }
  }, [searchParams, autoAnalyzed]);

  // Auto-analyze when input is set from URL param
  useEffect(() => {
    if (autoAnalyzed && input && !result && !isAnalyzing) {
      handleAnalyze();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyzed, input]);

  // Dramatic reveal of risk flags one by one
  useEffect(() => {
    if (result?.riskFlags && revealedFlags < result.riskFlags.length) {
      const timer = setTimeout(() => {
        setRevealedFlags((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [result, revealedFlags]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setRevealedFlags(0);

    try {
      const response = await fetch('/api/playground/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          type: inputType,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Analysis failed. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score >= 70) return 'Low Risk';
    if (score >= 40) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🧾</span>
            </div>
            <span className="font-semibold text-gray-900">RECEIPTS</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Go to Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Agreement Risk Scanner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste any Terms of Service. Watch AI find the traps in seconds.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            {/* Input Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputType('url')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === 'url'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Paste URL
              </button>
              <button
                onClick={() => setInputType('text')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === 'text'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Paste Text
              </button>
            </div>

            {/* Input Field */}
            {inputType === 'url' ? (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://example.com/terms-of-service"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            ) : (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste the terms of service text here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            )}

            {/* Example URLs */}
            {inputType === 'url' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Try:</span>
                {EXAMPLE_URLS.map((example) => (
                  <button
                    key={example.url}
                    onClick={() => setInput(example.url)}
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {example.name}
                  </button>
                ))}
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className={`mt-4 w-full py-3 rounded-lg font-semibold text-lg transition-all ${
                isAnalyzing || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning for risks...
                </span>
              ) : (
                'Analyze Agreement'
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="max-w-4xl mx-auto">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Risk Score Header */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {result.merchantName || 'Agreement Analysis'}
                      </h2>
                      <p className="text-gray-500 mt-1">
                        {result.riskFlags?.length || 0} risk flags detected
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getRiskScoreColor(result.riskScore || 50)}`}>
                        {result.riskScore || 50}
                      </div>
                      <div className={`text-sm font-medium ${getRiskScoreColor(result.riskScore || 50)}`}>
                        {getRiskScoreLabel(result.riskScore || 50)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Flags - Dramatic Reveal */}
                {result.riskFlags && result.riskFlags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Risk Flags Detected
                    </h3>
                    <div className="space-y-3">
                      {result.riskFlags.map((flag, index) => (
                        <div
                          key={flag.flag}
                          className={`transform transition-all duration-500 ${
                            index < revealedFlags
                              ? 'opacity-100 translate-x-0'
                              : 'opacity-0 -translate-x-4'
                          }`}
                        >
                          <div
                            className={`p-4 rounded-lg border-l-4 ${
                              flag.severity === 'high'
                                ? 'bg-red-50 border-red-500'
                                : flag.severity === 'medium'
                                  ? 'bg-yellow-50 border-yellow-500'
                                  : 'bg-blue-50 border-blue-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  flag.severity === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : flag.severity === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {flag.severity.toUpperCase()}
                              </span>
                              <span className="font-semibold text-gray-900">{flag.label}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabbed Content */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200">
                    <nav className="flex">
                      {(['summary', 'terms', 'raw'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab
                              ? 'border-primary-600 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab === 'summary' ? 'Plain English' : tab === 'terms' ? 'Extracted Terms' : 'API Response'}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'summary' && (
                      <div>
                        <p className="text-gray-700 leading-relaxed">
                          {result.plainSummary || 'No summary available.'}
                        </p>
                      </div>
                    )}

                    {activeTab === 'terms' && result.extractedTerms && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.extractedTerms.refundPolicy && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Refund Policy</h4>
                            <p className="text-sm text-gray-600">
                              Type: <span className="font-medium">{result.extractedTerms.refundPolicy.type}</span>
                              {result.extractedTerms.refundPolicy.window && (
                                <> | Window: <span className="font-medium">{result.extractedTerms.refundPolicy.window}</span></>
                              )}
                            </p>
                          </div>
                        )}
                        {result.extractedTerms.disputeResolution && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Dispute Resolution</h4>
                            <p className="text-sm text-gray-600">
                              Method: <span className="font-medium">{result.extractedTerms.disputeResolution.method}</span>
                              {result.extractedTerms.disputeResolution.classActionWaiver && (
                                <span className="ml-2 text-red-600 font-medium">Class action waived</span>
                              )}
                            </p>
                          </div>
                        )}
                        {result.extractedTerms.autoRenewal && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Auto-Renewal</h4>
                            <p className="text-sm text-gray-600">
                              {result.extractedTerms.autoRenewal.enabled ? (
                                <span className="text-yellow-600 font-medium">
                                  Enabled {result.extractedTerms.autoRenewal.frequency && `(${result.extractedTerms.autoRenewal.frequency})`}
                                </span>
                              ) : (
                                <span className="text-green-600 font-medium">Not enabled</span>
                              )}
                            </p>
                          </div>
                        )}
                        {result.extractedTerms.dataUsage && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Data Sharing</h4>
                            <p className="text-sm text-gray-600">
                              Third-party sharing:{' '}
                              <span className={result.extractedTerms.dataUsage.thirdPartySharing ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
                                {result.extractedTerms.dataUsage.thirdPartySharing ? 'Yes' : 'No'}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'raw' && (
                      <div>
                        <p className="text-sm text-gray-500 mb-3">
                          This is what the RECEIPTS API returns. Copy this to integrate:
                        </p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Share This Finding - VIRAL LOOP */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">🚨 Share This Finding</h3>
                    <p className="text-gray-600">
                      Help others know what they&apos;re agreeing to
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center mb-6">
                    {/* Twitter Share */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `🚨 I just scanned ${result.merchantName || 'a company'}'s Terms of Service\n\nRisk Score: ${result.riskScore}/100 (${getRiskScoreLabel(result.riskScore || 0)})\n\nFound ${result.riskFlags?.length || 0} risk flags${result.riskFlags && result.riskFlags.length > 0 ? ` including:\n${result.riskFlags.slice(0, 2).map(f => `⚠️ ${f.label}`).join('\n')}` : ''}\n\nScan any ToS free:`
                      )}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Share on X
                    </a>

                    {/* Copy Link */}
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(window.location.href);
                        const btn = document.getElementById('copy-link-btn');
                        if (btn) {
                          btn.textContent = '✓ Copied!';
                          setTimeout(() => { btn.textContent = '📋 Copy Link'; }, 2000);
                        }
                      }}
                      id="copy-link-btn"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      📋 Copy Link
                    </button>

                    {/* Native Share (mobile) */}
                    {typeof navigator !== 'undefined' && navigator.share && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.share({
                              title: `${result.merchantName || 'ToS'} Risk Analysis`,
                              text: `🚨 ${result.merchantName || 'This company'}'s ToS has ${result.riskFlags?.length || 0} risk flags. Risk score: ${result.riskScore}/100`,
                              url: window.location.href,
                            });
                          } catch {
                            // User cancelled
                          }
                        }}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-primary-100 text-primary-700 rounded-lg font-semibold hover:bg-primary-200 transition-colors"
                      >
                        📤 Share
                      </button>
                    )}
                  </div>

                  {/* Shareable preview text */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 font-mono">
                    <p className="mb-1">🚨 {result.merchantName || 'Company'}&apos;s Terms of Service</p>
                    <p className="mb-1">Risk Score: <span className={getRiskScoreColor(result.riskScore || 0)}>{result.riskScore}/100</span></p>
                    {result.riskFlags && result.riskFlags.length > 0 && (
                      <p>⚠️ {result.riskFlags[0].label}</p>
                    )}
                  </div>
                </div>

                {/* Email Capture - ToS Change Alerts */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🔔</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">Get notified when this ToS changes</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Companies update their terms all the time. We&apos;ll alert you when {result.merchantName || 'this company'} makes changes.
                      </p>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const emailInput = form.elements.namedItem('email') as HTMLInputElement;
                          const submitBtn = form.elements.namedItem('submit') as HTMLButtonElement;

                          if (!emailInput.value) return;

                          submitBtn.textContent = 'Subscribing...';
                          submitBtn.disabled = true;

                          try {
                            const res = await fetch('/api/subscribe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: emailInput.value,
                                tosUrl: input,
                                merchantName: result.merchantName,
                              }),
                            });

                            if (res.ok) {
                              submitBtn.textContent = '✓ Subscribed!';
                              emailInput.value = '';
                            } else {
                              submitBtn.textContent = 'Try again';
                              submitBtn.disabled = false;
                            }
                          } catch {
                            submitBtn.textContent = 'Try again';
                            submitBtn.disabled = false;
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email"
                          name="email"
                          placeholder="you@email.com"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                        <button
                          type="submit"
                          name="submit"
                          className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                        >
                          Notify Me
                        </button>
                      </form>
                      <p className="text-xs text-gray-500 mt-2">No spam. Only ToS change alerts.</p>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">Protect Your Users & Agents</h3>
                  <p className="text-primary-100 mb-6 max-w-lg mx-auto">
                    Integrate RECEIPTS to automatically capture and validate every agreement your AI agent encounters.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link
                      href="/dashboard/integrate"
                      className="px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Get API Access
                    </Link>
                    <Link
                      href="/hall-of-shame"
                      className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors"
                    >
                      View Hall of Shame
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How It Works (shown when no result) */}
        {!result && !isAnalyzing && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Paste Terms</h3>
                <p className="text-gray-600 text-sm">
                  Enter a URL or paste the full terms of service text
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Analyzes</h3>
                <p className="text-gray-600 text-sm">
                  Our AI extracts key terms and identifies risky clauses
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">See Risks</h3>
                <p className="text-gray-600 text-sm">
                  Get a risk score and detailed breakdown of concerning clauses
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RECEIPTS - Every agreement. Every agent. Every time.</p>
          <p className="mt-1">An agent without receipts is an agent that can be blamed for anything.</p>
        </div>
      </footer>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🧾</span>
          </div>
          <p className="text-gray-600">Loading Risk Scanner...</p>
        </div>
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  );
}
