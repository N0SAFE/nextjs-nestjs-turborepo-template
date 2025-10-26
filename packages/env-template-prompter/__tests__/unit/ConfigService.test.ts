import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '../../src/services/ConfigService.js';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  it('should initialize with default configuration', () => {
    const config = configService.getConfig();
    
    expect(config.debugMode).toBe(false);
    expect(config.templatePath).toBe('.env.template');
    expect(config.outputPath).toBe('.env');
    expect(config.skipExisting).toBe(false);
    expect(config.interactive).toBe(true);
  });

  it('should update configuration', () => {
    configService.updateConfig({
      debugMode: true,
      templatePath: 'custom.template'
    });

    const config = configService.getConfig();
    expect(config.debugMode).toBe(true);
    expect(config.templatePath).toBe('custom.template');
    expect(config.outputPath).toBe('.env'); // Should remain unchanged
  });

  it('should validate configuration', () => {
    const result = configService.validateConfig();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid configuration', () => {
    configService.updateConfig({
      templatePath: '',
      outputPath: ''
    });

    const result = configService.validateConfig();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Template path is required');
    expect(result.errors).toContain('Output path is required');
  });

  it('should handle debug mode', () => {
    let debugMessage = '';
    configService.addDebugHandler((message) => {
      debugMessage = message;
    });

    configService.setDebugMode(true);
    configService.debug('test message', 'test context');

    expect(debugMessage).toContain('test message');
    expect(debugMessage).toContain('test context');
  });
});
