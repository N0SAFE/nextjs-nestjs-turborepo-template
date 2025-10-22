import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService } from '../services/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const mockHealthService = {
      getHealth: vi.fn() as (this: unknown) => ReturnType<HealthService['getHealth']>,
      getDetailedHealth: vi.fn() as (this: unknown) => ReturnType<HealthService['getDetailedHealth']>,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useFactory: () => mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ORPC implementation methods', () => {
    it('should have check method that returns implementation handler', () => {
      const implementation = controller.check();
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have detailed method that returns implementation handler', () => {
      const implementation = controller.detailed();
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });
  });

  describe('Service integration', () => {
    it('should have service injected properly', () => {
      expect(service).toBeDefined();
      expect(service.getHealth.bind(service)).toBeDefined();
      expect(service.getDetailedHealth.bind(service)).toBeDefined();
    });

    it('should be able to call getHealth service method directly', async () => {
      const mockHealth = { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'nestjs-api'
      };
      vi.mocked(service.getHealth.bind(service)).mockResolvedValue(mockHealth);

      const result = await service.getHealth();
      expect(result).toEqual(mockHealth);
      expect(service.getHealth.bind(service)).toHaveBeenCalledOnce();
    });

    it('should be able to call getDetailedHealth service method directly', async () => {
      const mockDetailedHealth = { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'nestjs-api',
        uptime: 123,
        memory: { used: 1000, free: 2000, total: 3000 },
        database: { status: 'ok' }
      };
      vi.mocked(service.getDetailedHealth.bind(service)).mockResolvedValue(mockDetailedHealth);

      const result = await service.getDetailedHealth();
      expect(result).toEqual(mockDetailedHealth);
      expect(service.getDetailedHealth.bind(service)).toHaveBeenCalledOnce();
    });
  });
});
