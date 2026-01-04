import {
  INTERNAL_ERROR_STATUS,
  isInteger,
  isNonEmptyString,
  isValidEmail,
  parseStatusCodeFromErrorMessageToken,
  truthy,
  validateObject,
} from './common.utils';

describe('common.utils', () => {
  describe('parseStatusCodeFromErrorMessageToken', () => {
    it('should parse valid HTTP status code from error message', () => {
      expect(parseStatusCodeFromErrorMessageToken('400 Bad Request')).toBe(400);
      expect(parseStatusCodeFromErrorMessageToken('401 Unauthorized')).toBe(401);
      expect(parseStatusCodeFromErrorMessageToken('500 Internal Server Error')).toBe(500);
    });

    it('should return 500 for message without status code', () => {
      expect(parseStatusCodeFromErrorMessageToken('Some random error')).toBe(INTERNAL_ERROR_STATUS);
    });

    it('should return 500 for empty or undefined message', () => {
      expect(parseStatusCodeFromErrorMessageToken('')).toBe(INTERNAL_ERROR_STATUS);
      expect(parseStatusCodeFromErrorMessageToken(undefined)).toBe(INTERNAL_ERROR_STATUS);
    });

    it('should extract status code even with extra spaces', () => {
      expect(parseStatusCodeFromErrorMessageToken('404    Not Found')).toBe(404);
    });
  });

  describe('truthy', () => {
    it('should return the value if truthy', () => {
      expect(truthy('hello')).toBe('hello');
      expect(truthy(42)).toBe(42);
      expect(truthy(true)).toBe(true);
      expect(truthy({ key: 'value' })).toEqual({ key: 'value' });
    });

    it('should throw with custom message if falsy', () => {
      expect(() => truthy(null, 'Value is null')).toThrow('Value is null');
      expect(() => truthy(undefined, 'Value is undefined')).toThrow('Value is undefined');
      expect(() => truthy('', 'Empty string')).toThrow('Empty string');
    });

    it('should throw with function-generated message', () => {
      expect(() => truthy(null, () => 'Generated error message')).toThrow('Generated error message');
    });

    it('should throw default message if no message provided', () => {
      expect(() => truthy(null)).toThrow('400 Value is not truthy');
    });
  });

  describe('validateObject', () => {
    it('should validate object with validators', () => {
      const validators = {
        name: isNonEmptyString,
        age: isInteger,
      };

      expect(() => validateObject({ name: 'John', age: 30 }, validators)).not.toThrow();
    });

    it('should throw error for invalid field', () => {
      const validators = {
        name: isNonEmptyString,
        age: isInteger,
      };

      expect(() => validateObject({ name: '', age: 30 }, validators)).toThrow('400: Expected non-empty string');
    });

    it('should throw error if object is not an object', () => {
      const validators = { name: isNonEmptyString };

      expect(() => validateObject('not an object', validators)).toThrow('400: Expected object');
      expect(() => validateObject(null, validators)).toThrow('400: Expected object');
    });

    it('should skip validators with undefined values', () => {
      const validators = {
        name: isNonEmptyString,
        optional: undefined,
      };

      expect(() => validateObject({ name: 'John' }, validators)).not.toThrow();
    });

    it('should include context message in error', () => {
      const validators = {
        email: isValidEmail,
      };

      expect(() => validateObject({ email: 'invalid' }, validators, 'user data')).toThrow(
        '400: Invalid email (user data)',
      );
    });
  });
});
