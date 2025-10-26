import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../src/services/ValidationService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import type { TemplateField, ValidatorPlugin, ServiceContainer } from '../../src/types/index.js';

describe('ValidationService - Extended Tests', () => {
  let validationService: ValidationService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: false });
    validationService = new ValidationService(configService);
    
    // Create a mock service container for plugin testing
    const mockServiceContainer: ServiceContainer = {
      configService,
      templateParserService: null as any,
      transformerService: null as any,
      groupingService: null as any,
      promptService: null as any,
      outputService: null as any,
      validationService
    };
    
    validationService.setServiceContainer(mockServiceContainer);
  });

  const createTestField = (type: string, options: Record<string, unknown> = {}): TemplateField => ({
    key: 'TEST_FIELD',
    type,
    options,
    rawLine: '',
    lineNumber: 1
  });

  describe('URL Validation', () => {
    it('should validate only http and https URLs as valid', async () => {
      const field = createTestField('url', {
        protocol: 'http,https',
      });

      const urls = [
        'https://example.com',
        'http://localhost:3000',
        'ftp://ftp.example.com',
        'file:///path/to/file',
        'mailto:test@example.com',
        'tel:+1234567890'
      ];

      for (const url of urls) {
        const result = await validationService.validateField(url, field);
        if (url.startsWith('https://') || url.startsWith('http://')) {
          expect(result.valid).toBe(true);
        } else {
          expect(result.valid).toBe(false);
        }
      }
    });

    it('should validate URLs with ports and paths', async () => {
      const field = createTestField('url', {
        protocol: 'http,https',
        port: '8080,3000',
        hostname: 'api.example.com,localhost'
      }); 
      
      const complexUrls = [
        'https://api.example.com:8080/v1/users',
        'http://localhost:3000/auth/callback?code=123',
        'postgres://user:pass@db.example.com:5432/database',
        'mongodb://user:pass@cluster.mongodb.net:27017/db'
      ];

      for (const url of complexUrls) {
        const result = await validationService.validateField(url, field);
        expect(result.valid).toBe(url.startsWith('https://') || url.startsWith('http://'));
      }
    });

    it('should validate URLs with special characters', async () => {
      const field = createTestField('string');

      const specialUrls = [
        'https://example.com/path?query=hello%20world',
        'https://user:p@ssw0rd@example.com',
        'https://example.com/path/with-dashes_and_underscores',
        'https://sub.domain.example.com'
      ];

      for (const url of specialUrls) {
        const result = await validationService.validateField(url, field);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Number Validation', () => {
    it('should validate integers and floats', async () => {
      const field = createTestField('number');

      const validNumbers = ['123', '0', '-456', '3.14', '-2.718', '1e10', '0.5'];

      for (const num of validNumbers) {
        const result = await validationService.validateField(num, field);
        expect(result.valid).toBe(true);
      }
    });

    it('should respect min and max constraints', async () => {
      const field = createTestField('number', { min: 10, max: 100 });

      // Valid numbers within range
      const validNumbers = ['10', '50', '100', '25.5'];
      for (const num of validNumbers) {
        const result = await validationService.validateField(num, field);
        expect(result.valid).toBe(true);
      }

      // Invalid numbers outside range
      const invalidNumbers = ['9', '101', '0', '200'];
      for (const num of invalidNumbers) {
        const result = await validationService.validateField(num, field);
        expect(result.valid).toBe(false);
      }
    });

    it('should handle allow parameter with min/max', async () => {
      const field = createTestField('number', { min: 10, max: 100, allow: '80,443' });

      // Numbers within range
      expect((await validationService.validateField('50', field)).valid).toBe(true);
      
      // Allowed numbers outside range
      expect((await validationService.validateField('80', field)).valid).toBe(true);
      expect((await validationService.validateField('443', field)).valid).toBe(true);
      
      // Disallowed numbers outside range
      expect((await validationService.validateField('8', field)).valid).toBe(false);
      expect((await validationService.validateField('500', field)).valid).toBe(false);
    });

    it('should reject non-numeric strings', async () => {
      const field = createTestField('number');

      const invalidNumbers = ['abc', '12.34.56', 'NaN', 'Infinity', '12a', 'a12'];

      for (const invalid of invalidNumbers) {
        const result = await validationService.validateField(invalid, field);
        expect(result.valid).toBe(false);
      }
    });

    it('should handle edge cases for numbers', async () => {
      const field = createTestField('number');

      // Edge cases that should be valid
      const edgeCases = ['0', '0.0', '-0', '1e-10', '1E+10'];
      for (const edge of edgeCases) {
        const result = await validationService.validateField(edge, field);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('String Validation', () => {
    it('should validate string length constraints', async () => {
      const field = createTestField('string', { min_length: 5, max_length: 10 });

      // Valid strings
      const validStrings = ['hello', 'world!', '12345', 'ten_chars!'];
      for (const str of validStrings) {
        const result = await validationService.validateField(str, field);
        expect(result.valid).toBe(true);
      }

      // Invalid strings
      const invalidStrings = ['hi', 'this_is_too_long'];
      for (const str of invalidStrings) {
        const result = await validationService.validateField(str, field);
        expect(result.valid).toBe(false);
      }
    });

    it('should validate string patterns', async () => {
      const field = createTestField('string', { pattern: '^[A-Z][a-z]+$' });

      // Valid patterns
      const validStrings = ['Hello', 'World', 'Test'];
      for (const str of validStrings) {
        const result = await validationService.validateField(str, field);
        expect(result.valid).toBe(true);
      }

      // Invalid patterns
      const invalidStrings = ['hello', 'WORLD', '123', 'Test123'];
      for (const str of invalidStrings) {
        const result = await validationService.validateField(str, field);
        expect(result.valid).toBe(false);
      }
    });

    it('should handle empty strings', async () => {
      const field = createTestField('string');
      const result = await validationService.validateField('', field);
      expect(result.valid).toBe(true); // Empty strings are valid by default
    });

    it('should handle unicode strings', async () => {
      const field = createTestField('string');
      const unicodeStrings = ['café', '🚀', '中文', 'Ñoño', 'العربية'];
      
      for (const str of unicodeStrings) {
        const result = await validationService.validateField(str, field);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Boolean Validation', () => {
    it('should validate various boolean representations', async () => {
      const field = createTestField('boolean');

      const trueValues = ['true', 'TRUE', 'True', '1', 'yes', 'YES', 'on', 'ON'];
      const falseValues = ['false', 'FALSE', 'False', '0', 'no', 'NO', 'off', 'OFF'];

      for (const val of [...trueValues, ...falseValues]) {
        const result = await validationService.validateField(val, field);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid boolean values', async () => {
      const field = createTestField('boolean');

      const invalidValues = ['maybe', '2', 'yes_no', 'true_false', 'null'];

      for (const val of invalidValues) {
        const result = await validationService.validateField(val, field);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('Email Validation', () => {
    it('should validate standard email formats', async () => {
      const field = createTestField('string');

      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.org',
        'user_name@sub.domain.com',
        '123@example.com'
      ];

      for (const email of validEmails) {
        const isValid = validationService.validateEmail(email);
        expect(isValid).toBe(true);
      }
    });

    it('should reject invalid email formats', async () => {
      const field = createTestField('string');

      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user..user@example.com',
        'user@.com',
        'user@com'
      ];

      for (const email of invalidEmails) {
        const isValid = validationService.validateEmail(email);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Port Validation', () => {
    it('should validate port numbers', async () => {
      const field = createTestField('number');

      const validPorts = ['80', '443', '3000', '8080', '1', '65535'];

      for (const port of validPorts) {
        const isValid = validationService.validatePort(port);
        expect(isValid).toBe(true);
      }
    });

    it('should reject invalid port numbers', async () => {
      const field = createTestField('number');

      const invalidPorts = ['0', '65536', '70000', '-1', 'abc', '80.5'];

      for (const port of invalidPorts) {
        const isValid = validationService.validatePort(port);
        expect(isValid).toBe(false);
      }
    });

    it('should validate ports with allow parameter', async () => {
      // The implementation only supports allowWellKnown as a boolean
      expect(validationService.validatePort('80', true)).toBe(true);
      expect(validationService.validatePort('443', true)).toBe(true);
      expect(validationService.validatePort('3000', false)).toBe(true); // Valid port range
      expect(validationService.validatePort('0', false)).toBe(false); // Invalid port
    });
  });

  describe('Plugin System', () => {
    it('should register and use custom validators', async () => {
      const customValidator: ValidatorPlugin = {
        name: 'ends_with_test',
        description: 'Validates that the value ends with _test',
        handle: (_services: ServiceContainer, _field: TemplateField) => ({
          validate: (value: string) => value.endsWith('_test') ? true : 'Value must end with _test',
        })
      };

      validationService.registerValidator(customValidator);
      
      const field = createTestField('string', { validate: 'ends_with_test' });
      
      const validResult = await validationService.validateField('my_test', field);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = await validationService.validateField('my_value', field);
      expect(invalidResult.valid).toBe(false);
    });

    it('should handle async custom validators', async () => {
      const asyncValidator: ValidatorPlugin = {
        name: 'async_test',
        description: 'An async validator that checks string length',
        handle: (_services: ServiceContainer, _field: TemplateField) => ({
          validate: async (value: string) => {
            return new Promise(resolve => {
              setTimeout(() => resolve(value.length > 5 ? true : 'Value must be longer than 5 characters'), 10);
            });
          }
        })
      };

      validationService.registerValidator(asyncValidator);
      
      const field = createTestField('string', { validate: 'async_test' });
      
      const validResult = await validationService.validateField('long_enough', field);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = await validationService.validateField('short', field);
      expect(invalidResult.valid).toBe(false);
    });

    it('should unregister validators', () => {
      const customValidator: ValidatorPlugin = {
        name: 'temp_validator',
        description: 'A temporary validator for testing',
        handle: (_services: ServiceContainer, _field: TemplateField) => ({
          validate: () => true
        })
      };

      validationService.registerValidator(customValidator);
      expect(validationService.getRegisteredValidators().some(v => v.name === 'temp_validator')).toBe(true);
      
      validationService.unregisterValidator('temp_validator');
      expect(validationService.getRegisteredValidators().some(v => v.name === 'temp_validator')).toBe(false);
    });

    it('should handle validator errors gracefully', async () => {
      const faultyValidator: ValidatorPlugin = {
        name: 'faulty',
        description: 'A validator that throws an error',
        handle: (_services: ServiceContainer, _field: TemplateField) => ({
          validate: () => {
            throw new Error('Validator error');
          }
        })
      };

      validationService.registerValidator(faultyValidator);
      
      const field = createTestField('string', { validate: 'faulty' });
      
      const result = await validationService.validateField('test', field);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Validator error');
    });

    it('should get all registered validators', () => {
      const validators = validationService.getRegisteredValidators();
      expect(validators.length).toBeGreaterThan(8); // At least the default validators
      
      const validatorNames = validators.map(v => v.name);
      expect(validatorNames).toContain('url');
      expect(validatorNames).toContain('number');
      expect(validatorNames).toContain('string');
      expect(validatorNames).toContain('boolean');
      expect(validatorNames).toContain('email');
      expect(validatorNames).toContain('port');
    });
  });

  describe('Field Type Validation', () => {
    it('should validate different field types correctly', async () => {
      const stringField = createTestField('string');
      const numberField = createTestField('number');
      const booleanField = createTestField('boolean');

      // String field should accept text
      expect((await validationService.validateField('hello', stringField)).valid).toBe(true);
      
      // Number field should accept numbers
      expect((await validationService.validateField('123', numberField)).valid).toBe(true);
      
      // Boolean field should accept boolean values
      expect((await validationService.validateField('true', booleanField)).valid).toBe(true);
    });

    it('should handle unknown field types gracefully', async () => {
      const unknownField = createTestField('unknown_type');
      
      const result = await validationService.validateField('test', unknownField);
      expect(result.valid).toBe(true); // Should default to allowing the value
    });
  });

  describe('Validation Results', () => {
    it('should provide detailed validation results', async () => {
      const field = createTestField('number', { min: 10, max: 100 });
      
      const result = await validationService.validateField('5', field);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
    });

    it('should accumulate multiple validation errors', async () => {
      const field = createTestField('string', { 
        min_length: 10, 
        max_length: 5  // Impossible constraint
      });
      
      const result = await validationService.validateField('test', field);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large validation loads efficiently', async () => {
      const field = createTestField('string');
      
      const start = performance.now();
      
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(validationService.validateField(`test_${i}`, field));
      }
      
      await Promise.all(promises);
      
      const end = performance.now();
      expect(end - start).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle complex validation rules efficiently', async () => {
      const field = createTestField('string', {
        min_length: 5,
        max_length: 100,
        pattern: '^[a-zA-Z0-9_-]+$',
        validate: 'string'
      });
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await validationService.validateField(`valid_test_string_${i}`, field);
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Should complete quickly
    });
  });
});
