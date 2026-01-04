import { NextFunction } from 'express';
import { ExpressFunction, ExpressRequest, ExpressResponse } from '../utils/express.utils';
import { ApienceLoggingConfig } from './apience-logging.types';
import { logMessage } from './apience-logging.utils';
import { getApienceTlsData } from './apience-thread-local-storage';

/**
 * Creates request/response logging middleware with console output.
 * Logs incoming requests and outgoing responses with timing information.
 *
 * @param config - Logging configuration (optional)
 * @returns Express middleware function
 */
export function createApienceLoggingMiddleware(config?: ApienceLoggingConfig): ExpressFunction {
  const _sensitiveFields = new Set(config?.sensitiveFields || ['password', 'secret', 'token', 'api_key']);
  const enableConsole = config?.enableConsole !== false;

  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const requestId = getApienceTlsData('requestId') as string | undefined;

    // Log request
    logMessage(
      {
        level: 'info',
        message: `${req.method} ${req.path}`,
        timestamp: new Date(),
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
      },
      enableConsole,
    );

    // Capture response
    const originalSend = res.send;
    res.send = function (data: unknown): ExpressResponse {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log response
      logMessage(
        {
          level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
          message: `${req.method} ${req.path} ${statusCode}`,
          timestamp: new Date(),
          requestId,
          method: req.method,
          path: req.path,
          statusCode,
          duration,
        },
        enableConsole,
      );

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Initializes Apience logging with the provided configuration.
 * Call this once at application startup.
 *
 * @param config - Logging configuration (optional)
 */
export async function initializeApienceLogging(config?: ApienceLoggingConfig): Promise<void> {
  if (config?.transport) {
    await config.transport.initialize();
  }
}

/**
 * Flushes any pending logs from the transport.
 * Call this before gracefully shutting down the application.
 *
 * @param config - Logging configuration (optional)
 */
export async function flushApienceLogging(config?: ApienceLoggingConfig): Promise<void> {
  if (config?.transport) {
    await config.transport.flush();
  }
}
