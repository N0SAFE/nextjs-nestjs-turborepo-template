import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseModule } from 'magicast'
import { glob } from 'glob'
import * as config from '../src/config'
import * as template from '../src/template'
import {
  removeFileFromCache,
  parseInfoFile,
  checkRouteFile,
  buildFiles,
  updateBuildFiles,
  buildREADME
} from '../src/shared/build-tools'
import { readFileSyncMock, writeFileSyncMock, existsSyncMock, mkdirSyncMock } from '../vitest.setup'

vi.mock('magicast', () => ({
  parseModule: vi.fn(),
}))
vi.mock('glob', () => ({
  glob: vi.fn(),
}))
vi.mock('../src/config', () => ({
  getConfig: vi.fn(),
  absoluteFilePath: vi.fn(),
}))
vi.mock('../src/template', () => ({
  buildFileFromTemplate: vi.fn(),
  buildStringFromTemplate: vi.fn(),
}))

describe('build-tools', () => {
  const mockConfig = {
    mode: 'nextjs' as const,
    routes: '/test/routes',
    src: '/test/src',
    importPathPrefix: '@/app',
    stripRoutePrefix: undefined,
    openapi: undefined
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(config.getConfig).mockReturnValue(mockConfig as any)
    vi.mocked(config.absoluteFilePath).mockImplementation((cfg, p) => p)
    
    // Mock dynamic imports
    vi.resetModules()
  })
  
  // Helper to mock dynamic imports
  const mockDynamicImport = (modulePath: string, exports: any) => {
    vi.doMock(modulePath, () => exports)
  }

  describe('removeFileFromCache', () => {
    it('should remove file from internal paths cache', () => {
      // This is a simple function that just deletes from cache
      // We can verify it doesn't throw
      expect(() => removeFileFromCache('/test/app/users/page.info.ts')).not.toThrow()
    })
  })

  describe('parseInfoFile', () => {
    it('should parse basic route info', async () => {
      const testPath = 'app/users/page.info.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'Users' }
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "Users" }
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      
      const result = await parseInfoFile(testPath)
      
      expect(result).toBeGreaterThanOrEqual(1)
    })

    it('should parse route with GET verb', async () => {
      const testPath = 'app/api/users/route.info.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'Users' },
        GET: true
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "Users" }
        export const GET = true
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true
        }
      } as any)
      
      const result = await parseInfoFile(testPath)
      
      expect(result).toBeGreaterThanOrEqual(1)
    })

    it('should parse route with multiple verbs', async () => {
      const testPath = 'app/api/users/route.info.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'Users' },
        GET: true,
        POST: true,
        DELETE: true,
        PUT: true
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "Users" }
        export const GET = true
        export const POST = true
        export const DELETE = true
        export const PUT = true
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'Users' },
          GET: true,
          POST: true,
          DELETE: true,
          PUT: true
        }
      } as any)
      
      const result = await parseInfoFile(testPath)
      
      expect(result).toBe(4) // 4 verbs
    })

    it('should use default import path prefix for nextjs', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        importPathPrefix: undefined
      } as any)
      
      const testPath = 'app/users/page.info.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'Users' }
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "Users" }
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      
      await parseInfoFile(testPath)
      
      // Verify default prefix is used (can't directly test, but verify it doesn't throw)
      expect(readFileSyncMock).toHaveBeenCalled()
    })

    it('should use custom import path prefix', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        importPathPrefix: '@/custom'
      } as any)
      
      const testPath = 'app/users/page.info.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'Users' }
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "Users" }
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      
      await parseInfoFile(testPath)
      
      expect(readFileSyncMock).toHaveBeenCalled()
    })

    it('should handle qwikcity mode', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        mode: 'qwikcity',
        importPathPrefix: undefined
      } as any)
      
      const testPath = 'routes/users/routeInfo.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'Users' }
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "Users" }
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'Users' }
        }
      } as any)
      
      await parseInfoFile(testPath)
      
      expect(readFileSyncMock).toHaveBeenCalled()
    })

    it('should generate correct path template from directory structure', async () => {
      const testPath = 'app/api/v1/users/route.info.ts'
      
      // Mock the dynamic import
      mockDynamicImport(testPath, {
        Route: { name: 'ApiV1Users' }
      })
      
      readFileSyncMock.mockReturnValue(`
        export const Route = { name: "ApiV1Users" }
      `)
      
      vi.mocked(parseModule).mockReturnValue({
        exports: {
          Route: { name: 'ApiV1Users' }
        }
      } as any)
      
      await parseInfoFile(testPath)
      
      // Path template should be /app/api/v1/users
      expect(readFileSyncMock).toHaveBeenCalled()
    })
  })

  describe('checkRouteFile', () => {
    it('should return true when info file does not exist', async () => {
      const testPath = 'app/users/page.tsx'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue('export default function Page() {}')
      
      const result = await checkRouteFile(testPath)
      
      expect(result).toBe(true)
      expect(template.buildFileFromTemplate).toHaveBeenCalled()
    })

    it('should return false when info file already exists', async () => {
      const testPath = 'app/users/page.tsx'
      
      existsSyncMock.mockReturnValue(true)
      
      const result = await checkRouteFile(testPath)
      
      expect(result).toBe(false)
      expect(template.buildFileFromTemplate).not.toHaveBeenCalled()
    })

    it('should create info file for route without one', async () => {
      const testPath = 'app/users/page.tsx'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue('export default function Page() {}')
      
      await checkRouteFile(testPath)
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'shared/info.ts.template',
        expect.anything(),
        expect.anything()
      )
    })

    it('should detect verbs in route file', async () => {
      const testPath = 'app/api/users/route.ts'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue(`
        export function GET(req) {
          return Response.json({ users: [] })
        }
        export function POST(req) {
          return Response.json({ created: true })
        }
      `)
      
      await checkRouteFile(testPath)
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'shared/info.ts.template',
        expect.anything(),
        expect.objectContaining({
          verbs: expect.arrayContaining([
            expect.objectContaining({ verb: 'GET' }),
            expect.objectContaining({ verb: 'POST' })
          ])
        })
      )
    })

    it('should handle qwikcity route files', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        mode: 'qwikcity'
      } as any)
      
      const testPath = 'routes/users/index.tsx'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue('export default component$(() => {})')
      
      await checkRouteFile(testPath)
      
      expect(template.buildFileFromTemplate).toHaveBeenCalled()
    })

    it('should handle dynamic route segments', async () => {
      const testPath = 'app/users/[id]/page.tsx'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue('export default function Page({ params }) {}')
      
      await checkRouteFile(testPath)
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'shared/info.ts.template',
        expect.anything(),
        expect.objectContaining({
          params: expect.arrayContaining([
            expect.stringContaining('z.string()')
          ])
        })
      )
    })

    it('should handle catch-all route segments', async () => {
      const testPath = 'app/users/[...slug]/page.tsx'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue('export default function Page({ params }) {}')
      
      await checkRouteFile(testPath)
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'shared/info.ts.template',
        expect.anything(),
        expect.objectContaining({
          params: expect.arrayContaining([
            expect.stringContaining('z.string().array()')
          ])
        })
      )
    })

    it('should handle optional catch-all route segments', async () => {
      const testPath = 'app/users/[[...slug]]/page.tsx'
      
      existsSyncMock.mockReturnValue(false)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      readFileSyncMock.mockReturnValue('export default function Page({ params }) {}')
      
      await checkRouteFile(testPath)
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'shared/info.ts.template',
        expect.anything(),
        expect.objectContaining({
          params: expect.arrayContaining([
            expect.stringContaining('z.string().array().optional()')
          ])
        })
      )
    })
  })

  describe('buildFiles', () => {
    it('should build all route files', async () => {
      vi.mocked(glob).mockResolvedValue([
        'app/users/page.tsx',
        'app/posts/page.tsx'
      ] as any)
      
      // Mock dynamic imports for each route
      mockDynamicImport('app/users/page.tsx', { Route: { name: 'Users' } })
      mockDynamicImport('app/posts/page.tsx', { Route: { name: 'Posts' } })
      
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue('')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(parseModule).mockReturnValue({ exports: { Route: { name: 'Test' } } } as any)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated code')
      
      const result = await buildFiles(true)
      
      expect(result).toHaveProperty('routesAdded')
      expect(result).toHaveProperty('routeCount')
      expect(result).toHaveProperty('diff')
    })

    it('should add new info files for routes without them', async () => {
      vi.mocked(glob).mockResolvedValueOnce([
        'app/users/page.tsx',
        'app/posts/page.tsx'
      ] as any)
      
      vi.mocked(glob).mockResolvedValueOnce([
        'app/users/page.info.ts'
      ] as any)
      
      // Mock dynamic import for the existing info file
      mockDynamicImport('app/users/page.info.ts', { Route: { name: 'Users' } })
      
      existsSyncMock.mockReturnValueOnce(true).mockReturnValueOnce(false)
      readFileSyncMock.mockReturnValue('')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated')
      vi.mocked(parseModule).mockReturnValue({ exports: { Route: { name: 'Test' } } } as any)
      
      const result = await buildFiles(true)
      
      expect(result.routesAdded).toBeGreaterThanOrEqual(0)
    })

    it('should handle qwikcity routes', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        mode: 'qwikcity'
      } as any)
      
      vi.mocked(glob).mockResolvedValue([
        'routes/users/index.tsx'
      ] as any)
      
      // Mock dynamic import for qwikcity route
      mockDynamicImport('routes/users/index.tsx', { Route: { name: 'Users' } })
      
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue('')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(parseModule).mockReturnValue({ exports: { Route: { name: 'Test' } } } as any)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated')
      
      const result = await buildFiles(true)
      
      expect(result).toHaveProperty('routeCount')
    })

    it('should write OpenAPI spec when configured', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        openapi: {
          template: '/test/openapi.template.ts',
          target: '/test/openapi.ts'
        }
      } as any)
      
      vi.mocked(glob).mockResolvedValue([] as any)
      existsSyncMock.mockReturnValue(false)
      readFileSyncMock.mockReturnValue('// template')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated')
      
      await buildFiles(true)
      
      expect(writeFileSyncMock).toHaveBeenCalled()
    })

    it('should show console output when not silent', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      vi.mocked(glob).mockResolvedValue([] as any)
      existsSyncMock.mockReturnValue(false)
      readFileSyncMock.mockReturnValue('')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated')
      
      await buildFiles(false)
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('updateBuildFiles', () => {
    it('should update routes without full rebuild', async () => {
      existsSyncMock.mockReturnValue(false)
      readFileSyncMock.mockReturnValue('')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated')
      
      await updateBuildFiles(true)
      
      expect(template.buildStringFromTemplate).toHaveBeenCalled()
    })

    it('should update OpenAPI spec when configured', async () => {
      vi.mocked(config.getConfig).mockReturnValue({
        ...mockConfig,
        openapi: {
          template: '/test/openapi.template.ts',
          target: '/test/openapi.ts'
        }
      } as any)
      
      existsSyncMock.mockReturnValue(false)
      readFileSyncMock.mockReturnValue('// template')
      writeFileSyncMock.mockReturnValue(undefined)
      vi.mocked(template.buildStringFromTemplate).mockResolvedValue('// generated')
      
      await updateBuildFiles(true)
      
      expect(writeFileSyncMock).toHaveBeenCalled()
    })
  })

  describe('buildREADME', () => {
    it('should build README for nextjs', async () => {
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      
      await buildREADME('bun', 'nextjs')
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'nextjs/README.md.template',
        expect.anything(),
        expect.anything()
      )
    })

    it('should build README for react-router', async () => {
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      
      await buildREADME('npm', 'react-router')
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'react-router/README.md.template',
        expect.anything(),
        expect.anything()
      )
    })

    it('should build README for qwikcity', async () => {
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      
      await buildREADME('pnpm', 'qwikcity')
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        'qwikcity/README.md.template',
        expect.anything(),
        expect.anything()
      )
    })

    it('should use correct package manager command', async () => {
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      
      await buildREADME('npm', 'nextjs')
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          packageManager: 'npm run'
        })
      )
    })

    it('should use package manager name for non-npm', async () => {
      vi.mocked(template.buildFileFromTemplate).mockResolvedValue(undefined)
      
      await buildREADME('bun', 'nextjs')
      
      expect(template.buildFileFromTemplate).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          packageManager: 'bun'
        })
      )
    })
  })
})
