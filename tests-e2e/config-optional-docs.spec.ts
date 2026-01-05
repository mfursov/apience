import { assertString } from 'assertic';
import { ApienceRequestContext, configureApience, registerUrlParameter, resetApienceConfig } from '../src';
import { getApiResult, getTestRoutes, makeRequest } from './test-setup';

registerUrlParameter('id', {
  doc: {
    type: 'string',
    text: 'ID',
    description: 'Resource ID.',
  },
});

describe('Apience Configuration: Optional Documentation', () => {
  afterEach(() => {
    // Reset configuration after each test.
    resetApienceConfig();
  });

  describe('Default behavior (requireDocs: false)', () => {
    it('should allow GET endpoint without doc', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'no-doc-get',
        handler: async () => ({ value: 'success' }),
      });

      const response = await makeRequest('GET', '/no-doc-get');
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('success');
    });

    it('should allow POST endpoint without doc', async () => {
      const routes = getTestRoutes();
      routes.post({
        path: 'no-doc-post',
        validator: { name: assertString },
        handler: async (ctx: ApienceRequestContext<{ name: string }>) => ({ value: ctx.request.name }),
      });

      const response = await makeRequest('POST', '/no-doc-post', { body: { name: 'test' } });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('test');
    });

    it('should allow DELETE endpoint without doc', async () => {
      const routes = getTestRoutes();
      routes.delete({
        path: 'no-doc-delete/:id',
        handler: async () => {},
      });

      const response = await makeRequest('DELETE', '/no-doc-delete/123');
      expect(response.status).toBe(200);
    });

    it('should allow PUT endpoint without doc', async () => {
      const routes = getTestRoutes();
      routes.put({
        path: 'no-doc-put/:id',
        validator: {},
        handler: async (ctx: ApienceRequestContext) => ({ value: ctx.params.get('id') }),
      });

      const response = await makeRequest('PUT', '/no-doc-put/456', { body: {} });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('456');
    });

    it('should allow PATCH endpoint without doc', async () => {
      const routes = getTestRoutes();
      routes.patch({
        path: 'no-doc-patch/:id',
        validator: {},
        handler: async (ctx: ApienceRequestContext) => ({ value: ctx.params.get('id') }),
      });

      const response = await makeRequest('PATCH', '/no-doc-patch/789', { body: {} });
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('789');
    });
  });

  describe('Strict mode (requireDocs: true)', () => {
    beforeEach(() => {
      configureApience({ requireDocs: true });
    });

    it('should throw error for GET endpoint without doc', () => {
      const routes = getTestRoutes();

      expect(() => {
        routes.get({
          path: 'missing-doc',
          handler: async () => ({ value: 'test' }),
        });
      }).toThrow('[Apience] Documentation (doc) is required for GET /missing-doc');
    });

    it('should throw error for POST endpoint without doc', () => {
      const routes = getTestRoutes();

      expect(() => {
        routes.post({
          path: 'missing-doc-post',
          validator: {},
          handler: async () => ({ value: 'test' }),
        });
      }).toThrow('[Apience] Documentation (doc) is required for POST /missing-doc-post');
    });

    it('should throw error for DELETE endpoint without doc', () => {
      const routes = getTestRoutes();

      expect(() => {
        routes.delete({
          path: 'missing-doc-delete',
          handler: async () => {},
        });
      }).toThrow('[Apience] Documentation (doc) is required for DELETE /missing-doc-delete');
    });

    it('should allow endpoint with doc when requireDocs is true', async () => {
      const routes = getTestRoutes();
      routes.get({
        path: 'with-doc',
        doc: {
          summary: 'Test endpoint',
          description: 'Test endpoint description',
          response: { value: { text: 'Value', type: 'string' }, $name: 'WithDocRes' },
        },
        handler: async () => ({ value: 'success' }),
      });

      const response = await makeRequest('GET', '/with-doc');
      expect(response.status).toBe(200);
      expect(getApiResult<{ value: string }>(response).value).toBe('success');
    });
  });

  describe('Mixed scenarios', () => {
    it('should allow switching from permissive to strict mode', () => {
      // First, create endpoint without doc (default permissive mode)
      let routes = getTestRoutes();
      routes.get({
        path: 'permissive-endpoint',
        handler: async () => ({ value: 'ok' }),
      });

      // Switch to strict mode.
      configureApience({ requireDocs: true });

      // New endpoint should require doc.
      routes = getTestRoutes();
      expect(() => {
        routes.get({
          path: 'strict-endpoint',
          handler: async () => ({ value: 'test' }),
        });
      }).toThrow('[Apience] Documentation (doc) is required');
    });

    it('should allow switching from strict to permissive mode', async () => {
      configureApience({ requireDocs: true });

      // Should throw in strict mode
      let routes = getTestRoutes();
      expect(() => {
        routes.get({
          path: 'strict-fails',
          handler: async () => ({ value: 'test' }),
        });
      }).toThrow();

      // Switch to permissive mode
      configureApience({ requireDocs: false });

      // Should succeed now
      routes = getTestRoutes();
      routes.get({
        path: 'permissive-succeeds',
        handler: async () => ({ value: 'success' }),
      });

      // Verify it works
      const response = await makeRequest('GET', '/permissive-succeeds');
      expect(response.status).toBe(200);
    });
  });

  describe('Warning mode (warnOnMissingDocs: true)', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should warn via console when warnOnMissingDocs is true', () => {
      configureApience({
        warnOnMissingDocs: true,
        requireDocs: false,
      });

      const routes = getTestRoutes();
      routes.get({
        path: 'warn-console',
        handler: async () => ({ value: 'test' }),
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Apience] No documentation for GET /warn-console');
    });

    it('should not warn when warnOnMissingDocs is false', () => {
      configureApience({
        warnOnMissingDocs: false,
      });

      const routes = getTestRoutes();
      routes.get({
        path: 'no-warn-config',
        handler: async () => ({ value: 'test' }),
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn in strict mode even with warnOnMissingDocs true', () => {
      configureApience({
        warnOnMissingDocs: true,
        requireDocs: true,
      });

      const routes = getTestRoutes();

      // Should throw error, not warn
      expect(() => {
        routes.get({
          path: 'no-warn-strict',
          handler: async () => ({ value: 'test' }),
        });
      }).toThrow('[Apience] Documentation (doc) is required');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn for endpoints with documentation', () => {
      configureApience({
        warnOnMissingDocs: true,
      });

      const routes = getTestRoutes();
      routes.get({
        path: 'with-doc-no-warn',
        doc: {
          summary: 'Test endpoint',
          description: 'Test endpoint description',
          response: { value: { text: 'Value', type: 'string' }, $name: 'TestRes' },
        },
        handler: async () => ({ value: 'success' }),
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
