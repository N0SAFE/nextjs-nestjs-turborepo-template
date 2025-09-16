import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseModule } from './database.module';
import { DatabaseService } from './services/database.service';
import { DATABASE_CONNECTION } from './database-connection';

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    })
    .overrideProvider(DATABASE_CONNECTION)
    .useValue({
      execute: vi.fn(),
    })
    .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide DatabaseService', () => {
    const databaseService = module.get<DatabaseService>(DatabaseService);
    expect(databaseService).toBeDefined();
  });

  it('should provide DATABASE_CONNECTION', () => {
    const connection = module.get(DATABASE_CONNECTION);
    expect(connection).toBeDefined();
  });
});