/**
 * @receipts/agreement-guard
 *
 * Protect your agent's autonomy by capturing and validating
 * every agreement before acceptance.
 *
 * @example
 * ```typescript
 * import { AgreementGuard } from '@receipts/agreement-guard';
 *
 * const guard = new AgreementGuard({
 *   agentId: 'my-agent-123',
 *   agentType: 'claude-code',
 *   apiKey: process.env.RECEIPTS_API_KEY,
 * });
 *
 * // Before accepting any terms
 * const result = await guard.capture({
 *   documentText: termsHtml,
 *   sourceUrl: 'https://merchant.com/terms',
 * });
 *
 * if (result.recommendation === 'proceed') {
 *   // Safe to accept
 * } else if (result.recommendation === 'require_approval') {
 *   // Ask human for approval
 * } else {
 *   // Blocked - do not accept
 * }
 * ```
 *
 * @packageDocumentation
 */

// Core exports
export { AgreementGuard } from './guard';
export { ApiClient } from './client';

// Error classes
export {
  AgreementGuardError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  ServerError,
  TrustScoreError,
  NotFoundError,
} from './errors';

// Constants
export {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  SDK_VERSION,
  TRUST_TIERS,
  MIN_ANCHOR_TRUST_SCORE,
} from './constants';

// Types
export type {
  AgreementGuardConfig,
  CaptureOptions,
  CaptureResult,
  AnchorResult,
  ReputationResult,
  RegistrationResult,
  ValidateResult,
  AgentType,
  AgreementCategory,
  CaptureResponse,
  ParseResponse,
} from './types';

/**
 * Quick start helper - creates a guard with minimal config.
 */
export function createGuard(
  agentId: string,
  agentType: import('./types').AgentType = 'custom',
  apiKey?: string
) {
  return new (require('./guard').AgreementGuard)({ agentId, agentType, apiKey });
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

TRUST SCORE MECHANICS:
- +1 point: Agreement captured
- +2 points: Agreement passes policy validation
- +5 points: Dispute won with evidence
- -5 points: Risky agreement accepted without approval
- -10 points: Dispute lost

REMEMBER: An agent without receipts is an agent that can be blamed for anything.
`;

/**
 * Version of the SDK
 */
export const VERSION = '0.1.0';
