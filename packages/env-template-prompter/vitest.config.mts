import { defineConfig } from 'vitest/config';

import { createNodeConfig } from '@repo/vitest-config/node'

export default defineConfig(
  createNodeConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['__tests__/**/*.{test,spec}.{js,ts}'],
      exclude: ['node_modules', 'dist'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          'tests/',
          'src/types/',
          '**/*.d.ts',
          '**/*.test.ts',
          '**/*.spec.ts'
        ],
        thresholds: {
          global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
          }
        }
      },
      testTimeout: 10000,
      hookTimeout: 10000
    },
    resolve: {
      alias: {
        '@': './src',
        '@tests': './tests'
      }
    }
  })
);
