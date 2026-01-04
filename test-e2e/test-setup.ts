import express, {Express} from 'express';
import http from 'http';
import {createRouteTable} from '../src';
import {assertTruthy} from '../src/utils/common.utils';

const TEST_PORT = 3001;

/**
 * Shared test server that is created once and reused across all e2e tests.
 * This significantly improves test performance by avoiding server startup/teardown overhead.
 */
let testApp: Express | undefined;
let testServer: http.Server | undefined;
let initialized = false;

/**
 * Initialize the shared test server. Called once during test setup.
 */
export async function initializeTestServer(): Promise<void> {
  if (initialized) {
    return;
  }

  const app = express();
  app.use(express.json());
  testApp = app;
  testServer = app.listen(TEST_PORT);
  initialized = true;
}

/**
 * Teardown the shared test server. Called once after all tests.
 */
export async function teardownTestServer(): Promise<void> {
  const server = testServer;
  if (initialized && server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        initialized = false;
        resolve();
      });
    });
  }
}

/**
 * Get the shared Express app for registering routes.
 */
export function getTestApp(): Express {
  assertTruthy(testApp, 'Test server not initialized. Call initializeTestServer first.');
  return testApp;
}

/**
 * Get a new route table for the shared app.
 */
export function getTestRoutes(): ReturnType<typeof createRouteTable> {
  return createRouteTable(getTestApp());
}

/**
 * Get the port the test server is running on.
 */
export function getTestPort(): number {
  return TEST_PORT;
}

/**
 * Type-safe response body accessor for test assertions.
 */
export function getResponseBody(response: { status: number; body: Record<string, unknown> | undefined }): Record<string, unknown> {
  assertTruthy(response.body, 'Response body is empty');
  return response.body;
}

/**
 * Get the result field from an API response safely with typed access to nested properties.
 */
export function getApiResult<T = unknown>(response: { status: number; body: Record<string, unknown> | undefined }): T {
  const body = getResponseBody(response);
  return (body.result as T);
}

/**
 * Makes HTTP requests to the test server.
 */
export function makeRequest(
  method: string,
  path: string,
  options?: { body?: unknown; headers?: Record<string, string> }
): Promise<{ status: number; body: Record<string, unknown> | undefined; headers: Record<string, string | string[]> }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          let parsedBody: Record<string, unknown> | undefined;
          try {
            parsedBody = data ? JSON.parse(data) : undefined;
          } catch {
            parsedBody = {raw: data};
          }
          resolve({
            status: res.statusCode || 500,
            body: parsedBody,
            headers: res.headers as Record<string, string | string[]>,
          });
        });
      }
    );

    req.on('error', reject);

    if (options?.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}
