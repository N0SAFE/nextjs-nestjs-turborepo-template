import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      checkDatabaseHealth: vi.fn(),
      getMemoryInfo: vi.fn(),
      getUptime: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HealthService,
          useFactory: () => new HealthService(mockRepository),
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return basic health status', async () => {
      const result = await service.getHealth();

      expect(result).toMatchObject({
        status: 'ok',
        service: 'nestjs-api',
      });
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('getReadiness', () => {
    it('should return ready status when database is healthy', async () => {
      const mockCheckHealth = mockRepository.checkDatabaseHealth as any;
      mockCheckHealth.mockResolvedValue({
        status: 'ok',
        timestamp: new Date().toISOString(),
        responseTime: 10,
      });

      const result = await service.getReadiness();

      expect(result).toMatchObject({
        status: 'ready',
        service: 'nestjs-api',
      });
      expect(result.timestamp).toBeDefined();
      expect(mockCheckHealth).toHaveBeenCalledOnce();
    });

    it('should return not-ready status when database is unhealthy', async () => {
      const mockCheckHealth = mockRepository.checkDatabaseHealth as any;
      mockCheckHealth.mockResolvedValue({
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: 1000,
        error: 'Connection failed',
      });

      const result = await service.getReadiness();

      expect(result).toMatchObject({
        status: 'not-ready',
        service: 'nestjs-api',
      });
      expect(result.timestamp).toBeDefined();
      expect(mockCheckHealth).toHaveBeenCalledOnce();
    });
  });

  describe('getLiveness', () => {
    it('should return alive status', async () => {
      const result = await service.getLiveness();

      expect(result).toMatchObject({
        status: 'alive',
        service: 'nestjs-api',
      });
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health when all systems are healthy', async () => {
      const mockDbHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        responseTime: 15,
      };
      const mockMemory = { used: 1000, free: 2000, total: 3000 };
      const mockUptime = 123.45;

      const mockCheckHealth = mockRepository.checkDatabaseHealth as any;
      const mockGetMemory = mockRepository.getMemoryInfo as any;
      const mockGetUptime = mockRepository.getUptime as any;

      mockCheckHealth.mockResolvedValue(mockDbHealth);
      mockGetMemory.mockReturnValue(mockMemory);
      mockGetUptime.mockReturnValue(mockUptime);

      const result = await service.getDetailedHealth();

      expect(result).toMatchObject({
        status: 'ok',
        service: 'nestjs-api',
        uptime: mockUptime,
        memory: mockMemory,
        database: mockDbHealth,
      });
      expect(result.timestamp).toBeDefined();
      expect(mockCheckHealth).toHaveBeenCalledOnce();
      expect(mockGetMemory).toHaveBeenCalledOnce();
      expect(mockGetUptime).toHaveBeenCalledOnce();
    });

    it('should return degraded status when database is unhealthy', async () => {
      const mockDbHealth = {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: 5000,
        error: 'Connection timeout',
      };
      const mockMemory = { used: 1000, free: 2000, total: 3000 };
      const mockUptime = 123.45;

      const mockCheckHealth = mockRepository.checkDatabaseHealth as any;
      const mockGetMemory = mockRepository.getMemoryInfo as any;
      const mockGetUptime = mockRepository.getUptime as any;

      mockCheckHealth.mockResolvedValue(mockDbHealth);
      mockGetMemory.mockReturnValue(mockMemory);
      mockGetUptime.mockReturnValue(mockUptime);

      const result = await service.getDetailedHealth();

      expect(result).toMatchObject({
        status: 'degraded',
        service: 'nestjs-api',
        uptime: mockUptime,
        memory: mockMemory,
        database: mockDbHealth,
      });
      expect(result.timestamp).toBeDefined();
    });
  });
});