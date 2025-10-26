import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllDefaultPlugins,
  getDefaultTransformerPlugins,
  getDefaultValidatorPlugins,
  PluginRegistry,
  extractPortTransformer,
  urlValidator,
  type ServiceContainer,
  type ValidatorPlugin
} from '../src/index.js';

describe('Plugin System', () => {
  describe('Default Plugins', () => {
    it('should provide all default transformer plugins', () => {
      const transformers = getDefaultTransformerPlugins();
      
      expect(transformers).toHaveLength(7);
      expect(transformers.map(t => t.name)).toContain('extract_port');
      expect(transformers.map(t => t.name)).toContain('extract_hostname');
      expect(transformers.map(t => t.name)).toContain('cors_origins');
      expect(transformers.map(t => t.name)).toContain('generate_secret');
      expect(transformers.map(t => t.name)).toContain('boolean_flag');
      expect(transformers.map(t => t.name)).toContain('array_from_csv');
      expect(transformers.map(t => t.name)).toContain('extract_protocol');
    });

    it('should provide all default validator plugins', () => {
      const validators = getDefaultValidatorPlugins();
      
      expect(validators).toHaveLength(11);
      expect(validators.map(v => v.name)).toContain('url');
      expect(validators.map(v => v.name)).toContain('number');
      expect(validators.map(v => v.name)).toContain('string');
      expect(validators.map(v => v.name)).toContain('boolean');
      expect(validators.map(v => v.name)).toContain('email');
      expect(validators.map(v => v.name)).toContain('port');
      expect(validators.map(v => v.name)).toContain('json');
      expect(validators.map(v => v.name)).toContain('path');
      expect(validators.map(v => v.name)).toContain('select');
      expect(validators.map(v => v.name)).toContain('multiselect');
      expect(validators.map(v => v.name)).toContain('date');
    });

    it('should provide complete plugin collection', () => {
      const allPlugins = getAllDefaultPlugins();
      
      expect(allPlugins.transformers).toHaveLength(7);
      expect(allPlugins.validators).toHaveLength(11);
    });
  });

  describe('Individual Plugin Functionality', () => {
    describe('extractPortTransformer', () => {
      it('should extract port from URL', () => {
        const context = {
          sourceValue: 'https://example.com:3000/path',
          allValues: new Map(),
          field: {} as any,
          templateFields: []
        };

        const result = extractPortTransformer.transform('', { source: 'DATABASE_URL' }, context);
        expect(result).toBe('3000');
      });

      it('should return default port for HTTPS', () => {
        const context = {
          sourceValue: 'https://example.com/path',
          allValues: new Map(),
          field: {} as any,
          templateFields: []
        };

        const result = extractPortTransformer.transform('', { source: 'DATABASE_URL' }, context);
        expect(result).toBe('443');
      });

      it('should return default port for HTTP', () => {
        const context = {
          sourceValue: 'http://example.com/path',
          allValues: new Map(),
          field: {} as any,
          templateFields: []
        };

        const result = extractPortTransformer.transform('', { source: 'DATABASE_URL' }, context);
        expect(result).toBe('80');
      });

      it('should return existing value when no source', () => {
        const context = {
          sourceValue: '',
          allValues: new Map(),
          field: {} as any,
          templateFields: []
        };

        const result = extractPortTransformer.transform('8080', {}, context);
        expect(result).toBe('8080');
      });
    });

    describe('urlValidator', () => {
      const urlValidatorHandle = urlValidator.handle({} as ServiceContainer, {} as any);
      it('should validate correct URLs', () => {
        expect(urlValidatorHandle.validate('https://example.com', {})).toBe(true);
        expect(urlValidatorHandle.validate('http://localhost:3000', {})).toBe(true);
        expect(urlValidatorHandle.validate('postgres://user:pass@host:5432/db', {})).toBe(true);
      });

      it('should reject invalid URLs', () => {
        expect(urlValidatorHandle.validate('not-a-url', {})).toBe('Invalid URL format');
        expect(urlValidatorHandle.validate('', {})).toBe('URL cannot be empty');
        expect(urlValidatorHandle.validate('invalid-protocol://test', {})).toBe('Invalid protocol. Must be one of: http, https, ftp, ftps, postgres, postgresql, mysql, redis');
      });
    });
  });

  describe('PluginRegistry', () => {
    let registry: PluginRegistry;

    beforeEach(() => {
      registry = new PluginRegistry(false); // Don't load defaults initially
    });

    it('should create empty registry', () => {
      expect(registry.getAllTransformers()).toHaveLength(0);
      expect(registry.getAllValidators()).toHaveLength(0);
    });

    it('should load default plugins when requested', () => {
      registry.loadDefaultPlugins();
      
      expect(registry.getAllTransformers()).toHaveLength(7);
      expect(registry.getAllValidators()).toHaveLength(11);
    });

    it('should register custom transformer', () => {
      const customTransformer = {
        name: 'uppercase',
        description: 'Converts to uppercase',
        transform: (value: string) => value.toUpperCase()
      };

      registry.registerTransformer(customTransformer);
      
      expect(registry.hasTransformer('uppercase')).toBe(true);
      expect(registry.getTransformer('uppercase')).toBe(customTransformer);
    });

    it('should register custom validator', () => {
      const customValidator: ValidatorPlugin = {
        name: 'custom',
        description: 'A custom validator for testing',
        handle: (_services: ServiceContainer, field: any) => ({
          validate: (value: string) => value.length > 5 ? true : 'Value must be longer than 5 characters',
          transform: (value: string) => value.trim(),
          transformPrompt: (promptOptions: any, field: any) => promptOptions
        }),
      };

      registry.registerValidator(customValidator);
      
      expect(registry.hasValidator('custom')).toBe(true);
      expect(registry.getValidator('custom')).toBe(customValidator);
    });

    it('should provide plugin statistics', () => {
      registry.loadDefaultPlugins();
      
      const stats = registry.getStats();
      expect(stats.transformers).toBe(7);
      expect(stats.validators).toBe(11);
    });

    it('should allow unregistering plugins', () => {
      registry.loadDefaultPlugins();
      
      expect(registry.unregisterTransformer('extract_port')).toBe(true);
      expect(registry.hasTransformer('extract_port')).toBe(false);
      
      expect(registry.unregisterValidator('url')).toBe(true);
      expect(registry.hasValidator('url')).toBe(false);
    });

    it('should clear all plugins', () => {
      registry.loadDefaultPlugins();
      registry.clear();
      
      expect(registry.getAllTransformers()).toHaveLength(0);
      expect(registry.getAllValidators()).toHaveLength(0);
    });
  });

  describe('Plugin Auto-loading', () => {
    it('should auto-load defaults when registry created with loadDefaults=true', () => {
      const registry = new PluginRegistry(true);

      expect(registry.getAllTransformers()).toHaveLength(7);
      expect(registry.getAllValidators()).toHaveLength(11);
    });
  });
});
