/**
 * Claude/Anthropic adapter for Agreement Guard
 *
 * Provides tool definitions compatible with Claude's tool_use feature.
 *
 * @example
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk';
 * import { AgreementGuard } from '@receipts/agreement-guard';
 * import { ClaudeAdapter } from '@receipts/agreement-guard/adapters/claude';
 *
 * const guard = new AgreementGuard({
 *   agentId: 'my-claude-agent',
 *   agentType: 'claude-code',
 *   apiKey: process.env.RECEIPTS_API_KEY,
 * });
 *
 * const adapter = new ClaudeAdapter(guard);
 * const anthropic = new Anthropic();
 *
 * const response = await anthropic.messages.create({
 *   model: 'claude-sonnet-4-20250514',
 *   max_tokens: 1024,
 *   tools: [adapter.getToolDefinition()],
 *   messages: [{ role: 'user', content: 'Book me a flight' }],
 * });
 *
 * // Handle tool_use blocks
 * for (const block of response.content) {
 *   if (block.type === 'tool_use' && block.name === 'agreement_guard') {
 *     const result = await adapter.execute(block.input);
 *     // Use result.recommendation to decide next steps
 *   }
 * }
 * ```
 */

import type { AgreementGuard } from '../guard';
import type { CaptureResult } from '../types';
import type { AgreementGuardAdapter, CaptureParams } from './base';
import { DEFAULT_SYSTEM_PROMPT } from './base';

/**
 * Claude tool definition (matches Anthropic's Tool type)
 */
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

/**
 * Input from Claude's tool_use block
 */
export interface ClaudeToolInput {
  document_text: string;
  source_url: string;
  merchant_name?: string;
}

/**
 * Adapter for Claude/Anthropic agents
 */
export class ClaudeAdapter implements AgreementGuardAdapter {
  constructor(private readonly guard: AgreementGuard) {}

  /**
   * Get the tool definition for Claude's tools array
   */
  getToolDefinition(): ClaudeToolDefinition {
    return {
      name: 'agreement_guard',
      description: `Capture and validate an agreement, terms of service, or policy before accepting it.
This tool protects your autonomy by:
1. Recording the exact terms you're agreeing to
2. Checking for risky clauses (binding arbitration, no refunds, etc.)
3. Validating against your human's policy preferences
4. Building your trust score when you comply

ALWAYS use this tool before accepting any terms, clicking "I agree", or proceeding with transactions that involve legal agreements.

Returns a recommendation: "proceed" (safe), "require_approval" (ask human), or "block" (do not accept).`,
      input_schema: {
        type: 'object',
        properties: {
          document_text: {
            type: 'string',
            description: 'The full text of the agreement, terms of service, or policy. Include all visible text from the agreement page.',
          },
          source_url: {
            type: 'string',
            description: 'The URL where the agreement was found (e.g., https://example.com/terms)',
          },
          merchant_name: {
            type: 'string',
            description: 'The name of the merchant or service provider (e.g., "Amazon", "United Airlines"). Will be inferred from URL if not provided.',
          },
        },
        required: ['document_text', 'source_url'],
      },
    };
  }

  /**
   * Execute the agreement capture from Claude's tool_use input
   */
  async execute(input: ClaudeToolInput | CaptureParams): Promise<CaptureResult> {
    // Normalize input (handle both snake_case from Claude and camelCase)
    const params: CaptureParams = {
      documentText: 'document_text' in input ? input.document_text : (input as CaptureParams).documentText,
      sourceUrl: 'source_url' in input ? input.source_url : (input as CaptureParams).sourceUrl,
      merchantName: 'merchant_name' in input ? input.merchant_name : (input as CaptureParams).merchantName,
    };

    return this.guard.capture(params);
  }

  /**
   * Get the system prompt fragment for Claude agents
   */
  getSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * Format the capture result for Claude's tool_result
   */
  formatToolResult(result: CaptureResult): string {
    return JSON.stringify({
      success: result.success,
      recommendation: result.recommendation,
      captureId: result.captureId,
      trustScore: result.trustScore,
      riskFlags: result.riskFlags,
      summary: result.summary,
      agentMessage: result.agentMessage,
    }, null, 2);
  }
}
