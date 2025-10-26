import { describe, it, expect, beforeEach } from 'vitest';
import {
  initJsUrlValidator,
  initJsNumberValidator,
  initJsStringValidator,
  initJsDateValidator
} from '../../src/plugins/validators/initJsCompatValidators.js';
import type { ServiceContainer, TemplateField, ValidatorPlugin } from '../../src/types/index.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import { ValidationService } from '../../src/services/ValidationService.js';
import { TransformerService } from '../../src/services/TransformerService.js';
import { TemplateParserService } from '../../src/services/TemplateParserService.js';
import { GroupingService } from '../../src/services/GroupingService.js';
import { PromptService } from '../../src/services/PromptService.js';
import { OutputService } from '../../src/services/OutputService.js';

// Helper function to create validator function from new plugin interface
function createValidatorFunction(plugin: ValidatorPlugin, fieldType: string = 'string') {
  const mockConfigService = new ConfigService({ debugMode: false });
  const mockValidationService = new ValidationService(mockConfigService);
  const mockTransformerService = new TransformerService(mockConfigService);
  const mockTemplateParserService = new TemplateParserService(mockConfigService, mockValidationService);
  const mockGroupingService = new GroupingService(mockConfigService);
  const mockPromptService = new PromptService(mockValidationService, mockTransformerService, mockConfigService);
  const mockOutputService = new OutputService(mockConfigService);

  const mockServices: ServiceContainer = {
    configService: mockConfigService,
    validationService: mockValidationService,
    transformerService: mockTransformerService,
    templateParserService: mockTemplateParserService,
    groupingService: mockGroupingService,
    promptService: mockPromptService,
    outputService: mockOutputService
  };

  const mockField: TemplateField = {
    key: 'testField',
    type: fieldType,
    options: {},
    rawLine: '',
    lineNumber: 1
  };

  const handlers = plugin.handle(mockServices, mockField);
  return handlers.validate;
}

describe('Init.js Compatible Validators', () => {
  describe('initJsUrlValidator', () => {
    const validate = createValidatorFunction(initJsUrlValidator, 'url');

    it('should validate basic URLs', async () => {
      expect(await validate('https://example.com', {})).toBe(true);
      expect(await validate('http://localhost:3000', {})).toBe(true);
      expect(await validate('ftp://ftp.example.com', {})).toBe(true);
    });

    it('should reject empty URLs', async () => {
      expect(await validate('', {})).toBe('URL is required');
    });

    it('should reject malformed URLs', async () => {
      expect(await validate('not-a-url', {})).toBe('Invalid URL format');
      expect(await validate('http://', {})).toBe('Invalid URL format');
    });

    it('should validate protocol constraints', async () => {
      const params = { protocol: 'https' };
      expect(await validate('https://example.com', params)).toBe(true);
      expect(await validate('http://example.com', params)).toBe('Protocol must be one of: https');
    });

    it('should validate hostname constraints', async () => {
      const params = { hostname: 'localhost,example.com' };
      expect(await validate('https://localhost', params)).toBe(true);
      expect(await validate('https://example.com', params)).toBe(true);
      expect(await validate('https://other.com', params)).toBe('Hostname must be one of: localhost,example.com');
    });

    it('should validate port constraints', async () => {
      const params = { port: '3000' };
      expect(await validate('https://example.com:3000', params)).toBe(true);
      expect(await validate('https://example.com:8080', params)).toBe('Port must be one of: 3000');
    });

  });

  describe('initJsNumberValidator', () => {
    const validate = createValidatorFunction(initJsNumberValidator, 'number');
    it('should validate basic numbers', async () => {
      expect(await validate('42', {})).toBe(true);
      expect(await validate('3.14', {})).toBe(true);
      expect(await validate('-10', {})).toBe(true);
    });

    it('should reject non-numbers', async () => {
      expect(await validate('not-a-number', {})).toBe('Must be a valid number');
      expect(await validate('', {})).toBe('Must be a valid number');
    });

    it('should validate allow list first', async () => {
      const params = { allow: '80,443,8080', min: '1000' };
      expect(await validate('80', params)).toBe(true); // In allow list
      expect(await validate('500', params)).toBe('Must be at least 1000 or one of: 80,443,8080'); // Not in allow list and below min
    });

    it('should validate min/max constraints', async () => {
      const params = { min: '10', max: '100' };
      expect(await validate('50', params)).toBe(true);
      expect(await validate('5', params)).toBe('Must be at least 10');
      expect(await validate('150', params)).toBe('Must be at most 100');
    });
  });

  describe('initJsStringValidator', () => {
    const validate = createValidatorFunction(initJsStringValidator, 'string');

    it('should validate required strings', async () => {
      expect(await validate('hello', {})).toBe(true);
    });

    it('should allow empty optional strings', async () => {
      const params = { optional: 'true' };
      expect(await validate('', params)).toBe(true);
    });

    it('should validate length constraints', async () => {
      const params = { minLength: '3', maxLength: '10' };
      expect(await validate('hello', params)).toBe(true);
      expect(await validate('hi', params)).toBe('Must be at least 3 characters');
      expect(await validate('this is too long', params)).toBe('Must be at most 10 characters');
    });

    it('should validate pattern constraints', async () => {
      const params = { pattern: '^[a-z]+$' };
      expect(await validate('hello', params)).toBe(true);
      expect(await validate('Hello', params)).toBe('Must match pattern: ^[a-z]+$');
    });
  });

  describe('initJsDateValidator', () => {
    const validate = createValidatorFunction(initJsDateValidator, 'date');

    it('should validate valid dates', async () => {
      expect(await validate('2023-01-01', {})).toBe(true);
      expect(await validate('2023-12-31T23:59:59Z', {})).toBe(true);
    });

    it('should reject invalid dates', async () => {
      expect(await validate('not-a-date', {})).toBe('Invalid date format');
      expect(await validate('2023-13-01', {})).toBe('Invalid date format');
    });

    it('should allow empty optional dates', async () => {
      const params = { optional: 'true' };
      expect(await validate('', params)).toBe(true);
    });

    it('should validate date range constraints', async () => {
      const params = { minDate: '2023-01-01', maxDate: '2023-12-31' };
      expect(await validate('2023-06-15', params)).toBe(true);
      expect(await validate('2022-12-31', params)).toBe('Date must be after 2023-01-01');
      expect(await validate('2024-01-01', params)).toBe('Date must be before 2023-12-31');
    });
  });
});