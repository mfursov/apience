import { ApienceResponse } from '../protocol/apience.types';

/**
 * Converts JS timestamp or date to ISO 8601 format (without milliseconds).
 * Example: "2012-07-20T01:19:13Z".
 */
export function toApienceDateString(value: number | Date): string {
  const resultWithMillis = (typeof value === 'number' ? new Date(value) : value).toISOString();
  return `${resultWithMillis.substring(0, resultWithMillis.length - 5)}Z`;
}

/**
 * Wraps the response into the correct Apience form.
 * Add necessary fields, like 'requestId'.
 * If the response is already in the correct form, returns it as-is.
 */
export function wrapAsApienceResponse<T = unknown>(
  apienceResponseOrResultValue: T | ApienceResponse<T>,
): ApienceResponse<T> {
  let apienceResponse: ApienceResponse<T> = apienceResponseOrResultValue as ApienceResponse<T>;
  apienceResponse = apienceResponse?.result
    ? apienceResponse // The value is in the correct 'ApienceResponse' form: just return it.
    : <ApienceResponse<T>>{ result: apienceResponseOrResultValue }; // Wrap the raw value into the correct ApienceResponse form.
  return apienceResponse;
}
