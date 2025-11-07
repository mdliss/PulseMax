/**
 * Data validation schemas and utilities
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate session data
 */
export function validateSessionData(data: any): ValidationResult<any> {
  const errors: string[] = [];

  if (!data.sessionId || typeof data.sessionId !== 'string') {
    errors.push('Invalid or missing sessionId');
  }

  if (!data.customerId || typeof data.customerId !== 'string') {
    errors.push('Invalid or missing customerId');
  }

  if (!data.tutorId || typeof data.tutorId !== 'string') {
    errors.push('Invalid or missing tutorId');
  }

  if (!data.subject || typeof data.subject !== 'string') {
    errors.push('Invalid or missing subject');
  }

  if (!data.startTime) {
    errors.push('Missing startTime');
  }

  if (!data.status || !['scheduled', 'in-progress', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('Invalid or missing status');
  }

  if (data.rating !== undefined && (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5)) {
    errors.push('Invalid rating (must be between 1 and 5)');
  }

  return errors.length === 0
    ? { success: true, data }
    : { success: false, errors };
}

/**
 * Validate customer data
 */
export function validateCustomerData(data: any): ValidationResult<any> {
  const errors: string[] = [];

  if (!data.customerId || typeof data.customerId !== 'string') {
    errors.push('Invalid or missing customerId');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.signupDate) {
    errors.push('Missing signupDate');
  }

  if (!data.status || !['active', 'inactive', 'churned'].includes(data.status)) {
    errors.push('Invalid or missing status');
  }

  return errors.length === 0
    ? { success: true, data }
    : { success: false, errors };
}

/**
 * Validate tutor data
 */
export function validateTutorData(data: any): ValidationResult<any> {
  const errors: string[] = [];

  if (!data.tutorId || typeof data.tutorId !== 'string') {
    errors.push('Invalid or missing tutorId');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.status || !['active', 'inactive'].includes(data.status)) {
    errors.push('Invalid or missing status');
  }

  if (data.ratingAvg !== undefined && (typeof data.ratingAvg !== 'number' || data.ratingAvg < 0 || data.ratingAvg > 5)) {
    errors.push('Invalid ratingAvg (must be between 0 and 5)');
  }

  return errors.length === 0
    ? { success: true, data }
    : { success: false, errors };
}

/**
 * Validate inbound call data
 */
export function validateInboundCallData(data: any): ValidationResult<any> {
  const errors: string[] = [];

  if (!data.customerId || typeof data.customerId !== 'string') {
    errors.push('Invalid or missing customerId');
  }

  if (!data.callDate) {
    errors.push('Missing callDate');
  }

  if (data.duration !== undefined && (typeof data.duration !== 'number' || data.duration < 0)) {
    errors.push('Invalid duration (must be non-negative number)');
  }

  return errors.length === 0
    ? { success: true, data }
    : { success: false, errors };
}

/**
 * Validate query parameters
 */
export function validateQueryParams(params: {
  page?: string | null;
  perPage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): ValidationResult<{
  page: number;
  perPage: number;
  startDate?: Date;
  endDate?: Date;
}> {
  const errors: string[] = [];
  const result: any = {
    page: 1,
    perPage: 100
  };

  if (params.page) {
    const page = parseInt(params.page);
    if (isNaN(page) || page < 1) {
      errors.push('Invalid page number');
    } else {
      result.page = page;
    }
  }

  if (params.perPage) {
    const perPage = parseInt(params.perPage);
    if (isNaN(perPage) || perPage < 1 || perPage > 1000) {
      errors.push('Invalid perPage (must be between 1 and 1000)');
    } else {
      result.perPage = perPage;
    }
  }

  if (params.startDate) {
    const startDate = new Date(params.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid startDate format');
    } else {
      result.startDate = startDate;
    }
  }

  if (params.endDate) {
    const endDate = new Date(params.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid endDate format');
    } else {
      result.endDate = endDate;
    }
  }

  if (result.startDate && result.endDate && result.startDate > result.endDate) {
    errors.push('startDate must be before endDate');
  }

  return errors.length === 0
    ? { success: true, data: result }
    : { success: false, errors };
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, maxLength);
}

/**
 * Validate and sanitize numeric input
 */
export function validateNumber(
  value: any,
  min?: number,
  max?: number
): ValidationResult<number> {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { success: false, errors: ['Invalid number'] };
  }

  if (min !== undefined && num < min) {
    return { success: false, errors: [`Number must be >= ${min}`] };
  }

  if (max !== undefined && num > max) {
    return { success: false, errors: [`Number must be <= ${max}`] };
  }

  return { success: true, data: num };
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
  maxDays: number = 90
): ValidationResult<{ startDate: Date; endDate: Date }> {
  const errors: string[] = [];

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    errors.push('Invalid startDate');
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    errors.push('Invalid endDate');
  }

  if (startDate > endDate) {
    errors.push('startDate must be before endDate');
  }

  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > maxDays) {
    errors.push(`Date range cannot exceed ${maxDays} days`);
  }

  return errors.length === 0
    ? { success: true, data: { startDate, endDate } }
    : { success: false, errors };
}
