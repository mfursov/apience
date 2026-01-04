/**
 * Common utility functions - replacements for @cp/* imports
 */

// ===== Assert utilities =====

export function assertTruthy(value: unknown, messageOrFn?: string | (() => string)): asserts value {
  if (!value) {
    const message = typeof messageOrFn === 'function' ? messageOrFn() : messageOrFn;
    throw new Error(message || '400 Assertion failed');
  }
}

export function truthy<T>(value: T | undefined | null, messageOrFn?: string | (() => string)): T {
  if (!value) {
    const message = typeof messageOrFn === 'function' ? messageOrFn() : messageOrFn;
    throw new Error(message || '400 Value is not truthy');
  }
  return value;
}

// ===== HTTP Error utilities =====

export const BAD_REQUEST = '400';
export const UNAUTHORIZED = '401';
export const FORBIDDEN = '403';
export const NOT_FOUND = '404';
export const INTERNAL_ERROR = '500';
export const INTERNAL_ERROR_STATUS = 500;
export const BAD_REQUEST_STATUS = 400;

/**
 * Parse HTTP status code from error message.
 * Expected format: "XXX Some error message"
 * Example: "400 Bad Request" -> 400
 */
export function parseStatusCodeFromErrorMessageToken(errorMessage?: string): number {
  if (!errorMessage) return INTERNAL_ERROR_STATUS;

  const match = errorMessage.match(/^(\d{3})/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return INTERNAL_ERROR_STATUS;
}

// ===== Validator utilities =====

export type ValueValidator<_T = unknown> = (value: unknown, errorStatus: string) => void;

export type ObjectValidator<T extends Record<string, unknown> = Record<string, unknown>> = {
  [K in keyof T]?: ValueValidator<T[K]>;
};

export interface ValidateObjectOptions {
  failOnMissedValidators?: boolean;
}

/**
 * Validates an object against provided validators.
 * @throws Error with status code if validation fails
 */
export function validateObject<T extends Record<string, unknown>>(
  obj: unknown,
  validators: ObjectValidator<T>,
  contextMessage?: string,
  _options?: ValidateObjectOptions,
): void {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`${BAD_REQUEST}${contextMessage ? ': ' + contextMessage : ''}: Expected object`);
  }

  const typedObj = obj as Record<string, unknown>;

  for (const [key, validator] of Object.entries(validators)) {
    if (validator) {
      const value = typedObj[key];
      try {
        validator(value, BAD_REQUEST);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${message}${contextMessage ? ' (' + contextMessage + ')' : ''}`);
      }
    }
  }
}

// ===== Common validators =====

export function isNonEmptyString(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${errorStatus}: Expected non-empty string`);
  }
}

export function isValidEmail(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (typeof value !== 'string' || !value.includes('@')) {
    throw new Error(`${errorStatus}: Invalid email`);
  }
}

export function isNumber(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (typeof value !== 'number') {
    throw new Error(`${errorStatus}: Expected number`);
  }
}

export function isInteger(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${errorStatus}: Expected integer`);
  }
}

export function isBoolean(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (typeof value !== 'boolean') {
    throw new Error(`${errorStatus}: Expected boolean`);
  }
}

export function isArray(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (!Array.isArray(value)) {
    throw new Error(`${errorStatus}: Expected array`);
  }
}

export function isObject(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${errorStatus}: Expected object`);
  }
}

export function isUUID(value: unknown, errorStatus: string = BAD_REQUEST): void {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${errorStatus}: Invalid UUID format`);
  }
}
