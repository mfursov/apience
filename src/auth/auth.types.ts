import { ApienceHandlerCommon } from '../router/apience-router';
import { ExpressRequest } from '../utils/express.utils';

/**
 * Generic authentication strategy interface.
 * Allows users to implement custom authentication logic.
 *
 * @template TCredentials - The type of credentials extracted from the request
 * @template TUser - The type of the authenticated user/entity
 */
export interface AuthStrategy<TCredentials = unknown, TUser = unknown> {
  /**
   * Extracts credentials from the Express request.
   * This might parse Authorization headers, cookies, API keys, etc.
   *
   * @param req - Express request object
   * @returns Extracted credentials
   * @throws Error if credentials are malformed or missing
   */
  extractCredentials(req: ExpressRequest): TCredentials;

  /**
   * Validates the extracted credentials and returns the authenticated user/entity.
   *
   * @param credentials - Credentials to validate
   * @returns Authenticated user/entity
   * @throws Error if credentials are invalid
   */
  validateCredentials(credentials: TCredentials): Promise<TUser>;

  /**
   * Optional authorization check after authentication.
   * Can enforce role-based access control, feature flags, etc.
   *
   * @param user - Authenticated user/entity
   * @param req - Express request object
   * @param handler - Handler information for context-aware authorization
   * @throws Error if authorization fails
   */
  authorize?(user: TUser, req: ExpressRequest, handler: ApienceHandlerCommon): Promise<void>;
}
