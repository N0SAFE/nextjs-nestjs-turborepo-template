/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { createNodeConfig } from '@repo/vitest-config'

export default defineConfig(
  createNodeConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['__tests__/**/*.test.{ts,js}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        clean: true,
      },
      testTimeout: 10000,
      hookTimeout: 10000,
    },
    resolve: {
      alias: {
        '@': './src',
        '~': './',
      },
    },
  })
)
