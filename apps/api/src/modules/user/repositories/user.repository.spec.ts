import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockDb: any;

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    image: null,
    status: 'active',
    emailVerified: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  const transformedUser = {
    ...mockUser,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    // Create proper Drizzle query builder chain mocks that handle the findMany complexity
    const mockSelectQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
    };

    const mockInsertQueryBuilder = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };

    const mockUpdateQueryBuilder = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };

    const mockDeleteQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };

    mockDb = {
      select: vi.fn(() => mockSelectQueryBuilder),
      insert: vi.fn(() => mockInsertQueryBuilder),
      update: vi.fn(() => mockUpdateQueryBuilder),
      delete: vi.fn(() => mockDeleteQueryBuilder),
    };

    const mockDatabaseService = {
      db: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserRepository,
          useFactory: () => new UserRepository(mockDatabaseService as any),
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input = { name: 'John Doe', email: 'john@example.com' };
      const mockInsertBuilder = mockDb.insert();
      mockInsertBuilder.returning.mockResolvedValue([mockUser]);

      const result = await repository.create(input);

      expect(result).toEqual(transformedUser);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsertBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: input.name,
          email: input.email,
          emailVerified: false,
        })
      );
      expect(mockInsertBuilder.returning).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockSelectBuilder = mockDb.select();
      // Mock the final execution result
      mockSelectBuilder.limit.mockResolvedValue([mockUser]);

      const result = await repository.findById('1');

      expect(result).toEqual(transformedUser);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockSelectBuilder.from).toHaveBeenCalled();
      expect(mockSelectBuilder.where).toHaveBeenCalled();
      expect(mockSelectBuilder.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.limit.mockResolvedValue([]);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.limit.mockResolvedValue([mockUser]);

      const result = await repository.findByEmail('john@example.com');

      expect(result).toEqual(transformedUser);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockSelectBuilder.from).toHaveBeenCalled();
      expect(mockSelectBuilder.where).toHaveBeenCalled();
      expect(mockSelectBuilder.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.limit.mockResolvedValue([]);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find users with pagination', async () => {
      const input = { pagination: { limit: 10, offset: 0 } };
      const users = [mockUser];
      const countResult = [{ count: 1 }];

      // Create separate mock builder instances for the two queries
      const mainQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(users),
      };

      const countQueryBuilder = {
        from: vi.fn().mockResolvedValue(countResult),
      };

      // Mock both select calls (first for main query, second for count)
      mockDb.select
        .mockReturnValueOnce(mainQueryBuilder)
        .mockReturnValueOnce(countQueryBuilder);

      const result = await repository.findMany(input);

      expect(result).toEqual({
        users: [transformedUser],
        meta: {
          pagination: {
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
        },
      });
    });

    it('should handle filtering and sorting', async () => {
      const input = {
        pagination: { limit: 10, offset: 0 },
        filter: { name: 'John', email: 'john' },
        sort: { field: 'name', direction: 'asc' },
      };
      const users = [mockUser];
      const countResult = [{ count: 1 }];

      const mainQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(users),
      };

      const countQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(countResult),
      };

      mockDb.select
        .mockReturnValueOnce(mainQueryBuilder)
        .mockReturnValueOnce(countQueryBuilder);

      await repository.findMany(input);

      expect(mainQueryBuilder.where).toHaveBeenCalled();
      expect(mainQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should handle default sorting when no sort provided', async () => {
      const input = { pagination: { limit: 10, offset: 0 } };
      const users = [mockUser];
      const countResult = [{ count: 1 }];

      const mainQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(users),
      };

      const countQueryBuilder = {
        from: vi.fn().mockResolvedValue(countResult),
      };

      mockDb.select
        .mockReturnValueOnce(mainQueryBuilder)
        .mockReturnValueOnce(countQueryBuilder);

      await repository.findMany(input);

      expect(mainQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should throw error for unsupported sort field', async () => {
      const input = {
        pagination: { limit: 10, offset: 0 },
        sort: { field: 'unsupported', direction: 'asc' },
      };

      await expect(repository.findMany(input)).rejects.toThrow(
        'Unsupported sort field: unsupported'
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const input = { name: 'Jane Doe' };
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      const mockUpdateBuilder = mockDb.update();
      mockUpdateBuilder.returning.mockResolvedValue([updatedUser]);

      const result = await repository.update('1', input);

      expect(result).toEqual({ ...transformedUser, name: 'Jane Doe' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockUpdateBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ...input,
          updatedAt: expect.any(Date),
        })
      );
      expect(mockUpdateBuilder.where).toHaveBeenCalled();
      expect(mockUpdateBuilder.returning).toHaveBeenCalled();
    });

    it('should return null when update fails', async () => {
      const mockUpdateBuilder = mockDb.update();
      mockUpdateBuilder.returning.mockResolvedValue([]);

      const result = await repository.update('nonexistent', { name: 'Jane' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const mockDeleteBuilder = mockDb.delete();
      mockDeleteBuilder.returning.mockResolvedValue([mockUser]);

      const result = await repository.delete('1');

      expect(result).toEqual(transformedUser);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDeleteBuilder.where).toHaveBeenCalled();
      expect(mockDeleteBuilder.returning).toHaveBeenCalled();
    });

    it('should return null when delete fails', async () => {
      const mockDeleteBuilder = mockDb.delete();
      mockDeleteBuilder.returning.mockResolvedValue([]);

      const result = await repository.delete('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user exists', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.limit.mockResolvedValue([{ id: '1' }]);

      const result = await repository.existsByEmail('john@example.com');

      expect(result).toBe(true);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockSelectBuilder.from).toHaveBeenCalled();
      expect(mockSelectBuilder.where).toHaveBeenCalled();
      expect(mockSelectBuilder.limit).toHaveBeenCalledWith(1);
    });

    it('should return false when user does not exist', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.limit.mockResolvedValue([]);

      const result = await repository.existsByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return user count', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.from.mockResolvedValue([{ count: 42 }]);

      const result = await repository.getCount();

      expect(result).toBe(42);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockSelectBuilder.from).toHaveBeenCalled();
    });

    it('should return 0 when no count result', async () => {
      const mockSelectBuilder = mockDb.select();
      mockSelectBuilder.from.mockResolvedValue([]);

      const result = await repository.getCount();

      expect(result).toBe(0);
    });
  });

  describe('transformUser', () => {
    it('should transform user dates to ISO strings', () => {
      // Access the private method through casting
      const result = (repository as any).transformUser(mockUser);

      expect(result).toEqual(transformedUser);
    });

    it('should return null for null input', () => {
      const result = (repository as any).transformUser(null);

      expect(result).toBeNull();
    });
  });

  describe('transformUsers', () => {
    it('should transform array of users', () => {
      const users = [mockUser, { ...mockUser, id: '2' }];
      const result = (repository as any).transformUsers(users);

      expect(result).toEqual([
        transformedUser,
        { ...transformedUser, id: '2' },
      ]);
    });

    it('should handle empty array', () => {
      const result = (repository as any).transformUsers([]);

      expect(result).toEqual([]);
    });
  });
});