import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PushRepository } from './push.repository';
import { DatabaseService } from '../../database/services/database.service';

describe('PushRepository', () => {
  let repository: PushRepository;
  let mockDatabaseService: any;

  const mockVapidKeys = {
    id: 'vapid-1',
    userId: 'user-1',
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
    subject: 'mailto:user-1@notifications.local',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
    p256dh: 'mock-p256dh-key',
    auth: 'mock-auth-key',
    deviceName: 'Chrome',
    userAgent: 'Mozilla/5.0...',
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    lastUsedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    // Mock Drizzle query builder chains
    const mockSelectQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    const mockInsertQueryBuilder = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    const mockUpdateQueryBuilder = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    const mockDeleteQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    mockDatabaseService = {
      db: {
        select: vi.fn().mockReturnValue(mockSelectQueryBuilder),
        insert: vi.fn().mockReturnValue(mockInsertQueryBuilder),
        update: vi.fn().mockReturnValue(mockUpdateQueryBuilder),
        delete: vi.fn().mockReturnValue(mockDeleteQueryBuilder),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PushRepository,
          useFactory: () => new PushRepository(mockDatabaseService),
        },
      ],
    }).compile();

    repository = module.get<PushRepository>(PushRepository);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('findVapidKeysByUserId', () => {
    it('should return VAPID keys for a user', async () => {
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.limit.mockResolvedValue([mockVapidKeys]);

      const result = await repository.findVapidKeysByUserId('user-1');

      expect(result).toEqual(mockVapidKeys);
      expect(mockDatabaseService.db.select).toHaveBeenCalled();
    });

    it('should return null if no VAPID keys found', async () => {
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.limit.mockResolvedValue([]);

      const result = await repository.findVapidKeysByUserId('user-1');

      expect(result).toBeNull();
    });
  });

  describe('createVapidKeys', () => {
    it('should create VAPID keys for a user', async () => {
      const mockInsert = mockDatabaseService.db.insert();
      mockInsert.returning.mockResolvedValue([mockVapidKeys]);

      const result = await repository.createVapidKeys(
        'user-1',
        'mock-public-key',
        'mock-private-key',
        'mailto:user-1@notifications.local'
      );

      expect(result).toEqual(mockVapidKeys);
      expect(mockDatabaseService.db.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          publicKey: 'mock-public-key',
          privateKey: 'mock-private-key',
          subject: 'mailto:user-1@notifications.local',
        })
      );
    });
  });

  describe('findSubscriptionByEndpoint', () => {
    it('should return subscription by endpoint', async () => {
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.limit.mockResolvedValue([mockSubscription]);

      const result = await repository.findSubscriptionByEndpoint('https://fcm.googleapis.com/fcm/send/mock-endpoint');

      expect(result).toEqual(mockSubscription);
    });

    it('should return null if subscription not found', async () => {
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.limit.mockResolvedValue([]);

      const result = await repository.findSubscriptionByEndpoint('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveSubscriptionsByUserId', () => {
    it('should return active subscriptions for a user', async () => {
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.where.mockResolvedValue([mockSubscription]);

      const result = await repository.findActiveSubscriptionsByUserId('user-1');

      expect(result).toEqual([mockSubscription]);
      expect(mockDatabaseService.db.select).toHaveBeenCalled();
    });

    it('should return empty array if no active subscriptions', async () => {
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.where.mockResolvedValue([]);

      const result = await repository.findActiveSubscriptionsByUserId('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findAllSubscriptionsByUserId', () => {
    it('should return all subscriptions for a user', async () => {
      const inactiveSubscription = { ...mockSubscription, id: 'sub-2', isActive: false };
      const mockSelect = mockDatabaseService.db.select();
      mockSelect.where.mockResolvedValue([mockSubscription, inactiveSubscription]);

      const result = await repository.findAllSubscriptionsByUserId('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('createSubscription', () => {
    it('should create a new push subscription', async () => {
      const mockInsert = mockDatabaseService.db.insert();
      mockInsert.returning.mockResolvedValue([mockSubscription]);

      const result = await repository.createSubscription(
        'user-1',
        'https://fcm.googleapis.com/fcm/send/mock-endpoint',
        'mock-p256dh-key',
        'mock-auth-key',
        'Chrome',
        'Mozilla/5.0...'
      );

      expect(result).toEqual(mockSubscription);
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
          p256dh: 'mock-p256dh-key',
          auth: 'mock-auth-key',
          deviceName: 'Chrome',
          userAgent: 'Mozilla/5.0...',
          isActive: true,
        })
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update an existing subscription', async () => {
      const mockUpdate = mockDatabaseService.db.update();
      mockUpdate.returning.mockResolvedValue([mockSubscription]);

      const result = await repository.updateSubscription(
        'https://fcm.googleapis.com/fcm/send/mock-endpoint',
        'user-1',
        'new-p256dh',
        'new-auth',
        'Firefox'
      );

      expect(result).toEqual(mockSubscription);
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          p256dh: 'new-p256dh',
          auth: 'new-auth',
          deviceName: 'Firefox',
        })
      );
    });
  });

  describe('updateSubscriptionLastUsed', () => {
    it('should update last used timestamp', async () => {
      const mockUpdate = mockDatabaseService.db.update();
      mockUpdate.returning.mockResolvedValue([mockSubscription]);

      await repository.updateSubscriptionLastUsed('sub-1');

      expect(mockDatabaseService.db.update).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastUsedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('markSubscriptionInactive', () => {
    it('should mark subscription as inactive', async () => {
      const mockUpdate = mockDatabaseService.db.update();
      mockUpdate.returning.mockResolvedValue([{ ...mockSubscription, isActive: false }]);

      await repository.markSubscriptionInactive('sub-1');

      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('deleteSubscription', () => {
    it('should delete a subscription', async () => {
      const mockDelete = mockDatabaseService.db.delete();
      mockDelete.returning.mockResolvedValue([mockSubscription]);

      const result = await repository.deleteSubscription('user-1', 'https://fcm.googleapis.com/fcm/send/mock-endpoint');

      expect(result).toBe(true);
      expect(mockDatabaseService.db.delete).toHaveBeenCalled();
    });

    it('should return false if subscription not found', async () => {
      const mockDelete = mockDatabaseService.db.delete();
      mockDelete.returning.mockResolvedValue([]);

      const result = await repository.deleteSubscription('user-1', 'non-existent');

      expect(result).toBe(false);
    });
  });
});
