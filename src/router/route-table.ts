import { ExpressApplication } from '../utils/express.utils';
import {
  ApienceDeleteHandler,
  ApienceGetHandler,
  ApiencePatchHandler,
  ApiencePostHandler,
  ApiencePutHandler,
} from './apience-router';
import { mountDelete, mountGet, mountPatch, mountPost, mountPut } from './apience-router.private';

/**
 * Helper utility for organizing and mounting routes.
 * Provides a fluent interface for registering multiple handlers.
 */
export class RouteTable {
  constructor(private readonly app: ExpressApplication) {}

  get<T>(handler: ApienceGetHandler<T> | ApienceGetHandler<T[]>): this {
    const resultType = Array.isArray({}) ? 'array' : 'object';
    mountGet(this.app, handler as ApienceGetHandler<T>, resultType === 'array' ? 'array' : 'object');
    return this;
  }

  post<Req, Res>(handler: ApiencePostHandler<Req, Res>): this {
    mountPost(this.app, handler);
    return this;
  }

  patch<Req, Res>(handler: ApiencePatchHandler<Req, Res>): this {
    mountPatch(this.app, handler);
    return this;
  }

  put<Req, Res>(handler: ApiencePutHandler<Req, Res>): this {
    mountPut(this.app, handler);
    return this;
  }

  delete(handler: ApienceDeleteHandler): this {
    mountDelete(this.app, handler);
    return this;
  }
}

/**
 * Factory function to create a new route table.
 * @param app Express application instance
 * @returns ApienceRouteTable instance with fluent API
 */
export function createRouteTable(app: ExpressApplication): RouteTable {
  return new RouteTable(app);
}
