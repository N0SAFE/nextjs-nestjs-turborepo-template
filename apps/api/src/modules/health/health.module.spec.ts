import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HealthModule } from '@/modules/health/health.module';
import { HealthController } from '@/modules/health/controllers/health.controller';
import { HealthService } from '@/modules/health/services/health.service';
import { HealthRepository } from '@/modules/health/repositories/health.repository';
import { DatabaseService } from '@/core/modules/database/services/database.service';

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HealthModule],
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