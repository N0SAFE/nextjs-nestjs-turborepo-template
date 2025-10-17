/**
 * Main entry point for @repo/eject-customize
 */

export * from './types/index.js'
export * from './utils/index.js'

// Export Framework Swapping (Phase 6)
export * from './swap/index.js'

// Export placeholder orchestrators (to be implemented in Phase 3 and 5)
export interface EjectOrchestrator {
  eject(): Promise<void>
}

export interface CustomizeOrchestrator {
  customize(): Promise<void>
}

export function createEjectOrchestrator(): EjectOrchestrator {
  return {
    eject: async () => {
      throw new Error('Not implemented in Phase 1')
    },
  }
}

export function createCustomizeOrchestrator(): CustomizeOrchestrator {
  return {
    customize: async () => {
      throw new Error('Not implemented in Phase 1')
    },
  }
}
