import { Assertion, ObjectAssertion, ValueAssertion } from 'assertic';
import { ApienceDeleteHandlerDoc, ApienceGetHandlerDoc, ApiencePostHandlerDoc } from '../protocol/apience-doc.types';
import { ApienceResponse, ApienceUrlTokensValidator } from '../protocol/apience.types';
import { ExpressRequest, ExpressResponse } from '../utils/express.utils';

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
  run: () => Promise<unknown>,
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
  run: (context: ApienceRequestContext) => Promise<ApienceResponseOrValue<Array<ResponseResultElementType>>>;
  /** Optional middleware to execute before the handler */
  middlewares?: Array<ApienceHandlerMiddleware>;
}

/** Descriptor for GET routes. */
export interface ApienceGetHandler<ResponseResultType = unknown> extends ApienceHandlerCommon {
  pathValidator?: ApienceUrlTokensValidator;
  queryValidator?: ApienceUrlTokensValidator;
  doc?: ApienceGetHandlerDoc<ResponseResultType>;
  run: (context: ApienceRequestContext) => Promise<ApienceResponseOrValue<ResponseResultType>>;
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
  validator: RequestBodyType extends object ? ObjectAssertion<RequestBodyType> : Assertion<RequestBodyType>;
  run: (context: ApienceRequestContext<RequestBodyType>) => Promise<ApienceResponseOrValue<ResponseResultType>>;
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
  pathValidator?: Record<string, ValueAssertion<string>>;
  queryValidator?: Record<string, ValueAssertion<string>>;
  doc?: ApienceDeleteHandlerDoc;
  run: (context: ApienceRequestContext) => Promise<void>;
  /** Optional middleware to execute before the handler */
  middlewares?: Array<ApienceHandlerMiddleware>;
}

/** Union type for all route registration info objects. */
export type RouteRegistrationInfo = (
  | { method: 'get'; route: ApienceGetHandler | ApienceGetListHandler }
  | { method: 'post'; route: ApiencePostHandler }
  | { method: 'patch'; route: ApiencePatchHandler }
  | { method: 'put'; route: ApiencePutHandler }
  | { method: 'delete'; route: ApienceDeleteHandler }
) & { isArrayResultType?: boolean };
