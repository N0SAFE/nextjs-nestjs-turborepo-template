import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthRepository } from './health.repository';

// Mock drizzle
const mockDb = {
  execute: vi.fn(),
};

describe('HealthRepository', () => {
  let healthRepository: HealthRepository;

  beforeEach(() => {
    healthRepository = new HealthRepository(mockDb as any);
    vi.clearAllMocks();
  });

  describe('Repository Creation', () => {
    it('should create health repository instance', () => {
      expect(healthRepository).toBeDefined();
      expect(healthRepository).toBeInstanceOf(HealthRepository);
    });

    it('should accept database dependency', () => {
      const repository = new HealthRepository(mockDb as any);
      expect(repository).toBeDefined();
    });
  });

  describe('checkDatabase', () => {
    it('should return true when database query succeeds', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    });

    it('should return false when database query fails', async () => {
      mockDb.execute.mockRejectedValue(new Error('Connection failed'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should execute SELECT 1 query', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      await healthRepository.checkDatabase();

      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT 1'));
    });

    it('should catch database errors gracefully', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
      expect(() => result).not.toThrow();
    });

    it('should handle connection timeout', async () => {
      mockDb.execute.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should handle null result', async () => {
      mockDb.execute.mockResolvedValue(null);

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    });

    it('should handle undefined result', async () => {
      mockDb.execute.mockResolvedValue(undefined);

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    });

    it('should handle empty array result', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    });
  });

  describe('Concurrent Checks', () => {
    it('should handle multiple simultaneous checks', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      const results = await Promise.all([
        healthRepository.checkDatabase(),
        healthRepository.checkDatabase(),
        healthRepository.checkDatabase(),
      ]);

      expect(results).toEqual([true, true, true]);
      expect(mockDb.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure', async () => {
      mockDb.execute
        .mockResolvedValueOnce([{ result: 1 }])
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([{ result: 1 }]);

      const results = await Promise.all([
        healthRepository.checkDatabase(),
        healthRepository.checkDatabase(),
        healthRepository.checkDatabase(),
      ]);

      expect(results).toEqual([true, false, true]);
    });
  });

  describe('Error Types', () => {
    it('should handle network errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should handle authentication errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Authentication failed'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should handle syntax errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Syntax error in query'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should handle database not available', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database does not exist'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should handle permission errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Permission denied'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });
  });

  describe('Query Execution', () => {
    it('should call database execute method', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      await healthRepository.checkDatabase();

      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('should use simple SELECT 1 query', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      await healthRepository.checkDatabase();

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String));
      const query = mockDb.execute.mock.calls[0][0];
      expect(query.toLowerCase()).toContain('select');
      expect(query).toContain('1');
    });

    it('should not require specific result format', async () => {
      mockDb.execute.mockResolvedValue({ rows: [{ value: 1 }] });

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete quickly on success', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      const start = Date.now();
      await healthRepository.checkDatabase();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should complete quickly on failure', async () => {
      mockDb.execute.mockRejectedValue(new Error('Failed'));

      const start = Date.now();
      await healthRepository.checkDatabase();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should not cache results', async () => {
      mockDb.execute
        .mockResolvedValueOnce([{ result: 1 }])
        .mockRejectedValueOnce(new Error('Failed'));

      const result1 = await healthRepository.checkDatabase();
      const result2 = await healthRepository.checkDatabase();

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with Database', () => {
    it('should use provided database instance', async () => {
      const customDb = { execute: vi.fn().mockResolvedValue([{ result: 1 }]) };
      const repository = new HealthRepository(customDb as any);

      await repository.checkDatabase();

      expect(customDb.execute).toHaveBeenCalled();
    });

    it('should work with different database types', async () => {
      const postgresDb = { execute: vi.fn().mockResolvedValue([]) };
      const repository = new HealthRepository(postgresDb as any);

      const result = await repository.checkDatabase();

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database returning non-standard response', async () => {
      mockDb.execute.mockResolvedValue({ success: true, data: null });

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    });

    it('should handle very slow queries', async () => {
      mockDb.execute.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([{ result: 1 }]), 2000))
      );

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
    }, 3000);

    it('should handle database execute throwing synchronously', async () => {
      mockDb.execute.mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
    });

    it('should handle database returning error object', async () => {
      mockDb.execute.mockResolvedValue({ error: 'Query failed' });

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true); // No exception = success
    });
  });

  describe('Type Safety', () => {
    it('should return boolean type', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      const result = await healthRepository.checkDatabase();

      expect(typeof result).toBe('boolean');
    });

    it('should always return boolean on success', async () => {
      mockDb.execute.mockResolvedValue([{ result: 1 }]);

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });

    it('should always return boolean on failure', async () => {
      mockDb.execute.mockRejectedValue(new Error('Failed'));

      const result = await healthRepository.checkDatabase();

      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    });
  });
});
