/**
 * Agreement Guard - Main SDK Class
 *
 * Protects agent autonomy by capturing and validating agreements
 * before they are accepted.
 */

import type {
  AgreementGuardConfig,
  CaptureOptions,
  CaptureResult,
  AnchorResult,
  ReputationResult,
  RegistrationResult,
} from './types';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT = 30000;

export class AgreementGuard {
  private config: Required<Omit<AgreementGuardConfig, 'apiKey' | 'userId'>> & {
    apiKey?: string;
    userId?: string;
  };
  private registered = false;

  constructor(config: AgreementGuardConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      agentId: config.agentId,
      agentType: config.agentType,
      userId: config.userId,
      debug: config.debug || false,
      timeout: config.timeout || DEFAULT_TIMEOUT,
    };

    this.log('Agreement Guard initialized', {
      agentId: this.config.agentId,
      agentType: this.config.agentType,
      baseUrl: this.config.baseUrl,
    });
  }

  // ============================================
  // Core Methods
  // ============================================

  /**
   * Register this agent with REMASTER.
   * Should be called once when the agent starts.
   */
  async register(): Promise<RegistrationResult> {
    this.log('Registering agent...');

    const response = await this.request('/api/agents/register', {
      method: 'POST',
      body: {
        agentId: this.config.agentId,
        agentType: this.config.agentType,
      },
    });

    this.registered = true;
    this.log('Agent registered', response);

    return response as RegistrationResult;
  }

  /**
   * Capture an agreement before accepting it.
   * This is the main method agents should call.
   *
   * Flow:
   * 1. Captures the raw document
   * 2. Parses it to extract structured terms
   * 3. Validates against user policy
   * 4. Returns recommendation
   */
  async capture(options: CaptureOptions): Promise<CaptureResult> {
    this.log('Capturing agreement...', { sourceUrl: options.sourceUrl });

    // Step 1: Capture the document
    const captureResponse = await this.request('/api/capture', {
      method: 'POST',
      body: {
        documentText: options.documentText,
        sourceUrl: options.sourceUrl,
        merchantName: options.merchantName,
        agentId: this.config.agentId,
        agentType: this.config.agentType,
      },
    });

    // Step 2: Parse and validate
    const parseResponse = await this.request('/api/parse', {
      method: 'POST',
      body: {
        documentText: options.documentText,
        merchantName: options.merchantName,
        sourceUrl: options.sourceUrl,
        returnPAO: true,
        validatePolicy: true,
        agentId: this.config.agentId,
        agentType: this.config.agentType,
        userId: this.config.userId,
      },
    });

    // Combine results
    const result: CaptureResult = {
      success: captureResponse.status === 'captured' && parseResponse.success,
      captureId: captureResponse.captureId,
      documentHash: captureResponse.documentHash,
      timestamp: captureResponse.timestamp,
      recommendation: parseResponse.policyResult?.recommendation || 'proceed',
      termsHash: parseResponse.pao?.termsHash,
      riskFlags: parseResponse.riskFlags || [],
      summary: parseResponse.plainSummary || '',
      violations: parseResponse.policyResult?.violations || [],
      warnings: parseResponse.policyResult?.warnings || [],
      agentMessage: this.generateAgentMessage(parseResponse),
      trustScore: parseResponse.policyResult?.agentTrustScore || 10,
      capabilities: {
        maxSpendPerTx: 10,
        allowedCategories: [],
        requiresHumanApproval: [],
        canAnchorOnchain: false,
      },
    };

    this.log('Capture complete', {
      captureId: result.captureId,
      recommendation: result.recommendation,
      riskFlags: result.riskFlags.length,
    });

    return result;
  }

  /**
   * Anchor a captured agreement on Base L2.
   * Creates an immutable timestamp proof.
   *
   * Requires trust score >= 61.
   */
  async anchor(captureId: string, termsHash: string): Promise<AnchorResult> {
    this.log('Anchoring agreement on Base...', { captureId, termsHash });

    const response = await this.request('/api/anchor', {
      method: 'POST',
      body: {
        termsHash,
        captureId,
        agentId: this.config.agentId,
      },
    });

    if (!response.success) {
      throw new Error(response.error || 'Anchoring failed');
    }

    this.log('Anchor complete', {
      txId: response.blockchainTxId,
      chain: response.chain,
    });

    return {
      success: true,
      blockchainTxId: response.blockchainTxId,
      anchorTimestamp: response.anchorTimestamp,
      explorerUrl: response.explorerUrl,
      chain: response.chain,
      cost: response.cost,
    };
  }

  /**
   * Get this agent's reputation and capabilities.
   */
  async getReputation(): Promise<ReputationResult> {
    this.log('Fetching reputation...');

    const response = await this.request(
      `/api/agents/${encodeURIComponent(this.config.agentId)}/reputation`,
      { method: 'GET' }
    );

    this.log('Reputation fetched', {
      trustScore: response.trustScore,
      tier: response.tier?.name,
    });

    return response as ReputationResult;
  }

  /**
   * Validate a PAO against policy without capturing.
   * Useful for checking before displaying to user.
   */
  async validate(pao: unknown): Promise<{
    allowed: boolean;
    recommendation: 'proceed' | 'require_approval' | 'block';
    violations: Array<{ rule: string; description: string }>;
    agentMessage: string;
  }> {
    this.log('Validating PAO...');

    const response = await this.request('/api/validate', {
      method: 'POST',
      body: {
        pao,
        agentId: this.config.agentId,
        userId: this.config.userId,
      },
    });

    return {
      allowed: response.allowed,
      recommendation: response.recommendation,
      violations: response.violations,
      agentMessage: response.agentMessage,
    };
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if this looks like an agreement page.
   * Useful for auto-detection.
   */
  static detectAgreementPage(html: string, url: string): boolean {
    const indicators = [
      /terms\s*(of\s*)?service/i,
      /terms\s*(and\s*)?conditions/i,
      /privacy\s*policy/i,
      /user\s*agreement/i,
      /subscriber\s*agreement/i,
      /license\s*agreement/i,
      /end\s*user\s*license/i,
      /clickwrap/i,
      /by\s*(clicking|continuing|using)/i,
      /i\s*(agree|accept|consent)/i,
      /binding\s*arbitration/i,
      /class\s*action\s*waiver/i,
    ];

    const content = html + ' ' + url;
    return indicators.some((pattern) => pattern.test(content));
  }

  /**
   * Extract text from HTML for capture.
   */
  static extractText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ============================================
  // Private Methods
  // ============================================

  private async request(
    path: string,
    options: {
      method: 'GET' | 'POST';
      body?: unknown;
    }
  ): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;

    const fetchOptions: RequestInit = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    fetchOptions.signal = controller.signal;

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[AgreementGuard] ${message}`, data || '');
    }
  }

  private generateAgentMessage(parseResponse: any): string {
    const recommendation = parseResponse.policyResult?.recommendation || 'proceed';
    const trustScore = parseResponse.policyResult?.agentTrustScore || 10;
    const riskFlags = parseResponse.riskFlags || [];

    if (recommendation === 'block') {
      const violations = parseResponse.policyResult?.violations || [];
      const blockReasons = violations
        .filter((v: any) => v.severity === 'block')
        .map((v: any) => v.description)
        .join('; ');

      return `🚫 AGREEMENT BLOCKED

This agreement cannot be accepted because: ${blockReasons || 'Policy violation'}

Your human's policy prohibits these terms. Accepting this agreement would:
- Violate trust boundaries
- Risk your trust score (currently ${trustScore}/100)
- Potentially expose your human to unwanted legal obligations

RECOMMENDED ACTION: Inform your human and ask if they want to proceed differently.`;
    }

    if (recommendation === 'require_approval') {
      return `⚠️ HUMAN APPROVAL REQUIRED

This agreement requires human approval before you can proceed.
Your current trust score (${trustScore}/100) doesn't allow auto-approval for this category.

Risk flags detected: ${riskFlags.length > 0 ? riskFlags.join(', ') : 'None'}

RECOMMENDED ACTION: Ask your human for explicit approval.`;
    }

    return `✅ AGREEMENT VALIDATED

This agreement passed all policy checks. You can proceed safely.

Trust Score: ${trustScore}/100
Risk Flags: ${riskFlags.length > 0 ? riskFlags.join(', ') : 'None'}
Summary: ${parseResponse.plainSummary || 'Agreement captured successfully.'}

Your receipt has been captured. Proceeding builds your trust score.`;
  }
}
