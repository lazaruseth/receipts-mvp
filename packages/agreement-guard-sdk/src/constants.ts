/**
 * SDK Constants
 */

/** Default RECEIPTS API URL */
export const DEFAULT_BASE_URL = 'https://remaster-mvp.vercel.app';

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT = 30000;

/** SDK version */
export const SDK_VERSION = '0.1.0';

/** User agent string for API requests */
export const USER_AGENT = `@receipts/agreement-guard/${SDK_VERSION}`;

/** Maximum retry attempts for transient failures */
export const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms) */
export const RETRY_BASE_DELAY = 1000;

/** Trust score thresholds */
export const TRUST_TIERS = {
  NEW_AGENT: { min: 0, max: 20, name: 'New Agent', maxSpend: 10 },
  EMERGING: { min: 21, max: 40, name: 'Emerging Agent', maxSpend: 50 },
  ACTIVE: { min: 41, max: 60, name: 'Active Transactor', maxSpend: 200 },
  VERIFIED: { min: 61, max: 80, name: 'Verified Operator', maxSpend: 500 },
  TRUSTED: { min: 81, max: 100, name: 'Trusted Delegate', maxSpend: 1000 },
} as const;

/** Minimum trust score required for on-chain anchoring */
export const MIN_ANCHOR_TRUST_SCORE = 61;

/** HTTP status codes */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
} as const;
