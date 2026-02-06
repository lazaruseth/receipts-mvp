/**
 * Custom error classes for Agreement Guard SDK
 */

/**
 * Base error class for all Agreement Guard errors
 */
export class AgreementGuardError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AgreementGuardError';
    Object.setPrototypeOf(this, AgreementGuardError.prototype);
  }
}

/**
 * Authentication-related errors (401, 403)
 */
export class AuthenticationError extends AgreementGuardError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization/permission errors
 */
export class AuthorizationError extends AgreementGuardError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AgreementGuardError {
  constructor(
    message: string = 'Validation failed',
    public readonly validationErrors?: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', 400, validationErrors);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network-related errors (connection failures, timeouts)
 */
export class NetworkError extends AgreementGuardError {
  constructor(message: string = 'Network error', details?: unknown) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Request timeout errors
 */
export class TimeoutError extends AgreementGuardError {
  constructor(message: string = 'Request timed out', public readonly timeoutMs?: number) {
    super(message, 'TIMEOUT_ERROR', 408, { timeoutMs });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends AgreementGuardError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfterMs?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfterMs });
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server errors (500+)
 */
export class ServerError extends AgreementGuardError {
  constructor(message: string = 'Server error', statusCode: number = 500, details?: unknown) {
    super(message, 'SERVER_ERROR', statusCode, details);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Trust score related errors
 */
export class TrustScoreError extends AgreementGuardError {
  constructor(
    message: string,
    public readonly requiredScore?: number,
    public readonly currentScore?: number
  ) {
    super(message, 'TRUST_SCORE_ERROR', 403, { requiredScore, currentScore });
    this.name = 'TrustScoreError';
    Object.setPrototypeOf(this, TrustScoreError.prototype);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends AgreementGuardError {
  constructor(message: string = 'Resource not found', public readonly resourceType?: string) {
    super(message, 'NOT_FOUND_ERROR', 404, { resourceType });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
