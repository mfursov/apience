import { OpenAPIV3 } from 'openapi-types';
import {
  ApienceDocField,
  ApienceDocPrimitiveValueType,
  ApienceObjectDoc,
  ApienceRequestDoc,
  ApienceResponseDoc,
  isApienceDocArrayField,
  isApienceDocPrimitiveField,
  isApienceDocPrimitiveType,
  isApienceDocReferenceField,
} from '../protocol/apience-doc.types';
import { assertUrlParameter, URL_PARAMETER_INFO, UrlParameter } from '../protocol/urls-parameters';
import { assertTruthy, BAD_REQUEST_STATUS, truthy } from '../utils/common.utils';

/** Returns fully qualified $ref path. */
export function getComponentsSectionPath(ref: string): string {
  return `#/components/schemas/${ref}`;
}

/** Helper used to check that the same type is never registered twice with different descriptions. */
const uniqueApienceObjectDocMap = new Map<string, ApienceObjectDoc>();

/**
 * Extended OpenAPIV3 schema description.
 * Allows us to have a reference to an external object descriptions for a field
 * (which is OK, but not in the typescript package for some reason).
 */
type SchemaObjectV1 = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

function convertToOpenAPIV3Schema(request: ApienceObjectDoc): Record<string, SchemaObjectV1> {
  const result: Record<string, SchemaObjectV1> = {};

  const buildReferenceType = (referenceTypeName: string): OpenAPIV3.ReferenceObject => ({
    $ref: getComponentsSectionPath(referenceTypeName),
  });

  function buildPrimitiveType(
    field: Omit<ApienceDocField, 'text'> & { type: ApienceDocPrimitiveValueType } & { text?: string },
  ): OpenAPIV3.NonArraySchemaObject {
    return {
      type: field.type,
      description: field.text,
      format: field.format,
      enum: field.enum,
      minimum: field.minimum,
      maximum: field.maximum,
      multipleOf: field.multipleOf,
      example: field.example,
    };
  }

  for (const [key, value] of Object.entries(request)) {
    if (key === '$name') continue; // Self-type name.
    if (isApienceDocArrayField(value)) {
      let items: SchemaObjectV1;
      if (typeof value.itemType === 'object') {
        items = buildReferenceType(value.itemType.$name);
      } else if (isApienceDocPrimitiveType(value.itemType)) {
        items = buildPrimitiveType({ type: value.itemType, enum: value.enum });
      } else {
        console.error('Unsupported doc field type for array element: ', value);
        throw new Error(`Failed to convert doc field: ${key}`);
      }
      result[key] = { type: 'array', description: value.text, format: value.format, items };
    } else if (isApienceDocReferenceField(value)) {
      result[key] = buildReferenceType(value.$name);
    } else if (isApienceDocPrimitiveField(value)) {
      result[key] = buildPrimitiveType(value);
    } else {
      console.error('Unsupported doc field type: ', value);
      throw new Error(`Failed to convert doc field: ${key}`);
    }
  }
  return result;
}

/** Global object that has documentation about all currently registered endpoints and types. */
export const apienceV1Schema3Response: OpenAPIV3.Document = {
  openapi: '3.0.1',
  info: {
    title: 'API spec',
    version: '1.0',
  },
  servers: [], // Autofilled during handler registration.
  paths: {}, // Autofilled during handler registration.
  components: {
    // Autofilled during handler registration.
    schemas: {},
  },
};

export function registerApienceObjectDoc<T extends object = object>(
  objectDoc: ApienceObjectDoc<T>,
): ApienceObjectDoc<T> {
  const schemas = truthy(apienceV1Schema3Response.components?.schemas as Record<string, OpenAPIV3.SchemaObject>);
  const oldObjectDoc = uniqueApienceObjectDocMap.get(objectDoc.$name);
  assertTruthy(
    oldObjectDoc === undefined || oldObjectDoc === objectDoc,
    () => `Duplicate doc object: ${objectDoc.$name}`,
  );
  if (oldObjectDoc === undefined) {
    schemas[objectDoc.$name] = { properties: convertToOpenAPIV3Schema(objectDoc) };
    uniqueApienceObjectDocMap.set(objectDoc.$name, objectDoc);
  }
  return objectDoc;
}

export function registerRequestDoc(request: ApienceRequestDoc): OpenAPIV3.ReferenceObject {
  registerApienceObjectDoc(request);
  return { $ref: getComponentsSectionPath(request.$name) };
}

export function registerResponseDoc(
  response: ApienceResponseDoc,
  isArrayResultType: boolean,
): OpenAPIV3.ResponsesObject {
  registerApienceObjectDoc(response);
  const responses: OpenAPIV3.ResponsesObject = {};
  responses['200'] = {
    description: 'Successful response',
    content: {
      'application/json': {
        // See 'ApienceResponse' type: it contains 'result' field with a payload.
        schema: {
          type: 'object',
          properties: {
            result: isArrayResultType
              ? { type: 'array', items: { $ref: getComponentsSectionPath(response.$name) } }
              : { $ref: getComponentsSectionPath(response.$name) },
            status: { type: 'number', description: 'HTTP status code.', example: 200 },
            requestId: { type: 'string', description: 'Unique id assigned to every request. UUIDv4', format: 'uuid' },
          },
        },
      },
    },
  };
  responses[`${BAD_REQUEST_STATUS}`] = {
    description:
      'The server cannot or will not process the request due to something that is perceived to be a client error.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            status: { type: 'number', description: 'HTTP status code.', example: BAD_REQUEST_STATUS },
            error: { type: 'string', description: 'Detailed error description.' },
          },
        },
      },
    },
  };
  return responses;
}

/**
 * Parses known parameters from the string and generates OpenAPIV3.ReferenceObject for all parameters found.
 * Asserts if there is any unknown parameter.
 */
export function generateParameterDocs(
  path: string,
  overrides: Partial<Record<UrlParameter, string>>,
): Array<OpenAPIV3.ParameterObject> {
  const result: Array<OpenAPIV3.ParameterObject> = [];
  const tokens = path.split('/');
  for (const token of tokens) {
    if (token.startsWith(':')) {
      const urlParameter = token.substring(1);
      assertUrlParameter(urlParameter);
      const { doc } = URL_PARAMETER_INFO[urlParameter];
      const parameterDoc: OpenAPIV3.ParameterObject = {
        in: 'path',
        name: doc.text,
        description: overrides[urlParameter] || doc.description,
        schema: {
          type: doc.type,
          format: doc.format,
        },
      };
      result.push(parameterDoc);
    }
  }
  return result;
}
