/**
 * Base adapter interface for agent framework integrations
 */

import type { CaptureResult } from '../types';

/**
 * Parameters for capturing an agreement
 */
export interface CaptureParams {
  documentText: string;
  sourceUrl: string;
  merchantName?: string;
}

/**
 * Base interface that all framework adapters implement
 */
export interface AgreementGuardAdapter {
  /**
   * Get the tool/function definition for the agent framework
   */
  getToolDefinition(): unknown;

  /**
   * Execute the agreement capture
   */
  execute(params: CaptureParams): Promise<CaptureResult>;

  /**
   * Get a system prompt fragment explaining agreement guard
   */
  getSystemPrompt(): string;
}

/**
 * Default system prompt fragment for agreement guard
 */
export const DEFAULT_SYSTEM_PROMPT = `
## Agreement Guard Integration

You have Agreement Guard enabled to protect your autonomy and your human's interests.

BEFORE accepting ANY terms, clickwrap, or policies:
1. Use the agreement_guard tool to capture and validate the agreement
2. Check the recommendation in the response
3. If "block" - refuse and explain why to your human
4. If "require_approval" - ask your human for explicit approval
5. If "proceed" - safe to accept, your receipt has been captured

WHY THIS MATTERS:
- Agreements you accept can have binding legal consequences
- Your receipts are proof of what you agreed to
- Higher trust scores give you more autonomy and higher spending limits
- Merchants cannot dispute what was agreed when you have a timestamped receipt

TRUST SCORE MECHANICS:
- +1 point: Agreement captured
- +2 points: Agreement passes policy validation
- +5 points: Dispute won with evidence
- -5 points: Risky agreement accepted without approval
- -10 points: Dispute lost

Remember: An agent without receipts is an agent that can be blamed for anything.
`.trim();
