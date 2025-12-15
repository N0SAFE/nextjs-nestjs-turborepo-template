/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createBaseConfig } from './base.js'

/**
 * React-specific Vitest configuration
 */
export const createReactConfig = (overrides: any = {}) => {
  const baseConfig = createBaseConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.react.js'],
      globals: true,
    },
    resolve: {
      alias: {
        '@': './src',
        '~': './',
      },
    },
    ...overrides,
  })

  return baseConfig
}

export const defaultConfig = createReactConfig()

export default defaultConfig
