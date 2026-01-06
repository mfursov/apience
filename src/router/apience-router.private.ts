import { assertTruthy, callValueAssertion, validateObject, Assertion } from 'assertic';
import * as url from 'url';
import { getApienceConfig } from '../config/apience-config';
import { catchRouteErrors } from '../middleware/catch-all.middleware';
import { ApienceUrlTokensValidator } from '../protocol/apience.types';
import { BAD_REQUEST } from '../utils/common.private';
import { wrapAsApienceResponse } from '../utils/conversion.private';
import { ExpressApplication, ExpressRequest, ExpressResponse } from '../utils/express.utils';
import {
  ApienceDeleteHandler,
  ApienceGetHandler,
  ApienceGetListHandler,
  ApienceHandlerMiddleware,
  ApiencePatchHandler,
  ApiencePostHandler,
  ApiencePutHandler,
  ApienceRequestContext,
  ApienceResponseOrValue,
  RouteRegistrationInfo,
} from './apience-router';
import { registerApiEndpointDocs } from './route-docs-handler.private';

/** Registers a GET route. */
export const mountGet = (
  app: ExpressApplication,
  route: ApienceGetHandler | ApienceGetListHandler,
  resultType: 'object' | 'array',
): void => mount(app, { method: 'get', route, isArrayResultType: resultType === 'array' });

/** Registers a POST route. */
export const mountPost = <Req, Res>(app: ExpressApplication, route: ApiencePostHandler<Req, Res>): void =>
  mount(app, { method: 'post', route: route as ApiencePostHandler });

/** Registers a PATCH route. */
export const mountPatch = <Req, Res>(app: ExpressApplication, route: ApiencePatchHandler<Req, Res>): void =>
  mount(app, { method: 'patch', route: route as ApiencePatchHandler });

/** Registers a PUT route. */
export const mountPut = <Req, Res>(app: ExpressApplication, route: ApiencePutHandler<Req, Res>): void =>
  mount(app, { method: 'put', route: route as ApiencePutHandler });

/** Registers a DELETE route. */
export const mountDelete = (app: ExpressApplication, route: ApienceDeleteHandler): void =>
  mount(app, { method: 'delete', route });

/** Mounts a route to the Express application. */
export function mount(app: ExpressApplication, { method, route, isArrayResultType }: RouteRegistrationInfo): void {
  const pathPrefix = route.version ? `/v${route.version}/` : '/';
  const config = getApienceConfig();

  // Runtime check: require docs if configured
  if (config.requireDocs && !route.doc) {
    throw new Error(
      `[Apience] Documentation (doc) is required for ${method.toUpperCase()} ${pathPrefix}${route.path}. ` +
        `Set configureApience({ requireDocs: false }) to disable this check.`,
    );
  }

  // Warning for missing docs (only if not in strict mode)
  if (config.warnOnMissingDocs && !route.doc && !config.requireDocs) {
    console.warn(`[Apience] No documentation for ${method.toUpperCase()} ${pathPrefix}${route.path}`);
  }

  // Register documentation only if provided
  if (route.doc) {
    registerApiEndpointDocs(method, pathPrefix + route.path, route.doc, !!isArrayResultType);
  }

  const path = `${pathPrefix}${route.path}`;
  console.log(`${`${method.toUpperCase()}     `.substring(0, 8)} ${path}`);
  app[method](
    path,
    catchRouteErrors(async (req, res) => {
      let result: ApienceResponseOrValue<unknown>;
      validateUrlParameters(req, route);
      const requestContext = newRequestContext(undefined, req, res);

      if (method === 'get') {
        result = await runGetHandler(route as ApienceGetHandler, requestContext, route.middlewares);
      } else if (method === 'delete') {
        result = await runDeleteHandler(route as ApienceDeleteHandler, requestContext, route.middlewares);
      } else {
        result = await runPppHandler(
          route as PppHandler<unknown, unknown>,
          requestContext as ApienceRequestContextImpl<unknown>,
          route.middlewares,
        );
      }

      const response = wrapAsApienceResponse(result);
      response.status = response.status || 200;
      res.status(response.status);
      res.send(response);
    }),
  );
}

/** Validates request parameters using custom validators. */
function validateUrlParameters(
  req: ExpressRequest,
  {
    pathValidator,
    queryValidator,
  }: {
    pathValidator?: ApienceUrlTokensValidator;
    queryValidator?: ApienceUrlTokensValidator;
  },
): void {
  for (const key in req.params) {
    const value = req.params[key];
    const validator = pathValidator?.[key];
    if (validator) {
      callValueAssertion(value, validator, BAD_REQUEST);
    }
  }

  const parsedUrl = url.parse(req.url, true);
  for (const key in parsedUrl.query) {
    const value = parsedUrl.query[key];
    const validator = queryValidator?.[key];
    if (validator) {
      callValueAssertion(value, validator, BAD_REQUEST);
    }
  }
}

/** Runs GET handler with optional middleware. */
async function runGetHandler<ResponseResultType>(
  route: ApienceGetHandler<ResponseResultType>,
  requestContext: ApienceRequestContextImpl<void>,
  middlewares?: Array<ApienceHandlerMiddleware>,
): Promise<ApienceResponseOrValue<ResponseResultType>> {
  return await executeWithMiddleware(() => route.run(requestContext), middlewares || [], requestContext);
}

/** Runs DELETE handler with optional middleware. */
async function runDeleteHandler(
  route: ApienceDeleteHandler,
  requestContext: ApienceRequestContextImpl<void>,
  middlewares?: Array<ApienceHandlerMiddleware>,
): Promise<ApienceResponseOrValue<void>> {
  await executeWithMiddleware(() => route.run(requestContext), middlewares || [], requestContext);
  return undefined;
}

/** POST/PUT/PATCH handler. */
type PppHandler<Req, Res> = ApiencePostHandler<Req, Res> | ApiencePutHandler<Req, Res> | ApiencePatchHandler<Req, Res>;

/** Runs POST/PUT/PATCH handler with optional middleware. */
async function runPppHandler<RequestBodyType, ResponseResultType>(
  route: PppHandler<RequestBodyType, ResponseResultType>,
  requestContext: ApienceRequestContextImpl<RequestBodyType>,
  middlewares?: Array<ApienceHandlerMiddleware>,
): Promise<ApienceResponseOrValue<ResponseResultType>> {
  const apienceRequest = requestContext.req.body as unknown;

  // Handle validation based on whether validator is an object or function
  const validator = route.validator as Assertion<RequestBodyType>;
  let error: string | undefined;
  
  // Check if validator is an object (ObjectAssertion) vs function (ValueAssertion)
  if (typeof validator === 'object' && validator !== null) {
    // It's an ObjectAssertion - use validateObject
    const isEmptyValidator = Object.keys(validator).length === 0;
    error = validateObject(apienceRequest, validator, `${BAD_REQUEST}: request body`, {
      failOnUnknownFields: !isEmptyValidator,
    });
  } else {
    // It's a ValueAssertion (function) - use callValueAssertion
    try {
      callValueAssertion(apienceRequest, validator, `${BAD_REQUEST}: request body`);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
  
  assertTruthy(!error, error);
  requestContext.data.request = requestContext.req.body;

  return await executeWithMiddleware(
    () => route.run(requestContext),
    middlewares || [],
    requestContext as ApienceRequestContext<RequestBodyType>,
  );
}

/**
 * Executes handler with middleware chain.
 * Middleware are applied in order, with the handler at the end.
 */
async function executeWithMiddleware<T>(
  run: () => Promise<T>,
  middlewares: Array<ApienceHandlerMiddleware>,
  context: ApienceRequestContext<unknown>,
): Promise<T> {
  // Build the middleware chain
  let current: () => Promise<T> = run;

  // Apply middleware in reverse order so they wrap each other
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const middleware = middlewares[i];
    const next = current;
    current = (): Promise<T> => middleware(next, context as ApienceRequestContext) as Promise<T>;
  }

  return current();
}

/** Proxies & adds extra safety checks on access to ApienceRequestContext. */
class ApienceRequestContextImpl<RequestBodyType> implements ApienceRequestContext<RequestBodyType> {
  constructor(readonly data: ApienceRequestContext<RequestBodyType>) {}

  get request(): RequestBodyType {
    return this.data.request;
  }

  get req(): ExpressRequest {
    return this.data.req;
  }

  get res(): ExpressResponse {
    return this.data.res;
  }

  get params(): { get(key: string): string; tryGet(key: string): string | undefined } {
    return {
      get: (key: string): string => {
        const value = this.data.req.params[key];
        assertTruthy(value, `Path parameter '${key}' not found in context`);
        return value;
      },
      tryGet: (key: string): string | undefined => this.data.req.params[key],
    };
  }

  get context(): Map<string, unknown> {
    return this.data.context;
  }
}

function newRequestContext<RequestBodyType>(
  openapiRequest: RequestBodyType,
  req: ExpressRequest,
  res: ExpressResponse,
): ApienceRequestContextImpl<RequestBodyType> {
  return new ApienceRequestContextImpl<RequestBodyType>({
    request: openapiRequest,
    req,
    res,
    params: {
      get: (key: string): string => {
        const value = req.params[key];
        assertTruthy(value, `Path parameter '${key}' not found`);
        return value;
      },
      tryGet: (key: string): string | undefined => req.params[key],
    },
    context: new Map(),
  });
}
