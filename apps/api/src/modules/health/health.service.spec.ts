import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from './health.service';
import type { HealthRepository } from './health.repository';

describe('HealthService', () => {
  let healthService: HealthService;
  let mockHealthRepository: HealthRepository;

  beforeEach(() => {
    // Create mock repository
    mockHealthRepository = {
      checkDatabase: vi.fn(),
    } as unknown as HealthRepository;

    // Create service with mock
    healthService = new HealthService(mockHealthRepository);
    
    vi.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should create health service instance', () => {
      expect(healthService).toBeDefined();
      expect(healthService).toBeInstanceOf(HealthService);
    });

    it('should accept health repository dependency', () => {
      const service = new HealthService(mockHealthRepository);
      expect(service).toBeDefined();
    });
  });

  describe('getHealth', () => {
    it('should return healthy status when database is up', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

      expect(result).toEqual({
        status: 'healthy',
        database: 'up',
        timestamp: expect.any(String),
      });
    });

    it('should return unhealthy status when database is down', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(false);

      const result = await healthService.getHealth();

      expect(result).toEqual({
        status: 'unhealthy',
        database: 'down',
        timestamp: expect.any(String),
      });
    });

    it('should call repository checkDatabase method', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      await healthService.getHealth();

      expect(mockHealthRepository.checkDatabase).toHaveBeenCalledTimes(1);
    });

    it('should return timestamp in ISO format', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return recent timestamp', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const before = new Date();
      const result = await healthService.getHealth();
      const after = new Date();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Error Handling', () => {
    it('should handle database check throwing error', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(healthService.getHealth()).rejects.toThrow('Database connection failed');
    });

    it('should handle database check timeout', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(healthService.getHealth()).rejects.toThrow('Timeout');
    });

    it('should handle repository returning null', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(null as any);

      const result = await healthService.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('down');
    });

    it('should handle repository returning undefined', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(undefined as any);

      const result = await healthService.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('down');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous health checks', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const results = await Promise.all([
        healthService.getHealth(),
        healthService.getHealth(),
        healthService.getHealth(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('healthy');
        expect(result.database).toBe('up');
      });
      expect(mockHealthRepository.checkDatabase).toHaveBeenCalledTimes(3);
    });

    it('should return independent timestamps for concurrent checks', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const results = await Promise.all([
        healthService.getHealth(),
        healthService.getHealth(),
      ]);

      // Timestamps should be the same or very close
      const time1 = new Date(results[0].timestamp).getTime();
      const time2 = new Date(results[1].timestamp).getTime();
      expect(Math.abs(time1 - time2)).toBeLessThan(100); // Within 100ms
    });
  });

  describe('Database Status Mapping', () => {
    it('should map true to "up"', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

      expect(result.database).toBe('up');
    });

    it('should map false to "down"', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(false);

      const result = await healthService.getHealth();

      expect(result.database).toBe('down');
    });
  });

  describe('Status Determination', () => {
    it('should return healthy when all checks pass', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy when database check fails', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(false);

      const result = await healthService.getHealth();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('Response Structure', () => {
    it('should return object with status, database, and timestamp', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('timestamp');
      expect(Object.keys(result)).toHaveLength(3);
    });

    it('should return consistent structure for healthy state', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

      expect(result).toMatchObject({
        status: expect.any(String),
        database: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should return consistent structure for unhealthy state', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(false);

      const result = await healthService.getHealth();

      expect(result).toMatchObject({
        status: expect.any(String),
        database: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });

  describe('Integration with Repository', () => {
    it('should use injected repository instance', async () => {
      const customRepository = {
        checkDatabase: vi.fn().mockResolvedValue(true),
      } as unknown as HealthRepository;

      const service = new HealthService(customRepository);
      await service.getHealth();

      expect(customRepository.checkDatabase).toHaveBeenCalled();
    });

    it('should not cache repository responses', async () => {
      vi.mocked(mockHealthRepository.checkDatabase)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result1 = await healthService.getHealth();
      const result2 = await healthService.getHealth();

      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('unhealthy');
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed response', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const result = await healthService.getHealth();

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
    it('should handle very slow database check', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 1000))
      );

      const start = Date.now();
      const result = await healthService.getHealth();
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(result.status).toBe('healthy');
    });

    it('should handle immediate database check', async () => {
      vi.mocked(mockHealthRepository.checkDatabase).mockResolvedValue(true);

      const start = Date.now();
      const result = await healthService.getHealth();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
      expect(result.status).toBe('healthy');
    });
  });
});
