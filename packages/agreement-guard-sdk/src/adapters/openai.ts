/**
 * OpenAI adapter for Agreement Guard
 *
 * Provides function definitions compatible with OpenAI's function calling
 * and Assistants API.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { AgreementGuard } from '@receipts/agreement-guard';
 * import { OpenAIAdapter } from '@receipts/agreement-guard/adapters/openai';
 *
 * const guard = new AgreementGuard({
 *   agentId: 'my-openai-assistant',
 *   agentType: 'openai-assistants',
 *   apiKey: process.env.RECEIPTS_API_KEY,
 * });
 *
 * const adapter = new OpenAIAdapter(guard);
 * const openai = new OpenAI();
 *
 * // Create an assistant with the tool
 * const assistant = await openai.beta.assistants.create({
 *   name: 'Shopping Assistant',
 *   instructions: adapter.getSystemPrompt(),
 *   model: 'gpt-4-turbo',
 *   tools: [{
 *     type: 'function',
 *     function: adapter.getToolDefinition()
 *   }]
 * });
 *
 * // Handle function calls in runs
 * async function handleToolCall(toolCall) {
 *   if (toolCall.function.name === 'capture_agreement') {
 *     const args = JSON.parse(toolCall.function.arguments);
 *     const result = await adapter.execute(args);
 *     return JSON.stringify(result);
 *   }
 * }
 * ```
 */

import type { AgreementGuard } from '../guard';
import type { CaptureResult } from '../types';
import type { AgreementGuardAdapter, CaptureParams } from './base';
import { DEFAULT_SYSTEM_PROMPT } from './base';

/**
 * OpenAI function definition
 */
export interface OpenAIFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

/**
 * OpenAI tool definition (wraps function)
 */
export interface OpenAIToolDefinition {
  type: 'function';
  function: OpenAIFunctionDefinition;
}

/**
 * Input from OpenAI's function call
 */
export interface OpenAIFunctionInput {
  document_text: string;
  source_url: string;
  merchant_name?: string;
}

/**
 * Adapter for OpenAI Assistants and function calling
 */
export class OpenAIAdapter implements AgreementGuardAdapter {
  constructor(private readonly guard: AgreementGuard) {}

  /**
   * Get the function definition for OpenAI
   */
  getToolDefinition(): OpenAIFunctionDefinition {
    return {
      name: 'capture_agreement',
      description: `Capture and validate an agreement, terms of service, or policy before accepting it.

This function protects the user by:
1. Recording the exact terms being agreed to with a timestamp
2. Checking for risky clauses (binding arbitration, no refunds, class action waivers, etc.)
3. Validating against the user's policy preferences
4. Building agent trust score for future autonomy

ALWAYS call this function before:
- Clicking "I agree" or "Accept" buttons
- Making purchases or transactions
- Signing up for services
- Accepting any terms and conditions

Returns a recommendation:
- "proceed": Safe to accept, receipt captured
- "require_approval": Ask the user for explicit approval first
- "block": Do NOT accept these terms`,
      parameters: {
        type: 'object',
        properties: {
          document_text: {
            type: 'string',
            description: 'The full text content of the agreement, terms of service, or policy document',
          },
          source_url: {
            type: 'string',
            description: 'The URL where the agreement was found',
          },
          merchant_name: {
            type: 'string',
            description: 'The name of the merchant or service provider. Will be inferred from URL if not provided.',
          },
        },
        required: ['document_text', 'source_url'],
      },
    };
  }

  /**
   * Get as a full tool definition (with type: 'function' wrapper)
   */
  getAsToolDefinition(): OpenAIToolDefinition {
    return {
      type: 'function',
      function: this.getToolDefinition(),
    };
  }

  /**
   * Execute the agreement capture from OpenAI's function call input
   */
  async execute(input: OpenAIFunctionInput | CaptureParams): Promise<CaptureResult> {
    // Normalize input (handle both snake_case and camelCase)
    const params: CaptureParams = {
      documentText: 'document_text' in input ? input.document_text : (input as CaptureParams).documentText,
      sourceUrl: 'source_url' in input ? input.source_url : (input as CaptureParams).sourceUrl,
      merchantName: 'merchant_name' in input ? input.merchant_name : (input as CaptureParams).merchantName,
    };

    return this.guard.capture(params);
  }

  /**
   * Get the system prompt fragment for OpenAI agents
   */
  getSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * Format the capture result for OpenAI's function response
   */
  formatFunctionResult(result: CaptureResult): string {
    return JSON.stringify({
      success: result.success,
      recommendation: result.recommendation,
      captureId: result.captureId,
      trustScore: result.trustScore,
      riskFlags: result.riskFlags,
      summary: result.summary,
      agentMessage: result.agentMessage,
      violations: result.violations,
      warnings: result.warnings,
    });
  }

  /**
   * Parse function arguments from OpenAI
   */
  static parseArguments(argumentsJson: string): OpenAIFunctionInput {
    return JSON.parse(argumentsJson);
  }
}
