import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserModule } from '@/modules/user/user.module';
import { UserController } from '@/modules/user/controllers/user.controller';
import { UserService } from '@/modules/user/services/user.service';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { DatabaseService } from '@/core/modules/database/services/database.service';

describe('UserModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UserModule],
    })
    .overrideProvider(DatabaseService)
    .useValue({
      db: {
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
      },
    })
    .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide UserController', () => {
    const controller = module.get<UserController>(UserController);
    expect(controller).toBeDefined();
  });

  it('should provide UserService', () => {
    const service = module.get<UserService>(UserService);
    expect(service).toBeDefined();
  });

  it('should provide UserRepository', () => {
    const repository = module.get<UserRepository>(UserRepository);
    expect(repository).toBeDefined();
  });
});