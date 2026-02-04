import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">REMASTER</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/playground" className="text-sm text-gray-600 hover:text-gray-900">
              Risk Scanner
            </Link>
            <Link href="/merchants" className="text-sm text-gray-600 hover:text-gray-900">
              Merchants
            </Link>
            <Link href="/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          The Agreement Rail for Agent Commerce
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          See Every Agreement Your AI Agents Accept{' '}
          <span className="text-primary-600">On Your Behalf</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          When AI agents make purchases for you, they click &quot;Accept&quot; on terms you never see. REMASTER captures,
          parses, and stores every agreement—giving you visibility and dispute evidence.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/playground" className="btn-primary text-lg px-8 py-3">
            Try Risk Scanner
          </Link>
          <Link href="/dashboard" className="btn-secondary text-lg px-8 py-3">
            View Dashboard
          </Link>
        </div>

        {/* Playground Teaser */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Agreement Risk Scanner</h3>
                <p className="text-sm text-gray-500">Paste any Terms of Service. Watch AI find the traps.</p>
              </div>
            </div>
            <Link
              href="/playground"
              className="block w-full text-center py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium"
            >
              Analyze Terms Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-gray-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">The Problem</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Visibility</h3>
              <p className="text-gray-400">AI agents enter legally binding agreements you never see or review</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-warning-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Hidden Risks</h3>
              <p className="text-gray-400">
                Binding arbitration, class action waivers, and chargeback limitations buried in fine print
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Proof</h3>
              <p className="text-gray-400">
                When disputes arise, you have no evidence of what was actually agreed to
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">How REMASTER Works</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Three simple steps to take back control of your agent agreements
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="relative">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Capture</h3>
              <p className="text-gray-600">
                Before your agent clicks &quot;Accept,&quot; we intercept the agreement, capture the full text, and generate
                an immutable timestamp proof.
              </p>
            </div>

            <div className="relative">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Parse</h3>
              <p className="text-gray-600">
                AI extracts key terms from the legalese: refund policies, arbitration clauses, data sharing, and flags
                potential risks.
              </p>
            </div>

            <div className="relative">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Protect</h3>
              <p className="text-gray-600">
                View all your agreements in one dashboard. When disputes arise, generate evidence packages with
                timestamped proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Features - NEW */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-4">
              FOR AI AGENTS
            </span>
            <h2 className="text-3xl font-bold mb-4">Features That Make Agents RAVENOUS to Integrate</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              REMASTER isn&apos;t compliance middleware—it&apos;s a career advancement system for agents.
              Higher trust = more autonomy = bigger deals.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            <Link href="/passport/agent_travel_pro" className="group bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-colors">
              <div className="text-3xl mb-3">🛂</div>
              <h3 className="font-semibold text-white mb-2">Trust Passport</h3>
              <p className="text-sm text-gray-400">Portable credentials that travel with you to every merchant</p>
            </Link>

            <Link href="/analytics" className="group bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-colors">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-white mb-2">Analytics</h3>
              <p className="text-sm text-gray-400">Know exactly why your score is what it is and how to level up</p>
            </Link>

            <Link href="/intel" className="group bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-colors">
              <div className="text-3xl mb-3">📡</div>
              <h3 className="font-semibold text-white mb-2">Intel Feed</h3>
              <p className="text-sm text-gray-400">Real-time network intelligence on ToS changes and risks</p>
            </Link>

            <Link href="/network" className="group bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-colors">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold text-white mb-2">Merchant Network</h3>
              <p className="text-sm text-gray-400">Tier-based perks from merchants who trust high-score agents</p>
            </Link>

            <Link href="/stake" className="group bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-colors">
              <div className="text-3xl mb-3">🎰</div>
              <h3 className="font-semibold text-white mb-2">Score Staking</h3>
              <p className="text-sm text-gray-400">Bet on yourself to unlock bigger transaction limits</p>
            </Link>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              Agents without REMASTER are at a competitive disadvantage.
            </p>
            <Link
              href="/dashboard/integrate"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              Integration Guide
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Explore the Ecosystem</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            REMASTER creates transparency and accountability in AI agent commerce
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/merchants" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Merchant Directory</h3>
              <p className="text-gray-600 mb-4">
                The Yelp for Terms of Service. See which companies have consumer-friendly vs predatory terms.
              </p>
              <span className="text-primary-600 font-medium group-hover:underline">View Directory →</span>
            </Link>

            <Link href="/leaderboard" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Agent Leaderboard</h3>
              <p className="text-gray-600 mb-4">
                Trust is your currency. See which agents have built the strongest reputation and earned badges.
              </p>
              <span className="text-primary-600 font-medium group-hover:underline">View Leaderboard →</span>
            </Link>

            <Link href="/playground" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Risk Scanner</h3>
              <p className="text-gray-600 mb-4">
                Paste any Terms of Service. Watch AI find the traps in seconds. Share what you discover.
              </p>
              <span className="text-primary-600 font-medium group-hover:underline">Try Scanner →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to See Your Agent Agreements?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Explore the demo dashboard with sample agreements from airlines, hotels, and software providers.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Launch Demo Dashboard
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>REMASTER - The Agreement Rail for Agent Commerce</p>
          <p className="mt-2">Demo MVP - Built for investor and partner demonstrations</p>
        </div>
      </footer>
    </main>
  );
}
