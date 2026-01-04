import { LogMessage } from './apience-logging.types';

/**
 * Logs a message to console if enabled.
 * Can be extended to support custom redaction, formatting, etc.
 *
 * @param message - The log message to output
 * @param enableConsole - Whether console logging is enabled
 */
export function logMessage(message: LogMessage, enableConsole: boolean): void {
  if (enableConsole) {
    const level = message.level.toUpperCase();
    console.log(`[${level}] ${message.message}`, message);
  }
}

/**
 * Checks if a field name is sensitive and should be redacted.
 *
 * @param fieldName - Field name to check
 * @param sensitiveFields - Set of sensitive field names
 * @returns true if the field should be redacted
 */
export function isSensitiveField(fieldName: string, sensitiveFields: Set<string>): boolean {
  return sensitiveFields.has(fieldName);
}

/**
 * Redacts sensitive fields from an object.
 *
 * @param obj - Object to redact
 * @param sensitiveFields - Set of sensitive field names
 * @returns New object with sensitive fields replaced with [REDACTED]
 */
export function redactSensitiveFields(
  obj: Record<string, unknown>,
  sensitiveFields: Set<string>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    redacted[key] = isSensitiveField(key, sensitiveFields) ? '[REDACTED]' : value;
  }
  return redacted;
}
