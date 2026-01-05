import { assertTruthy } from 'assertic';
import { ApienceDocValueFormat } from './apience-doc.types';

/** Globally identified URL (path or query) parameter info. */
export interface UrlParameterInfo {
  doc: { type: 'string' | 'integer'; text: string; description: string; format?: ApienceDocValueFormat };
}

/**
 * Valid URL parameters.
 * Using enum instead of type enumeration as an explicit namespace that should improve readability when used.
 */
export enum UrlParameter {
  id = 'id',
  organizationId = 'organizationId',
  instanceId = 'serviceId',
  backupId = 'backupId',
  userId = 'userId',
  keyId = 'keyId',
  invitationId = 'invitationId',
  activityId = 'activityId',
  limit = 'limit',
  offset = 'offset',
}

/** Default documentation for URL parameters. Can be overridden with 'parameterDescriptionOverride'. */
export const URL_PARAMETER_INFO: Record<UrlParameter, UrlParameterInfo> = {
  [UrlParameter.id]: {
    doc: {
      type: 'string',
      text: 'ID',
      description: 'Resource ID.',
    },
  },
  [UrlParameter.organizationId]: {
    doc: {
      type: 'string',
      text: 'Organization ID',
      description: 'ID of the requested organization.',
      format: 'uuid',
    },
  },
  [UrlParameter.instanceId]: {
    doc: {
      type: 'string',
      text: 'Service ID',
      description: 'ID of the requested service.',
      format: 'uuid',
    },
  },
  [UrlParameter.backupId]: {
    doc: {
      type: 'string',
      text: 'Service backup ID',
      description: 'ID of the requested backup.',
      format: 'uuid',
    },
  },
  [UrlParameter.userId]: {
    doc: {
      type: 'string',
      text: 'User ID',
      description: 'ID of the requested user.',
      format: 'uuid',
    },
  },
  [UrlParameter.keyId]: {
    doc: {
      type: 'string',
      text: 'API key ID',
      description: 'ID of the requested key.',
      format: 'uuid',
    },
  },
  [UrlParameter.invitationId]: {
    doc: {
      type: 'string',
      text: 'Organization invitation ID',
      description: 'ID of the requested organization.',
      format: 'uuid',
    },
  },
  [UrlParameter.activityId]: {
    doc: {
      type: 'string',
      text: 'Activity ID',
      description: 'ID of the requested activity.',
    },
  },
  [UrlParameter.limit]: {
    doc: {
      type: 'integer',
      text: 'Records per request',
      description: 'Count of records to return per request. Used for pagination.',
    },
  },
  [UrlParameter.offset]: {
    doc: {
      type: 'integer',
      text: 'Offset in the records list.',
      description: 'Offset in the result records list. Used for pagination.',
    },
  },
};

export function assertUrlParameter(value: unknown): asserts value is UrlParameter {
  assertTruthy(URL_PARAMETER_INFO[value as UrlParameter], `Invalid parameter: ${value}`);
}
