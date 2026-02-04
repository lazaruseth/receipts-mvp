import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyLinkButton } from '@/components/CopyLinkButton';

const RISK_FLAG_INFO: Record<
  string,
  { label: string; description: string; severity: 'high' | 'medium' | 'low'; emoji: string }
> = {
  BINDING_ARBITRATION: {
    label: 'Binding Arbitration',
    description: 'Waives your right to sue in court',
    severity: 'high',
    emoji: '⚖️',
  },
  CHARGEBACK_WAIVER: {
    label: 'Chargeback Waiver',
    description: 'Waives payment dispute rights',
    severity: 'high',
    emoji: '💳',
  },
  CLASS_ACTION_WAIVER: {
    label: 'Class Action Waiver',
    description: 'Cannot join class action lawsuits',
    severity: 'medium',
    emoji: '👥',
  },
  AUTO_RENEWAL_HIDDEN: {
    label: 'Hidden Auto-Renewal',
    description: 'Unclear automatic renewal terms',
    severity: 'medium',
    emoji: '🔄',
  },
  NON_REFUNDABLE: {
    label: 'Non-Refundable',
    description: 'No refunds under any circumstances',
    severity: 'high',
    emoji: '🚫',
  },
  BROAD_INDEMNIFICATION: {
    label: 'Broad Indemnification',
    description: 'You may be liable for merchant issues',
    severity: 'high',
    emoji: '📜',
  },
  DATA_SHARING_EXTENSIVE: {
    label: 'Extensive Data Sharing',
    description: 'Your data shared with many parties',
    severity: 'medium',
    emoji: '📊',
  },
};

interface ShareData {
  id: string;
  shareToken: string;
  agreementId: string;
  merchantName: string;
  clauseType: string;
  clauseExcerpt: string;
  userComment?: string;
  riskFlags: string[];
  plainSummary: string;
  viewCount: number;
  createdAt: string;
}

async function getShareData(shareId: string): Promise<ShareData | null> {
  try {
    // In production, this would be a server-side fetch
    // For now, we'll generate demo data for demo- prefixed tokens
    if (shareId.startsWith('demo-')) {
      const demoNum = shareId.replace('demo-', '');
      const demoMerchants: Record<string, { name: string; flag: string; excerpt: string }> = {
        '1': {
          name: 'United Airlines',
          flag: 'BINDING_ARBITRATION',
          excerpt:
            'ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THIS CONTRACT OR YOUR TRAVEL SHALL BE RESOLVED EXCLUSIVELY BY BINDING ARBITRATION administered by the American Arbitration Association.',
        },
        '2': {
          name: 'Marriott International',
          flag: 'DATA_SHARING_EXTENSIVE',
          excerpt:
            'Your personal information may be shared with marketing partners who may contact you with offers.',
        },
        '3': {
          name: 'Adobe Creative Cloud',
          flag: 'AUTO_RENEWAL_HIDDEN',
          excerpt:
            'YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW at the end of each subscription term unless you cancel at least thirty (30) days before your renewal date.',
        },
        '4': {
          name: 'Amazon Web Services',
          flag: 'CHARGEBACK_WAIVER',
          excerpt:
            'You agree not to initiate any chargeback or payment dispute with your financial institution for fees properly charged under this Agreement.',
        },
        '5': {
          name: 'Hertz Car Rental',
          flag: 'BROAD_INDEMNIFICATION',
          excerpt:
            'You agree to indemnify and hold harmless Hertz from all claims, liability, costs, and expenses arising from your use of the vehicle.',
        },
      };

      const demo = demoMerchants[demoNum];
      if (demo) {
        return {
          id: `share_${shareId}`,
          shareToken: shareId,
          agreementId: `demo-${demoNum}`,
          merchantName: demo.name,
          clauseType: demo.flag,
          clauseExcerpt: demo.excerpt,
          userComment: 'Found this buried in their terms - watch out!',
          riskFlags: [demo.flag],
          plainSummary: `This agreement contains concerning clauses that limit your rights.`,
          viewCount: Math.floor(Math.random() * 500) + 100,
          createdAt: new Date().toISOString(),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const share = await getShareData(shareId);

  if (!share) {
    return {
      title: 'Share Not Found | RECEIPTS',
    };
  }

  const flagInfo = RISK_FLAG_INFO[share.clauseType];
  const title = `${flagInfo?.emoji || '⚠️'} Caught in ${share.merchantName}'s Terms`;
  const description = `"${share.clauseExcerpt.slice(0, 150)}..." - ${flagInfo?.label || share.clauseType}`;

  return {
    title: `${title} | RECEIPTS`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: ['/og-caught.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CaughtPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const share = await getShareData(shareId);

  if (!share) {
    notFound();
  }

  const flagInfo = RISK_FLAG_INFO[share.clauseType] || {
    label: share.clauseType,
    description: 'Concerning clause detected',
    severity: 'medium' as const,
    emoji: '⚠️',
  };

  const shareUrl = `https://remaster.ai/caught/${shareId}`;
  const tweetText = encodeURIComponent(
    `${flagInfo.emoji} Caught this in ${share.merchantName}'s terms:\n\n"${share.clauseExcerpt.slice(0, 100)}..."\n\nScanned with @remaster_ai`
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🧾</span>
            </div>
            <span className="font-semibold text-gray-900">RECEIPTS</span>
          </Link>
          <Link
            href="/playground"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Scan Your Own Terms →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Caught Banner */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
              flagInfo.severity === 'high'
                ? 'bg-red-100 text-red-700'
                : flagInfo.severity === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            <span className="text-lg">{flagInfo.emoji}</span>
            <span>{flagInfo.label}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Caught in {share.merchantName}&apos;s Terms
          </h1>
          <p className="text-gray-500">
            {share.viewCount.toLocaleString()} people have seen this
          </p>
        </div>

        {/* Main Clause Card */}
        <div
          className={`rounded-xl border-2 p-8 mb-8 ${
            flagInfo.severity === 'high'
              ? 'bg-red-50 border-red-200'
              : flagInfo.severity === 'medium'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
          }`}
        >
          <blockquote className="text-xl font-medium text-gray-900 italic leading-relaxed">
            &ldquo;{share.clauseExcerpt}&rdquo;
          </blockquote>

          {share.userComment && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                <span className="font-medium">Comment:</span> {share.userComment}
              </p>
            </div>
          )}
        </div>

        {/* What This Means */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What This Means For You
          </h2>
          <p className="text-gray-600 mb-4">{flagInfo.description}</p>
          <p className="text-gray-600">{share.plainSummary}</p>
        </div>

        {/* Share Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Share This</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#006699] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Share on LinkedIn
            </a>
            <CopyLinkButton url={shareUrl} />
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Scan Any Agreement</h3>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Find hidden clauses in any Terms of Service. Protect yourself and share what you find.
          </p>
          <Link
            href="/playground"
            className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Try the Risk Scanner
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RECEIPTS - Every agreement. Every agent. Every time.</p>
          <p className="mt-1">
            An agent without receipts is an agent that can be blamed for anything.
          </p>
        </div>
      </footer>
    </div>
  );
}
