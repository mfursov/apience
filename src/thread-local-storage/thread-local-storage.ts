import { AsyncLocalStorage } from 'async_hooks';

/**
 * Thread-local data stored per request.
 * Can be extended with custom fields via the context key-value store.
 */
export interface ApienceThreadLocalData {
  /** Unique request ID for tracing */
  requestId: string;

  /** Generic key-value storage for extensibility */
  [key: string]: unknown;
}

/**
 * AsyncLocalStorage instance for managing per-request context.
 * This ensures that each async operation associated with a request
 * can access the request-specific data even across async boundaries.
 */
const asyncLocalStorage = new AsyncLocalStorage<ApienceThreadLocalData>();

/**
 * Gets all thread-local data for the current request context.
 * Returns undefined if called outside an async context managed by Apience.
 */
export function getApienceThreadLocalData(): ApienceThreadLocalData | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Gets a specific field from the thread-local data.
 * Throws if called outside of a managed async context.
 *
 * @param key - Field key
 * @returns Field value or undefined if not set
 */
export function getApienceTlsData(key: string): unknown {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    return undefined;
  }
  return store[key];
}

/**
 * Sets a specific field in the thread-local data.
 * Throws if called outside a managed async context.
 *
 * @param key - Field key
 * @param value - Field value
 */
export function setApienceTlsData(key: string, value: unknown): void {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    console.warn(`Cannot set thread-local data '${key}' outside of async context`);
    return;
  }
  store[key] = value;
}

/**
 * Executes a callback within a request context with the given thread-local data.
 * Used by middleware to set up the context for handlers.
 *
 * @param data - Thread-local data to establish
 * @param callback - Function to execute within the context
 * @returns Result of the callback
 */
export async function runWithApienceTlsData<T>(data: ApienceThreadLocalData, callback: () => Promise<T>): Promise<T> {
  return asyncLocalStorage.run(data, callback);
}
