import {
  ApienceRequestContext,
  BasicAuthStrategy,
  buildApienceSchemaJsonResponse,
  createAuthMiddleware,
  getAuthUser,
} from '../src';
import { getApiResult, getTestRoutes, makeRequest } from './test-setup';

// Minimal doc helper for compact tests
const minDoc = (name: string) => ({
  summary: name,
  description: name,
  response: { value: { text: 'Value', type: 'string' as const }, $name: `${name}Res` },
});

describe('Apience Core + Auth E2E Integration', () => {
  describe('Core routing (top-level paths, no version)', () => {
    it('should handle GET requests at top-level path', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'health',
        doc: minDoc('Health'),
        handler: async () => ({ value: 'healthy' }),
      });

      const response = await makeRequest('GET', '/health');
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('healthy');
    });

    it('should handle POST requests at top-level path', async () => {
      const routes = getTestRoutes();
      routes.post({
        path: 'items',
        doc: { ...minDoc('CreateItem'), request: { name: { text: 'Name', type: 'string' }, $name: 'CreateItemReq' } },
        validator: { name: (v) => { if (typeof v !== 'string') throw new Error('400: bad'); } },
        handler: async (ctx: ApienceRequestContext<{ name: string }>) => ({ value: ctx.request.name }),
      });

      const response = await makeRequest('POST', '/items', { body: { name: 'Test' } });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('Test');
    });

    it('should handle PUT requests at top-level path', async () => {
      const routes = getTestRoutes();
      routes.put({
        path: 'items/:id',
        doc: { ...minDoc('UpdateItem'), request: { name: { text: 'Name', type: 'string' }, $name: 'UpdateItemReq' } },
        validator: {},
        handler: async (ctx: ApienceRequestContext<{ name: string }>) => ({ value: ctx.params.get('id') }),
      });

      const response = await makeRequest('PUT', '/items/123', { body: { name: 'Updated' } });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('123');
    });

    it('should handle PATCH requests at top-level path', async () => {
      const routes = getTestRoutes();
      routes.patch({
        path: 'items/:id',
        doc: { ...minDoc('PatchItem'), request: { name: { text: 'Name', type: 'string' }, $name: 'PatchItemReq' } },
        validator: {},
        handler: async (ctx: ApienceRequestContext<{ name?: string }>) => ({ value: ctx.request.name || 'none' }),
      });

      const response = await makeRequest('PATCH', '/items/456', { body: { name: 'Patched' } });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('Patched');
    });

    it('should handle DELETE requests at top-level path', async () => {
      const routes = getTestRoutes();
      routes.delete({
        path: 'items/:id',
        doc: { summary: 'Delete item', description: 'Delete item by id' },
        handler: async () => {},
      });

      const response = await makeRequest('DELETE', '/items/789');
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid request body', async () => {
      const routes = getTestRoutes();
      routes.post({
        path: 'validate-test',
        doc: { ...minDoc('ValidateTest'), request: { name: { text: 'Name', type: 'string' }, $name: 'ValidateTestReq' } },
        validator: { name: (v) => { if (typeof v !== 'string' || !v) throw new Error('400: name required'); } },
        handler: async (ctx: ApienceRequestContext<{ name: string }>) => ({ value: ctx.request.name }),
      });

      const response = await makeRequest('POST', '/validate-test', { body: { name: '' } });
      expect(response.status).toBe(400);
    });
  });

  describe('API versioning', () => {
    it('should handle version: "1" with /v1/ prefix', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'versioned',
        version: '1',
        doc: minDoc('V1Endpoint'),
        handler: async () => ({ value: 'v1' }),
      });

      const response = await makeRequest('GET', '/v1/versioned');
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('v1');
    });

    it('should handle version: "2" with /v2/ prefix', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'versioned',
        version: '2',
        doc: minDoc('V2Endpoint'),
        handler: async () => ({ value: 'v2' }),
      });

      const response = await makeRequest('GET', '/v2/versioned');
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('v2');
    });

    it('should allow both versioned and top-level endpoints simultaneously', async () => {
      const routes = getTestRoutes();

      routes.get({
        path: 'mixed',
        doc: minDoc('TopLevel'),
        handler: async () => ({ value: 'top-level' }),
      });

      routes.get({
        path: 'mixed',
        version: '1',
        doc: minDoc('V1Mixed'),
        handler: async () => ({ value: 'v1' }),
      });

      const topResponse = await makeRequest('GET', '/mixed');
      expect(getApiResult<{ value: string }>(topResponse).value).toBe('top-level');

      const v1Response = await makeRequest('GET', '/v1/mixed');
      expect(getApiResult<{ value: string }>(v1Response).value).toBe('v1');
    });
  });

  describe('Authentication', () => {
    it('should deny request without Authorization header', async () => {
      const routes = getTestRoutes();
      const strategy = new BasicAuthStrategy(
        async (u, p) => (u === 'admin' && p === 'secret' ? { id: '1', username: u } : null),
      );

      routes.get<{ value: string }>({
        path: 'protected',
        doc: minDoc('Protected'),
        middlewares: [createAuthMiddleware(strategy)],
        handler: async (ctx: ApienceRequestContext) => {
          const user = getAuthUser(ctx) as { id: string };
          return { value: user.id };
        },
      });

      const response = await makeRequest('GET', '/protected');
      expect(response.status).toBe(401);
    });

    it('should allow request with valid credentials', async () => {
      const routes = getTestRoutes();
      const strategy = new BasicAuthStrategy(
        async (u, p) => (u === 'user' && p === 'pass' ? { id: 'user-1', username: u } : null),
      );

      routes.get<{ value: string }>({
        path: 'secure',
        doc: minDoc('Secure'),
        middlewares: [createAuthMiddleware(strategy)],
        handler: async (ctx: ApienceRequestContext) => {
          const user = getAuthUser(ctx) as { id: string };
          return { value: user.id };
        },
      });

      const credentials = Buffer.from('user:pass').toString('base64');
      const response = await makeRequest('GET', '/secure', {
        headers: { Authorization: `Basic ${credentials}` },
      });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('user-1');
    });
  });

  describe('OpenAPI documentation generation', () => {
    it('should document top-level endpoint (no version)', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'docs-top-level',
        doc: {
          summary: 'Top level endpoint',
          description: 'An endpoint without version prefix.',
          response: { message: { text: 'Message', type: 'string' }, $name: 'DocsTopLevelRes' },
        },
        handler: async () => ({ message: 'ok' }),
      });

      const schema = JSON.parse(buildApienceSchemaJsonResponse());
      expect(schema.openapi).toBe('3.0.1');
      expect(schema.paths['/docs-top-level']).toBeDefined();
      expect(schema.paths['/docs-top-level'].get.summary).toBe('Top level endpoint');
    });

    it('should document versioned endpoint with /v1/ prefix', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'docs-versioned',
        version: '1',
        doc: {
          summary: 'Versioned v1 endpoint',
          description: 'An endpoint with v1 prefix.',
          response: { message: { text: 'Message', type: 'string' }, $name: 'DocsVersionedRes' },
        },
        handler: async () => ({ message: 'v1' }),
      });

      const schema = JSON.parse(buildApienceSchemaJsonResponse());
      expect(schema.paths['/v1/docs-versioned']).toBeDefined();
      expect(schema.paths['/v1/docs-versioned'].get.summary).toBe('Versioned v1 endpoint');
    });

    it('should document POST request/response bodies', async () => {
      const routes = getTestRoutes();
      routes.post<{ title: string }, { id: string }>({
        path: 'docs-post',
        doc: {
          summary: 'Create resource',
          description: 'Creates a new resource',
          request: { title: { text: 'Title', type: 'string', isRequired: true }, $name: 'DocsPostReq' },
          response: { id: { text: 'ID', type: 'string' }, $name: 'DocsPostRes' },
        },
        validator: { title: () => {} },
        handler: async () => ({ id: '1' }),
      });

      const schema = JSON.parse(buildApienceSchemaJsonResponse());
      expect(schema.paths['/docs-post'].post.requestBody).toBeDefined();
      expect(schema.paths['/docs-post'].post.responses['200']).toBeDefined();
      expect(schema.paths['/docs-post'].post.responses['400']).toBeDefined();
    });
  });
});
