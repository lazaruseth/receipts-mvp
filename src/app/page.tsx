'use client';

import { useState } from 'react';
import Link from 'next/link';

const EXAMPLE_URLS = [
  { name: 'Google', url: 'https://policies.google.com/terms' },
  { name: 'OpenAI', url: 'https://openai.com/policies/terms-of-use' },
  { name: 'AWS', url: 'https://aws.amazon.com/service-terms/' },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    window.location.href = `/playground?url=${encodeURIComponent(url)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🧾</span>
            </div>
            <span className="text-xl font-bold text-gray-900">RECEIPTS</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/hall-of-shame" className="text-sm text-gray-600 hover:text-gray-900">
              Hall of Shame
            </Link>
            <Link href="/playground" className="text-sm text-gray-600 hover:text-gray-900">
              Risk Scanner
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero - Dispute Resolution Focus */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          87% of disputes resolved in user&apos;s favor
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          When AI Transactions Go Wrong,<br />
          <span className="text-primary-600">We Make Them Right</span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Your AI agent booked the wrong flight. The merchant won&apos;t refund.
          Their ToS says &quot;binding arbitration only.&quot;
          <br /><br />
          <strong>RECEIPTS fights back.</strong> We capture every agreement, analyze the fine print,
          and help you recover your money—even when merchants say no.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            href="/dashboard/disputes/new"
            className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
          >
            Start a Dispute
          </Link>
          <Link
            href="/playground"
            className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Check Any ToS
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">87%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">4.2</div>
            <div className="text-sm text-gray-500">Days Avg Resolution</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">$2.3M</div>
            <div className="text-sm text-gray-500">Recovered</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">How RECEIPTS Protects You</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            From the moment your agent accepts an agreement to the moment you get your money back
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📸</span>
              </div>
              <div className="text-sm text-primary-400 font-semibold mb-2">STEP 1</div>
              <h3 className="text-lg font-semibold mb-2">Capture</h3>
              <p className="text-gray-400 text-sm">
                Every agreement your agent accepts is timestamped and stored with immutable proof
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <div className="text-sm text-primary-400 font-semibold mb-2">STEP 2</div>
              <h3 className="text-lg font-semibold mb-2">Analyze</h3>
              <p className="text-gray-400 text-sm">
                When something goes wrong, AI finds the violations in their own terms
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚔️</span>
              </div>
              <div className="text-sm text-primary-400 font-semibold mb-2">STEP 3</div>
              <h3 className="text-lg font-semibold mb-2">Dispute</h3>
              <p className="text-gray-400 text-sm">
                Pre-written legal arguments based on their own ToS—submitted to merchant or card issuer
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <div className="text-sm text-green-400 font-semibold mb-2">STEP 4</div>
              <h3 className="text-lg font-semibold mb-2">Recover</h3>
              <p className="text-gray-400 text-sm">
                Get your money back, even from &quot;no refund&quot; merchants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem - Real Scenario */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                This happens every day
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-2xl">😤</span>
                  <div>
                    <div className="font-semibold text-gray-900">Agent books wrong dates</div>
                    <div className="text-sm text-gray-600">Hotel says &quot;non-refundable booking&quot;</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-2xl">😤</span>
                  <div>
                    <div className="font-semibold text-gray-900">Order never arrives</div>
                    <div className="text-sm text-gray-600">Merchant points to &quot;binding arbitration&quot; clause</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-2xl">😤</span>
                  <div>
                    <div className="font-semibold text-gray-900">Subscription auto-renewed</div>
                    <div className="text-sm text-gray-600">Company refuses refund citing ToS Section 12.4</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
              <div className="text-sm text-green-600 font-semibold mb-2">WITH RECEIPTS</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">You fight back with evidence</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Timestamped proof of what was agreed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">AI-generated legal arguments from their own terms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Submit to merchant or escalate to card issuer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Track resolution until you get your money back</span>
                </li>
              </ul>
              <Link
                href="/dashboard/disputes/new"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Start a Dispute
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Scanner (Secondary Feature) */}
      <section className="bg-gray-50 py-16 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Any Terms of Service</h2>
            <p className="text-gray-600">Scan before you agree. Know what traps are hiding in the fine print.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/terms-of-service"
                className="flex-1 px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                disabled={!url || isAnalyzing}
                className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {isAnalyzing ? 'Scanning...' : 'Scan'}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-500">Try:</span>
              {EXAMPLE_URLS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setUrl(example.url)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Shame Teaser */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Merchants With The Worst Dispute Records</h2>
            <p className="text-gray-600">Ranked by how hard they make it to get your money back</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌩️</span>
                  <div>
                    <div className="font-semibold text-gray-900">#1 Amazon Web Services</div>
                    <div className="text-xs text-gray-500">Cloud Services</div>
                  </div>
                </div>
                <div className="text-red-600 font-bold text-xl">15</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">No Chargebacks</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Arbitration Only</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <div className="font-semibold text-gray-900">#2 Uber</div>
                    <div className="text-xs text-gray-500">Transportation</div>
                  </div>
                </div>
                <div className="text-red-600 font-bold text-xl">22</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Price Changes</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">No Class Action</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎵</span>
                  <div>
                    <div className="font-semibold text-gray-900">#3 TikTok</div>
                    <div className="text-xs text-gray-500">Social Media</div>
                  </div>
                </div>
                <div className="text-red-600 font-bold text-xl">18</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Foreign Courts</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Data Collection</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/hall-of-shame"
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
            >
              See the full Hall of Shame
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* For Developers */}
      <section className="bg-gray-900 py-16 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-4">
              FOR AI DEVELOPERS
            </span>
            <h2 className="text-3xl font-bold mb-4">Protect Your Agent&apos;s Transactions</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Integrate RECEIPTS so when disputes happen, you have the evidence to win.
              Reduce chargebacks. Protect users. Build trust.
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="text-sm text-gray-400 mb-2 font-mono">// Protect every transaction:</div>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`const receipt = await receipts.capture({
  url: tosUrl,
  agentId: "your-agent-id",
  userId: "user-123",
  transactionAmount: 299.00
});

// When dispute needed:
const dispute = await receipts.createDispute({
  receiptId: receipt.id,
  issueType: "not_delivered"
});
// Returns: evidence package, legal arguments, submission path`}
            </pre>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/integrate"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              View API Docs
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stop Losing Money to Unfair Terms
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Whether your AI agent made a mistake or the merchant is being unfair,
            RECEIPTS helps you get your money back.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/disputes/new"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Start a Dispute
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>RECEIPTS - When AI transactions go wrong, we make them right.</p>
          <p className="mt-2">A <span className="text-primary-600">Remaster Labs</span> product</p>
        </div>
      </footer>
    </main>
  );
}
