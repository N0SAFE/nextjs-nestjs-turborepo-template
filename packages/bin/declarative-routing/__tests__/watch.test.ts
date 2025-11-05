import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSyncMock, readFileSyncMock } from '../vitest.setup'

// Create mock functions using vi.hoisted to ensure proper hoisting
const { parseModuleMock, buildFilesMock, removeFileFromCacheMock, updateBuildFilesMock, parseInfoFileMock, checkRouteFileMock, getConfigMock, absoluteFilePathMock } = vi.hoisted(() => ({
  parseModuleMock: vi.fn(),
  buildFilesMock: vi.fn(),
  removeFileFromCacheMock: vi.fn(),
  updateBuildFilesMock: vi.fn(),
  parseInfoFileMock: vi.fn(),
  checkRouteFileMock: vi.fn(),
  getConfigMock: vi.fn(),
  absoluteFilePathMock: vi.fn(),
}))

vi.mock('magicast', () => ({
  parseModule: parseModuleMock,
}))
vi.mock('../src/shared/build-tools', () => ({
  buildFiles: buildFilesMock,
  removeFileFromCache: removeFileFromCacheMock,
  updateBuildFiles: updateBuildFilesMock,
  parseInfoFile: parseInfoFileMock,
  checkRouteFile: checkRouteFileMock,
}))
vi.mock('../src/config', () => ({
  getConfig: getConfigMock,
  absoluteFilePath: absoluteFilePathMock,
}))

// Import the modules AFTER mocks are set up
import * as buildTools from '../src/shared/build-tools'
import {
  processFile,
  finishedProcessing,
  fileRemoved
} from '../src/shared/watch'

describe('watch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default config mock
    getConfigMock.mockReturnValue({
      mode: 'nextjs',
      routes: '/test/routes',
      importPathPrefix: '@/app',
      stripRoutePrefix: undefined
    } as any)
    
    absoluteFilePathMock.mockImplementation((cfg, path) => path)
  })

  describe('processFile', () => {
    it('should process info file on first encounter', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      readFileSyncMock.mockReturnValue('export const Route = { name: "Users" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true
        }
      } as any)
      
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      
      // Should trigger parsing for new file
      expect(parseInfoFileMock).toHaveBeenCalledWith(testPath)
    })

    it('should skip rebuild when only content changes but route name stays same', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      // First call - establish baseline
      readFileSyncMock.mockReturnValue(
        'export const Route = { name: "Users" }\nexport const GET = true'
      )
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      
      // Clear the mock to check second call
      vi.clearAllMocks()
      
      // Second call - content changed but route info is the same
      readFileSyncMock.mockReturnValue(
        'export const Route = { name: "Users" }\nexport const GET = true\n// Added comment'
      )
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true
        }
      } as any)
      
      finishedProcessing()
      processFile(testPath)
      
      // Should NOT call parseInfoFile again since relevant content is the same
      // The function returns early when hasRelevantChanges() is false
      expect(parseInfoFileMock).not.toHaveBeenCalled()
    })

    it('should rebuild when route name changes', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      // First call
      readFileSyncMock.mockReturnValue('export const Route = { name: "Users" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
      
      // Second call with different route name
      readFileSyncMock.mockReturnValue('export const Route = { name: "UserList" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'UserList' }
        }
      } as any)
      
      finishedProcessing()
      processFile(testPath)
      
      // Should call parseInfoFile again
      expect(parseInfoFileMock).toHaveBeenCalledTimes(2)
    })

    it('should rebuild when HTTP verbs change', async () => {
      const testPath = '/test/app/api/users/route.info.ts'
      
      // First call - only GET
      readFileSyncMock.mockReturnValue('export const GET = true')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
      
      // Second call - GET and POST
      readFileSyncMock.mockReturnValue('export const GET = true\nexport const POST = true')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true,
          POST: true
        }
      } as any)
      
      finishedProcessing()
      processFile(testPath)
      
      // Should call parseInfoFile again because verbs changed
      expect(parseInfoFileMock).toHaveBeenCalledTimes(2)
    })

    it('should handle qwikcity route info files', async () => {
      getConfigMock.mockReturnValue({
        mode: 'qwikcity',
        routes: '/test/routes',
        importPathPrefix: '@/routes',
        stripRoutePrefix: undefined
      } as any)
      
      const testPath = '/test/app/users/routeInfo.ts'
      
      readFileSyncMock.mockReturnValue('export const Route = { name: "Users" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      
      expect(parseInfoFileMock).toHaveBeenCalledWith(testPath)
    })

    it('should process route files', async () => {
      const testPath = '/test/app/users/page.tsx'
      
      checkRouteFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      
      // Route files should always be processed (we need to check for verbs)
      expect(checkRouteFileMock).toHaveBeenCalledWith(testPath)
    })

    it('should handle parsing errors gracefully', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      readFileSyncMock.mockReturnValue('invalid typescript')
      parseModuleMock.mockImplementation(() => {
        throw new Error('Parse error')
      })
      parseInfoFileMock.mockResolvedValue(undefined)
      
      // Should not throw, should treat as changed
      processFile(testPath)
      
      expect(parseInfoFileMock).toHaveBeenCalled()
    })

    it('should handle qwikcity route files', async () => {
      getConfigMock.mockReturnValue({
        mode: 'qwikcity',
        routes: '/test/routes',
        importPathPrefix: '@/routes',
        stripRoutePrefix: undefined
      } as any)
      
      const testPath = '/test/app/users/index.tsx'
      
      checkRouteFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      
      expect(checkRouteFileMock).toHaveBeenCalledWith(testPath)
    })

    it('should handle api route files', async () => {
      const testPath = '/test/app/api/users/route.ts'
      
      checkRouteFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      
      expect(checkRouteFileMock).toHaveBeenCalledWith(testPath)
    })
  })

  describe('finishedProcessing', () => {
    it('should enable real-time mode after initial processing', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      readFileSyncMock.mockReturnValue('export const Route = { name: "Users" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      updateBuildFilesMock.mockResolvedValue(undefined)
      
      // Process a file first
      processFile(testPath)
      
      // Simulate file processing completion
      await vi.waitFor(() => {
        expect(parseInfoFileMock).toHaveBeenCalled()
      })
      
      // Call finishedProcessing
      finishedProcessing()
      
      // Now process the same file again with different content
      readFileSyncMock.mockReturnValue('export const Route = { name: "UserList" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'UserList' }
        }
      } as any)
      
      processFile(testPath)
      
      // In real-time mode, updateBuildFiles should be called
      await vi.waitFor(() => {
        expect(buildTools.updateBuildFiles).toHaveBeenCalled()
      })
    })
  })

  describe('fileRemoved', () => {
    it('should remove file from cache and update build', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      removeFileFromCacheMock.mockReturnValue(undefined)
      updateBuildFilesMock.mockResolvedValue(undefined)
      
      fileRemoved(testPath)
      
      expect(buildTools.removeFileFromCache).toHaveBeenCalledWith(testPath)
      expect(buildTools.updateBuildFiles).toHaveBeenCalled()
    })

    it('should handle multiple file removals', async () => {
      removeFileFromCacheMock.mockReturnValue(undefined)
      updateBuildFilesMock.mockResolvedValue(undefined)
      
      fileRemoved('/test/app/users/page.info.ts')
      fileRemoved('/test/app/posts/page.info.ts')
      fileRemoved('/test/app/settings/page.info.ts')
      
      expect(buildTools.removeFileFromCache).toHaveBeenCalledTimes(3)
      expect(buildTools.updateBuildFiles).toHaveBeenCalledTimes(3)
    })
  })

  describe('smart change detection', () => {
    it('should detect verb order changes as no change', async () => {
      const testPath = '/test/app/api/users/route.info.ts'
      
      // First call - GET, POST, DELETE
      readFileSyncMock.mockReturnValue('export const GET = true')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true,
          POST: true,
          DELETE: true
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
      
      // Second call - same verbs, different order (DELETE, GET, POST)
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          DELETE: true,
          GET: true,
          POST: true
        }
      } as any)
      
      finishedProcessing()
      processFile(testPath)
      
      // Should not rebuild - verbs are sorted internally
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
    })

    it('should detect case-sensitive route name changes', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      // First call - "Users"
      readFileSyncMock.mockReturnValue('export const Route = { name: "Users" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
      
      // Second call - "users" (lowercase)
      readFileSyncMock.mockReturnValue('export const Route = { name: "users" }')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'users' }
        }
      } as any)
      
      finishedProcessing()
      processFile(testPath)
      
      // Should rebuild - case matters
      expect(parseInfoFileMock).toHaveBeenCalledTimes(2)
    })

    it('should ignore whitespace and comment changes', async () => {
      const testPath = '/test/app/users/page.info.ts'
      
      // First call
      readFileSyncMock.mockReturnValue('export const Route={name:"Users"}')
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      parseInfoFileMock.mockResolvedValue(undefined)
      
      processFile(testPath)
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
      
      // Second call - same structure, different whitespace and comments
      readFileSyncMock.mockReturnValue(`
        // This is a comment
        export const Route = {
          name: "Users" // User list route
        }
      `)
      parseModuleMock.mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      
      finishedProcessing()
      processFile(testPath)
      
      // Should not rebuild - only formatting changed
      expect(parseInfoFileMock).toHaveBeenCalledTimes(1)
    })
  })
})
