import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PushService } from './push.service';
import { PushRepository } from '../repositories/push.repository';
import * as webpush from 'web-push';

// Mock web-push module
vi.mock('web-push', () => ({
  default: {
    generateVAPIDKeys: vi.fn(),
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
  generateVAPIDKeys: vi.fn(),
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

describe('PushService', () => {
  let service: PushService;
  let mockRepository: any;

  const mockVapidKeys = {
    id: 'vapid-1',
    userId: 'user-1',
    publicKey: 'BNhZW5J9ILjt1234567890abcdefghijklmnopqrstuvwxyz',
    privateKey: 'mock-private-key-1234567890',
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
    userAgent: 'Mozilla/5.0 Chrome',
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    lastUsedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    mockRepository = {
      findVapidKeysByUserId: vi.fn(),
      createVapidKeys: vi.fn(),
      findSubscriptionByEndpoint: vi.fn(),
      findActiveSubscriptionsByUserId: vi.fn(),
      findAllSubscriptionsByUserId: vi.fn(),
      createSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      updateSubscriptionLastUsed: vi.fn(),
      markSubscriptionInactive: vi.fn(),
      deleteSubscription: vi.fn(),
    };

    // Reset web-push mocks
    (webpush.generateVAPIDKeys as any).mockReturnValue({
      publicKey: mockVapidKeys.publicKey,
      privateKey: mockVapidKeys.privateKey,
    });
    (webpush.setVapidDetails as any).mockReturnValue(undefined);
    (webpush.sendNotification as any).mockResolvedValue({ statusCode: 201, body: '', headers: {} });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PushService,
          useFactory: () => new PushService(mockRepository),
        },
      ],
    }).compile();

    service = module.get<PushService>(PushService);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('generateUserVapidKeys', () => {
    it('should generate VAPID keys for a new user', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(null);
      mockRepository.createVapidKeys.mockResolvedValue(mockVapidKeys);

      const result = await service.generateUserVapidKeys('user-1');

      expect(result).toEqual(mockVapidKeys);
      expect(webpush.generateVAPIDKeys).toHaveBeenCalled();
      expect(mockRepository.createVapidKeys).toHaveBeenCalledWith(
        'user-1',
        mockVapidKeys.publicKey,
        mockVapidKeys.privateKey,
        'mailto:user-user-1@notifications.local'
      );
    });

    it('should return existing VAPID keys if already exist', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);

      const result = await service.generateUserVapidKeys('user-1');

      expect(result).toEqual(mockVapidKeys);
      expect(webpush.generateVAPIDKeys).not.toHaveBeenCalled();
      expect(mockRepository.createVapidKeys).not.toHaveBeenCalled();
    });
  });

  describe('getUserPublicKey', () => {
    it('should return existing public key', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);

      const result = await service.getUserPublicKey('user-1');

      expect(result).toBe(mockVapidKeys.publicKey);
    });

    it('should auto-generate keys if not exist', async () => {
      // First call in getUserPublicKey returns null
      mockRepository.findVapidKeysByUserId.mockResolvedValueOnce(null);
      // Second call in generateUserVapidKeys also returns null
      mockRepository.findVapidKeysByUserId.mockResolvedValueOnce(null);
      // Then createVapidKeys is called
      mockRepository.createVapidKeys.mockResolvedValue(mockVapidKeys);

      const result = await service.getUserPublicKey('user-1');

      expect(result).toBe(mockVapidKeys.publicKey);
      expect(mockRepository.createVapidKeys).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    const subscribeInput = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/new-endpoint',
      keys: {
        p256dh: 'new-p256dh',
        auth: 'new-auth',
      },
      deviceName: 'Firefox',
      userAgent: 'Mozilla/5.0 Firefox',
    };

    it('should create a new subscription', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);
      mockRepository.findSubscriptionByEndpoint.mockResolvedValue(null);
      mockRepository.createSubscription.mockResolvedValue(mockSubscription);

      const result = await service.subscribe('user-1', subscribeInput);

      expect(result).toEqual(mockSubscription);
      expect(mockRepository.createSubscription).toHaveBeenCalledWith(
        'user-1',
        subscribeInput.endpoint,
        subscribeInput.keys.p256dh,
        subscribeInput.keys.auth,
        subscribeInput.deviceName,
        subscribeInput.userAgent
      );
    });

    it('should update existing subscription', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);
      mockRepository.findSubscriptionByEndpoint.mockResolvedValue(mockSubscription);
      mockRepository.updateSubscription.mockResolvedValue(mockSubscription);

      const result = await service.subscribe('user-1', subscribeInput);

      expect(result).toEqual(mockSubscription);
      expect(mockRepository.updateSubscription).toHaveBeenCalled();
      expect(mockRepository.createSubscription).not.toHaveBeenCalled();
    });

    it('should auto-generate VAPID keys if not exist', async () => {
      // First call in subscribe -> getUserPublicKey returns null
      mockRepository.findVapidKeysByUserId.mockResolvedValueOnce(null);
      // Second call in generateUserVapidKeys also returns null
      mockRepository.findVapidKeysByUserId.mockResolvedValueOnce(null);
      // Then createVapidKeys is called
      mockRepository.createVapidKeys.mockResolvedValue(mockVapidKeys);
      mockRepository.findSubscriptionByEndpoint.mockResolvedValue(null);
      mockRepository.createSubscription.mockResolvedValue(mockSubscription);

      await service.subscribe('user-1', subscribeInput);

      expect(mockRepository.createVapidKeys).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should delete a subscription', async () => {
      mockRepository.findSubscriptionByEndpoint.mockResolvedValue(mockSubscription);
      mockRepository.deleteSubscription.mockResolvedValue(true);

      const result = await service.unsubscribe('user-1', mockSubscription.endpoint);

      expect(result).toBe(true);
      expect(mockRepository.deleteSubscription).toHaveBeenCalledWith('user-1', mockSubscription.endpoint);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockRepository.findSubscriptionByEndpoint.mockResolvedValue(null);

      await expect(
        service.unsubscribe('user-1', 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subscription belongs to different user', async () => {
      mockRepository.findSubscriptionByEndpoint.mockResolvedValue({
        ...mockSubscription,
        userId: 'user-2',
      });

      await expect(
        service.unsubscribe('user-1', mockSubscription.endpoint)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserSubscriptions', () => {
    it('should return active subscriptions', async () => {
      mockRepository.findActiveSubscriptionsByUserId.mockResolvedValue([mockSubscription]);

      const result = await service.getUserSubscriptions('user-1');

      expect(result).toEqual([mockSubscription]);
    });

    it('should return empty array if no subscriptions', async () => {
      mockRepository.findActiveSubscriptionsByUserId.mockResolvedValue([]);

      const result = await service.getUserSubscriptions('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('sendToUser', () => {
    const notificationPayload = {
      title: 'Test Notification',
      body: 'This is a test',
      icon: '/icon.png',
    };

    it('should send notification to all user devices', async () => {
      const subscription2 = { ...mockSubscription, id: 'sub-2', deviceName: 'Firefox' };
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);
      mockRepository.findActiveSubscriptionsByUserId.mockResolvedValue([mockSubscription, subscription2]);
      mockRepository.updateSubscriptionLastUsed.mockResolvedValue(undefined);

      const result = await service.sendToUser('user-1', notificationPayload);

      expect(result).toEqual({
        success: 2,
        failed: 0,
        total: 2,
      });
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateSubscriptionLastUsed).toHaveBeenCalledTimes(2);
    });

    it('should handle failed notifications', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);
      mockRepository.findActiveSubscriptionsByUserId.mockResolvedValue([mockSubscription]);
      (webpush.sendNotification as any).mockRejectedValue(new Error('Network error'));

      const result = await service.sendToUser('user-1', notificationPayload);

      expect(result).toEqual({
        success: 0,
        failed: 1,
        total: 1,
      });
    });

    it('should mark expired subscriptions as inactive', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);
      mockRepository.findActiveSubscriptionsByUserId.mockResolvedValue([mockSubscription]);
      const expiredError: any = new Error('Gone');
      expiredError.statusCode = 410;
      (webpush.sendNotification as any).mockRejectedValue(expiredError);

      await service.sendToUser('user-1', notificationPayload);

      expect(mockRepository.markSubscriptionInactive).toHaveBeenCalledWith(mockSubscription.id);
    });

    it('should throw NotFoundException if VAPID keys not found', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(null);

      await expect(
        service.sendToUser('user-1', notificationPayload)
      ).rejects.toThrow(NotFoundException);
    });

    it('should return zero counts if no subscriptions', async () => {
      mockRepository.findVapidKeysByUserId.mockResolvedValue(mockVapidKeys);
      mockRepository.findActiveSubscriptionsByUserId.mockResolvedValue([]);

      const result = await service.sendToUser('user-1', notificationPayload);

      expect(result).toEqual({
        success: 0,
        failed: 0,
        total: 0,
      });
    });
  });

  describe('getUserStats', () => {
    it('should return statistics for a user', async () => {
      const activeSubscription = { ...mockSubscription, isActive: true };
      const inactiveSubscription = { ...mockSubscription, id: 'sub-2', isActive: false };
      mockRepository.findAllSubscriptionsByUserId.mockResolvedValue([
        activeSubscription,
        inactiveSubscription,
      ]);

      const result = await service.getUserStats('user-1');

      expect(result).toEqual({
        totalSubscriptions: 2,
        activeSubscriptions: 1,
        devices: [
          {
            deviceName: 'Chrome',
            lastUsed: mockSubscription.lastUsedAt,
          },
        ],
      });
    });

    it('should handle subscriptions without device name', async () => {
      const subscription = { ...mockSubscription, deviceName: null };
      mockRepository.findAllSubscriptionsByUserId.mockResolvedValue([subscription]);

      const result = await service.getUserStats('user-1');

      expect(result.devices[0].deviceName).toBe('Unknown Device');
    });

    it('should use createdAt if lastUsedAt is null', async () => {
      const subscription = { ...mockSubscription, lastUsedAt: null };
      mockRepository.findAllSubscriptionsByUserId.mockResolvedValue([subscription]);

      const result = await service.getUserStats('user-1');

      expect(result.devices[0].lastUsed).toBe(subscription.createdAt);
    });
  });
});
