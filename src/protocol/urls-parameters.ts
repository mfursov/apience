import { assertTruthy } from 'assertic';
import { ApienceDocValueFormat } from './apience-doc.types';

/** Globally identified URL (path or query) parameter info. */
export interface UrlParameterInfo {
  doc: { type: 'string' | 'integer'; text: string; description: string; format?: ApienceDocValueFormat };
}

/** Default documentation for URL parameters. Can be overridden with 'parameterDescriptionOverride'. */
export const URL_PARAMETER_INFO: Record<string, UrlParameterInfo> = {};

export function registerUrlParameter(name: string, info: UrlParameterInfo) {
  URL_PARAMETER_INFO[name] = info;
}

export function assertUrlParameter(value: unknown): asserts value is string {
  assertTruthy(
    URL_PARAMETER_INFO[value as string],
    `Invalid URL parameter: '${value}'. Please register it using 'registerUrlParameter('${value}', ...)'`,
  );
}
