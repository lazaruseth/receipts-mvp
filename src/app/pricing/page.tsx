'use client';

import { useState } from 'react';
import Link from 'next/link';

type BillingPeriod = 'monthly' | 'annual';

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaLink: string;
}

const CONSUMER_TIERS: PricingTier[] = [
  {
    name: 'Free',
    description: 'For casual scanning',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '3 ToS scans per month',
      'Basic risk flags',
      'Plain English summaries',
      'Hall of Shame access',
    ],
    ctaText: 'Get Started',
    ctaLink: '/playground',
  },
  {
    name: 'Pro',
    description: 'For power users',
    monthlyPrice: 9,
    annualPrice: 7,
    features: [
      'Unlimited ToS scans',
      'Full risk analysis',
      'ToS change alerts',
      'Clause comparisons',
      'Export reports (PDF)',
      'Priority support',
    ],
    highlighted: true,
    ctaText: 'Start Free Trial',
    ctaLink: '/dashboard',
  },
  {
    name: 'Family',
    description: 'Protect the whole family',
    monthlyPrice: 19,
    annualPrice: 15,
    features: [
      'Everything in Pro',
      'Up to 5 users',
      'Shared dashboard',
      'Family risk alerts',
      'Kid-safe mode',
    ],
    ctaText: 'Start Free Trial',
    ctaLink: '/dashboard',
  },
];

const BUSINESS_TIERS: PricingTier[] = [
  {
    name: 'Startup',
    description: 'For early-stage companies',
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      '1,000 API calls/month',
      'Webhook integrations',
      'JSON responses',
      'Basic SLA (99.5%)',
      'Email support',
    ],
    ctaText: 'Get API Key',
    ctaLink: '/dashboard/integrate',
  },
  {
    name: 'Scale',
    description: 'For growing businesses',
    monthlyPrice: 499,
    annualPrice: 399,
    features: [
      '10,000 API calls/month',
      'Everything in Startup',
      'Custom webhooks',
      'Priority SLA (99.9%)',
      'Dedicated support',
      'Custom risk rules',
    ],
    highlighted: true,
    ctaText: 'Get API Key',
    ctaLink: '/dashboard/integrate',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Unlimited API calls',
      'Everything in Scale',
      'On-premise option',
      'Custom SLA',
      'Dedicated CSM',
      'Compliance reports',
      'SOC 2 Type II',
    ],
    ctaText: 'Contact Sales',
    ctaLink: 'mailto:enterprise@receipts.ai',
  },
];

const AGENT_TIERS: PricingTier[] = [
  {
    name: 'Agent Basic',
    description: 'For individual agents',
    monthlyPrice: 29,
    annualPrice: 23,
    features: [
      '500 captures/month',
      'Agreement validation',
      'Risk scoring',
      'Basic passport',
    ],
    ctaText: 'Register Agent',
    ctaLink: '/dashboard/integrate',
  },
  {
    name: 'Agent Pro',
    description: 'For agent networks',
    monthlyPrice: 199,
    annualPrice: 159,
    features: [
      '5,000 captures/month',
      'Everything in Basic',
      'Trust passport',
      'Dispute support',
      'Merchant verification',
      'Network access',
    ],
    highlighted: true,
    ctaText: 'Register Agent',
    ctaLink: '/dashboard/integrate',
  },
  {
    name: 'Agent Platform',
    description: 'For agent frameworks',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Unlimited captures',
      'Everything in Pro',
      'White-label option',
      'Revenue share model',
      'Co-marketing',
      'Integration support',
    ],
    ctaText: 'Partner With Us',
    ctaLink: 'mailto:partners@receipts.ai',
  },
];

function PricingCard({ tier, billingPeriod }: { tier: PricingTier; billingPeriod: BillingPeriod }) {
  const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  const isCustom = price === 0 && tier.name !== 'Free';

  return (
    <div
      className={`relative rounded-2xl p-8 ${
        tier.highlighted
          ? 'bg-primary-600 text-white shadow-xl scale-105 z-10'
          : 'bg-white text-gray-900 border border-gray-200'
      }`}
    >
      {tier.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
          Most Popular
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className={`text-xl font-bold ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}>
          {tier.name}
        </h3>
        <p className={`text-sm mt-1 ${tier.highlighted ? 'text-primary-100' : 'text-gray-500'}`}>
          {tier.description}
        </p>
      </div>

      <div className="text-center mb-6">
        {isCustom ? (
          <div className="text-3xl font-bold">Custom</div>
        ) : (
          <>
            <span className="text-4xl font-bold">${price}</span>
            {price > 0 && (
              <span className={tier.highlighted ? 'text-primary-200' : 'text-gray-500'}>
                /mo
              </span>
            )}
          </>
        )}
        {billingPeriod === 'annual' && price > 0 && !isCustom && (
          <p className={`text-sm mt-1 ${tier.highlighted ? 'text-primary-200' : 'text-gray-500'}`}>
            billed annually
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <svg
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.highlighted ? 'text-primary-200' : 'text-primary-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className={`text-sm ${tier.highlighted ? 'text-white' : 'text-gray-600'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {tier.ctaLink.startsWith('mailto:') ? (
        <a
          href={tier.ctaLink}
          className={`block w-full py-3 text-center rounded-lg font-semibold transition-colors ${
            tier.highlighted
              ? 'bg-white text-primary-600 hover:bg-gray-100'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {tier.ctaText}
        </a>
      ) : (
        <Link
          href={tier.ctaLink}
          className={`block w-full py-3 text-center rounded-lg font-semibold transition-colors ${
            tier.highlighted
              ? 'bg-white text-primary-600 hover:bg-gray-100'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {tier.ctaText}
        </Link>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [activeTab, setActiveTab] = useState<'consumer' | 'business' | 'agent'>('consumer');

  const tiers = activeTab === 'consumer' ? CONSUMER_TIERS : activeTab === 'business' ? BUSINESS_TIERS : AGENT_TIERS;

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
          <div className="flex gap-4">
            <Link href="/playground" className="text-sm text-gray-600 hover:text-gray-900">
              Playground
            </Link>
            <Link href="/hall-of-shame" className="text-sm text-gray-600 hover:text-gray-900">
              Hall of Shame
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Audience Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['consumer', 'business', 'agent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'consumer' ? 'For You' : tab === 'business' ? 'For Business' : 'For AI Agents'}
            </button>
          ))}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={billingPeriod === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors"
            style={{ backgroundColor: billingPeriod === 'annual' ? '#4F46E5' : undefined }}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={billingPeriod === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
            Annual
            <span className="ml-1 text-green-600 text-sm font-medium">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} billingPeriod={billingPeriod} />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">What counts as an API call?</h3>
              <p className="text-gray-600 text-sm">
                Each ToS scan, capture, or validation counts as one API call. Webhook deliveries are free.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all plans are month-to-month with no contracts. Cancel anytime from your dashboard.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">What's a Trust Passport?</h3>
              <p className="text-gray-600 text-sm">
                A cryptographic proof that your AI agent has a history of fair dealings. Merchants can verify it.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer discounts?</h3>
              <p className="text-gray-600 text-sm">
                Yes! We offer 50% off for startups, students, and non-profits. Contact us to apply.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 bg-gray-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Building an AI Agent Platform?</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Partner with us to offer agreement protection to your entire user base.
            Revenue share available for qualified partners.
          </p>
          <a
            href="mailto:partners@receipts.ai"
            className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Become a Partner
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>A <Link href="/" className="text-primary-600 hover:underline">Remaster Labs</Link> product</p>
          <p className="mt-1">Questions? Email us at hello@receipts.ai</p>
        </div>
      </footer>
    </div>
  );
}
