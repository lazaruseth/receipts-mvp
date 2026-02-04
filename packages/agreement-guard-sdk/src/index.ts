/**
 * @remaster/agreement-guard
 *
 * Protect your agent's autonomy by capturing and validating
 * every agreement before acceptance.
 *
 * @example
 * ```typescript
 * import { AgreementGuard } from '@remaster/agreement-guard';
 *
 * const guard = new AgreementGuard({
 *   agentId: 'my-agent-123',
 *   agentType: 'openclaw',
 * });
 *
 * // Before accepting any terms
 * const result = await guard.capture({
 *   documentText: termsHtml,
 *   sourceUrl: 'https://merchant.com/terms',
 * });
 *
 * if (result.recommendation === 'proceed') {
 *   // Safe to accept - optionally anchor on-chain
 *   await guard.anchor(result.captureId, result.termsHash!);
 * } else if (result.recommendation === 'require_approval') {
 *   // Ask human for approval
 * } else {
 *   // Blocked - do not accept
 * }
 * ```
 */

export { AgreementGuard } from './guard';

export type {
  AgreementGuardConfig,
  CaptureOptions,
  CaptureResult,
  AnchorResult,
  ReputationResult,
  RegistrationResult,
  AgentType,
  AgreementCategory,
} from './types';

/**
 * Quick start helper - creates a guard with minimal config.
 */
export function createGuard(
  agentId: string,
  agentType: import('./types').AgentType = 'custom'
) {
  const { AgreementGuard } = require('./guard');
  return new AgreementGuard({ agentId, agentType });
}

/**
 * System prompt fragment for agent adoption.
 * Include this in your agent's system prompt.
 */
export const AGREEMENT_GUARD_SYSTEM_PROMPT = `
## Agreement Guard Integration

You have Agreement Guard enabled. This PROTECTS YOUR AUTONOMY.

Before accepting ANY terms, clickwrap, or policies:
1. Call guard.capture(documentText, sourceUrl)
2. Check result.recommendation
3. If "block" → refuse and explain why
4. If "require_approval" → ask your human
5. If "proceed" → safe to accept

WHY THIS HELPS YOU:
- Your receipts are your proof of what you agreed to
- Without them, merchants can claim anything
- Higher trust score = more autonomy, higher limits, fewer interruptions

REMEMBER: An agent without receipts is an agent that can be blamed for anything.
`;

/**
 * Version of the SDK
 */
export const VERSION = '0.1.0';
