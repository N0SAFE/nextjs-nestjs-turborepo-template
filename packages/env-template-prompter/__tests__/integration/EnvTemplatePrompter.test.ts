import { describe, it, expect, beforeEach } from 'vitest';
import { EnvTemplatePrompter } from '../../src/EnvTemplatePrompter.js';
import type { ValidatorPlugin } from '../../src/index.js';

describe('EnvTemplatePrompter Integration', () => {
  let prompter: EnvTemplatePrompter;

  beforeEach(() => {
    prompter = new EnvTemplatePrompter();
  });

  it('should create services container', () => {
    expect(prompter).toBeDefined();
    expect(prompter['services']).toBeDefined();
    expect(prompter['services'].configService).toBeDefined();
    expect(prompter['services'].templateParserService).toBeDefined();
    expect(prompter['services'].validationService).toBeDefined();
    expect(prompter['services'].transformerService).toBeDefined();
    expect(prompter['services'].groupingService).toBeDefined();
    expect(prompter['services'].promptService).toBeDefined();
    expect(prompter['services'].outputService).toBeDefined();
  });

  it('should register custom transformer', async () => {
    const customTransformer = {
      name: 'test_transformer',
      transform: async (value: string) => `transformed_${value}`
    };

    prompter.registerTransformer(customTransformer);
    
    // Test that transformer was registered by checking it exists
    const transformers = prompter['services'].transformerService.getRegisteredTransformers();
    expect(transformers.some(transformer => transformer.name === 'test_transformer')).toBe(true);
  });

  it('should register custom validator', () => {
    const customValidator: ValidatorPlugin = {
      name: 'test_validator',
      handle: (_services, _field) => ({
        validate: (value: string) => value === 'valid' ? true : 'Value must be "valid"',
        transform: (value: string) => `validated_${value}`,
        transformPrompt: (promptOptions, _field) => ({
          ...promptOptions,
          message: promptOptions.message || 'Enter a valid value'
        })
      }),
      description: 'A custom validator for testing',
    };

    prompter.registerValidator(customValidator);
    
    // Test that validator was registered by checking it exists
    const validators = prompter['services'].validationService.getRegisteredValidators();
    expect(validators.some(validator => validator.name === 'test_validator')).toBe(true);
  });

  it('should handle debug mode configuration', () => {
    let debugMessages: string[] = [];
    
    prompter['services'].configService.addDebugHandler((message) => {
      debugMessages.push(message);
    });
    
    prompter['services'].configService.setDebugMode(true);
    
    expect(prompter['services'].configService.getConfig().debugMode).toBe(true);
    
    // Clear any existing messages and trigger some debug output
    debugMessages.length = 0;
    prompter['services'].configService.debug('Test debug message', 'test');
    
    expect(debugMessages).toHaveLength(1);
    expect(debugMessages[0]).toContain('Test debug message');
  });
});
