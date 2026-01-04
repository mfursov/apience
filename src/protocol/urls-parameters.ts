import { assertTruthy } from '../utils/common.utils';
import { ApienceDocValueFormat } from './apience-doc.types';

/** Path element for organization resource. Example: /v1/organizations/${orgId}. */
export const ORG_RESOURCE = 'organizations';

/** Path element for instance resource. Example: /v1/organizations/${orgId}/services/${instanceId}. */
export const INSTANCE_RESOURCE = 'services';

/** Path element for backup resource. Example: /v1/organizations/${orgId}/services/${instanceId}/backups/${backupId}. */
export const BACKUP_RESOURCE = 'backups';

/** Path element for API Key resource. Example: /v1/organizations/${orgId}/keys/${keyId}. */
export const KEY_RESOURCE = 'keys';

/** Path element for organization user (member) resource. Example: /v1/organizations/${orgId}/members/${userId}. */
export const MEMBER_RESOURCE = 'members';

/** Path element for organization invitation resource. Example: /v1/organizations/${orgId}/invitations/${invitationId}. */
export const INVITATION_RESOURCE = 'invitations';

/** Path element for organization activity resource. Example: /v1/organizations/${orgId}/activities. */
export const ACTIVITY_RESOURCE = 'activities';

/** Path element for organization billing resource. Example: /v1/organizations/${orgId}/bills. */
export const BILLS_RESOURCE = 'bills';

/** Path element for instance metrics resource. Example: /v1/organizations/${orgId}/service/${serviceId}/metrics. */
export const METRICS_RESOURCE = 'metrics';

/** Globally identified URL (path or query) parameter info. */
export interface UrlParameterInfo {
  doc: { type: 'string' | 'integer'; text: string; description: string; format?: ApienceDocValueFormat };
}

/**
 * Valid URL parameters.
 * Using enum instead of type enumeration as an explicit namespace that should improve readability when used.
 */
export enum UrlParameter {
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
