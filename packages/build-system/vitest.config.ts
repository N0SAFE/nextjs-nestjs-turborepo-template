import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 60000, // 60 seconds for e2e tests
    hookTimeout: 30000,
    isolate: false, // Run tests in the same context to avoid NestJS initialization issues
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        'test/**',
      ],
    },
  },
});
