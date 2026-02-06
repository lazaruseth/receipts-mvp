/**
 * Low-level API client for RECEIPTS API
 */

import {
  AgreementGuardError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError,
} from './errors';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  HTTP_STATUS,
  MAX_RETRIES,
  RETRY_BASE_DELAY,
  USER_AGENT,
} from './constants';

export interface ApiClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  debug?: boolean;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: unknown;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly debug: boolean;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? MAX_RETRIES;
    this.debug = config.debug || false;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Make an API request with automatic retry and error handling
   */
  async request<T>(path: string, options: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const retries = options.retries ?? this.maxRetries;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.executeRequest<T>(url, options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (
          error instanceof AuthenticationError ||
          error instanceof AuthorizationError ||
          error instanceof ValidationError ||
          error instanceof NotFoundError
        ) {
          throw error;
        }

        // Check if we should retry
        if (attempt < retries && this.shouldRetry(error as Error)) {
          const delay = this.calculateBackoff(attempt);
          this.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`, {
            error: (error as Error).message,
          });
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError || new NetworkError('Request failed after retries');
  }

  /**
   * Execute a single request (no retry logic)
   */
  private async executeRequest<T>(url: string, options: RequestOptions): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
      signal: controller.signal,
    };

    if (options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    this.log(`${options.method} ${url}`, options.body);

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response body
      const contentType = response.headers.get('content-type');
      let data: unknown;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        throw this.createError(response.status, data as ApiErrorResponse);
      }

      this.log(`Response ${response.status}`, data);
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${this.timeout}ms`, this.timeout);
      }

      if (error instanceof AgreementGuardError) {
        throw error;
      }

      throw new NetworkError((error as Error).message, error);
    }
  }

  /**
   * Create appropriate error based on status code
   */
  private createError(status: number, response: ApiErrorResponse): AgreementGuardError {
    const message = response.error || response.message || `HTTP ${status}`;

    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return new ValidationError(message, response.details as any);

      case HTTP_STATUS.UNAUTHORIZED:
        return new AuthenticationError(message, response.details);

      case HTTP_STATUS.FORBIDDEN:
        return new AuthorizationError(message, response.details);

      case HTTP_STATUS.NOT_FOUND:
        return new NotFoundError(message);

      case HTTP_STATUS.RATE_LIMITED:
        return new RateLimitError(message);

      default:
        if (status >= 500) {
          return new ServerError(message, status, response.details);
        }
        return new AgreementGuardError(message, 'UNKNOWN_ERROR', status, response.details);
    }
  }

  /**
   * Determine if an error is retryable
   */
  private shouldRetry(error: Error): boolean {
    // Retry on network errors and server errors
    if (error instanceof NetworkError || error instanceof ServerError) {
      return true;
    }

    // Retry on rate limits (with backoff)
    if (error instanceof RateLimitError) {
      return true;
    }

    // Retry on timeouts
    if (error instanceof TimeoutError) {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff with jitter
    const exponential = RETRY_BASE_DELAY * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(exponential + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log message if debug is enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[ApiClient] ${message}`, data !== undefined ? data : '');
    }
  }
}
