import { ValueAssertion } from 'assertic';

export type ApienceUrlTokensValidator = Record<string, ValueAssertion<string>>;

export interface ApienceResponse<ResponseEntity = unknown> {
  /** Result of the call. A single entity for non-paginated ${by-id} requests or an array for list queries. */
  result: ResponseEntity;
  /** Unique ID of the request. Assigned to every Apience response. */
  requestId?: string;
  /**
   * Response status code. Same as HTTP response status.
   * Default: 200 for successful responses or 500 for internal server errors.
   */
  status?: number;
  /** Optional error message. */
  error?: string;
  /** Offset in the result set. Save as 'offset' query parameter. */
  offset?: number;
  /** Number of results requested. Same as 'limit' query parameter. */
  limit?: number;
}

/** Converts an API response value into a standardized ApienceResponse structure. */
export function response<T = unknown>(result: T): ApienceResponse<T> {
  return { result };
}

/** Http method used in Apience. */
export type ApienceHttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';
