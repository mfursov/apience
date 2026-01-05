import * as url from 'url';
import { getApienceConfig } from '../config/apience-config';
import { catchRouteErrors } from '../middleware/apience-errors';
import { ApienceDeleteHandlerDoc, ApienceGetHandlerDoc, ApiencePostHandlerDoc } from '../protocol/apience-doc.types';
import { ApienceResponse, ApienceUrlTokensValidator } from '../protocol/apience.types';
import { wrapAsApienceResponse } from '../utils/apience-conversion.utils';
import { assertTruthy, BAD_REQUEST, ObjectValidator, validateObject, ValueValidator } from '../utils/common.utils';
import { ExpressApplication, ExpressRequest, ExpressResponse } from '../utils/express.utils';
import { registerApiEndpointDocs } from './apience-route-docs-handler';

/** Common part of all Apience route descriptors. */
export interface ApienceHandlerCommon {
  path: string;
  version?: string;
  /**
   * If true, blocks requests from the restricted countries (see handler.blockRestrictedCountries).
   * The request country can be extracted from custom headers or request context.
   */
  blockRestrictedCountries?: boolean;
  /**
   * Whether this handler can be called with restricted permission levels.
   * Default: false (only full-access users/keys can call)
   */
  allowRestrictedAccess?: boolean;
}

/** Apience allows handlers to return response in the raw form. */
export type ApienceResponseOrValue<ResponseEntity> = ApienceResponse<ResponseEntity> | ResponseEntity;

/**
 * Generic middleware hook for handler execution.
 * Allows custom logic like transaction management, authorization checks, etc.
 */
export type ApienceHandlerMiddleware<Context = ApienceRequestContext> = (
  handler: () => Promise<unknown>,
  context: Context,
) => Promise<unknown>;

/** Generic request context passed to all handlers. Database-agnostic and extensible. */
export interface ApienceRequestContext<RequestBodyType = void> {
  /** Parsed and validated request body (for POST/PATCH/PUT handlers) */
  request: RequestBodyType;
  /** Express Request object */
  req: ExpressRequest;
  /** Express Response object */
  res: ExpressResponse;

  /**
   * Generic parameter access with lazy validation.
   * Provides type-safe access to URL path and query parameters.
   */
  params: {
    get(key: string): string;
    tryGet(key: string): string | undefined;
  };

  /**
   * Generic context storage for middleware to attach data.
   * Allows middleware to pass information to handlers and other middleware.
   */
  context: Map<string, unknown>;
}

/** Descriptor for GET list routes. */
export interface ApienceGetListHandler<ResponseResultElementType = unknown> extends ApienceHandlerCommon {
  pathValidator?: ApienceUrlTokensValidator;
  queryValidator?: ApienceUrlTokensValidator;
  doc?: ApienceGetHandlerDoc<ResponseResultElementType>;
  handler: (context: ApienceRequestContext) => Promise<ApienceResponseOrValue<Array<ResponseResultElementType>>>;
  /** Optional middleware to execute before the handler */
  middlewares?: Array<ApienceHandlerMiddleware>;
}

/** Descriptor for GET routes. */
export interface ApienceGetHandler<ResponseResultType = unknown> extends ApienceHandlerCommon {
  pathValidator?: ApienceUrlTokensValidator;
  queryValidator?: ApienceUrlTokensValidator;
  doc?: ApienceGetHandlerDoc<ResponseResultType>;
  handler: (context: ApienceRequestContext) => Promise<ApienceResponseOrValue<ResponseResultType>>;
  /** Optional middleware to execute before the handler */
  middlewares?: Array<ApienceHandlerMiddleware>;
}

/** Descriptor for POST routes. */
export interface ApiencePostHandler<
  RequestBodyType = unknown,
  ResponseResultType = unknown,
> extends ApienceHandlerCommon {
  doc?: ApiencePostHandlerDoc<RequestBodyType, ResponseResultType>;
  pathValidator?: ApienceUrlTokensValidator;
  queryValidator?: ApienceUrlTokensValidator;
  /** Request body validator. */
  validator: ObjectValidator<Record<string, unknown>>;
  handler: (context: ApienceRequestContext<RequestBodyType>) => Promise<ApienceResponseOrValue<ResponseResultType>>;
  /** Optional middleware to execute before the handler */
  middlewares?: Array<ApienceHandlerMiddleware>;
}

/** Same as POST. Used for full object updates. */
export type ApiencePutHandler<RequestBodyType = unknown, ResponseResultType = unknown> = ApiencePostHandler<
  RequestBodyType,
  ResponseResultType
>;

/** Same as PUT. While PUT is used for the whole object update, PATCH is used for a partial update. */
export type ApiencePatchHandler<RequestBodyType = unknown, ResponseResultType = unknown> = ApiencePutHandler<
  RequestBodyType,
  ResponseResultType
>;

/** Descriptor for DELETE routes. */
export interface ApienceDeleteHandler extends ApienceHandlerCommon {
  pathValidator?: Record<string, ValueValidator<string>>;
  queryValidator?: Record<string, ValueValidator<string>>;
  doc?: ApienceDeleteHandlerDoc;
  handler: (context: ApienceRequestContext) => Promise<void>;
  /** Optional middleware to execute before the handler */
  middlewares?: Array<ApienceHandlerMiddleware>;
}

export type RouteRegistrationInfo = (
  | { method: 'get'; handler: ApienceGetHandler | ApienceGetListHandler }
  | { method: 'post'; handler: ApiencePostHandler }
  | { method: 'patch'; handler: ApiencePatchHandler }
  | { method: 'put'; handler: ApiencePutHandler }
  | { method: 'delete'; handler: ApienceDeleteHandler }
) & { isArrayResultType?: boolean };

export const mountGet = (
  app: ExpressApplication,
  handler: ApienceGetHandler | ApienceGetListHandler,
  resultType: 'object' | 'array',
): void => mount(app, { method: 'get', handler, isArrayResultType: resultType === 'array' });

export const mountPost = <Req, Res>(app: ExpressApplication, handler: ApiencePostHandler<Req, Res>): void =>
  mount(app, { method: 'post', handler: handler as ApiencePostHandler });

export const mountPatch = <Req, Res>(app: ExpressApplication, handler: ApiencePatchHandler<Req, Res>): void =>
  mount(app, { method: 'patch', handler: handler as ApiencePatchHandler });

export const mountPut = <Req, Res>(app: ExpressApplication, handler: ApiencePutHandler<Req, Res>): void =>
  mount(app, { method: 'put', handler: handler as ApiencePutHandler });

export const mountDelete = (app: ExpressApplication, handler: ApienceDeleteHandler): void =>
  mount(app, { method: 'delete', handler });

export function mount(app: ExpressApplication, { method, handler, isArrayResultType }: RouteRegistrationInfo): void {
  const pathPrefix = handler.version ? `/v${handler.version}/` : '/';
  const config = getApienceConfig();

  // Runtime check: require docs if configured
  if (config.requireDocs && !handler.doc) {
    throw new Error(
      `[Apience] Documentation (doc) is required for ${method.toUpperCase()} ${pathPrefix}${handler.path}. ` +
        `Set configureApience({ requireDocs: false }) to disable this check.`,
    );
  }

  // Register documentation only if provided
  if (handler.doc) {
    registerApiEndpointDocs(method, pathPrefix + handler.path, handler.doc, !!isArrayResultType);
  }

  const path = `${pathPrefix}${handler.path}`;
  console.log(`${`${method.toUpperCase()}     `.substring(0, 8)} ${path}`);
  app[method](
    path,
    catchRouteErrors(async (req, res) => {
      let result: ApienceResponseOrValue<unknown>;
      validateUrlParameters(req, handler);
      const requestContext = newRequestContext(undefined, req, res);

      if (method === 'get') {
        result = await runGetHandler(handler as ApienceGetHandler, requestContext, handler.middlewares);
      } else if (method === 'delete') {
        result = await runDeleteHandler(handler as ApienceDeleteHandler, requestContext, handler.middlewares);
      } else {
        result = await runPppHandler(
          handler as PppHandler<unknown, unknown>,
          requestContext as ApienceRequestContextImpl<unknown>,
          handler.middlewares,
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
      validator(value, BAD_REQUEST);
    }
  }

  const parsedUrl = url.parse(req.url, true);
  for (const key in parsedUrl.query) {
    const value = parsedUrl.query[key];
    const validator = queryValidator?.[key];
    if (validator) {
      validator(value, BAD_REQUEST);
    }
  }
}

/** Runs GET handler with optional middleware. */
async function runGetHandler<ResponseResultType>(
  handler: ApienceGetHandler<ResponseResultType>,
  requestContext: ApienceRequestContextImpl<void>,
  middlewares?: Array<ApienceHandlerMiddleware>,
): Promise<ApienceResponseOrValue<ResponseResultType>> {
  return await executeWithMiddleware(() => handler.handler(requestContext), middlewares || [], requestContext);
}

/** Runs DELETE handler with optional middleware. */
async function runDeleteHandler(
  handler: ApienceDeleteHandler,
  requestContext: ApienceRequestContextImpl<void>,
  middlewares?: Array<ApienceHandlerMiddleware>,
): Promise<ApienceResponseOrValue<void>> {
  await executeWithMiddleware(() => handler.handler(requestContext), middlewares || [], requestContext);
  return undefined;
}

/** POST/PUT/PATCH handler. */
type PppHandler<Req, Res> = ApiencePostHandler<Req, Res> | ApiencePutHandler<Req, Res> | ApiencePatchHandler<Req, Res>;

/** Runs POST/PUT/PATCH handler with optional middleware. */
async function runPppHandler<RequestBodyType, ResponseResultType>(
  handler: PppHandler<RequestBodyType, ResponseResultType>,
  requestContext: ApienceRequestContextImpl<RequestBodyType>,
  middlewares?: Array<ApienceHandlerMiddleware>,
): Promise<ApienceResponseOrValue<ResponseResultType>> {
  const apienceRequest = requestContext.req.body as unknown;
  validateObject(apienceRequest, handler.validator, `${BAD_REQUEST}: request body`, { failOnMissedValidators: true });
  requestContext.data.request = requestContext.req.body;

  return await executeWithMiddleware(
    () => handler.handler(requestContext),
    middlewares || [],
    requestContext as ApienceRequestContext<RequestBodyType>,
  );
}

/**
 * Executes handler with middleware chain.
 * Middleware are applied in order, with the handler at the end.
 */
async function executeWithMiddleware<T>(
  handler: () => Promise<T>,
  middlewares: Array<ApienceHandlerMiddleware>,
  context: ApienceRequestContext<unknown>,
): Promise<T> {
  // Build the middleware chain
  let current: () => Promise<T> = handler;

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
