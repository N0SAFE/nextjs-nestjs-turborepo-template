/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { createBaseConfig } from './base.js'

/**
 * Node.js-specific Vitest configuration
 */
export const createNodeConfig = (overrides: any = {}) => {
  const baseConfig = createBaseConfig({
    test: {
      environment: 'node',
      setupFiles: ['./vitest.setup.node.js'],
      globals: true,
    },
    ...overrides,
  })

  return baseConfig
}

export const defaultConfig = createNodeConfig()

export default defaultConfig
