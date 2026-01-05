import { ExpressRequest } from '../utils/express.utils';

/**
 * Interface representing the authenticated user.
 * Users of the library should use module augmentation to add fields to this interface.
 *
 * Example:
 * ```ts
 * declare module 'apience' {
 *   interface ApienceAuthUser {
 *     id: string;
 *     roles: string[];
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApienceAuthUser {}

/**
 * Generic authentication strategy interface.
 * Allows users to implement custom authentication logic.
 *
 * @template TCredentials - The type of credentials extracted from the request
 * @template TUser - The type of the authenticated user/entity
 */
export interface AuthStrategy<TCredentials = unknown, TUser extends ApienceAuthUser = ApienceAuthUser> {
  /**
   * Extracts credentials from the Express request.
   * This might parse Authorization headers, cookies, API keys, etc.
   *
   * @param req - Express request object
   * @returns Extracted credentials, or undefined if not found/applicable
   */
  extractCredentials(req: ExpressRequest): TCredentials | undefined;

  /**
   * Validates the extracted credentials and returns the authenticated user/entity.
   *
   * @param credentials - Credentials to validate
   * @returns Authenticated user/entity
   * @throws Error if credentials are invalid
   */
  validateCredentials(credentials: TCredentials): Promise<TUser>;
}
