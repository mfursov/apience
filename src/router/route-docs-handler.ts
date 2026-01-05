import { apienceOpenApiSchema } from '../service/doc-registry.private';

/** Builds the final OpenAPI schema JSON string. */
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
