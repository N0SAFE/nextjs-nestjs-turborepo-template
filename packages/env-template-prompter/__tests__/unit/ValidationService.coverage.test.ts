import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../src/services/ValidationService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import type { TemplateField, ServiceContainer } from '../../src/types/index.js';

describe('ValidationService - Coverage Tests', () => {
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
    type: type as any,
    options,
    rawLine: '',
    lineNumber: 1
  });

  describe('Comprehensive Field Type Coverage', () => {
    it('should handle all supported field types via plugins', async () => {
      const fieldTypes = [
        { type: 'url', value: 'https://example.com', shouldBeValid: true },
        { type: 'number', value: '42', shouldBeValid: true },
        { type: 'string', value: 'hello', shouldBeValid: true },
        { type: 'date', value: '2023-01-01', shouldBeValid: true },
        { type: 'boolean', value: 'true', shouldBeValid: true },
        { type: 'email', value: 'test@example.com', shouldBeValid: true },
        { type: 'port', value: '8080', shouldBeValid: true },
        { type: 'json', value: '{"key": "value"}', shouldBeValid: true },
        { type: 'path', value: '/usr/local/bin', shouldBeValid: true },
      ];

      for (const { type, value, shouldBeValid } of fieldTypes) {
        const field = createTestField(type);
        const result = await validationService.validateField(value, field);
        expect(result.valid).toBe(shouldBeValid);
        expect(result.errors).toEqual(shouldBeValid ? [] : expect.arrayContaining([expect.any(String)]));
      }
    });

    it('should handle invalid values for all field types', async () => {
      const invalidCases = [
        { type: 'url', value: 'not-a-url' },
        { type: 'number', value: 'not-a-number' },
        { type: 'date', value: 'not-a-date' },
        { type: 'boolean', value: 'maybe' },
        { type: 'email', value: 'not-an-email' },
        { type: 'port', value: 'not-a-port' },
        { type: 'json', value: 'not-json' },
        { type: 'path', value: 'path<with>invalid*chars' },
      ];

      for (const { type, value } of invalidCases) {
        const field = createTestField(type);
        const result = await validationService.validateField(value, field);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should use init.js compatible validators with proper error messages', async () => {
      // Test URL with specific constraints
      const urlField = createTestField('url', { protocol: 'https', hostname: 'example.com' });
      const urlResult = await validationService.validateField('http://other.com', urlField);
      expect(urlResult.valid).toBe(false);
      expect(urlResult.errors[0]).toContain('Protocol must be one of: https');

      // Test number with constraints
      const numberField = createTestField('number', { min: 10, max: 100 });
      const numberResult = await validationService.validateField('5', numberField);
      expect(numberResult.valid).toBe(false);
      expect(numberResult.errors[0]).toContain('Must be at least 10');

      // Test string with constraints
      const stringField = createTestField('string', { minLength: 5 });
      const stringResult = await validationService.validateField('hi', stringField);
      expect(stringResult.valid).toBe(false);
      expect(stringResult.errors[0]).toContain('Must be at least 5 characters');
    });

    it('should handle optional fields correctly', async () => {
      const optionalStringField = createTestField('string', { optional: true });
      const result = await validationService.validateField('', optionalStringField);
      expect(result.valid).toBe(true);

      const optionalDateField = createTestField('date', { optional: true });
      const dateResult = await validationService.validateField('', optionalDateField);
      expect(dateResult.valid).toBe(true);
    });

    it('should handle field options parameter mapping', async () => {
      // Test that field options are properly converted to plugin parameters
      const field = createTestField('number', { 
        min: 10, 
        max: 100, 
        allow: '80,443',
        customParam: 'customValue'
      });
      
      // Should pass because 80 is in allow list (overrides min constraint)
      const result = await validationService.validateField('80', field);
      expect(result.valid).toBe(true);
    });

    it('should handle unknown field types gracefully', async () => {
      const unknownField = createTestField('unknown_type');
      const result = await validationService.validateField('any value', unknownField);
      expect(result.valid).toBe(true); // Should not error
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Unknown field type: unknown_type');
    });

    it('should handle custom validation rules in addition to plugins', async () => {
      const field = createTestField('string', { min_length: '5', pattern: '^[a-z]+$' });
      
      // Valid case
      const validResult = await validationService.validateField('hello', field);
      expect(validResult.valid).toBe(true);
      
      // Too short
      const shortResult = await validationService.validateField('hi', field);
      expect(shortResult.valid).toBe(false);
      
      // Wrong pattern
      const patternResult = await validationService.validateField('Hello', field);
      expect(patternResult.valid).toBe(false);
    });

    it('should handle plugin validation errors gracefully', async () => {
      // Register a plugin that throws an error
      validationService.registerValidator({
        name: 'error_plugin',
        description: 'A plugin that always fails',
        handle: (_services, _field) => ({
          validate: () => {
            throw new Error('Plugin error');
          },
          transform: (value: string) => value,
          transformPrompt: (promptOptions, _field) => promptOptions
        }),
      });

      const field = createTestField('error_plugin');
      const result = await validationService.validateField('any value', field);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Validator error');
    });

    it('should handle fallback to hardcoded validation when no plugin exists', async () => {
      // Boolean type doesn't have an init.js plugin, should use hardcoded validation
      const booleanField = createTestField('boolean');
      
      const validResult = await validationService.validateField('true', booleanField);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = await validationService.validateField('maybe', booleanField);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toContain('Invalid boolean value');
    });
  });

  describe('Plugin Management', () => {
    it('should register and list all default plugins correctly', () => {
      const validators = validationService.getRegisteredValidators();
      expect(validators.length).toBeGreaterThan(0);
      
      const validatorNames = validators.map(v => v.name);
      expect(validatorNames).toContain('init_js_url');
      expect(validatorNames).toContain('init_js_number');
      expect(validatorNames).toContain('init_js_string');
      expect(validatorNames).toContain('init_js_date');
      expect(validatorNames).toContain('boolean');
      expect(validatorNames).toContain('email');
      expect(validatorNames).toContain('port');
    });

    it('should handle plugin registration and unregistration', () => {
      const initialCount = validationService.getRegisteredValidators().length;
      
      // Register a custom plugin
      validationService.registerValidator({
        name: 'test_custom',
        description: 'A test custom validator',
        handle: (_services, _field) => ({
          validate: (value: string) => value === 'test' ? true : 'Must be "test"',
          transform: (value: string) => value.toUpperCase(),
          transformPrompt: (promptOptions, _field) => ({
            ...promptOptions,
            message: promptOptions.message || 'Enter a test value'
          })
        }),
      });
      
      expect(validationService.getRegisteredValidators().length).toBe(initialCount + 1);
      
      // Unregister the plugin
      validationService.unregisterValidator('test_custom');
      expect(validationService.getRegisteredValidators().length).toBe(initialCount);
    });

    it('should prioritize init.js compatible validators over default ones', async () => {
      // URL validation should use init_js_url plugin which allows any protocol
      const field = createTestField('url');
      const result = await validationService.validateField('ftp://example.com', field);
      expect(result.valid).toBe(true); // init_js_url allows any protocol by default
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain exact same behavior as before for common cases', async () => {
      // These test cases should behave exactly as they did before plugin refactor
      const testCases = [
        { type: 'string', value: 'hello', options: {}, shouldBeValid: true },
        { type: 'number', value: '42', options: {}, shouldBeValid: true },
        { type: 'number', value: 'abc', options: {}, shouldBeValid: false },
        { type: 'boolean', value: 'true', options: {}, shouldBeValid: true },
        { type: 'boolean', value: 'false', options: {}, shouldBeValid: true },
        { type: 'boolean', value: 'yes', options: {}, shouldBeValid: true },
        { type: 'boolean', value: 'no', options: {}, shouldBeValid: true },
        { type: 'boolean', value: 'maybe', options: {}, shouldBeValid: false },
      ];

      for (const { type, value, options, shouldBeValid } of testCases) {
        const field = createTestField(type, options);
        const result = await validationService.validateField(value, field);
        expect(result.valid).toBe(shouldBeValid);
      }
    });

    it('should handle all existing field option patterns', async () => {
      // Test patterns that existing tests might use
      const stringField = createTestField('string', { 
        min_length: 3, 
        max_length: 10, 
        pattern: '^[a-z]+$' 
      });
      
      expect((await validationService.validateField('hello', stringField)).valid).toBe(true);
      expect((await validationService.validateField('hi', stringField)).valid).toBe(false);
      expect((await validationService.validateField('Hello', stringField)).valid).toBe(false);
      expect((await validationService.validateField('verylongstring', stringField)).valid).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed field options gracefully', async () => {
      const field = createTestField('number', { 
        min: 'not-a-number', 
        max: 'also-not-a-number' 
      });
      
      // Should not throw, but might not validate constraints properly
      const result = await validationService.validateField('50', field);
      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('should handle very long input values', async () => {
      const longValue = 'a'.repeat(10000);
      const field = createTestField('string');
      
      const result = await validationService.validateField(longValue, field);
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('should handle unicode and special characters', async () => {
      const unicodeField = createTestField('string');
      const unicodeValue = '🌟 Unicode test with émojis and àccénts 你好';
      
      const result = await validationService.validateField(unicodeValue, unicodeField);
      expect(result.valid).toBe(true);
    });

    it('should handle null and undefined field options', async () => {
      const field: TemplateField = {
        key: 'TEST',
        type: 'string',
        options: null as any,
        rawLine: '',
        lineNumber: 1
      };
      
      const result = await validationService.validateField('test', field);
      expect(result).toBeDefined();
    });
  });
});