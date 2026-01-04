import {
  ApienceRequestContext,
  BasicAuthStrategy,
  buildApienceSchemaJsonResponse,
  createAuthMiddleware,
  getAuthUser,
} from '../src';
import { getApiResult, getTestRoutes, makeRequest } from './test-setup';

describe('Apience Core + Auth E2E Integration', () => {
  describe('Core routing with real HTTP requests', () => {
    it('should handle GET requests and return correct response.', async () => {
      const routes = getTestRoutes();

      routes.get({
        path: 'health',
        doc: {
          summary: 'Health check endpoint.',
          description: 'Returns the health status of the API.',
          response: {
            status: { text: 'Health status.', type: 'string' },
            $name: 'HealthResponse',
          },
        },
        handler: async (_context: ApienceRequestContext): Promise<{ status: string }> => {
          return { status: 'healthy' };
        },
      });

      const response = await makeRequest('GET', '/v1/health');
      expect(response.status).toBe(200);
      expect(getApiResult<{ status: string }>(response)).toStrictEqual({ status: 'healthy' });
    });

    it('should handle POST requests and validate body.', async () => {
      const routes = getTestRoutes();

      routes.post({
        path: 'items',
        doc: {
          summary: 'Create item.',
          description: 'Creates a new item.',
          request: {
            name: { text: 'Item name.', type: 'string', isRequired: true },
            $name: 'CreateItemRequest1',
          },
          response: {
            id: { text: 'Item ID.', type: 'string' },
            name: { text: 'Item name.', type: 'string' },
            $name: 'CreateItemResponse1',
          },
        },
        validator: {
          name: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: name must be a non-empty string');
            }
          },
        },
        handler: async (
          context: ApienceRequestContext<{ name: string }>,
        ): Promise<{
          id: string;
          name: string;
        }> => {
          return { id: '123', name: context.request.name };
        },
      });

      const response = await makeRequest('POST', '/v1/items', {
        body: { name: 'Test Item' },
      });
      expect(response.status).toBe(200);
      expect((response.body as Record<string, unknown>).result.id).toBe('123');
      expect((response.body as Record<string, unknown>).result.name).toBe('Test Item');
    });

    it('should return 400 error for invalid request.', async () => {
      const routes = getTestRoutes();

      routes.post({
        path: 'invalid-items',
        doc: {
          summary: 'Create item.',
          description: 'Creates a new item.',
          request: {
            name: { text: 'Item name.', type: 'string', isRequired: true },
            $name: 'CreateItemRequest2',
          },
          response: {
            id: { text: 'Item ID.', type: 'string' },
            name: { text: 'Item name.', type: 'string' },
            $name: 'CreateItemResponse2',
          },
        },
        validator: {
          name: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: name must be a non-empty string');
            }
          },
        },
        handler: async (
          context: ApienceRequestContext<{ name: string }>,
        ): Promise<{
          id: string;
          name: string;
        }> => {
          return { id: '123', name: context.request.name };
        },
      });

      const response = await makeRequest('POST', '/v1/invalid-items', {
        body: { name: '' },
      });
      expect(response.status).toBe(400);
    });
  });

  describe('PUT/PATCH requests', () => {
    it('should handle PUT requests for full updates.', async () => {
      const routes = getTestRoutes();

      routes.put({
        path: 'put-items/:id',
        pathValidator: {
          id: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: id must be a non-empty string');
            }
          },
        },
        doc: {
          summary: 'Update item.',
          description: 'Updates an entire item.',
          request: {
            name: { text: 'Item name.', type: 'string', isRequired: true },
            description: { text: 'Item description.', type: 'string' },
            $name: 'UpdateItemRequest',
          },
          response: {
            id: { text: 'Item ID.', type: 'string' },
            name: { text: 'Item name.', type: 'string' },
            description: { text: 'Item description.', type: 'string' },
            $name: 'UpdateItemResponse',
          },
        },
        validator: {
          name: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: name must be a non-empty string');
            }
          },
        },
        handler: async (
          context: ApienceRequestContext<{ name: string; description?: string }>,
        ): Promise<{
          id: string;
          name: string;
          description: string;
        }> => {
          const itemId = context.params.get('id');
          return { id: itemId, name: context.request.name, description: context.request.description || 'N/A' };
        },
      });

      const response = await makeRequest('PUT', '/v1/put-items/123', {
        body: { name: 'Updated Item', description: 'New description' },
      });
      expect(response.status).toBe(200);
      expect((response.body as Record<string, unknown>).result.id).toBe('123');
      expect((response.body as Record<string, unknown>).result.name).toBe('Updated Item');
      expect((response.body as Record<string, unknown>).result.description).toBe('New description');
    });

    it('should handle PATCH requests for partial updates.', async () => {
      const routes = getTestRoutes();

      routes.patch({
        path: 'patch-items/:id',
        pathValidator: {
          id: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: id must be a non-empty string');
            }
          },
        },
        doc: {
          summary: 'Partially update item.',
          description: 'Updates specific fields of an item.',
          request: {
            name: { text: 'Item name.', type: 'string' },
            $name: 'PatchItemRequest',
          },
          response: {
            id: { text: 'Item ID.', type: 'string' },
            name: { text: 'Item name.', type: 'string' },
            $name: 'PatchItemResponse',
          },
        },
        validator: {},
        handler: async (
          context: ApienceRequestContext<{ name?: string }>,
        ): Promise<{
          id: string;
          name: string;
        }> => {
          const itemId = context.params.get('id');
          return { id: itemId, name: context.request.name || 'Unchanged' };
        },
      });

      const response = await makeRequest('PATCH', '/v1/patch-items/456', {
        body: { name: 'Patched Item' },
      });
      expect(response.status).toBe(200);
      expect((response.body as Record<string, unknown>).result.id).toBe('456');
      expect((response.body as Record<string, unknown>).result.name).toBe('Patched Item');
    });
  });

  describe('DELETE requests', () => {
    it('should handle DELETE requests.', async () => {
      const routes = getTestRoutes();

      routes.delete({
        path: 'delete-items/:id',
        pathValidator: {
          id: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: id must be a non-empty string');
            }
          },
        },
        doc: {
          summary: 'Delete item.',
          description: 'Deletes an item by ID.',
        },
        handler: async (context: ApienceRequestContext): Promise<void> => {
          const itemId = context.params.get('id');
          // Simulate deletion
          console.log(`Deleted item: ${itemId}`);
        },
      });

      const response = await makeRequest('DELETE', '/v1/delete-items/789');
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication with real HTTP requests', () => {
    it('should deny request without Authorization header.', async () => {
      const routes = getTestRoutes();
      const strategy = new BasicAuthStrategy(async (username: string, password: string) => {
        if (username === 'admin' && password === 'secret123') {
          return { id: 'admin-1', username, role: 'admin' };
        }
        return null;
      });

      routes.get({
        path: 'auth-profile',
        doc: {
          summary: 'Get user profile.',
          description: 'Returns the authenticated user profile.',
          response: {
            id: { text: 'User ID.', type: 'string' },
            username: { text: 'Username.', type: 'string' },
            $name: 'UserProfile',
          },
        },
        middlewares: [createAuthMiddleware(strategy)],
        handler: async (context: ApienceRequestContext): Promise<{ id: string; username: string }> => {
          const user = getAuthUser(context) as { id: string; username: string };
          return { id: user.id, username: user.username };
        },
      });

      const response = await makeRequest('GET', '/v1/auth-profile');
      expect(response.status).toBe(401);
    });

    it('should allow request with valid Basic auth credentials.', async () => {
      const routes = getTestRoutes();
      const strategy = new BasicAuthStrategy(async (username: string, password: string) => {
        if (username === 'user' && password === 'pass123') {
          return { id: 'user-1', username, role: 'user' };
        }
        return null;
      });

      routes.get({
        path: 'secure-profile',
        doc: {
          summary: 'Get user profile.',
          description: 'Returns the authenticated user profile.',
          response: {
            id: { text: 'User ID.', type: 'string' },
            username: { text: 'Username.', type: 'string' },
            $name: 'SecureUserProfile',
          },
        },
        middlewares: [createAuthMiddleware(strategy)],
        handler: async (context: ApienceRequestContext): Promise<{ id: string; username: string }> => {
          const user = getAuthUser(context) as { id: string; username: string };
          return { id: user.id, username: user.username };
        },
      });

      const credentials = Buffer.from('user:pass123').toString('base64');
      const response = await makeRequest('GET', '/v1/secure-profile', {
        headers: { Authorization: `Basic ${credentials}` },
      });
      expect(response.status).toBe(200);
      expect((response.body as Record<string, unknown>).result.id).toBe('user-1');
      expect((response.body as Record<string, unknown>).result.username).toBe('user');
    });
  });

  describe('OpenAPI documentation generation', () => {
    it('should generate OpenAPI schema with registered endpoints.', async () => {
      const routes = getTestRoutes();

      routes.get({
        path: 'doc-endpoint',
        doc: {
          summary: 'A documented endpoint.',
          description: 'This endpoint has complete documentation.',
          response: {
            message: { text: 'Response message.', type: 'string' },
            $name: 'DocResponse',
          },
        },
        handler: async (): Promise<{ message: string }> => {
          return { message: 'Documented' };
        },
      });

      // Build and verify the schema
      const schemaJson = buildApienceSchemaJsonResponse();
      const schema = JSON.parse(schemaJson);

      // Verify OpenAPI 3.0.1 format
      expect(schema.openapi).toBe('3.0.1');
      expect(schema.info).toBeDefined();
      expect(schema.info.title).toBe('API spec');

      // Verify endpoint is documented
      expect(schema.paths['/v1/doc-endpoint']).toBeDefined();
      expect(schema.paths['/v1/doc-endpoint'].get).toBeDefined();
      expect(schema.paths['/v1/doc-endpoint'].get.summary).toBe('A documented endpoint.');
    });

    it('should document request and response bodies in OpenAPI schema.', async () => {
      const routes = getTestRoutes();

      routes.post({
        path: 'doc-post',
        doc: {
          summary: 'Create documented item.',
          description: 'Creates an item with full documentation.',
          request: {
            title: { text: 'Item title.', type: 'string', isRequired: true },
            tags: { text: 'Item tags.', type: 'array', itemType: 'string' },
            $name: 'DocRequestBody',
          },
          response: {
            id: { text: 'Item ID.', type: 'string' },
            title: { text: 'Item title.', type: 'string' },
            $name: 'DocResponseBody',
          },
        },
        validator: {
          title: (val: unknown): void => {
            if (typeof val !== 'string' || val.length === 0) {
              throw new Error('400: title required');
            }
          },
        },
        handler: async (
          context: ApienceRequestContext<{ title: string; tags?: string[] }>,
        ): Promise<{
          id: string;
          title: string;
        }> => {
          return { id: 'doc-1', title: context.request.title };
        },
      });

      const schemaJson = buildApienceSchemaJsonResponse();
      const schema = JSON.parse(schemaJson);

      // Verify request body documentation
      expect(schema.paths['/v1/doc-post'].post.requestBody).toBeDefined();
      expect(schema.paths['/v1/doc-post'].post.requestBody.content['application/json']).toBeDefined();

      // Verify response documentation
      expect(schema.paths['/v1/doc-post'].post.responses['200']).toBeDefined();
      expect(schema.paths['/v1/doc-post'].post.responses['400']).toBeDefined();
    });
  });

  describe('HTTP response status codes', () => {
    it('should return correct status codes for success and error scenarios.', async () => {
      const routes = getTestRoutes();

      // Success endpoint
      routes.get({
        path: 'status-success',
        doc: {
          summary: 'Success endpoint.',
          description: 'Returns success status.',
          response: { code: { text: 'Status code.', type: 'number' }, $name: 'StatusSuccessResponse' },
        },
        handler: async (): Promise<{ code: number }> => {
          return { code: 200 };
        },
      });

      // Error endpoint
      routes.post({
        path: 'status-error',
        doc: {
          summary: 'Error test.',
          description: 'Tests error handling.',
          request: {
            testValue: { text: 'Required value.', type: 'string', isRequired: true },
            $name: 'StatusErrorRequestBody',
          },
          response: {
            error: { text: 'Error message.', type: 'string' },
            $name: 'StatusErrorResponseBody',
          },
        },
        validator: {
          testValue: (val: unknown): void => {
            if (typeof val !== 'string') {
              throw new Error('400: value must be string');
            }
          },
        },
        handler: async (context: ApienceRequestContext<{ testValue: string }>): Promise<{ error: string }> => {
          if (typeof context.request.testValue !== 'string') {
            return { error: 'validation failed' };
          }
          return { error: 'none' };
        },
      });

      // Test success
      const successResponse = await makeRequest('GET', '/v1/status-success');
      expect(successResponse.status).toBe(200);
      expect((successResponse.body as Record<string, unknown>).status).toBe(200);

      // Test error
      const errorResponse = await makeRequest('POST', '/v1/status-error', {
        body: { testValue: 123 },
      });
      expect(errorResponse.status).toBe(400);
    });
  });
});
