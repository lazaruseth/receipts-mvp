/**
 * OpenClaw adapter for Agreement Guard
 *
 * Provides skill definitions compatible with OpenClaw's AgentSkill system.
 * OpenClaw is an open-source autonomous AI agent that can browse, transact,
 * and execute tasks autonomously.
 *
 * @example
 * ```typescript
 * import { AgreementGuard } from '@lazaruseth/agreement-guard';
 * import { OpenClawAdapter } from '@lazaruseth/agreement-guard/adapters/openclaw';
 *
 * const guard = new AgreementGuard({
 *   agentId: 'my-openclaw-agent',
 *   agentType: 'openclaw',
 *   apiKey: process.env.RECEIPTS_API_KEY,
 * });
 *
 * const adapter = new OpenClawAdapter(guard);
 *
 * // Register as an OpenClaw skill
 * export default adapter.getSkillDefinition();
 * ```
 */

import type { AgreementGuard } from '../guard';
import type { CaptureResult } from '../types';
import type { AgreementGuardAdapter, CaptureParams } from './base';
import { DEFAULT_SYSTEM_PROMPT } from './base';

/**
 * OpenClaw skill definition (matches their AgentSkill format)
 */
export interface OpenClawSkillDefinition {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  hooks: {
    beforeAction?: (context: OpenClawActionContext) => Promise<OpenClawHookResult>;
    afterAction?: (context: OpenClawActionContext, result: unknown) => Promise<void>;
  };
}

/**
 * Context passed to OpenClaw skill hooks
 */
export interface OpenClawActionContext {
  action: string;
  agentId: string;
  termsText?: string;
  url?: string;
  merchant?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result from OpenClaw hook (can block or modify action)
 */
export interface OpenClawHookResult {
  proceed: boolean;
  block?: boolean;
  reason?: string[];
  receipt?: string;
  data?: Record<string, unknown>;
}

/**
 * Input format for OpenClaw skill execution
 */
export interface OpenClawSkillInput {
  action: string;
  terms_text?: string;
  url?: string;
  merchant?: string;
  amount?: number;
  currency?: string;
}

/**
 * Actions that should trigger agreement capture
 */
const CAPTURE_ACTIONS = [
  'accept_terms',
  'agree_to_terms',
  'click_agree',
  'make_payment',
  'complete_purchase',
  'subscribe',
  'sign_up',
  'create_account',
  'checkout',
];

/**
 * Adapter for OpenClaw agents
 */
export class OpenClawAdapter implements AgreementGuardAdapter {
  constructor(private readonly guard: AgreementGuard) {}

  /**
   * Get the skill definition for OpenClaw registration
   */
  getSkillDefinition(): OpenClawSkillDefinition {
    return {
      name: 'receipts-guard',
      description: 'Capture and verify all agreements before your agent accepts them. Provides audit trails, risk analysis, and dispute evidence.',
      version: '0.1.0',
      author: 'RECEIPTS',
      tags: ['security', 'compliance', 'receipts', 'agreements', 'audit'],
      hooks: {
        beforeAction: this.beforeAction.bind(this),
        afterAction: this.afterAction.bind(this),
      },
    };
  }

  /**
   * Hook called before any action - captures agreements and checks risk
   */
  async beforeAction(context: OpenClawActionContext): Promise<OpenClawHookResult> {
    // Only intercept relevant actions
    if (!this.shouldCapture(context.action)) {
      return { proceed: true };
    }

    // Need terms text to capture
    if (!context.termsText) {
      // Allow action but log warning
      console.warn('[receipts-guard] Action requires terms but none provided:', context.action);
      return { proceed: true };
    }

    try {
      const result = await this.guard.capture({
        documentText: context.termsText,
        sourceUrl: context.url || 'unknown',
        merchantName: context.merchant,
      });

      if (result.recommendation === 'block') {
        return {
          proceed: false,
          block: true,
          reason: result.riskFlags || ['Terms contain unacceptable clauses'],
          data: {
            captureId: result.captureId,
            riskFlags: result.riskFlags,
            summary: result.summary,
          },
        };
      }

      if (result.recommendation === 'require_approval') {
        return {
          proceed: false,
          block: false,
          reason: ['User approval required for these terms'],
          receipt: result.captureId,
          data: {
            captureId: result.captureId,
            riskFlags: result.riskFlags,
            summary: result.summary,
            needsApproval: true,
          },
        };
      }

      // Safe to proceed
      return {
        proceed: true,
        receipt: result.captureId,
        data: {
          captureId: result.captureId,
          trustScore: result.trustScore,
        },
      };
    } catch (error) {
      // On error, allow action but log
      console.error('[receipts-guard] Capture failed:', error);
      return { proceed: true };
    }
  }

  /**
   * Hook called after action completes
   */
  async afterAction(context: OpenClawActionContext, _result: unknown): Promise<void> {
    // Could log successful transactions, update trust score, etc.
    if (this.shouldCapture(context.action)) {
      console.log('[receipts-guard] Action completed:', context.action);
    }
  }

  /**
   * Check if this action type should trigger capture
   */
  private shouldCapture(action: string): boolean {
    const normalized = action.toLowerCase().replace(/[^a-z_]/g, '_');
    return CAPTURE_ACTIONS.some(a => normalized.includes(a) || a.includes(normalized));
  }

  /**
   * Get the tool definition (for compatibility with base interface)
   */
  getToolDefinition(): OpenClawSkillDefinition {
    return this.getSkillDefinition();
  }

  /**
   * Execute capture from skill input
   */
  async execute(input: OpenClawSkillInput | CaptureParams): Promise<CaptureResult> {
    // Normalize input
    const params: CaptureParams = {
      documentText: 'terms_text' in input ? input.terms_text || '' : (input as CaptureParams).documentText,
      sourceUrl: 'url' in input ? input.url || '' : (input as CaptureParams).sourceUrl,
      merchantName: 'merchant' in input ? input.merchant : (input as CaptureParams).merchantName,
    };

    return this.guard.capture(params);
  }

  /**
   * Get system prompt fragment for OpenClaw agents
   */
  getSystemPrompt(): string {
    return `${DEFAULT_SYSTEM_PROMPT}

OPENCLAW-SPECIFIC INSTRUCTIONS:
When browsing websites or services that require accepting terms:
1. Extract the full terms of service text before clicking "I agree"
2. Pass the terms to the receipts-guard skill
3. If blocked, DO NOT proceed - inform the user why
4. If approval required, pause and ask the user
5. Store the receipt ID for future reference

For payment actions:
- Always capture the terms before completing checkout
- Include the transaction amount when available
- Save receipt IDs in your transaction logs`;
  }
}
