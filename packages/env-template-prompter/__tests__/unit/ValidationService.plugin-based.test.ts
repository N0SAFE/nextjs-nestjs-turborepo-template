import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../src/services/ValidationService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import { TransformerService } from '../../src/services/TransformerService.js';
import { TemplateParserService } from '../../src/services/TemplateParserService.js';
import { GroupingService } from '../../src/services/GroupingService.js';
import { PromptService } from '../../src/services/PromptService.js';
import { OutputService } from '../../src/services/OutputService.js';
import type { TemplateField, ServiceContainer } from '../../src/types/index.js';

describe('ValidationService - Plugin-based Validation', () => {
  let validationService: ValidationService;
  let configService: ConfigService;
  let serviceContainer: ServiceContainer;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: false });
    validationService = new ValidationService(configService);
    const transformerService = new TransformerService(configService);
    const templateParserService = new TemplateParserService(configService, validationService);
    const groupingService = new GroupingService(configService);
    const promptService = new PromptService(validationService, transformerService, configService);
    const outputService = new OutputService(configService);

    serviceContainer = {
      configService,
      validationService,
      transformerService,
      templateParserService,
      groupingService,
      promptService,
      outputService
    };

    // Set cross-service references
    validationService.setServiceContainer(serviceContainer);
  });

  const createTestField = (type: string, options: Record<string, unknown> = {}): TemplateField => ({
    key: 'TEST_FIELD',
    type: type as any,
    options,
    rawLine: '',
    lineNumber: 1
  });

  describe('Plugin Integration', () => {
    it('should use init.js URL validator for URL fields', async () => {
      const field = createTestField('url');
      
      // Valid URL
      const validResult = await validationService.validateField('https://example.com', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid URL
      const invalidResult = await validationService.validateField('not-a-url', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Invalid URL format');
    });

    it('should use init.js number validator for number fields', async () => {
      const field = createTestField('number');
      
      // Valid number
      const validResult = await validationService.validateField('42', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid number
      const invalidResult = await validationService.validateField('not-a-number', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Must be a valid number');
    });

    it('should use init.js string validator for string fields', async () => {
      const field = createTestField('string');
      
      // Valid string
      const validResult = await validationService.validateField('hello', field);
      expect(validResult.valid).toBe(true);
    });

    it('should use init.js date validator for date fields', async () => {
      const field = createTestField('date');
      
      // Valid date
      const validResult = await validationService.validateField('2023-01-01', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid date
      const invalidResult = await validationService.validateField('not-a-date', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Invalid date format');
    });

    it('should pass field options as plugin parameters', async () => {
      const field = createTestField('url', { protocol: 'https', hostname: 'example.com' });
      
      // Valid URL matching constraints
      const validResult = await validationService.validateField('https://example.com', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid protocol
      const invalidProtocolResult = await validationService.validateField('http://example.com', field);
      expect(invalidProtocolResult.valid).toBe(false);
      expect(invalidProtocolResult.errors[0]).toBe('Protocol must be one of: https');
      
      // Invalid hostname
      const invalidHostnameResult = await validationService.validateField('https://other.com', field);
      expect(invalidHostnameResult.valid).toBe(false);
      expect(invalidHostnameResult.errors[0]).toBe('Hostname must be one of: example.com');
    });

    it('should handle number field constraints', async () => {
      const field = createTestField('number', { min: 10, max: 100, allow: '80,443' });
      
      // Valid number in range
      const validResult = await validationService.validateField('50', field);
      expect(validResult.valid).toBe(true);
      
      // Valid number in allow list (overrides range)
      const allowedResult = await validationService.validateField('80', field);
      expect(allowedResult.valid).toBe(true);
      
      // Invalid - below min and not in allow list
      const belowMinResult = await validationService.validateField('5', field);
      expect(belowMinResult.valid).toBe(false);
      expect(belowMinResult.errors[0]).toBe('Must be at least 10 or one of: 80,443');
    });

    it('should handle string field constraints', async () => {
      const field = createTestField('string', { minLength: 3, maxLength: 10, pattern: '^[a-z]+$' });
      
      // Valid string
      const validResult = await validationService.validateField('hello', field);
      expect(validResult.valid).toBe(true);
      
      // Too short
      const tooShortResult = await validationService.validateField('hi', field);
      expect(tooShortResult.valid).toBe(false);
      expect(tooShortResult.errors[0]).toBe('Must be at least 3 characters');
      
      // Pattern mismatch
      const patternResult = await validationService.validateField('Hello', field);
      expect(patternResult.valid).toBe(false);
      expect(patternResult.errors[0]).toBe('Must match pattern: ^[a-z]+$');
    });

    it('should handle optional string fields correctly', async () => {
      const field = createTestField('string', { optional: true });
      
      // Empty optional string should be valid
      const emptyResult = await validationService.validateField('', field);
      expect(emptyResult.valid).toBe(true);
      
      // Non-empty should also be valid
      const nonEmptyResult = await validationService.validateField('hello', field);
      expect(nonEmptyResult.valid).toBe(true);
    });

    it('should fallback to hardcoded validation for unsupported types', async () => {
      const field = createTestField('boolean');
      
      // Valid boolean
      const validResult = await validationService.validateField('true', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid boolean
      const invalidResult = await validationService.validateField('maybe', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toContain('Invalid boolean value');
    });

    it('should handle custom validation rules', async () => {
      const field = createTestField('string', { minLength: '5' });
      
      // Valid - meets custom rule
      const validResult = await validationService.validateField('hello world', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid - fails custom rule
      const invalidResult = await validationService.validateField('hi', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Must be at least 5 characters');
    });

    it('should handle unknown field types with warnings', async () => {
      const field = createTestField('unknown_type');
      
      const result = await validationService.validateField('any value', field);
      expect(result.valid).toBe(true); // No errors, but should have warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Unknown field type: unknown_type');
    });
  });

  describe('Plugin Registration', () => {
    it('should register and use custom validators', async () => {
      // Register a custom validator using new interface
      validationService.registerValidator({
        name: 'custom_test',
        description: 'A custom test validator',
        handle: (_services: ServiceContainer, field: TemplateField) => ({
          validate: (value: string) => {
            return value === 'expected' ? true : `Expected 'expected', got '${value}'`;
          },
          transformPrompt: (promptOptions: any, field: TemplateField) => ({
            ...promptOptions,
            type: 'text',
            message: 'Enter "expected"'
          }),
          transform: (value: string): string => value.trim()
        })
      });

      const field = createTestField('custom_test');
      
      // Valid
      const validResult = await validationService.validateField('expected', field);
      expect(validResult.valid).toBe(true);
      
      // Invalid
      const invalidResult = await validationService.validateField('unexpected', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe("Expected 'expected', got 'unexpected'");
    });

    it('should list all registered validators', () => {
      const validators = validationService.getRegisteredValidators();
      expect(validators.length).toBeGreaterThan(0);
      
      // Should include init.js compatible validators
      const validatorNames = validators.map(v => v.name);
      expect(validatorNames).toContain('init_js_url');
      expect(validatorNames).toContain('init_js_number');
      expect(validatorNames).toContain('init_js_string');
      expect(validatorNames).toContain('init_js_date');
    });

    it('should unregister validators', () => {
      const initialCount = validationService.getRegisteredValidators().length;
      
      validationService.unregisterValidator('init_js_url');
      
      const afterUnregisterCount = validationService.getRegisteredValidators().length;
      expect(afterUnregisterCount).toBe(initialCount - 1);
    });
  });
});