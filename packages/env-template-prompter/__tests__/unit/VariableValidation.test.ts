import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../src/services/ValidationService.js';
import { TransformerService } from '../../src/services/TransformerService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import { TemplateParserService } from '../../src/services/TemplateParserService.js';
import { GroupingService } from '../../src/services/GroupingService.js';
import { PromptService } from '../../src/services/PromptService.js';
import { OutputService } from '../../src/services/OutputService.js';
import type { TemplateField, ServiceContainer, TransformContext } from '../../src/types/index.js';

describe('Variable Validation and Transformation', () => {
  let validationService: ValidationService;
  let transformerService: TransformerService;
  let configService: ConfigService;
  let serviceContainer: ServiceContainer;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: false });
    validationService = new ValidationService(configService);
    transformerService = new TransformerService(configService);
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
    transformerService.setValidationService(validationService);
  });

  it('should validate and transform variable references', async () => {
    // Create a source field that will be referenced
    const sourceField: TemplateField = {
      key: 'API_URL',
      type: 'url',
      options: { protocol: 'https' },
      rawLine: 'API_URL={{url|protocol=https}}',
      lineNumber: 1
    };

    // Test variable validation
    const result = await validationService.validateVariable(
      'API_URL',
      'https://example.com',
      sourceField,
      {
        sourceValue: 'https://example.com',
        allValues: new Map([['API_URL', 'https://example.com']]),
        field: sourceField,
        templateFields: [sourceField],
        isVariableValue: true
      }
    );

    expect(result.valid).toBe(true);
    expect(result.value).toBe('https://example.com');
    expect(result.errors).toHaveLength(0);
    expect(result.wasTransformed).toBe(false); // No transformer specified
  });

  it('should validate and transform variable with transformer', async () => {
    // Create a source field with transformer
    const sourceField: TemplateField = {
      key: 'API_URL',
      type: 'url',
      options: { 
        protocol: 'https',
        transformer: 'extract_hostname'
      },
      rawLine: 'API_URL={{url|protocol=https|transformer=extract_hostname}}',
      lineNumber: 1
    };

    // Test variable validation with transformation
    const result = await validationService.validateVariable(
      'API_URL',
      'https://example.com:8080/path',
      sourceField,
      {
        sourceValue: 'https://example.com:8080/path',
        allValues: new Map([['API_URL', 'https://example.com:8080/path']]),
        field: sourceField,
        templateFields: [sourceField],
        isVariableValue: true
      }
    );

    expect(result.valid).toBe(true);
    expect(result.value).toBe('example.com'); // Transformed to hostname
    expect(result.errors).toHaveLength(0);
    expect(result.wasTransformed).toBe(true);
  });

  it('should handle invalid variable values', async () => {
    const sourceField: TemplateField = {
      key: 'API_URL',
      type: 'url',
      options: { protocol: 'https' },
      rawLine: 'API_URL={{url|protocol=https}}',
      lineNumber: 1
    };

    const result = await validationService.validateVariable(
      'API_URL',
      'not-a-url',
      sourceField,
      {
        sourceValue: 'not-a-url',
        allValues: new Map([['API_URL', 'not-a-url']]),
        field: sourceField,
        templateFields: [sourceField],
        isVariableValue: true
      }
    );

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Variable API_URL');
  });

  it('should resolve variable references with validation', async () => {
    const sourceField: TemplateField = {
      key: 'API_URL',
      type: 'url',
      options: {},
      rawLine: 'API_URL={{url}}',
      lineNumber: 1
    };

    const targetField: TemplateField = {
      key: 'HOSTNAME',
      type: 'string',
      options: { 
        source: '@{API_URL}',
        transformer: 'extract_hostname'
      },
      rawLine: 'HOSTNAME={{string|source=@{API_URL}|transformer=extract_hostname}}',
      lineNumber: 2
    };

    const context: TransformContext = {
      sourceValue: '',
      allValues: new Map([['API_URL', 'https://example.com:8080/path']]),
      field: targetField,
      templateFields: [sourceField, targetField],
      isVariableValue: true
    };

    const result = await transformerService.resolveSourceValue(targetField, context);
    expect(result).toBe('https://example.com:8080/path'); // Should return the validated variable value
  });

  it('should validate placeholder variables', async () => {
    const sourceField: TemplateField = {
      key: 'API_URL',
      type: 'url',
      options: {},
      rawLine: 'API_URL={{url}}',
      lineNumber: 1
    };

    const context: TransformContext = {
      sourceValue: '',
      allValues: new Map([['API_URL', 'https://example.com']]),
      field: sourceField,
      templateFields: [sourceField],
      isVariableValue: true
    };

    const result = await transformerService.resolvePlaceholders(
      'The API is available at @{API_URL}',
      context
    );

    expect(result).toBe('The API is available at https://example.com');
  });
});