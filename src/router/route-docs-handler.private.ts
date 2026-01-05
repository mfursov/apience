import { truthy } from 'assertic';
import { OpenAPIV3 } from 'openapi-types';
import { ApienceHandlerDocCommon, ApienceRequestDoc, ApienceResponseDoc } from '../protocol/apience-doc.types';
import { ApienceHttpMethod } from '../protocol/apience.types';
import {
  apienceOpenApiSchema,
  generateParameterDocs,
  registerRequestDoc,
  registerResponseDoc,
} from '../service/doc-registry.private';

type ApienceHandlerDoc = ApienceHandlerDocCommon & {
  request?: ApienceRequestDoc;
  response?: ApienceResponseDoc;
};

/** Registers documentation for a single API endpoint. */
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
