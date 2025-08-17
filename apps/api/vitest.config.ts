import { defineConfig } from 'vitest/config'
import * as path from 'path'
// Import createNodeConfig from CJS export; TypeScript may not infer types from subpath properly in Docker context
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createNodeConfig } = require('@repo/vitest-config/node')

export default defineConfig(
  createNodeConfig({
    test: {
      name: 'api',
      environment: 'node',
      setupFiles: ['./vitest.setup.ts'],
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
      exclude: ['node_modules', 'dist', 'uploads', 'database', 'drizzle', 'src/app.module.spec.ts'],
      globals: true,
      coverage: {
        provider: 'istanbul', // Switch to istanbul for Bun compatibility
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        clean: true,
        thresholds: {
          global: {
            branches: 90, // Set to 90% for now, will work toward 100%
            functions: 90,
            lines: 90,
            statements: 90
          }
        },
        exclude: [
          'coverage/**',
          'dist/**',
          'node_modules/**',
          '**/*.d.ts',
          '**/drizzle/**',
          '**/migrations/**',
          'src/main.ts', // Entry point excluded as it's hard to test in isolation
          '**/*.config.*',
          '**/symbols.ts', // Constants file
          '**/index.ts' // Barrel exports
        ]
      },
      // Increase timeout for database operations
      testTimeout: 15000,
      hookTimeout: 15000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './'),
      },
    },
  })
)
