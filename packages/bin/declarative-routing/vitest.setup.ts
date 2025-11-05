import { vi } from 'vitest'

// Global mock setup for all tests
// This ensures mocks are configured correctly before any test files import modules

// Create mock functions that will be shared across all tests
export const readFileSyncMock = vi.fn()
export const writeFileSyncMock = vi.fn()
export const existsSyncMock = vi.fn()
export const mkdirSyncMock = vi.fn()
export const readJSONSyncMock = vi.fn()
export const writeJSONSyncMock = vi.fn()

// Mock fs-extra with both default and named exports for compatibility
vi.mock('fs-extra', () => ({
  default: {
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    readJSONSync: readJSONSyncMock,
    writeJSONSync: writeJSONSyncMock,
  },
  readFileSync: readFileSyncMock,
  writeFileSync: writeFileSyncMock,
  existsSync: existsSyncMock,
  mkdirSync: mkdirSyncMock,
  readJSONSync: readJSONSyncMock,
  writeJSONSync: writeJSONSyncMock,
}))

// Mock fs (Node.js built-in) with both default and named exports
vi.mock('fs', () => ({
  default: {
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
    existsSync: existsSyncMock,
  },
  readFileSync: readFileSyncMock,
  writeFileSync: writeFileSyncMock,
  existsSync: existsSyncMock,
}))
