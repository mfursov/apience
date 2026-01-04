/**
 * Configuration for Apience logging.
 */
export interface ApienceLoggingConfig {
  /** Fields to redact from logs (e.g., passwords, API keys) */
  sensitiveFields?: string[];

  /** Enable console logging (default: true) */
  enableConsole?: boolean;

  /** Custom transport for handling log messages */
  transport?: LogTransport;
}

/**
 * Interface for custom log transports.
 * Implement this to integrate with external logging systems like CloudWatch, ELK, etc.
 */
export interface LogTransport {
  /** Initialize the transport */
  initialize(): Promise<void>;

  /** Log a message */
  log(message: LogMessage): Promise<void>;

  /** Flush any pending logs */
  flush(): Promise<void>;
}

/**
 * Structured log message.
 */
export interface LogMessage {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  requestId?: string;
  [key: string]: unknown;
}
