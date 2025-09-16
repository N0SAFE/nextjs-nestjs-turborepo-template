import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { HealthModule } from '@/modules/health/health.module';
import { HealthController } from '@/modules/health/controllers/health.controller';
import { HealthService } from '@/modules/health/services/health.service';
import { HealthRepository } from '@/modules/health/repositories/health.repository';
import { DatabaseService } from '@/core/modules/database/services/database.service';
import { DATABASE_CONNECTION } from '@/core/modules/database/database-connection';

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HealthModule],
    })
    .overrideProvider(ConfigService)
    .useValue({
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'databaseUrl') return 'postgresql://test:test@localhost:5432/test';
        return 'test-value';
      }),
    })
    .overrideProvider(DATABASE_CONNECTION)
    .useValue({
      execute: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    })
    .overrideProvider(DatabaseService)
    .useValue({
      db: {
        execute: vi.fn(),
      },
    })
    .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide HealthController', () => {
    const controller = module.get<HealthController>(HealthController);
    expect(controller).toBeDefined();
  });

  it('should provide HealthService', () => {
    const service = module.get<HealthService>(HealthService);
    expect(service).toBeDefined();
  });

  it('should provide HealthRepository', () => {
    const repository = module.get<HealthRepository>(HealthRepository);
    expect(repository).toBeDefined();
  });
});