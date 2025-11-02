import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from '@/modules/user/controllers/user.controller';
import { UserService } from '@/modules/user/services/user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    image: null,
    emailVerified: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z') as Date & string,
    updatedAt: new Date('2023-01-01T00:00:00.000Z') as Date & string,
    role: 'user',
    banned: false,
    banReason: null,
    banExpires: null,
  } satisfies Awaited<ReturnType<typeof service.getUsers>>['users'][number]

  beforeEach(async () => {
    const mockUserService = {
      getUsers: vi.fn(),
      findUserById: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      checkUserExistsByEmail: vi.fn(),
      getUserCount: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useFactory: () => mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ORPC implementation methods', () => {
    it('should have list method that returns implementation', () => {
      const implementation = controller.list() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have findById method that returns implementation', () => {
      const implementation = controller.findById() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have create method that returns implementation', () => {
      const implementation = controller.create() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have update method that returns implementation', () => {
      const implementation = controller.update() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have delete method that returns implementation', () => {
      const implementation = controller.delete() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have checkEmail method that returns implementation', () => {
      const implementation = controller.checkEmail() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });

    it('should have count method that returns implementation', () => {
      const implementation = controller.count() as any;
      expect(implementation).toBeDefined();
      expect(typeof implementation.handler).toBe('function');
    });
  });

  describe('Service integration', () => {
    it('should have service injected properly', () => {
      expect(service).toBeDefined();
      expect(service.getUsers).toBeDefined();
      expect(service.findUserById).toBeDefined();
      expect(service.createUser).toBeDefined();
      expect(service.updateUser).toBeDefined();
      expect(service.deleteUser).toBeDefined();
      expect(service.checkUserExistsByEmail).toBeDefined();
      expect(service.getUserCount).toBeDefined();
    });

    it('should be able to call service methods directly', async () => {
      const mockResponse = {
        users: [mockUser],
        meta: { pagination: { total: 1, limit: 10, offset: 0, hasMore: false } },
      };
      vi.mocked(service.getUsers).mockResolvedValue(mockResponse);

      const result = await service.getUsers({ pagination: { limit: 10, offset: 0 } });
      expect(result).toEqual(mockResponse);
      expect(service.getUsers).toHaveBeenCalledWith({ pagination: { limit: 10, offset: 0 } });
    });
  });
});