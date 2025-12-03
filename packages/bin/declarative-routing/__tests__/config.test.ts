import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as path from 'path'
import { getConfig, hasConfig, writeConfig, absoluteFilePath, type Config } from '../src/config'
import { readFileSyncMock, writeFileSyncMock, existsSyncMock } from '../vitest.setup'

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getConfig', () => {
    it('should read and parse valid config file', () => {
      const mockConfig: Config = {
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes',
        importPathPrefix: '@/app'
      }

      readFileSyncMock.mockReturnValue(JSON.stringify(mockConfig))

      const result = getConfig()

      expect(result).toEqual(mockConfig)
      expect(readFileSyncMock).toHaveBeenCalledWith(
        path.resolve('./declarative-routing.config.json')
      )
    })

    it('should parse config with openapi', () => {
      const mockConfig: Config = {
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes',
        openapi: {
          target: 'public/openapi.json',
          template: 'openapi-template.yml'
        }
      }

      readFileSyncMock.mockReturnValue(JSON.stringify(mockConfig))

      const result = getConfig()

      expect(result).toEqual(mockConfig)
      expect(result.openapi).toBeDefined()
      expect(result.openapi?.target).toBe('public/openapi.json')
    })

    it('should parse config with stripRoutePrefix', () => {
      const mockConfig: Config = {
        mode: 'react-router',
        src: 'src',
        routes: 'src/routes',
        stripRoutePrefix: 'app'
      }

      readFileSyncMock.mockReturnValue(JSON.stringify(mockConfig))

      const result = getConfig()

      expect(result.stripRoutePrefix).toBe('app')
    })

    it('should throw error for invalid mode', () => {
      const invalidConfig = {
        mode: 'invalid-mode',
        src: 'src/app',
        routes: 'src/routes'
      }

      readFileSyncMock.mockReturnValue(JSON.stringify(invalidConfig))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => getConfig()).toThrow()
      
      consoleErrorSpy.mockRestore()
    })

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        mode: 'nextjs'
        // Missing src and routes
      }

      readFileSyncMock.mockReturnValue(JSON.stringify(invalidConfig))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => getConfig()).toThrow()
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle qwikcity mode', () => {
      const mockConfig: Config = {
        mode: 'qwikcity',
        src: 'src/routes',
        routes: 'src/components/routes'
      }

      readFileSyncMock.mockReturnValue(JSON.stringify(mockConfig))

      const result = getConfig()

      expect(result.mode).toBe('qwikcity')
    })
  })

  describe('hasConfig', () => {
    it('should return true when config file exists', () => {
      existsSyncMock.mockReturnValue(true)

      const result = hasConfig()

      expect(result).toBe(true)
      expect(existsSyncMock).toHaveBeenCalledWith(
        path.resolve('./declarative-routing.config.json')
      )
    })

    it('should return false when config file does not exist', () => {
      existsSyncMock.mockReturnValue(false)

      const result = hasConfig()

      expect(result).toBe(false)
    })
  })

  describe('writeConfig', () => {
    it('should write valid config to file', () => {
      const mockConfig: Config = {
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes',
        importPathPrefix: '@/app'
      }

      writeConfig(mockConfig)

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.resolve('./declarative-routing.config.json'),
        JSON.stringify(mockConfig, null, 2)
      )
    })

    it('should write config with all optional fields', () => {
      const mockConfig: Config = {
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes',
        importPathPrefix: '@/app',
        stripRoutePrefix: 'app',
        openapi: {
          target: 'public/openapi.json',
          template: 'openapi-template.yml'
        }
      }

      writeConfig(mockConfig)

      expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.resolve('./declarative-routing.config.json'),
        expect.any(String)
      )
      
      // Verify the JSON content matches regardless of property order
      const actualCall = writeFileSyncMock.mock.calls[0][1] as string
      const actualConfig = JSON.parse(actualCall)
      expect(actualConfig).toEqual(mockConfig)
    })

    it('should throw error for invalid config', () => {
      const invalidConfig = {
        mode: 'invalid',
        src: 'src'
      } as any
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => writeConfig(invalidConfig)).toThrow()
      
      consoleErrorSpy.mockRestore()
    })

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        mode: 'nextjs'
      } as any
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => writeConfig(invalidConfig)).toThrow()
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('absoluteFilePath', () => {
    it('should resolve absolute path with src directory', () => {
      const config: Config = {
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      }
      const filePath = 'users/page.tsx'

      const result = absoluteFilePath(config, filePath)

      expect(result).toBe(path.resolve('src/app', filePath))
    })

    it('should handle nested file paths', () => {
      const config: Config = {
        mode: 'nextjs',
        src: 'apps/web/src',
        routes: 'src/routes'
      }
      const filePath = 'app/api/users/route.ts'

      const result = absoluteFilePath(config, filePath)

      expect(result).toBe(path.resolve('apps/web/src', filePath))
    })

    it('should handle empty file path', () => {
      const config: Config = {
        mode: 'nextjs',
        src: 'src/app',
        routes: 'src/routes'
      }

      const result = absoluteFilePath(config, '')

      expect(result).toBe(path.resolve('src/app'))
    })

    it('should handle missing src directory', () => {
      const config: Config = {
        mode: 'nextjs',
        src: '',
        routes: 'src/routes'
      }
      const filePath = 'users/page.tsx'

      const result = absoluteFilePath(config, filePath)

      expect(result).toBe(path.resolve('', filePath))
    })
  })
})
