/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Error logger with structured logging
 */
export class ErrorLogger {
  static log(error: Error, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';

    const logEntry = {
      timestamp,
      name: error.name,
      message: error.message,
      stack: !isProduction ? error.stack : undefined,
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        code: error.code,
        details: error.details
      }),
      ...context
    };

    if (isProduction) {
      // In production, send to monitoring service (Sentry, DataDog, etc.)
      console.error(JSON.stringify(logEntry));
    } else {
      // In development, pretty print
      console.error('❌ Error:', {
        ...logEntry,
        stack: error.stack
      });
    }
  }

  static warn(message: string, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    console.warn('⚠️  Warning:', {
      timestamp,
      message,
      ...context
    });
  }

  static info(message: string, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    console.log('ℹ️  Info:', {
      timestamp,
      message,
      ...context
    });
  }
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: any[]) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      ErrorLogger.log(error, {
        handler: 'asyncHandler',
        args: args.map(arg => {
          // Sanitize sensitive data
          if (arg && typeof arg === 'object') {
            const sanitized = { ...arg };
            delete sanitized.password;
            delete sanitized.token;
            delete sanitized.apiKey;
            return sanitized;
          }
          return arg;
        })
      });
      throw error;
    });
  }) as T;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    ErrorLogger.warn('JSON parse failed', {
      json: json.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return fallback;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        ErrorLogger.log(lastError, {
          function: 'retryWithBackoff',
          attempts: attempt + 1,
          finalDelay: delay
        });
        throw lastError;
      }

      ErrorLogger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, {
        error: lastError.message,
        nextDelay: delay
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        this.failures = 0;
      } else {
        throw new AppError('Circuit breaker is open', 503, 'CIRCUIT_BREAKER_OPEN');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        ErrorLogger.warn('Circuit breaker opened', {
          failures: this.failures,
          threshold: this.threshold
        });
      }

      throw error;
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details }),
        ...(!isProduction && error.stack && { stack: error.stack })
      }
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        message: isProduction ? 'Internal server error' : error.message,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        ...(!isProduction && error.stack && { stack: error.stack })
      }
    };
  }

  return {
    error: {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    }
  };
}
