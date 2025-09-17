import { beforeAll, beforeEach, afterAll, vi } from 'vitest';
import 'reflect-metadata';

// Set up test environment variables BEFORE any other imports to ensure they're available
// when modules are loaded and the env schema is validated
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.AUTH_SECRET = 'test-auth-secret-key-for-testing-only';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.API_PORT = '3001';
process.env.PASSKEY_RPID = 'localhost';
process.env.PASSKEY_RPNAME = 'NestJS Directus Turborepo Template';
process.env.PASSKEY_ORIGIN = 'http://localhost:3000';

// Global test setup for NestJS API
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

// Mock environment variables for testing
beforeAll(() => {
  // Mock console methods for cleaner test output
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Mock external dependencies
vi.mock('better-auth', () => ({
  betterAuth: vi.fn(() => ({
    api: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  })),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

// Mock database connection
vi.mock('./src/db/database-connection', () => ({
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
}));

// Mock OS hostname for logger middleware
vi.mock('os', () => ({
  hostname: vi.fn(() => 'test-hostname'),
}));

// Mock @orpc/nest for controller testing
vi.mock('@orpc/nest', () => ({
  Implement: vi.fn(() => (target: any, propertyKey: string) => {}),
  implement: vi.fn((contract: any) => ({
    handler: vi.fn((handlerFn: Function) => {
      // Return a handler that preserves the original function context
      return {
        handler: handlerFn,
      };
    }),
  })),
}));