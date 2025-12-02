import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;
  let mockHealthService: HealthService;

  beforeEach(() => {
    // Create mock service
    mockHealthService = {
      getHealth: vi.fn(),
    } as unknown as HealthService;

    // Create controller with mock
    healthController = new HealthController(mockHealthService);
    
    vi.clearAllMocks();
  });

  describe('Controller Creation', () => {
    it('should create health controller instance', () => {
      expect(healthController).toBeDefined();
      expect(healthController).toBeInstanceOf(HealthController);
    });

    it('should accept health service dependency', () => {
      const controller = new HealthController(mockHealthService);
      expect(controller).toBeDefined();
    });
  });

  describe('getHealth endpoint', () => {
    it('should return healthy response', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result).toEqual(mockResponse);
    });

    it('should return unhealthy response', async () => {
      const mockResponse = {
        status: 'unhealthy',
        database: 'down',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result).toEqual(mockResponse);
    });

    it('should call service getHealth method', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      await healthController.getHealth();

      expect(mockHealthService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should call service with no arguments', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      await healthController.getHealth();

      expect(mockHealthService.getHealth).toHaveBeenCalledWith();
    });

    it('should return response immediately', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const start = Date.now();
      await healthController.getHealth();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      vi.mocked(mockHealthService.getHealth).mockRejectedValue(
        new Error('Service error')
      );

      await expect(healthController.getHealth()).rejects.toThrow('Service error');
    });

    it('should handle service timeout', async () => {
      vi.mocked(mockHealthService.getHealth).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(healthController.getHealth()).rejects.toThrow('Timeout');
    });

    it('should handle service returning null', async () => {
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(null as any);

      const result = await healthController.getHealth();

      expect(result).toBeNull();
    });

    it('should handle service returning undefined', async () => {
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(undefined as any);

      const result = await healthController.getHealth();

      expect(result).toBeUndefined();
    });
  });

  describe('Response Structure', () => {
    it('should return object with status, database, timestamp', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('timestamp');
    });

    it('should preserve service response structure', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
        extra: 'field',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse as any);

      const result = await healthController.getHealth();

      expect(result).toEqual(mockResponse);
    });

    it('should return timestamp as string', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(typeof result.timestamp).toBe('string');
    });

    it('should return status as string', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(typeof result.status).toBe('string');
    });

    it('should return database as string', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(typeof result.database).toBe('string');
    });
  });

  describe('Status Values', () => {
    it('should return "healthy" status', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result.status).toBe('healthy');
    });

    it('should return "unhealthy" status', async () => {
      const mockResponse = {
        status: 'unhealthy',
        database: 'down',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result.status).toBe('unhealthy');
    });

    it('should return "up" database status', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result.database).toBe('up');
    });

    it('should return "down" database status', async () => {
      const mockResponse = {
        status: 'unhealthy',
        database: 'down',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result.database).toBe('down');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const results = await Promise.all([
        healthController.getHealth(),
        healthController.getHealth(),
        healthController.getHealth(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('healthy');
      });
      expect(mockHealthService.getHealth).toHaveBeenCalledTimes(3);
    });

    it('should return independent responses for concurrent requests', async () => {
      let counter = 0;
      vi.mocked(mockHealthService.getHealth).mockImplementation(async () => ({
        status: 'healthy',
        database: 'up',
        timestamp: `2024-01-01T00:00:0${counter++}.000Z`,
      }));

      const results = await Promise.all([
        healthController.getHealth(),
        healthController.getHealth(),
      ]);

      expect(results[0].timestamp).not.toBe(results[1].timestamp);
    });
  });

  describe('Integration with Service', () => {
    it('should use injected service instance', async () => {
      const customService = {
        getHealth: vi.fn().mockResolvedValue({
          status: 'healthy',
          database: 'up',
          timestamp: '2024-01-01T00:00:00.000Z',
        }),
      } as unknown as HealthService;

      const controller = new HealthController(customService);
      await controller.getHealth();

      expect(customService.getHealth).toHaveBeenCalled();
    });

    it('should not modify service response', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      expect(result).toEqual(mockResponse);
      expect(result).not.toBe(mockResponse); // Different reference
    });

    it('should pass through service response without transformation', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
        customField: 'value',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse as any);

      const result = await healthController.getHealth();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Performance', () => {
    it('should complete quickly', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const start = Date.now();
      await healthController.getHealth();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should not cache responses', async () => {
      vi.mocked(mockHealthService.getHealth)
        .mockResolvedValueOnce({
          status: 'healthy',
          database: 'up',
          timestamp: '2024-01-01T00:00:00.000Z',
        })
        .mockResolvedValueOnce({
          status: 'unhealthy',
          database: 'down',
          timestamp: '2024-01-01T00:00:01.000Z',
        });

      const result1 = await healthController.getHealth();
      const result2 = await healthController.getHealth();

      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('unhealthy');
      expect(mockHealthService.getHealth).toHaveBeenCalledTimes(2);
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed response', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const result = await healthController.getHealth();

      // TypeScript should infer correct types
      const status: string = result.status;
      const database: string = result.database;
      const timestamp: string = result.timestamp;

      expect(status).toBeDefined();
      expect(database).toBeDefined();
      expect(timestamp).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very slow service response', async () => {
      vi.mocked(mockHealthService.getHealth).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          status: 'healthy',
          database: 'up',
          timestamp: '2024-01-01T00:00:00.000Z',
        }), 1000))
      );

      const result = await healthController.getHealth();

      expect(result.status).toBe('healthy');
    }, 2000);

    it('should handle immediate service response', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'up',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(mockHealthService.getHealth).mockResolvedValue(mockResponse);

      const start = Date.now();
      await healthController.getHealth();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should handle service throwing synchronously', async () => {
      vi.mocked(mockHealthService.getHealth).mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      await expect(healthController.getHealth()).rejects.toThrow('Synchronous error');
    });
  });
});
