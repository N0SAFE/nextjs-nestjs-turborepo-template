/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createBaseConfig } from './base'

/**
 * Next.js-specific Vitest configuration
 */
export const createNextJsConfig = (overrides: any = {}) => {
  const baseConfig = createBaseConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.nextjs.js'],
      globals: true,
    },
    ...overrides,
  })

  return baseConfig
}

export const defaultConfig = createNextJsConfig()

export default defaultConfig
