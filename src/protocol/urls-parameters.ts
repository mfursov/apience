import { assertString, assertTruthy } from 'assertic';
import { ApienceDocValueFormat } from './apience-doc.types';

/** Globally identified URL (path or query) parameter info. */
export interface UrlParameterInfo {
  doc: { type: 'string' | 'integer'; text: string; description: string; format?: ApienceDocValueFormat };
}

/** Default documentation for URL parameters. Can be overridden with 'parameterDescriptionOverride'. */
export const URL_PARAMETER_INFO: Record<string, UrlParameterInfo> = {};

/** Registers a new URL parameter for validation and documentation. */
export function registerUrlParameter(name: string, info: UrlParameterInfo): void {
  URL_PARAMETER_INFO[name] = info;
}

/** Asserts that the value is a registered URL parameter name. */
export function assertUrlParameter(name: unknown): asserts name is string {
  assertString(name, 'Url parameter name must be a string');
  assertTruthy(
    URL_PARAMETER_INFO[name],
    `Invalid URL parameter: '${name}'. Please register it using 'registerUrlParameter('${name}', ...)'`,
  );
}
