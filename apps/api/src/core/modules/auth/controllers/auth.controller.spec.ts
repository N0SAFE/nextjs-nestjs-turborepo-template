import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AUTH_INSTANCE_KEY } from '../types/symbols';
import type { Request, Response } from 'express';

// Mock the better-auth/node module
vi.mock('better-auth/node', () => ({
  toNodeHandler: vi.fn(() => vi.fn()),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuth: any;
  let mockHandler: any;

  beforeEach(async () => {
    mockHandler = vi.fn();
    mockAuth = {
      api: {
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
      },
      handler: mockHandler,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH_INSTANCE_KEY,
          useValue: mockAuth,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleAuth', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockRequest = {
        method: 'POST',
        url: '/api/auth/sign-in',
        headers: {},
        body: {},
      };

      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      };
    });

    it('should handle auth request successfully', async () => {
      // Mock the handler to resolve successfully
      (controller as any).handler.mockResolvedValue(undefined);

      await controller.handleAuth(mockRequest as Request, mockResponse as Response);

      expect((controller as any).handler).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it('should handle auth request errors', async () => {
      const error = new Error('Auth handler failed');
      (controller as any).handler.mockRejectedValue(error);

      await expect(
        controller.handleAuth(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Authentication request failed');

      expect((controller as any).handler).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it('should log debug information for requests', async () => {
      const loggerSpy = vi.spyOn((controller as any).logger, 'debug');
      (controller as any).handler.mockResolvedValue(undefined);

      await controller.handleAuth(mockRequest as Request, mockResponse as Response);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Handling auth request: POST /api/auth/sign-in'
      );
    });

    it('should log error information when handler fails', async () => {
      const error = new Error('Handler error');
      const loggerSpy = vi.spyOn((controller as any).logger, 'error');
      (controller as any).handler.mockRejectedValue(error);

      await expect(
        controller.handleAuth(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith('Error handling auth request:', error);
    });
  });
});