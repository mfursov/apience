import { ApienceResponse } from '../protocol/apience.types';
import { toApienceDateString, wrapAsApienceResponse } from './conversion.utils';

describe('apience-conversion.utils', () => {
  describe('toApienceDateString', () => {
    it('should convert timestamp to ISO 8601 format without milliseconds', () => {
      const timestamp = new Date('2012-07-20T01:19:13.000Z').getTime();
      const result = toApienceDateString(timestamp);
      expect(result).toBe('2012-07-20T01:19:13Z');
    });

    it('should convert Date object to ISO 8601 format without milliseconds', () => {
      const date = new Date('2012-07-20T01:19:13.456Z');
      const result = toApienceDateString(date);
      expect(result).toBe('2012-07-20T01:19:13Z');
    });

    it('should strip milliseconds from timestamp', () => {
      const timestamp = new Date('2023-01-15T10:30:45.789Z').getTime();
      const result = toApienceDateString(timestamp);
      expect(result).toBe('2023-01-15T10:30:45Z');
      expect(result).not.toContain('789');
    });

    it('should strip milliseconds from Date object', () => {
      const date = new Date('2023-12-31T23:59:59.999Z');
      const result = toApienceDateString(date);
      expect(result).toBe('2023-12-31T23:59:59Z');
    });

    it('should handle Unix epoch', () => {
      const timestamp = 0; // January 1, 1970
      const result = toApienceDateString(timestamp);
      expect(result).toBe('1970-01-01T00:00:00Z');
    });

    it('should handle current date', () => {
      const now = new Date();
      const result = toApienceDateString(now);
      // Result should match pattern YYYY-MM-DDTHH:mm:ssZ
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });

  describe('wrapAsApienceResponse', () => {
    it('should wrap plain value into ApienceResponse', () => {
      const value = { id: 1, name: 'test' };
      const result = wrapAsApienceResponse(value);
      expect(result).toEqual({ result: value });
    });

    it('should not wrap already wrapped ApienceResponse', () => {
      const response: ApienceResponse<{ id: number }> = { result: { id: 1 } };
      const wrapped = wrapAsApienceResponse(response);
      expect(wrapped).toBe(response);
    });

    it('should wrap array values', () => {
      const value = [{ id: 1 }, { id: 2 }];
      const result = wrapAsApienceResponse(value);
      expect(result).toEqual({ result: value });
    });

    it('should wrap string values', () => {
      const value = 'test string';
      const result = wrapAsApienceResponse(value);
      expect(result).toEqual({ result: value });
    });

    it('should wrap number values', () => {
      const value = 42;
      const result = wrapAsApienceResponse(value);
      expect(result).toEqual({ result: value });
    });

    it('should wrap null values', () => {
      const result = wrapAsApienceResponse(null);
      expect(result).toEqual({ result: null });
    });

    it('should wrap undefined values', () => {
      const result = wrapAsApienceResponse(undefined);
      expect(result).toEqual({ result: undefined });
    });

    it('should handle ApienceResponse with nested result property', () => {
      const response: ApienceResponse<{ data: string }> = { result: { data: 'nested' } };
      const wrapped = wrapAsApienceResponse(response);
      expect(wrapped).toBe(response);
      expect(wrapped.result).toEqual({ data: 'nested' });
    });

    it('should wrap object that looks like response but lacks result property', () => {
      const value = { status: 200, error: null };
      const result = wrapAsApienceResponse(value);
      expect(result).toEqual({ result: value });
    });

    it('should preserve type information for wrapped values', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };
      const result = wrapAsApienceResponse(user);
      expect(result.result).toEqual(user);
    });
  });
});
