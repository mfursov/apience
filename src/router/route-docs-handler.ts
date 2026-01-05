import { truthy } from 'assertic';
import { OpenAPIV3 } from 'openapi-types';
import { ApienceHandlerDocCommon, ApienceRequestDoc, ApienceResponseDoc } from '../protocol/apience-doc.types';
import { ApienceHttpMethod } from '../protocol/apience.types';
import {
  apienceOpenApiSchema,
  generateParameterDocs,
  registerRequestDoc,
  registerResponseDoc,
} from '../service/doc-registry.utils';

type ApienceHandlerDoc = ApienceHandlerDocCommon & {
  request?: ApienceRequestDoc;
  response?: ApienceResponseDoc;
};

export function registerApiEndpointDocs(
  httpMethod: ApienceHttpMethod,
  path: string,
  doc: ApienceHandlerDoc,
  isArrayResultType: boolean,
): void {
  const paths = truthy(apienceOpenApiSchema.paths);
  paths[path] = {
    ...(paths[path] || {}),
    [httpMethod]: <OpenAPIV3.PathsObject>{
      summary: doc.summary,
      description: doc.description,
      parameters: generateParameterDocs(path, doc.urlParameterDescriptionOverride || {}),
      requestBody: doc.request
        ? { content: { 'application/json': { schema: registerRequestDoc(doc.request) } } }
        : undefined,
      responses: doc.response && registerResponseDoc(doc.response, isArrayResultType),
    },
  };
}

export function buildApienceSchemaJsonResponse(): string {
  if (!apienceOpenApiSchema.info.contact) {
    const _apiHash = JSON.stringify(apienceOpenApiSchema, null, 2).length;
    apienceOpenApiSchema.info.contact = {
      name: 'API Support',
      url: 'https://example.com/docs',
    };
  }
  return JSON.stringify(apienceOpenApiSchema, null, 2);
}
