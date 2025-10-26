import { describe, it, expect, beforeEach } from 'vitest';
import { TransformerService } from '../../src/services/TransformerService.js';
import { ValidationService } from '../../src/services/ValidationService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import type { TemplateField, TransformContext } from '../../src/types/index.js';

describe('TransformerService', () => {
  let transformerService: TransformerService;
  let validationService: ValidationService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: true });
    validationService = new ValidationService(configService);
    transformerService = new TransformerService(configService);
  });

  const createTestField = (key: string, transformer: string, source?: string): TemplateField => ({
    key,
    type: 'string',
    options: { 
      transformer,
      ...(source && { source })
    },
    rawLine: `${key}=test_value|transformer=${transformer}${source ? `|source=${source}` : ''}`,
    lineNumber: 1
  });

  const createTestContext = (sourceValue: string, allValues: Record<string, string> = {}, isVariableValue = true): TransformContext => ({
    sourceValue,
    allValues: new Map(Object.entries(allValues)),
    field: createTestField('TEST_FIELD', 'test'),
    templateFields: [],
    isVariableValue
  });

  it('should apply extract_hostname transformer', async () => {
    const field = createTestField('API_URL', 'extract_hostname', 'SOURCE_URL');
    const context = createTestContext('http://localhost:3001/path');
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toBe('localhost');
  });

  it('should apply extract_port transformer', async () => {
    const field = createTestField('API_PORT', 'extract_port', 'SOURCE_URL');
    const context = createTestContext('http://localhost:3001/path');
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toBe('3001');
  });

  it('should apply array_from_csv transformer', async () => {
    const field = createTestField('ALLOWED_ORIGINS', 'array_from_csv', 'CSV_DATA');
    const context = createTestContext('http://localhost:3000,http://localhost:3001');
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toBe('["http://localhost:3000","http://localhost:3001"]');
  });

  it('should apply cors_origins transformer', async () => {
    const field = createTestField('CORS_ORIGINS', 'cors_origins', 'URL_LIST');
    const context = createTestContext(
      'http://localhost:3000',
      {
        NEXT_PUBLIC_WEB_URL: 'http://localhost:3000',
        NEXT_PUBLIC_API_URL: 'http://localhost:3001'
      }
    );
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toContain('=> http://localhost:3000');
    expect(result).toContain('=> http://localhost:3001');
  });

  it('should generate secret with generate_secret transformer', async () => {
    const field = createTestField('SECRET_KEY', 'generate_secret', 'EXISTING_SECRET');
    const context = createTestContext('32');
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toHaveLength(32);
    expect(result).toMatch(/^[A-Fa-f0-9]+$/);
  });

  it('should register custom transformer', async () => {
    const customTransformer = {
      name: 'uppercase',
      transform: async (value: string) => value.toUpperCase()
    };
    
    transformerService.registerTransformer(customTransformer);
    
    const field = createTestField('TEST_FIELD', 'uppercase', 'SOURCE');
    const context = createTestContext('hello world');
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toBe('HELLO WORLD');
  });

  it('should handle unknown transformers gracefully', async () => {
    const field = createTestField('TEST_FIELD', 'unknown_transformer', 'SOURCE');
    const context = createTestContext('test value');
    context.field = field;
    
    await expect(transformerService.applyTransformers(field, context))
      .rejects
      .toThrow('Unknown transformer: unknown_transformer');
  });

  it('should skip transformation for non-variable values without source', async () => {
    const field = createTestField('TEST_FIELD', 'extract_hostname');
    const context = createTestContext('http://localhost:3000', {}, false); // isVariableValue = false
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toBe('http://localhost:3000'); // Should return original value
  });

  it('should return original value when no transformer specified', async () => {
    const field: TemplateField = {
      key: 'TEST_FIELD',
      type: 'string',
      options: {},
      rawLine: 'TEST_FIELD=test_value',
      lineNumber: 1
    };
    const context = createTestContext('test value');
    context.field = field;
    
    const result = await transformerService.applyTransformers(field, context);
    expect(result).toBe('test value');
  });
});
