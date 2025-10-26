import { describe, it, expect, beforeEach } from 'vitest';
import type { TemplateField, PromptContext } from '../../src/types/index.js';
import { PromptService } from '../../src/services/PromptService.js';
import { ValidationService } from '../../src/services/ValidationService.js';
import { TransformerService } from '../../src/services/TransformerService.js';
import { ConfigService } from '../../src/services/ConfigService.js';

describe('PromptService - Global Variables', () => {
  let promptService: PromptService;
  let validationService: ValidationService;
  let transformerService: TransformerService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: false, interactive: false });
    validationService = new ValidationService(configService);
    transformerService = new TransformerService(configService);
    promptService = new PromptService(validationService, transformerService, configService);
  });

  describe('$index global variable', () => {
    it('should use processing index instead of line number', async () => {
      const field: TemplateField = {
        rawLine: 'TEST_PORT',
        key: 'TEST_PORT',
        type: 'number',
        lineNumber: 10, // This should be ignored
        options: {
          default: '${8055 + $index * 10}'
        }
      };

      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: false,
        globalVars: {
          index: 2, // This should be used
          iterCounters: new Map()
        }
      };

      const result = await promptService.evaluateTemplateExpression('${8055 + $index * 10}', field, context);
      expect(result).toBe('8075'); // 8055 + 2 * 10 = 8075
    });

    it('should handle $index in various expressions', async () => {
      const field: TemplateField = {
        rawLine: 'TEST_FIELD',
        key: 'TEST_FIELD',
        type: 'string',
        lineNumber: 5,
        options: {}
      };

      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: false,
        globalVars: {
          index: 3,
          iterCounters: new Map()
        }
      };

      // Test numeric expressions
      expect(await promptService.evaluateTemplateExpression('port-${3000 + $index}', field, context))
        .toBe('port-3003');

      // Test string expressions  
      expect(await promptService.evaluateTemplateExpression('${\"test\" + $index}', field, context))
        .toBe('test3');

      // Test direct replacement
      expect(await promptService.evaluateTemplateExpression('index-$index', field, context))
        .toBe('index-3');
    });
  });

  describe('$iter.namespace global variable', () => {
    it('should increment counters for different namespaces', async () => {
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

      // First call to $iter.api should return 0, then increment
      expect(await promptService.evaluateTemplateExpression('${8080 + $iter.api * 10}', field, context))
        .toBe('8080');

      // Second call to $iter.api should return 1
      expect(await promptService.evaluateTemplateExpression('${8080 + $iter.api * 10}', field, context))
        .toBe('8090');

      // First call to $iter.web should return 0 (different namespace)
      expect(await promptService.evaluateTemplateExpression('${3000 + $iter.web * 10}', field, context))
        .toBe('3000');

      // Third call to $iter.api should return 2
      expect(await promptService.evaluateTemplateExpression('${8080 + $iter.api * 10}', field, context))
        .toBe('8100');

      // Second call to $iter.web should return 1
      expect(await promptService.evaluateTemplateExpression('${3000 + $iter.web * 10}', field, context))
        .toBe('3010');
    });

    it('should handle multiple $iter variables in same expression', async () => {
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

      // Should increment both counters
      const result = await promptService.evaluateTemplateExpression('api:${8080 + $iter.api * 10},web:${3000 + $iter.web * 10}', field, context);
      expect(result).toBe('api:8080,web:3000');

      // Should continue from previous values
      const result2 = await promptService.evaluateTemplateExpression('api:${8080 + $iter.api * 10},web:${3000 + $iter.web * 10}', field, context);
      expect(result2).toBe('api:8090,web:3010');
    });
  });

  describe('JavaScript expression evaluation', () => {
    it('should handle string concatenation vs numeric addition correctly', async () => {
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

      // String concatenation
      expect(await promptService.evaluateTemplateExpression('${\"test\" + 1}', field, context))
        .toBe('test1');

      // Numeric addition
      expect(await promptService.evaluateTemplateExpression('${1 + 2}', field, context))
        .toBe('3');

      // Mixed expression
      expect(await promptService.evaluateTemplateExpression('${8055 + 0 * 10}', field, context))
        .toBe('8055');

      expect(await promptService.evaluateTemplateExpression('${8055 + 1 * 10}', field, context))
        .toBe('8065');
    });

    it('should handle complex expressions', async () => {
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
          index: 2,
          iterCounters: new Map()
        }
      };

      // Complex expression with $index
      expect(await promptService.evaluateTemplateExpression('${8055 + $index * 10 + 5}', field, context))
        .toBe('8080'); // 8055 + 2 * 10 + 5 = 8080

      // Expression with both $index and $iter
      expect(await promptService.evaluateTemplateExpression('${8000 + $index * 100 + $iter.test * 10}', field, context))
        .toBe('8200'); // 8000 + 2 * 100 + 0 * 10 = 8200

      // Second call should increment $iter.test
      expect(await promptService.evaluateTemplateExpression('${8000 + $index * 100 + $iter.test * 10}', field, context))
        .toBe('8210'); // 8000 + 2 * 100 + 1 * 10 = 8210
    });
  });

  describe('Integration with promptForGroup', () => {
    it('should correctly set index for each field in group processing', async () => {
      const fields: TemplateField[] = [
        {
          rawLine: 'FIELD_1',
          key: 'FIELD_1',
          type: 'string', 
          lineNumber: 1,
          options: { default: 'field-$index' }
        },
        {
          rawLine: 'FIELD_2',
          key: 'FIELD_2', 
          type: 'string',
          lineNumber: 5,
          options: { default: 'field-$index' }
        },
        {
          rawLine: 'FIELD_3',
          key: 'FIELD_3',
          type: 'string',
          lineNumber: 10, 
          options: { default: 'field-$index' }
        }
      ];

      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: false
      };

      const results = await promptService.promptForGroup('test', fields, context);

      // Should use processing index (0, 1, 2) not line numbers (1, 5, 10)
      expect(results.get('FIELD_1')?.value).toBe('field-0');
      expect(results.get('FIELD_2')?.value).toBe('field-1'); 
      expect(results.get('FIELD_3')?.value).toBe('field-2');
    });
  });
});