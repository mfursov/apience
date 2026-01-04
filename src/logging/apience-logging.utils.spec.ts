import { LogMessage } from './apience-logging.types';
import { isSensitiveField, logMessage, redactSensitiveFields } from './apience-logging.utils';

describe('apience-logging.utils', () => {
  describe('logMessage', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log message when console logging is enabled', () => {
      const now = new Date();
      const message: LogMessage = {
        level: 'info',
        message: 'Test message',
        timestamp: now,
      };

      logMessage(message, true);

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message', message);
    });

    it('should not log message when console logging is disabled', () => {
      const now = new Date();
      const message: LogMessage = {
        level: 'info',
        message: 'Test message',
        timestamp: now,
      };

      logMessage(message, false);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should uppercase the log level', () => {
      const now = new Date();
      const message: LogMessage = {
        level: 'debug',
        message: 'Debug message',
        timestamp: now,
      };

      logMessage(message, true);

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Debug message', message);
    });

    it('should handle different log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'];

      for (const level of levels) {
        const now = new Date();
        const message: LogMessage = {
          level: level as any,
          message: `${level} message`,
          timestamp: now,
        };

        logMessage(message, true);
        expect(consoleLogSpy).toHaveBeenCalledWith(`[${level.toUpperCase()}] ${level} message`, message);
      }
    });
  });

  describe('isSensitiveField', () => {
    it('should identify sensitive fields', () => {
      const sensitiveFields = new Set(['password', 'token', 'apiKey']);

      expect(isSensitiveField('password', sensitiveFields)).toBe(true);
      expect(isSensitiveField('token', sensitiveFields)).toBe(true);
      expect(isSensitiveField('apiKey', sensitiveFields)).toBe(true);
    });

    it('should identify non-sensitive fields', () => {
      const sensitiveFields = new Set(['password', 'token']);

      expect(isSensitiveField('username', sensitiveFields)).toBe(false);
      expect(isSensitiveField('email', sensitiveFields)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const sensitiveFields = new Set(['password']);

      expect(isSensitiveField('password', sensitiveFields)).toBe(true);
      expect(isSensitiveField('Password', sensitiveFields)).toBe(false);
      expect(isSensitiveField('PASSWORD', sensitiveFields)).toBe(false);
    });

    it('should handle empty sensitive fields set', () => {
      const sensitiveFields = new Set<string>();

      expect(isSensitiveField('password', sensitiveFields)).toBe(false);
      expect(isSensitiveField('token', sensitiveFields)).toBe(false);
    });
  });

  describe('redactSensitiveFields', () => {
    it('should redact sensitive fields in object', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };
      const sensitiveFields = new Set(['password']);

      const result = redactSensitiveFields(obj, sensitiveFields);

      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
        email: 'john@example.com',
      });
    });

    it('should redact multiple sensitive fields', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        apiKey: 'key-12345',
        email: 'john@example.com',
        token: 'token-xyz',
      };
      const sensitiveFields = new Set(['password', 'apiKey', 'token']);

      const result = redactSensitiveFields(obj, sensitiveFields);

      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
        apiKey: '[REDACTED]',
        email: 'john@example.com',
        token: '[REDACTED]',
      });
    });

    it('should not modify original object', () => {
      const obj = { username: 'john', password: 'secret' };
      const originalObj = { ...obj };
      const sensitiveFields = new Set(['password']);

      redactSensitiveFields(obj, sensitiveFields);

      expect(obj).toEqual(originalObj);
    });

    it('should handle empty object', () => {
      const obj = {};
      const sensitiveFields = new Set(['password']);

      const result = redactSensitiveFields(obj, sensitiveFields);

      expect(result).toEqual({});
    });

    it('should handle object with no sensitive fields', () => {
      const obj = { username: 'john', email: 'john@example.com' };
      const sensitiveFields = new Set(['password', 'token']);

      const result = redactSensitiveFields(obj, sensitiveFields);

      expect(result).toEqual(obj);
    });

    it('should handle various value types', () => {
      const obj = {
        sensitive: 'secret',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
      };
      const sensitiveFields = new Set(['sensitive']);

      const result = redactSensitiveFields(obj, sensitiveFields);

      expect(result).toEqual({
        sensitive: '[REDACTED]',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
      });
    });
  });
});
