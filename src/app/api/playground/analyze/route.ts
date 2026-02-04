import { NextRequest, NextResponse } from 'next/server';
import { DEMO_AGREEMENTS } from '@/lib/demo-data';
import type { RiskFlag, ExtractedTerms } from '@/types';

const RISK_FLAG_INFO: Record<
  string,
  { label: string; description: string; severity: 'high' | 'medium' | 'low' }
> = {
  BINDING_ARBITRATION: {
    label: 'Binding Arbitration',
    description: 'Waives your right to sue in court',
    severity: 'high',
  },
  CHARGEBACK_WAIVER: {
    label: 'Chargeback Waiver',
    description: 'Waives payment dispute rights',
    severity: 'high',
  },
  CLASS_ACTION_WAIVER: {
    label: 'Class Action Waiver',
    description: 'Cannot join class action lawsuits',
    severity: 'medium',
  },
  AUTO_RENEWAL_HIDDEN: {
    label: 'Hidden Auto-Renewal',
    description: 'Unclear automatic renewal terms',
    severity: 'medium',
  },
  NON_REFUNDABLE: {
    label: 'Non-Refundable',
    description: 'No refunds under any circumstances',
    severity: 'high',
  },
  FOREIGN_JURISDICTION: {
    label: 'Foreign Jurisdiction',
    description: 'Disputes in inconvenient location',
    severity: 'medium',
  },
  BROAD_INDEMNIFICATION: {
    label: 'Broad Indemnification',
    description: 'You may be liable for merchant issues',
    severity: 'high',
  },
  DATA_SHARING_EXTENSIVE: {
    label: 'Extensive Data Sharing',
    description: 'Your data shared with many parties',
    severity: 'medium',
  },
  SHORT_DISPUTE_WINDOW: {
    label: 'Short Dispute Window',
    description: 'Limited time to raise concerns',
    severity: 'medium',
  },
  PRICE_NOT_GUARANTEED: {
    label: 'Price Not Guaranteed',
    description: 'Price may change after agreement',
    severity: 'low',
  },
};

// Simple rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  if (limit.count >= 10) {
    // 10 per hour for demo
    return false;
  }

  limit.count++;
  return true;
}

function calculateRiskScore(riskFlags: RiskFlag[]): number {
  let score = 100;

  for (const flag of riskFlags) {
    const info = RISK_FLAG_INFO[flag];
    if (info) {
      if (info.severity === 'high') score -= 20;
      else if (info.severity === 'medium') score -= 10;
      else score -= 5;
    }
  }

  return Math.max(0, score);
}

function detectRisksFromText(text: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const lowerText = text.toLowerCase();

  // Binding arbitration detection
  if (
    lowerText.includes('binding arbitration') ||
    lowerText.includes('mandatory arbitration') ||
    (lowerText.includes('arbitration') && lowerText.includes('waive')) ||
    (lowerText.includes('arbitration') && lowerText.includes('agree'))
  ) {
    flags.push('BINDING_ARBITRATION');
  }

  // Class action waiver
  if (
    lowerText.includes('class action waiver') ||
    lowerText.includes('waive any right to participate in a class') ||
    lowerText.includes('individual capacity') ||
    (lowerText.includes('class') && lowerText.includes('waive'))
  ) {
    flags.push('CLASS_ACTION_WAIVER');
  }

  // Chargeback waiver
  if (
    lowerText.includes('chargeback') &&
    (lowerText.includes('waive') || lowerText.includes('restriction'))
  ) {
    flags.push('CHARGEBACK_WAIVER');
  }

  // Auto-renewal
  if (
    lowerText.includes('auto-renew') ||
    lowerText.includes('automatically renew') ||
    lowerText.includes('automatic renewal')
  ) {
    flags.push('AUTO_RENEWAL_HIDDEN');
  }

  // Non-refundable
  if (
    lowerText.includes('non-refundable') ||
    lowerText.includes('no refund') ||
    lowerText.includes('all fees are non-refundable')
  ) {
    flags.push('NON_REFUNDABLE');
  }

  // Indemnification
  if (
    lowerText.includes('indemnify') ||
    lowerText.includes('indemnification') ||
    lowerText.includes('hold harmless')
  ) {
    flags.push('BROAD_INDEMNIFICATION');
  }

  // Data sharing
  if (
    (lowerText.includes('third party') || lowerText.includes('third-party')) &&
    (lowerText.includes('share') || lowerText.includes('disclose'))
  ) {
    flags.push('DATA_SHARING_EXTENSIVE');
  }

  // Limitation of liability
  if (
    lowerText.includes('limitation of liability') ||
    lowerText.includes('not liable') ||
    lowerText.includes('disclaims all')
  ) {
    // This is common, mark as medium severity if excessive
    if (lowerText.includes('under no circumstances') || lowerText.includes('in no event')) {
      flags.push('BROAD_INDEMNIFICATION');
    }
  }

  return flags;
}

function extractMerchantFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '').replace('policies.', '');

    // Map common domains to merchant names
    const merchantMap: Record<string, string> = {
      'google.com': 'Google',
      'united.com': 'United Airlines',
      'marriott.com': 'Marriott International',
      'adobe.com': 'Adobe Creative Cloud',
      'aws.amazon.com': 'Amazon Web Services',
      'amazon.com': 'Amazon',
      'hertz.com': 'Hertz Car Rental',
      'spotify.com': 'Spotify',
      'netflix.com': 'Netflix',
      'apple.com': 'Apple',
      'microsoft.com': 'Microsoft',
      'openai.com': 'OpenAI',
      'facebook.com': 'Meta',
      'meta.com': 'Meta',
      'twitter.com': 'X (Twitter)',
      'x.com': 'X (Twitter)',
    };

    return merchantMap[hostname] || hostname;
  } catch {
    return 'Unknown Merchant';
  }
}

/**
 * Fetch and extract text content from a URL
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RECEIPTS-Bot/1.0; +https://receipts.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text content from HTML (basic extraction)
    // Remove scripts, styles, and HTML tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Limit text length to avoid token limits
    if (text.length > 50000) {
      text = text.substring(0, 50000);
    }

    return text;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate extracted terms from text analysis
 */
function generateExtractedTerms(text: string, riskFlags: RiskFlag[]): ExtractedTerms {
  const lowerText = text.toLowerCase();

  // Try to detect refund policy
  let refundType: 'refundable' | 'non-refundable' | 'conditional' = 'conditional';
  let refundWindow = '30 days';

  if (lowerText.includes('non-refundable') || lowerText.includes('no refund')) {
    refundType = 'non-refundable';
    refundWindow = 'N/A';
  } else if (lowerText.includes('full refund')) {
    refundType = 'refundable';
  }

  // Detect refund window
  const windowMatch = lowerText.match(/(\d+)\s*(?:day|hour|week)/i);
  if (windowMatch) {
    refundWindow = windowMatch[0];
  }

  return {
    refundPolicy: {
      type: refundType,
      window: refundWindow,
      conditions: riskFlags.includes('NON_REFUNDABLE') ? ['No refunds'] : undefined,
    },
    cancellationPolicy: {
      fee: 0,
      window: refundWindow,
    },
    disputeResolution: {
      method: riskFlags.includes('BINDING_ARBITRATION') ? 'arbitration' : 'courts',
      jurisdiction: lowerText.includes('california') ? 'California, USA' :
                   lowerText.includes('delaware') ? 'Delaware, USA' : undefined,
      classActionWaiver: riskFlags.includes('CLASS_ACTION_WAIVER'),
      chargebackRightsPreserved: !riskFlags.includes('CHARGEBACK_WAIVER'),
    },
    autoRenewal: {
      enabled: riskFlags.includes('AUTO_RENEWAL_HIDDEN'),
      frequency: riskFlags.includes('AUTO_RENEWAL_HIDDEN') ? 'Annual' : undefined,
    },
    dataUsage: {
      thirdPartySharing: riskFlags.includes('DATA_SHARING_EXTENSIVE'),
      purposes: riskFlags.includes('DATA_SHARING_EXTENSIVE') ?
        ['Service provision', 'Analytics', 'Marketing'] : ['Service provision'],
    },
    liability: {
      limitations: lowerText.includes('limitation of liability') ?
        ['Liability limited to amount paid'] : [],
      indemnification: riskFlags.includes('BROAD_INDEMNIFICATION'),
    },
  };
}

/**
 * Generate plain English summary
 */
function generateSummary(merchantName: string, riskFlags: RiskFlag[], text: string): string {
  const summaryParts: string[] = [];

  if (riskFlags.includes('BINDING_ARBITRATION')) {
    summaryParts.push('requires binding arbitration for disputes (you cannot sue in court)');
  }
  if (riskFlags.includes('CLASS_ACTION_WAIVER')) {
    summaryParts.push('waives your right to join class action lawsuits');
  }
  if (riskFlags.includes('CHARGEBACK_WAIVER')) {
    summaryParts.push('may limit your ability to dispute charges with your bank');
  }
  if (riskFlags.includes('NON_REFUNDABLE')) {
    summaryParts.push('is non-refundable');
  }
  if (riskFlags.includes('AUTO_RENEWAL_HIDDEN')) {
    summaryParts.push('includes automatic renewal');
  }
  if (riskFlags.includes('BROAD_INDEMNIFICATION')) {
    summaryParts.push('requires you to indemnify (protect) them from claims');
  }
  if (riskFlags.includes('DATA_SHARING_EXTENSIVE')) {
    summaryParts.push('shares your data with third parties');
  }

  if (summaryParts.length === 0) {
    return `This agreement with ${merchantName} appears to have standard terms. No major risk flags detected. Always read the full terms before accepting.`;
  }

  return `This agreement with ${merchantName} ${summaryParts.join(', ')}. Review these terms carefully before accepting.`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again in an hour.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { input, type } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide terms to analyze' },
        { status: 400 }
      );
    }

    let textToAnalyze: string;
    let merchantName: string;
    let sourceUrl: string | undefined;

    if (type === 'url') {
      // Normalize and validate URL - add https:// if no protocol provided
      let normalizedUrl = input.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Validate URL
      try {
        new URL(normalizedUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL provided' },
          { status: 400 }
        );
      }

      sourceUrl = normalizedUrl;
      merchantName = extractMerchantFromUrl(normalizedUrl);

      // Check if we have demo data for this merchant
      const demoMatch = DEMO_AGREEMENTS.find(
        (a) =>
          a.merchantName.toLowerCase().includes(merchantName.toLowerCase()) ||
          merchantName.toLowerCase().includes(a.merchantName.toLowerCase().split(' ')[0])
      );

      if (demoMatch) {
        // Use demo data for known merchants
        const riskScore = calculateRiskScore(demoMatch.riskFlags);
        const formattedFlags = demoMatch.riskFlags.map((flag) => ({
          flag,
          ...(RISK_FLAG_INFO[flag] || {
            label: flag,
            description: 'Unknown risk flag',
            severity: 'medium' as const,
          }),
        }));

        return NextResponse.json({
          success: true,
          merchantName: demoMatch.merchantName,
          riskScore,
          riskFlags: formattedFlags,
          extractedTerms: demoMatch.extractedTerms,
          plainSummary: demoMatch.plainSummary,
          sourceUrl,
          analyzedAt: new Date().toISOString(),
          source: 'demo',
        });
      }

      // Fetch and extract content from URL
      console.log(`[Playground] Fetching content from: ${input}`);
      try {
        textToAnalyze = await fetchUrlContent(input);
        console.log(`[Playground] Fetched ${textToAnalyze.length} characters from ${input}`);
      } catch (error) {
        console.error('[Playground] URL fetch failed:', error);
        return NextResponse.json(
          {
            success: false,
            error: `Could not fetch content from URL: ${error instanceof Error ? error.message : 'Unknown error'}. Try pasting the text directly.`
          },
          { status: 400 }
        );
      }
    } else {
      // Direct text input
      textToAnalyze = input;
      merchantName = 'Unknown Merchant';

      // Try to extract merchant name from text
      const merchantMatch = input.match(/(?:terms of service|terms and conditions|agreement)\s+(?:for|of|with)\s+([A-Za-z0-9\s]+)/i);
      if (merchantMatch) {
        merchantName = merchantMatch[1].trim();
      }
    }

    // Analyze the text for risk flags
    const riskFlags = detectRisksFromText(textToAnalyze);
    const riskScore = calculateRiskScore(riskFlags);
    const extractedTerms = generateExtractedTerms(textToAnalyze, riskFlags);
    const plainSummary = generateSummary(merchantName, riskFlags, textToAnalyze);

    // Format risk flags with info
    const formattedFlags = riskFlags.map((flag) => ({
      flag,
      ...(RISK_FLAG_INFO[flag] || {
        label: flag,
        description: 'Unknown risk flag',
        severity: 'medium' as const,
      }),
    }));

    return NextResponse.json({
      success: true,
      merchantName,
      riskScore,
      riskFlags: formattedFlags,
      extractedTerms,
      plainSummary,
      sourceUrl,
      analyzedAt: new Date().toISOString(),
      textLength: textToAnalyze.length,
      source: 'live',
    });
  } catch (error) {
    console.error('Playground analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
