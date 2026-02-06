/**
 * LangChain adapter for Agreement Guard
 *
 * Provides a LangChain-compatible tool for agreement capture.
 *
 * @example
 * ```typescript
 * import { ChatOpenAI } from '@langchain/openai';
 * import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
 * import { AgreementGuard } from '@receipts/agreement-guard';
 * import { AgreementGuardTool } from '@receipts/agreement-guard/adapters/langchain';
 *
 * const guard = new AgreementGuard({
 *   agentId: 'my-langchain-agent',
 *   agentType: 'langchain',
 *   apiKey: process.env.RECEIPTS_API_KEY,
 * });
 *
 * const agreementTool = new AgreementGuardTool(guard);
 *
 * const llm = new ChatOpenAI({ modelName: 'gpt-4-turbo' });
 *
 * const agent = await createOpenAIToolsAgent({
 *   llm,
 *   tools: [agreementTool],
 *   prompt: yourPromptTemplate,
 * });
 *
 * const executor = new AgentExecutor({
 *   agent,
 *   tools: [agreementTool],
 * });
 *
 * const result = await executor.invoke({
 *   input: 'Book me a flight to NYC',
 * });
 * ```
 */

import type { AgreementGuard } from '../guard';
import type { CaptureResult } from '../types';
import type { AgreementGuardAdapter, CaptureParams } from './base';
import { DEFAULT_SYSTEM_PROMPT } from './base';

/**
 * Input schema for the LangChain tool
 */
export interface LangChainToolInput {
  document_text: string;
  source_url: string;
  merchant_name?: string;
}

/**
 * LangChain-compatible tool for Agreement Guard
 *
 * This class can be used directly with LangChain agents.
 * It follows the LangChain Tool interface pattern.
 */
export class AgreementGuardTool implements AgreementGuardAdapter {
  /** Tool name for LangChain */
  name = 'agreement_guard';

  /** Tool description for LangChain */
  description = `Capture and validate an agreement before accepting it.

Input should be a JSON string with:
- document_text: The full text of the agreement/terms
- source_url: The URL where the agreement was found
- merchant_name: (optional) The merchant name

Returns JSON with:
- recommendation: "proceed", "require_approval", or "block"
- agentMessage: Explanation of the result
- riskFlags: Array of detected risks
- trustScore: Your current trust score

ALWAYS use this tool before accepting any terms of service or agreements.`;

  constructor(private readonly guard: AgreementGuard) {}

  /**
   * Get the tool definition in a format LangChain expects
   */
  getToolDefinition(): {
    name: string;
    description: string;
    schema: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  } {
    return {
      name: this.name,
      description: this.description,
      schema: {
        type: 'object',
        properties: {
          document_text: {
            type: 'string',
            description: 'The full text of the agreement',
          },
          source_url: {
            type: 'string',
            description: 'The URL where the agreement was found',
          },
          merchant_name: {
            type: 'string',
            description: 'The merchant name (optional)',
          },
        },
        required: ['document_text', 'source_url'],
      },
    };
  }

  /**
   * Execute the tool (called by LangChain)
   *
   * @param input - Either a JSON string or an object with the parameters
   */
  async execute(input: string | LangChainToolInput | CaptureParams): Promise<CaptureResult> {
    // Parse input if it's a string
    let parsed: LangChainToolInput | CaptureParams;
    if (typeof input === 'string') {
      try {
        parsed = JSON.parse(input);
      } catch {
        throw new Error('Invalid input: expected JSON string or object');
      }
    } else {
      parsed = input;
    }

    // Normalize to CaptureParams
    const params: CaptureParams = {
      documentText: 'document_text' in parsed ? parsed.document_text : (parsed as CaptureParams).documentText,
      sourceUrl: 'source_url' in parsed ? parsed.source_url : (parsed as CaptureParams).sourceUrl,
      merchantName: 'merchant_name' in parsed ? parsed.merchant_name : (parsed as CaptureParams).merchantName,
    };

    return this.guard.capture(params);
  }

  /**
   * LangChain's _call method (alternative interface)
   */
  async _call(input: string): Promise<string> {
    const result = await this.execute(input);
    return JSON.stringify({
      success: result.success,
      recommendation: result.recommendation,
      captureId: result.captureId,
      trustScore: result.trustScore,
      riskFlags: result.riskFlags,
      summary: result.summary,
      agentMessage: result.agentMessage,
    });
  }

  /**
   * Get the system prompt fragment for LangChain agents
   */
  getSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * Return type for LangChain
   */
  get returnDirect(): boolean {
    return false;
  }
}

/**
 * Create a LangChain-compatible tool from an AgreementGuard instance
 */
export function createAgreementGuardTool(guard: AgreementGuard): AgreementGuardTool {
  return new AgreementGuardTool(guard);
}
