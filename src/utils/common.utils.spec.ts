import {
  INTERNAL_ERROR_STATUS,
  isArray,
  isBoolean,
  isInteger,
  isNonEmptyString,
  isNumber,
  isObject,
  isUUID,
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

  describe('isNonEmptyString', () => {
    it('should accept valid non-empty strings', () => {
      expect(() => isNonEmptyString('hello')).not.toThrow();
      expect(() => isNonEmptyString('123')).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => isNonEmptyString('')).toThrow('400: Expected non-empty string');
    });

    it('should reject whitespace-only strings', () => {
      expect(() => isNonEmptyString('   ')).toThrow('400: Expected non-empty string');
    });

    it('should reject non-string values', () => {
      expect(() => isNonEmptyString(123)).toThrow('400: Expected non-empty string');
      expect(() => isNonEmptyString(null)).toThrow('400: Expected non-empty string');
      expect(() => isNonEmptyString(undefined)).toThrow('400: Expected non-empty string');
    });

    it('should use custom error status', () => {
      expect(() => isNonEmptyString('', '401')).toThrow('401: Expected non-empty string');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(() => isValidEmail('test@example.com')).not.toThrow();
      expect(() => isValidEmail('user+tag@domain.co.uk')).not.toThrow();
    });

    it('should reject strings without @ symbol', () => {
      expect(() => isValidEmail('notanemail')).toThrow('400: Invalid email');
      expect(() => isValidEmail('test.example.com')).toThrow('400: Invalid email');
    });

    it('should reject non-string values', () => {
      expect(() => isValidEmail(123)).toThrow('400: Invalid email');
      expect(() => isValidEmail(null)).toThrow('400: Invalid email');
    });
  });

  describe('isNumber', () => {
    it('should accept numeric values', () => {
      expect(() => isNumber(42)).not.toThrow();
      expect(() => isNumber(3.14)).not.toThrow();
      expect(() => isNumber(0)).not.toThrow();
      expect(() => isNumber(-100)).not.toThrow();
    });

    it('should reject non-numeric values', () => {
      expect(() => isNumber('42')).toThrow('400: Expected number');
      expect(() => isNumber(null)).toThrow('400: Expected number');
      expect(() => isNumber(undefined)).toThrow('400: Expected number');
    });
  });

  describe('isInteger', () => {
    it('should accept integer values', () => {
      expect(() => isInteger(42)).not.toThrow();
      expect(() => isInteger(0)).not.toThrow();
      expect(() => isInteger(-100)).not.toThrow();
    });

    it('should reject decimal numbers', () => {
      expect(() => isInteger(3.14)).toThrow('400: Expected integer');
      expect(() => isInteger(0.1)).toThrow('400: Expected integer');
    });

    it('should reject non-numeric values', () => {
      expect(() => isInteger('42')).toThrow('400: Expected integer');
      expect(() => isInteger(null)).toThrow('400: Expected integer');
    });
  });

  describe('isBoolean', () => {
    it('should accept boolean values', () => {
      expect(() => isBoolean(true)).not.toThrow();
      expect(() => isBoolean(false)).not.toThrow();
    });

    it('should reject non-boolean values', () => {
      expect(() => isBoolean(1)).toThrow('400: Expected boolean');
      expect(() => isBoolean('true')).toThrow('400: Expected boolean');
      expect(() => isBoolean(null)).toThrow('400: Expected boolean');
    });
  });

  describe('isArray', () => {
    it('should accept array values', () => {
      expect(() => isArray([])).not.toThrow();
      expect(() => isArray([1, 2, 3])).not.toThrow();
      expect(() => isArray(['a', 'b'])).not.toThrow();
    });

    it('should reject non-array values', () => {
      expect(() => isArray('array')).toThrow('400: Expected array');
      expect(() => isArray({ length: 1 })).toThrow('400: Expected array');
      expect(() => isArray(null)).toThrow('400: Expected array');
    });
  });

  describe('isObject', () => {
    it('should accept plain objects', () => {
      expect(() => isObject({})).not.toThrow();
      expect(() => isObject({ key: 'value' })).not.toThrow();
      expect(() => isObject({ nested: { obj: true } })).not.toThrow();
    });

    it('should reject arrays', () => {
      expect(() => isObject([])).toThrow('400: Expected object');
      expect(() => isObject([1, 2, 3])).toThrow('400: Expected object');
    });

    it('should reject non-object values', () => {
      expect(() => isObject('object')).toThrow('400: Expected object');
      expect(() => isObject(123)).toThrow('400: Expected object');
      expect(() => isObject(null)).toThrow('400: Expected object');
    });
  });

  describe('isUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(() => isUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
      expect(() => isUUID('12345678-1234-1234-1234-123456789012')).not.toThrow();
      expect(() => isUUID('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).not.toThrow();
    });

    it('should reject invalid UUID formats', () => {
      expect(() => isUUID('not-a-uuid')).toThrow('400: Invalid UUID format');
      expect(() => isUUID('550e8400e29b41d4a716446655440000')).toThrow('400: Invalid UUID format');
      expect(() => isUUID('550e8400-e29b-41d4-a716')).toThrow('400: Invalid UUID format');
    });

    it('should reject non-string values', () => {
      expect(() => isUUID(123)).toThrow('400: Invalid UUID format');
      expect(() => isUUID(null)).toThrow('400: Invalid UUID format');
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
