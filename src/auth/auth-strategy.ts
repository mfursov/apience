import { assertTruthy } from 'assertic';
import { ApienceHandlerCommon } from '../router/apience-router';
import { ExpressRequest } from '../utils/express.utils';
import { AuthStrategy } from './auth.types';

/**
 * Basic authentication strategy using username/password validation.
 * Parses HTTP Basic Authorization header and validates credentials.
 *
 * Example usage:
 * ```
 * const strategy = new BasicAuthStrategy(
 *   async (username, password) => {
 *     const user = await db.users.findByUsername(username);
 *     if (user && await bcrypt.compare(password, user.hash)) {
 *       return user;
 *     }
 *     return null;
 *   }
 * );
 * ```
 */
export class BasicAuthStrategy<TUser = unknown> implements AuthStrategy<{ username: string; password: string }, TUser> {
  constructor(
    private readonly validateFn: (username: string, password: string) => Promise<TUser | null>,
    private readonly authorizeFn?: (user: TUser, req: ExpressRequest, handler: ApienceHandlerCommon) => Promise<void>,
  ) {}

  /**
   * Extract username and password from Basic auth header.
   * Expected format: "Basic base64(username:password)"
   */
  extractCredentials(req: ExpressRequest): { username: string; password: string } {
    const authHeaderValue = req.header('Authorization');
    assertTruthy(authHeaderValue, '401 UNAUTHORIZED: No Authorization header provided');

    // Parse Basic auth header: "Basic base64(username:password)"
    assertTruthy(authHeaderValue.startsWith('Basic '), '401 UNAUTHORIZED: Invalid Authorization header format');

    try {
      const decoded = Buffer.from(authHeaderValue.substring(6), 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');

      assertTruthy(username && password, '401 UNAUTHORIZED: Invalid credentials format');

      return { username, password };
    } catch (_error) {
      throw new Error('401 UNAUTHORIZED: Failed to parse credentials');
    }
  }

  /**
   * Validate the extracted credentials using the provided validation function.
   */
  async validateCredentials({ username, password }: { username: string; password: string }): Promise<TUser> {
    const user = await this.validateFn(username, password);
    assertTruthy(user, '401 UNAUTHORIZED: Invalid username or password');
    return user;
  }

  /**
   * Perform optional authorization check.
   */
  async authorize(user: TUser, req: ExpressRequest, handler: ApienceHandlerCommon): Promise<void> {
    if (this.authorizeFn) {
      await this.authorizeFn(user, req, handler);
    }
  }
}
