import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { MODULE_OPTIONS_TOKEN } from '../definitions/auth-module-definition';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: any;

  beforeEach(async () => {
    mockAuth = {
      api: {
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
      },
      handler: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: {
            auth: mockAuth,
            disableTrustedOriginsCors: false,
            disableBodyParser: false,
            disableGlobalAuthGuard: false,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('api getter', () => {
    it('should return auth api instance', () => {
      const api = service.api;
      
      expect(api).toBe(mockAuth.api);
      expect(api).toHaveProperty('signUp');
      expect(api).toHaveProperty('signIn');
      expect(api).toHaveProperty('signOut');
      expect(api).toHaveProperty('getSession');
    });
  });

  describe('instance getter', () => {
    it('should return complete auth instance', () => {
      const instance = service.instance;
      
      expect(instance).toBe(mockAuth);
      expect(instance).toHaveProperty('api');
      expect(instance).toHaveProperty('handler');
    });
  });
});