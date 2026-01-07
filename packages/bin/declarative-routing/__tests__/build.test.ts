import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock functions using vi.hoisted to ensure proper hoisting
const { subscribeMock, buildFilesMock, finishedProcessingMock, processFileMock, fileRemovedMock, hasConfigMock, getConfigMock, absoluteFilePathMock } = vi.hoisted(() => ({
  subscribeMock: vi.fn(),
  buildFilesMock: vi.fn(),
  finishedProcessingMock: vi.fn(),
  processFileMock: vi.fn(),
  fileRemovedMock: vi.fn(),
  hasConfigMock: vi.fn(),
  getConfigMock: vi.fn(),
  absoluteFilePathMock: vi.fn(),
}))

vi.mock('@parcel/watcher', () => ({
  subscribe: subscribeMock,
}))
vi.mock('../src/shared/build-tools', () => ({
  buildFiles: buildFilesMock,
}))
vi.mock('../src/shared/watch', () => ({
  finishedProcessing: finishedProcessingMock,
  processFile: processFileMock,
  fileRemoved: fileRemovedMock,
}))
vi.mock('../src/config', () => ({
  hasConfig: hasConfigMock,
  getConfig: getConfigMock,
  absoluteFilePath: absoluteFilePathMock,
}))

// Now import the module that uses these mocks
import { build } from '../src/shared/build'

describe('build command', () => {
  let processOnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock process.on to prevent actual signal handlers
    processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('without watch option', () => {
    it('should run buildFiles when config exists', async () => {
      hasConfigMock.mockReturnValue(true)
      buildFilesMock.mockResolvedValue(undefined)

      await build.parseAsync(['node', 'test'])

      expect(buildFilesMock).toHaveBeenCalledTimes(1)
    })

    it('should show error when config does not exist', async () => {
      hasConfigMock.mockReturnValue(false)

      await build.parseAsync(['node', 'test'])

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('NOT been initialized')
      )
      expect(buildFilesMock).not.toHaveBeenCalled()
    })
  })

  describe('with watch option', () => {
    let mockSubscription: { unsubscribe: ReturnType<typeof vi.fn> }

    beforeEach(() => {
      mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(undefined)
      }
      subscribeMock.mockResolvedValue(mockSubscription as any)
      buildFilesMock.mockResolvedValue(undefined)
      finishedProcessingMock.mockReturnValue(undefined)
    })

    it('should subscribe to file watcher for nextjs mode', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockImplementation((cfg, p) => `${cfg.src}/${p}`)

      const promise = build.parseAsync(['node', 'test', '--watch'])

      // Let the watcher initialize
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(subscribeMock).toHaveBeenCalledWith(
        'src/app',
        expect.any(Function),
        expect.objectContaining({
          ignore: expect.arrayContaining([
            '**/node_modules/**',
            '**/.git/**',
            '**/.next/**'
          ])
        })
      )

      expect(buildFilesMock).toHaveBeenCalled()
      expect(finishedProcessingMock).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Watching for changes')
      )
    })

    it('should handle create events for info files', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockReturnValue('src/app')
      processFileMock.mockReturnValue(undefined)

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      // Get the callback function
      const callback = subscribeMock.mock.calls[0][1]

      // Simulate a create event
      callback(null, [
        {
          type: 'create',
          path: 'src/app/users/route.info.ts'
        }
      ] as any)

      expect(processFileMock).toHaveBeenCalledWith('users/route.info.ts')
    })

    it('should handle update events for route files', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockReturnValue('src/app')
      processFileMock.mockReturnValue(undefined)

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      const callback = subscribeMock.mock.calls[0][1]

      callback(null, [
        {
          type: 'update',
          path: 'src/app/users/page.tsx'
        }
      ] as any)

      expect(processFileMock).toHaveBeenCalledWith('users/page.tsx')
    })

    it('should handle delete events', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockReturnValue('src/app')
      fileRemovedMock.mockReturnValue(undefined)

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      const callback = subscribeMock.mock.calls[0][1]

      callback(null, [
        {
          type: 'delete',
          path: 'src/app/users/route.info.ts'
        }
      ] as any)

      expect(fileRemovedMock).toHaveBeenCalledWith('users/route.info.ts')
    })

    it('should ignore non-route files', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockReturnValue('src/app')

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      const callback = subscribeMock.mock.calls[0][1]

      callback(null, [
        {
          type: 'create',
          path: 'src/app/users/utils.ts'
        }
      ] as any)

      expect(processFileMock).not.toHaveBeenCalled()
      expect(fileRemovedMock).not.toHaveBeenCalled()
    })

    it('should handle qwikcity route files', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'qwikcity',
        src: 'src/routes',
        routes: 'src/components/routes'
      })
      absoluteFilePathMock.mockReturnValue('src/routes')
      processFileMock.mockReturnValue(undefined)

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      const callback = subscribeMock.mock.calls[0][1]

      // Qwikcity uses routeInfo.ts and index.tsx
      callback(null, [
        {
          type: 'create',
          path: 'src/routes/users/routeInfo.ts'
        }
      ] as any)

      expect(processFileMock).toHaveBeenCalledWith('users/routeInfo.ts')
    })

    it('should handle Windows paths correctly', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockReturnValue('C:\\project\\src\\app')
      processFileMock.mockReturnValue(undefined)

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      const callback = subscribeMock.mock.calls[0][1]

      // Windows-style path with backslashes
      callback(null, [
        {
          type: 'create',
          path: 'C:\\project\\src\\app\\users\\route.info.ts'
        }
      ] as any)

      // Should convert Windows path to posix-style
      expect(processFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/users[\/\\]route\.info\.ts$/)
      )
    })

    it('should handle watcher errors gracefully', async () => {
      hasConfigMock.mockReturnValue(true)
      getConfigMock.mockReturnValue({
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      })
      absoluteFilePathMock.mockReturnValue('src/app')

      const promise = build.parseAsync(['node', 'test', '--watch'])

      await new Promise(resolve => setTimeout(resolve, 100))

      const callback = subscribeMock.mock.calls[0][1]

      const error = new Error('Watch error')
      callback(error, [])

      expect(console.error).toHaveBeenCalledWith('Watch error:', error)
    })
  })
})
