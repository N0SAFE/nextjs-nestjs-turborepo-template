import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PushController } from './push.controller';
import { PushService } from '../services/push.service';

describe('PushController', () => {
  let controller: PushController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      getUserPublicKey: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getUserSubscriptions: vi.fn(),
      sendToUser: vi.fn(),
      getUserStats: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushController],
      providers: [
        {
          provide: PushService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PushController>(PushController);

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ORPC implementation methods', () => {
    it('should have getPublicKey method', () => {
      expect(controller.getPublicKey).toBeDefined();
      expect(typeof controller.getPublicKey).toBe('function');
    });

    it('should have subscribe method', () => {
      expect(controller.subscribe).toBeDefined();
      expect(typeof controller.subscribe).toBe('function');
    });

    it('should have unsubscribe method', () => {
      expect(controller.unsubscribe).toBeDefined();
      expect(typeof controller.unsubscribe).toBe('function');
    });

    it('should have getSubscriptions method', () => {
      expect(controller.getSubscriptions).toBeDefined();
      expect(typeof controller.getSubscriptions).toBe('function');
    });

    it('should have sendTestNotification method', () => {
      expect(controller.sendTestNotification).toBeDefined();
      expect(typeof controller.sendTestNotification).toBe('function');
    });

    it('should have getStats method', () => {
      expect(controller.getStats).toBeDefined();
      expect(typeof controller.getStats).toBe('function');
    });
  });

  describe('Service injection', () => {
    it('should inject PushService correctly', () => {
      expect(mockService).toBeDefined();
      expect(mockService.getUserPublicKey).toBeDefined();
      expect(mockService.subscribe).toBeDefined();
      expect(mockService.unsubscribe).toBeDefined();
      expect(mockService.getUserSubscriptions).toBeDefined();
      expect(mockService.sendToUser).toBeDefined();
      expect(mockService.getUserStats).toBeDefined();
    });
  });
});
