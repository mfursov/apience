/**
 *  Type-safe subset of OpenAPI 3.0 schema used by Apience to describe endpoints.
 *  See https://swagger.io/docs/specification/basic-structure/.
 *  The goal of this package is to provide a TS-safe documentation where the presence
 *  of the documentation for every field is validated during compile time and reference types are always reused.
 */

/*
 * See https://swagger.io/docs/specification/data-models/data-types/.
 * We do not use inlined 'object' types: all objects must go into the 'components' section and referenced via '$ref'.
 */

import { UrlParameter } from './urls-parameters';

export const APIENCE_DOC_PRIMITIVE_TYPES = ['boolean', 'number', 'string', 'integer'] as const;
export type ApienceDocPrimitiveValueType = (typeof APIENCE_DOC_PRIMITIVE_TYPES)[number];

/** Name of the object reference. The object will be registered in the OpenAPIV3 'components' section under using name. */
export type ApienceDocRef = { $name: string };

export type ApienceDocFieldType = ApienceDocPrimitiveValueType | ApienceDocRef | 'array';

/**
 * Format of the field: https://swagger.io/docs/specification/data-models/data-types/.
 * This set is open, and we can add our own values here. Add more formats here when needed.
 * When a format is not provided, a default .toString() method is used on the request/response field.
 */
export type ApienceDocValueFormat =
  | 'uuid'
  /** Full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21. */
  | 'date'
  /** The date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z. */
  | 'date-time'
  | 'email';

/** Single field documentation. See See https://swagger.io/docs/specification/data-models/data-types/ for details.*/
export interface ApienceDocField {
  /** Detailed description for the field. */
  text: string;
  /** One or more valid types for the field. */
  type: ApienceDocFieldType;
  /**
   * An optional format keyword serves as a hint for the tools to use a specific numeric type.
   * Use $ref: '#/components/schemas/' for non-primitive object types.
   */
  format?: ApienceDocValueFormat;

  /** Type of the items for 'type = array'. fields. Required for arrays. Object arrays are not allowed (use $ref).*/
  itemType?: ApienceDocPrimitiveValueType | ApienceDocRef;

  // Below is the set of possible optional keywords to describe field value details.

  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  /** Specifies that a number must be the multiple of another number. Must be a positive number.*/
  multipleOf?: number;
  /** Minimum string length. */
  minLength?: number;
  /** Maximum string length. */
  maxLength?: number;
  /**
   * The pattern keyword to define a regular expression template for the string value.
   * Example: '^\d{3}-\d{2}-\d{4}$'.
   */
  pattern?: string;

  /** Minimum array size. */
  minItems?: number;
  /** Maximum array size. */
  maxItems?: number;
  /** If true, the array contains only unique items. */
  uniqueItems?: boolean;
  enum?: string[];
  /** Sample value for the docs. */
  example?: string | number;
}

export type ApienceObjectDoc<ObjectType = unknown> = {
  [key in keyof Required<ObjectType>]: ApienceDocField | ApienceDocRef;
} & ApienceDocRef;

/** Single field documentation for the request field. */
export interface ApienceDocRequestField extends ApienceDocField {
  isRequired?: boolean;
  defaultValue?: string;
}

export type ApienceRequestDoc<RequestBodyType = unknown> =
  // Every field in the request must be described as a primitive field or a $ref to an object.
  { [key in keyof Required<RequestBodyType>]: ApienceDocRequestField | ApienceDocRef } &
    // And must include its own $name.
    ApienceDocRef;

export type ApienceResponseDoc<ResponseResultType = unknown> = ApienceObjectDoc<ResponseResultType>;

/** Documentation for a single Apience endpoint (a handler method). */
export interface ApienceHandlerDocCommon {
  summary: string;
  description: string;
  /**
   * Detailed list of statuses that can be returned by the handler.
   * If not provided, a default list of statuses is sent to a client.
   */
  status?: Record<number, string>;
  /** Overrides default parameter descriptions. */
  urlParameterDescriptionOverride?: Partial<Record<UrlParameter, string>>;
}

export interface ApienceGetListHandlerDoc<ResponseResultElementType> extends ApienceHandlerDocCommon {
  response: ApienceResponseDoc<ResponseResultElementType>;
}

export interface ApienceGetHandlerDoc<ResponseResultType> extends ApienceHandlerDocCommon {
  response: ApienceResponseDoc<ResponseResultType>;
}

export interface ApiencePostHandlerDoc<RequestBodyType, ResponseResultType> extends ApienceHandlerDocCommon {
  request: ApienceRequestDoc<RequestBodyType>;
  response: ApienceResponseDoc<ResponseResultType>;
}

export type ApiencePutHandlerDoc<RequestBodyType, ResponseResultType> = ApiencePostHandlerDoc<
  RequestBodyType,
  ResponseResultType
>;

export type ApiencePatchHandlerDoc<RequestBodyType, ResponseResultType> = ApiencePutHandlerDoc<
  RequestBodyType,
  ResponseResultType
>;

export type ApienceDeleteHandlerDoc = ApienceHandlerDocCommon;

export function isApienceDocReferenceField(value: unknown): value is ApienceDocRef {
  return (value as ApienceDocRef)?.$name !== undefined;
}

export function isApienceDocArrayField(value: unknown): value is ApienceDocField & { type: 'array' } {
  return (value as ApienceDocField).type === 'array';
}

export function isApienceDocPrimitiveField(
  value: unknown,
): value is ApienceDocField & { type: ApienceDocPrimitiveValueType } {
  return isApienceDocPrimitiveType((value as ApienceDocField).type);
}

export function isApienceDocPrimitiveType(value: unknown): value is ApienceDocPrimitiveValueType {
  return APIENCE_DOC_PRIMITIVE_TYPES.includes(value as ApienceDocPrimitiveValueType);
}
