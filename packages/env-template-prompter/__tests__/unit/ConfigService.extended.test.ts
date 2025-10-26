import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '../../src/services/ConfigService.js';
import type { RuntimeConfig, DebugHandler } from '../../src/types/index.js';

describe('ConfigService - Extended Tests', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  describe('Configuration Management', () => {
    it('should initialize with default configuration', () => {
      const config = configService.getConfig();
      
      expect(config.debugMode).toBe(false);
      expect(config.templatePath).toBe('.env.template');
      expect(config.outputPath).toBe('.env');
      expect(config.skipExisting).toBe(false);
      expect(config.interactive).toBe(true);
    });

    it('should accept initial configuration', () => {
      const initialConfig: Partial<RuntimeConfig> = {
        debugMode: true,
        templatePath: 'custom.template',
        outputPath: '.env.local',
        skipExisting: true,
        interactive: false
      };

      const service = new ConfigService(initialConfig);
      const config = service.getConfig();

      expect(config.debugMode).toBe(true);
      expect(config.templatePath).toBe('custom.template');
      expect(config.outputPath).toBe('.env.local');
      expect(config.skipExisting).toBe(true);
      expect(config.interactive).toBe(false);
    });

    it('should return immutable config copy', () => {
      const config1 = configService.getConfig();
      const config2 = configService.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same content

      // Modifying returned config should not affect service
      config1.debugMode = true;
      expect(configService.getConfig().debugMode).toBe(false);
    });

    it('should validate configuration correctly', () => {
      const result = configService.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial updates correctly', () => {
      const originalConfig = configService.getConfig();

      configService.updateConfig({
        debugMode: true,
        templatePath: 'new.template'
      });

      const updatedConfig = configService.getConfig();
      expect(updatedConfig.debugMode).toBe(true);
      expect(updatedConfig.templatePath).toBe('new.template');
      // Other values should remain unchanged
      expect(updatedConfig.outputPath).toBe(originalConfig.outputPath);
      expect(updatedConfig.skipExisting).toBe(originalConfig.skipExisting);
      expect(updatedConfig.interactive).toBe(originalConfig.interactive);
    });

    it('should handle empty partial updates', () => {
      const originalConfig = configService.getConfig();
      configService.updateConfig({});
      const updatedConfig = configService.getConfig();
      
      expect(updatedConfig).toEqual(originalConfig);
    });
  });

  describe('Debug System', () => {
    it('should not output debug messages when debug mode is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      configService.debug('Test message', 'TestContext');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should output debug messages when debug mode is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      configService.setDebugMode(true);
      configService.debug('Test message', 'TestContext');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext] Test message')
      );
      consoleSpy.mockRestore();
    });

    it('should use default context when none provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      configService.setDebugMode(true);
      configService.debug('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[General] Test message')
      );
      consoleSpy.mockRestore();
    });

    it('should manage debug handlers correctly', () => {
      const messages: string[] = [];
      const handler: DebugHandler = (message) => {
        messages.push(message);
      };

      configService.setDebugMode(true);
      configService.addDebugHandler(handler);
      configService.debug('Test message', 'TestContext');

      expect(messages).toHaveLength(2); // One from addDebugHandler, one from debug call
      expect(messages[1]).toContain('Test message');
    });

    it('should remove debug handlers correctly', () => {
      const messages: string[] = [];
      const handler: DebugHandler = (message) => {
        messages.push(message);
      };

      configService.setDebugMode(true);
      configService.addDebugHandler(handler);
      configService.removeDebugHandler(handler);
      configService.debug('Test message', 'TestContext');

      // Only console.log should be called, not the handler
      expect(messages).toHaveLength(2); // From add and remove operations only
    });

    it('should handle multiple debug handlers', () => {
      const messages1: string[] = [];
      const messages2: string[] = [];
      
      const handler1: DebugHandler = (message) => messages1.push(message);
      const handler2: DebugHandler = (message) => messages2.push(message);

      configService.setDebugMode(true);
      configService.addDebugHandler(handler1);
      configService.addDebugHandler(handler2);
      configService.debug('Test message', 'TestContext');

      expect(messages1).toEqual(expect.arrayContaining([expect.stringContaining('Test message')]));
      expect(messages2).toEqual(expect.arrayContaining([expect.stringContaining('Test message')]));
    });

    it('should handle debug handler errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const faultyHandler: DebugHandler = () => {
        throw new Error('Handler error');
      };

      configService.setDebugMode(true);
      configService.addDebugHandler(faultyHandler);
      
      // Should not throw
      expect(() => {
        configService.debug('Test message', 'TestContext');
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Debug handler error:',
        'Handler error'
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Service Properties', () => {
    it('should have correct service name', () => {
      expect(configService.serviceName).toBe('ConfigService');
    });

    it('should be readonly service name', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        configService.serviceName = 'NewName';
      }).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values in updateConfig', () => {
      // @ts-expect-error - Testing null value
      configService.updateConfig(null);
      expect(configService.getConfig()).toBeDefined();

      // @ts-expect-error - Testing undefined value
      configService.updateConfig(undefined);
      expect(configService.getConfig()).toBeDefined();
    });

    it('should handle very long debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const longMessage = 'x'.repeat(10000);
      
      configService.setDebugMode(true);
      configService.debug(longMessage, 'TestContext');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle special characters in debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const specialMessage = 'Test 🚀 with émojis and spéciàl chars: []{}()!@#$%^&*';
      
      configService.setDebugMode(true);
      configService.debug(specialMessage, 'TestContext');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle rapid debug calls efficiently', () => {
      const messages: string[] = [];
      const handler: DebugHandler = (message) => messages.push(message);
      
      configService.setDebugMode(true);
      configService.addDebugHandler(handler);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        configService.debug(`Message ${i}`, 'PerfTest');
      }
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
      expect(messages.length).toBeGreaterThan(1000); // Should have captured all messages
    });

    it('should handle many debug handlers efficiently', () => {
      const handlers: DebugHandler[] = [];
      
      // Add 100 handlers
      for (let i = 0; i < 100; i++) {
        const handler: DebugHandler = () => {};
        handlers.push(handler);
        configService.addDebugHandler(handler);
      }

      configService.setDebugMode(true);
      
      const start = performance.now();
      configService.debug('Test message', 'PerfTest');
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should complete quickly even with many handlers
    });
  });
});
