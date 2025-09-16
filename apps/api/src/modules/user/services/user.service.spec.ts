import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: any;

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    image: null,
    status: 'active',
    emailVerified: false,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
      getCount: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useFactory: () => new UserService(mockRepository),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user when email does not exist', async () => {
      const input = { name: 'John Doe', email: 'john@example.com' };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser);

      const result = await service.createUser(input);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should throw ConflictException when user with email already exists', async () => {
      const input = { name: 'John Doe', email: 'john@example.com' };
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(input)).rejects.toThrow(ConflictException);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getUserById('1')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findUserById('1');

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('john@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const input = { pagination: { limit: 10, offset: 0 } };
      const mockResponse = {
        users: [mockUser],
        meta: { pagination: { total: 1, limit: 10, offset: 0, hasMore: false } },
      };
      mockRepository.findMany.mockResolvedValue(mockResponse);

      const result = await service.getUsers(input);

      expect(result).toEqual(mockResponse);
      expect(mockRepository.findMany).toHaveBeenCalledWith(input);
    });
  });

  describe('updateUser', () => {
    it('should update user when user exists and no email conflict', async () => {
      const input = { name: 'Jane Doe' };
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', input);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(mockRepository.update).toHaveBeenCalledWith('1', input);
    });

    it('should return null when user does not exist', async () => {
      const input = { name: 'Jane Doe' };
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.updateUser('1', input);

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update user with new email when no conflict', async () => {
      const input = { email: 'jane@example.com' };
      const updatedUser = { ...mockUser, email: 'jane@example.com' };
      
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.existsByEmail.mockResolvedValue(false);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', input);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith('jane@example.com');
      expect(mockRepository.update).toHaveBeenCalledWith('1', input);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const input = { email: 'existing@example.com' };
      
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.existsByEmail.mockResolvedValue(true);

      await expect(service.updateUser('1', input)).rejects.toThrow(ConflictException);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should not check email conflict when email is same as current', async () => {
      const input = { email: 'john@example.com', name: 'John Updated' };
      const updatedUser = { ...mockUser, name: 'John Updated' };
      
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', input);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.existsByEmail).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith('1', input);
    });
  });

  describe('deleteUser', () => {
    it('should delete user when user exists', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.deleteUser('1');

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkUserExistsByEmail', () => {
    it('should return exists true when user exists', async () => {
      mockRepository.existsByEmail.mockResolvedValue(true);

      const result = await service.checkUserExistsByEmail('john@example.com');

      expect(result).toEqual({ exists: true });
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith('john@example.com');
    });

    it('should return exists false when user does not exist', async () => {
      mockRepository.existsByEmail.mockResolvedValue(false);

      const result = await service.checkUserExistsByEmail('nonexistent@example.com');

      expect(result).toEqual({ exists: false });
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });
  });

  describe('getUserCount', () => {
    it('should return user count', async () => {
      mockRepository.getCount.mockResolvedValue(42);

      const result = await service.getUserCount();

      expect(result).toEqual({ count: 42 });
      expect(mockRepository.getCount).toHaveBeenCalledOnce();
    });
  });
});