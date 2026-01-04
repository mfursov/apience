import { OpenAPIV3 } from 'openapi-types';
import { ApienceHandlerDocCommon, ApienceRequestDoc, ApienceResponseDoc } from '../protocol/apience-doc.types';
import { ApienceHttpMethod } from '../protocol/apience.types';
import {
  apienceV1Schema3Response,
  generateParameterDocs,
  registerRequestDoc,
  registerResponseDoc,
} from '../service/apience-doc-registry.utils';
import { assertTruthy, truthy } from '../utils/common.utils';

type ApienceHandlerDoc = ApienceHandlerDocCommon & {
  request?: ApienceRequestDoc;
  response?: ApienceResponseDoc;
};

export function registerV1EndpointDocs(
  httpMethod: ApienceHttpMethod,
  path: string,
  doc: ApienceHandlerDoc,
  isArrayResultType: boolean,
): void {
  assertTruthy(path.startsWith('/v1/'), () => `Only '/v1/*' schema methods are supported: ${path}`);
  const paths = truthy(apienceV1Schema3Response.paths);
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
  if (!apienceV1Schema3Response.info.contact) {
    const _apiHash = JSON.stringify(apienceV1Schema3Response, null, 2).length;
    apienceV1Schema3Response.info.contact = {
      name: 'API Support',
      url: 'https://example.com/docs',
    };
  }
  return JSON.stringify(apienceV1Schema3Response, null, 2);
}
