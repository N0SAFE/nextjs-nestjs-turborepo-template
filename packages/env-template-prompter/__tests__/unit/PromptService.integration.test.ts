import { describe, it, expect, beforeEach } from 'vitest';
import type { TemplateField, PromptContext } from '../../src/types/index.js';
import { PromptService } from '../../src/services/PromptService.js';
import { ValidationService } from '../../src/services/ValidationService.js';
import { TransformerService } from '../../src/services/TransformerService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import { TemplateParserService } from '../../src/services/TemplateParserService.js';

describe('Global Variables Integration Test', () => {
  let promptService: PromptService;
  let validationService: ValidationService;
  let transformerService: TransformerService;
  let configService: ConfigService;
  let templateParserService: TemplateParserService;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: false, interactive: false });
    validationService = new ValidationService(configService);
    transformerService = new TransformerService(configService);
    templateParserService = new TemplateParserService(configService, validationService);
    promptService = new PromptService(validationService, transformerService, configService);
  });

  it('should handle actual .env.template example with $index and computed expressions', async () => {
    // Test the exact field from .env.template:
    // NEXT_PUBLIC_API_URL={{url|group=api|protocol=http,https|label=API URL|description=URL where the Directus API will be accessible|default=http://localhost:${8055 + $index * 10}}}
    
    const field: TemplateField = {
      rawLine: 'NEXT_PUBLIC_API_URL',
      key: 'NEXT_PUBLIC_API_URL',
      type: 'url',
      lineNumber: 8,
      options: {
        group: 'api',
        protocol: 'http,https',
        label: 'API URL',
        description: 'URL where the Directus API will be accessible',
        default: 'http://localhost:${8055 + $index * 10}'
      }
    };

    // Test with different processing indexes
    const contexts = [
      { index: 0, expected: 'http://localhost:8055' },
      { index: 1, expected: 'http://localhost:8065' },
      { index: 2, expected: 'http://localhost:8075' },
      { index: 5, expected: 'http://localhost:8105' }
    ];

    for (const { index, expected } of contexts) {
      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: false,
        globalVars: {
          index,
          iterCounters: new Map()
        }
      };

      const result = await promptService.evaluateTemplateExpression(
        field.options.default as string,
        field,
        context
      );

      expect(result).toBe(expected);
    }
  });

  it('should handle $iter.namespace usage correctly', async () => {
    // Test a realistic scenario with multiple API endpoints
    const fields: TemplateField[] = [
      {
        rawLine: 'API_URL_1',
        key: 'API_URL_1',
        type: 'url',
        options: { default: 'http://api${$iter.service}.example.com:${8080 + $iter.service * 10}' },
        lineNumber: 1
      },
      {
        rawLine: 'API_URL_2',
        key: 'API_URL_2', 
        type: 'url',
        options: { default: 'http://api${$iter.service}.example.com:${8080 + $iter.service * 10}' },
        lineNumber: 2
      },
      {
        rawLine: 'WEB_URL_1',
        key: 'WEB_URL_1',
        type: 'url', 
        options: { default: 'http://web${$iter.frontend}.example.com:${3000 + $iter.frontend * 10}' },
        lineNumber: 3
      },
      {
        rawLine: 'WEB_URL_2',
        key: 'WEB_URL_2',
        type: 'url',
        options: { default: 'http://web${$iter.frontend}.example.com:${3000 + $iter.frontend * 10}' },
        lineNumber: 4
      }
    ];

    const context: PromptContext = {
      existingValues: new Map(),
      skipExisting: false,
      interactive: false,
      globalVars: {
        index: 0,
        iterCounters: new Map()
      }
    };

    const results: string[] = [];
    for (const field of fields) {
      const result = await promptService.evaluateTemplateExpression(
        field.options.default as string,
        field,
        context
      );
      results.push(result);
    }

    expect(results).toEqual([
      'http://api0.example.com:8080',  // $iter.service starts at 0
      'http://api1.example.com:8090',  // $iter.service increments to 1  
      'http://web0.example.com:3000',  // $iter.frontend starts at 0
      'http://web1.example.com:3010'   // $iter.frontend increments to 1
    ]);
  });

  it('should preserve JavaScript expression semantics correctly', async () => {
    const testCases = [
      // String concatenation vs numeric addition
      { expr: '${\"test\" + 1}', expected: 'test1' },
      { expr: '${1 + 2}', expected: '3' },
      { expr: '${\"port-\" + (3000 + 1)}', expected: 'port-3001' },
      
      // Complex expressions with order of operations
      { expr: '${8055 + 2 * 10 + 5}', expected: '8080' },
      { expr: '${(8055 + 2) * 10}', expected: '80570' },
      
      // Mixed string and numeric
      { expr: 'prefix-${8055 + 10}-suffix', expected: 'prefix-8065-suffix' }
    ];

    const field: TemplateField = {
      rawLine: 'TEST_FIELD',
      key: 'TEST_FIELD',
      type: 'string',
      lineNumber: 1,
      options: {}
    };

    const context: PromptContext = {
      existingValues: new Map(),
      skipExisting: false,
      interactive: false,
      globalVars: {
        index: 0,
        iterCounters: new Map()
      }
    };

    for (const { expr, expected } of testCases) {
      const result = await promptService.evaluateTemplateExpression(expr, field, context);
      expect(result).toBe(expected);
    }
  });
});