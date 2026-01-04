/**
 * Apience Auth Module.
 *
 * Provides pluggable authentication strategy system for Express.js.
 *
 * Types:
 * - AuthStrategy: Generic auth strategy interface.
 *
 * Utils:
 * - createAuthMiddleware: Create auth middleware from strategy.
 * - getAuthUser: Extract authenticated user from context (throws if not found).
 * - tryGetAuthUser: Extract authenticated user from context (returns undefined if not found).
 *
 * Implementations:
 * - BasicAuthStrategy: HTTP Basic authentication implementation.
 */

export type { AuthStrategy } from './apience-auth.types';
export { createAuthMiddleware, getAuthUser, tryGetAuthUser } from './apience-auth.utils';
export { BasicAuthStrategy } from './basic-auth-strategy';
