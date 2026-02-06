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

      {/* Hero - Evidence Layer Focus */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          Agreement Evidence Layer for AI Agents
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Prove What Your AI Agent<br />
          <span className="text-primary-600">Actually Agreed To</span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          When AI agents transact on behalf of users, nobody can prove what was agreed to.
          RECEIPTS captures every agreement with timestamped evidence, analyzes risky clauses,
          and validates against user policies—so you have proof when you need it.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            href="/dashboard/integrate"
            className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
          >
            Get the SDK
          </Link>
          <Link
            href="/playground"
            className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Try Risk Scanner
          </Link>
        </div>

        {/* What We Actually Do */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">📸</div>
            <div className="text-sm text-gray-500 mt-1">Capture & Hash</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">🔍</div>
            <div className="text-sm text-gray-500 mt-1">Analyze Risks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">✓</div>
            <div className="text-sm text-gray-500 mt-1">Validate Policy</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">How RECEIPTS Works</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            A simple SDK that captures agreements before your agent accepts them
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📸</span>
              </div>
              <div className="text-sm text-primary-400 font-semibold mb-2">STEP 1</div>
              <h3 className="text-lg font-semibold mb-2">Capture</h3>
              <p className="text-gray-400 text-sm">
                Agent calls our SDK before accepting any terms. We hash and timestamp the document with cryptographic proof.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <div className="text-sm text-primary-400 font-semibold mb-2">STEP 2</div>
              <h3 className="text-lg font-semibold mb-2">Analyze</h3>
              <p className="text-gray-400 text-sm">
                AI extracts risky clauses: binding arbitration, auto-renewal, no refunds, class action waivers, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <div className="text-sm text-green-400 font-semibold mb-2">STEP 3</div>
              <h3 className="text-lg font-semibold mb-2">Validate</h3>
              <p className="text-gray-400 text-sm">
                Check against user policies. Returns &quot;proceed&quot;, &quot;require approval&quot;, or &quot;block&quot;—with evidence stored for later.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Problem with AI Transactions
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-2xl">❓</span>
                  <div>
                    <div className="font-semibold text-gray-900">No proof of what was agreed</div>
                    <div className="text-sm text-gray-600">When disputes happen, it&apos;s your word against the merchant&apos;s</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="font-semibold text-gray-900">Hidden risky clauses</div>
                    <div className="text-sm text-gray-600">Agents accept terms without understanding binding arbitration or no-refund policies</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-semibold text-gray-900">Agents get blamed</div>
                    <div className="text-sm text-gray-600">No audit trail means agents can be held liable for anything</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
              <div className="text-sm text-green-600 font-semibold mb-2">WITH RECEIPTS</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">You have evidence</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Cryptographic hash of the exact document agreed to</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Timestamp proving when agreement was captured</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">AI analysis identifying risky clauses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Audit trail for compliance and disputes</span>
                </li>
              </ul>
              <Link
                href="/dashboard/integrate"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                View Documentation
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Risk Scanner</h2>
            <p className="text-gray-600">Analyze any terms of service. Know what risks are hiding in the fine print.</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hall of Shame</h2>
            <p className="text-gray-600">Companies with the most user-hostile terms of service</p>
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

      {/* For Developers - THE MAIN PRODUCT */}
      <section className="bg-gray-900 py-16 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-4">
              THE SDK
            </span>
            <h2 className="text-3xl font-bold mb-4">Integrate in Minutes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Add agreement capture to your AI agent with a few lines of code.
              Works with Claude, OpenAI, LangChain, and any custom agent.
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 max-w-3xl mx-auto mb-8">
            <div className="text-sm text-gray-400 mb-2 font-mono">npm install @receipts/agreement-guard</div>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`import { AgreementGuard } from '@receipts/agreement-guard';

const guard = new AgreementGuard({
  agentId: 'my-agent-123',
  agentType: 'claude-code',
  apiKey: process.env.RECEIPTS_API_KEY,
});

// Before accepting any terms of service
const result = await guard.capture({
  documentText: termsOfServiceText,
  sourceUrl: 'https://merchant.com/terms',
});

if (result.recommendation === 'proceed') {
  // Safe to accept - receipt captured
  console.log('Trust score:', result.trustScore);
} else if (result.recommendation === 'require_approval') {
  // Ask user for explicit approval
} else {
  // Block - do not accept these terms
}`}
            </pre>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/integrate"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              View Full Documentation
            </Link>
            <a
              href="https://www.npmjs.com/package/@receipts/agreement-guard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              View on npm
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Build Trustworthy AI Agents
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Give your users evidence of what their agent agreed to.
            Capture every agreement. Analyze every risk. Validate every policy.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/integrate"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Get Started
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
          <p>RECEIPTS - Agreement Evidence Layer for AI Agents</p>
          <p className="mt-2">A <span className="text-primary-600">Remaster Labs</span> product</p>
        </div>
      </footer>
    </main>
  );
}
