/**
 * Apience Logging Module.
 *
 * Provides request/response logging and thread-local storage for per-request context.
 *
 * Types:
 * - ApienceLoggingConfig: Logging configuration.
 * - LogTransport: Interface for custom log transports.
 * - LogMessage: Structured log message format.
 * - ApienceThreadLocalData: Per-request context storage.
 *
 * Utils:
 * - logMessage: Log message helper.
 * - isSensitiveField: Check if field should be redacted.
 * - redactSensitiveFields: Redact sensitive fields from object.
 * - getApienceThreadLocalData: Get all TLS data.
 * - getApienceTlsData: Get specific TLS field.
 * - setApienceTlsData: Set specific TLS field.
 * - runWithApienceTlsData: Run callback within TLS context.
 *
 * Implementations:
 * - createApienceLoggingMiddleware: Request/response logging middleware (console).
 * - initializeApienceLogging: Initialize logging system.
 * - flushApienceLogging: Flush pending logs.
 * - createApienceTlsMiddleware: Thread-local storage initialization middleware.
 * - extractCountryCodeFromCloudFront: Extract country code from CF header.
 */

export type { ApienceLoggingConfig, LogMessage, LogTransport } from './apience-logging.types';

export type { ApienceThreadLocalData } from './apience-thread-local-storage.types';

export { isSensitiveField, logMessage, redactSensitiveFields } from './apience-logging.utils';

export { createApienceLoggingMiddleware, flushApienceLogging, initializeApienceLogging } from './console-logging';

export {
  getApienceThreadLocalData,
  getApienceTlsData,
  runWithApienceTlsData,
  setApienceTlsData,
} from './apience-thread-local-storage';

export {
  createApienceTlsMiddleware,
  extractCountryCodeFromCloudFront,
} from './apience-thread-local-storage-middleware';
