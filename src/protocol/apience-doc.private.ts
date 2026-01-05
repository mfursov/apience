import {
  APIENCE_DOC_PRIMITIVE_TYPES,
  ApienceDocField,
  ApienceDocPrimitiveValueType,
  ApienceDocRef,
} from './apience-doc.types';

/** Checks if the value is a documentation reference field. */
export function isApienceDocReferenceField(value: unknown): value is ApienceDocRef {
  return (value as ApienceDocRef)?.$name !== undefined;
}

/** Checks if the value is an array documentation field. */
export function isApienceDocArrayField(value: unknown): value is ApienceDocField & { type: 'array' } {
  return (value as ApienceDocField).type === 'array';
}

/** Checks if the value is a primitive documentation field. */
export function isApienceDocPrimitiveField(
  value: unknown,
): value is ApienceDocField & { type: ApienceDocPrimitiveValueType } {
  return isApienceDocPrimitiveType((value as ApienceDocField).type);
}

/** Checks if the value is a primitive documentation type string. */
export function isApienceDocPrimitiveType(value: unknown): value is ApienceDocPrimitiveValueType {
  return APIENCE_DOC_PRIMITIVE_TYPES.includes(value as ApienceDocPrimitiveValueType);
}
