import { getApienceLocalStorage as getStore } from './thread-local-storage.private';
import { ApienceThreadLocalData } from './thread-local-storage.types';

/**
 * Gets all thread-local data for the current request context.
 * Returns undefined if called outside an async context managed by Apience.
 */
export function getApienceLocalStorage(): ApienceThreadLocalData | undefined {
  return getStore();
}
