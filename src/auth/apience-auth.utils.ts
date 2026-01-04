import { ApienceHandlerMiddleware, ApienceRequestContext } from '../router/apience-router';
import { AuthStrategy } from './apience-auth.types';

/**
 * Creates a middleware that enforces authentication using the provided strategy.
 * The authenticated user is stored in the context under the 'authUser' key.
 *
 * @template TUser - Type of the authenticated user
 * @param strategy - Authentication strategy to use
 * @param onSuccess - Optional callback to process authenticated user
 * @returns Apience middleware that enforces authentication
 */
export function createAuthMiddleware<TUser = unknown>(
  strategy: AuthStrategy<unknown, TUser>,
  onSuccess?: (user: TUser, context: ApienceRequestContext) => void,
): ApienceHandlerMiddleware {
  return async (handler, context) => {
    // Extract credentials from request
    const credentials = strategy.extractCredentials(context.req);

    // Validate credentials and get authenticated user
    const user = await strategy.validateCredentials(credentials);

    // Store authenticated user in context for the handler to access
    context.context.set('authUser', user);

    // Optional: Perform authorization check
    if (strategy.authorize) {
      // Note: handler information is not available here, but can be passed if needed
      await strategy.authorize(user, context.req, { path: context.req.path });
    }

    // Optional: Call success callback
    if (onSuccess) {
      onSuccess(user, context);
    }

    // Execute the actual handler
    return handler();
  };
}

/**
 * Helper to extract the authenticated user from the request context.
 * Throws if the user is not present (i.e., authentication was not performed).
 *
 * @template TUser - Type of the authenticated user
 * @param context - Apience request context
 * @returns The authenticated user
 * @throws Error if user is not found in context
 */
export function getAuthUser<TUser = unknown>(context: ApienceRequestContext): TUser {
  const user = context.context.get('authUser');
  if (!user) {
    throw new Error('401 UNAUTHORIZED: User not found in context. Did you add auth middleware?');
  }
  return user as TUser;
}

/**
 * Helper to safely extract the authenticated user from the request context.
 * Returns undefined if the user is not present.
 *
 * @template TUser - Type of the authenticated user
 * @param context - Apience request context
 * @returns The authenticated user, or undefined if not found
 */
export function tryGetAuthUser<TUser = unknown>(context: ApienceRequestContext): TUser | undefined {
  return context.context.get('authUser') as TUser | undefined;
}
