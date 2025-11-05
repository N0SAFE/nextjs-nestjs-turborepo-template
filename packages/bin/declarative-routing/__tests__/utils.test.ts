import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { execa } from 'execa'
import * as antfuNi from '@antfu/ni'
import {
  getPackageInfo,
  addPackageJSONScripts,
  getPackageManager,
  addPackages,
  jsClean,
  upperFirst,
  getDiffContent,
  showDiff
} from '../src/shared/utils'
import { readFileSyncMock, readJSONSyncMock, writeJSONSyncMock } from '../vitest.setup'

vi.mock('execa')
vi.mock('@antfu/ni')

describe('utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPackageInfo', () => {
    it('should read package.json from correct path', () => {
      const mockPackageJson = {
        name: '@repo-bin/declarative-routing',
        version: '0.1.20'
      }
      
      readJSONSyncMock.mockReturnValue(mockPackageJson)
      
      const result = getPackageInfo()
      
      expect(result).toEqual(mockPackageJson)
      expect(readJSONSyncMock).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      )
    })

    it('should handle missing package.json gracefully', () => {
      readJSONSyncMock.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory')
      })
      
      expect(() => getPackageInfo()).toThrow()
    })
  })

  describe('addPackageJSONScripts', () => {
    it('should add new scripts to package.json', () => {
      const existingPackageJson = {
        name: 'test-package',
        scripts: {
          build: 'tsc'
        }
      }
      
      const newScripts = {
        test: 'vitest',
        'test:watch': 'vitest --watch'
      }
      
      readJSONSyncMock.mockReturnValue(existingPackageJson)
      writeJSONSyncMock.mockReturnValue(undefined)
      
      addPackageJSONScripts(newScripts)
      
      expect(writeJSONSyncMock).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        {
          name: 'test-package',
          scripts: {
            build: 'tsc',
            test: 'vitest',
            'test:watch': 'vitest --watch'
          }
        },
        {
          spaces: 2,
          EOL: '\n'
        }
      )
    })

    it('should not overwrite existing scripts', () => {
      const existingPackageJson = {
        name: 'test-package',
        scripts: {
          test: 'jest'
        }
      }
      
      const newScripts = {
        test: 'vitest'
      }
      
      readJSONSyncMock.mockReturnValue(existingPackageJson)
      writeJSONSyncMock.mockReturnValue(undefined)
      
      addPackageJSONScripts(newScripts)
      
      expect(writeJSONSyncMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          scripts: {
            test: 'jest' // Original script preserved
          }
        }),
        expect.anything()
      )
    })

    it('should handle package.json without scripts', () => {
      const existingPackageJson = {
        name: 'test-package'
      }
      
      const newScripts = {
        test: 'vitest'
      }
      
      readJSONSyncMock.mockReturnValue(existingPackageJson)
      writeJSONSyncMock.mockReturnValue(undefined)
      
      addPackageJSONScripts(newScripts)
      
      expect(writeJSONSyncMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          scripts: {
            test: 'vitest'
          }
        }),
        expect.anything()
      )
    })
  })

  describe('getPackageManager', () => {
    it('should detect yarn berry as yarn', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('yarn@berry')
      
      const result = await getPackageManager()
      
      expect(result).toBe('yarn')
    })

    it('should detect pnpm@6 as pnpm', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('pnpm@6')
      
      const result = await getPackageManager()
      
      expect(result).toBe('pnpm')
    })

    it('should detect bun', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('bun')
      
      const result = await getPackageManager()
      
      expect(result).toBe('bun')
    })

    it('should fallback to npm when detection fails', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue(null)
      
      const result = await getPackageManager()
      
      expect(result).toBe('npm')
    })

    it('should handle other package managers', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('npm')
      
      const result = await getPackageManager()
      
      expect(result).toBe('npm')
    })
  })

  describe('addPackages', () => {
    it('should skip when no packages provided', async () => {
      await addPackages([])
      
      expect(execa).not.toHaveBeenCalled()
    })

    it('should install production packages with npm', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('npm')
      
      await addPackages(['react', 'react-dom'])
      
      expect(execa).toHaveBeenCalledWith('npm', ['install', 'react', 'react-dom'])
    })

    it('should install dev packages with npm', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('npm')
      
      await addPackages(['vitest', '@vitest/ui'], true)
      
      expect(execa).toHaveBeenCalledWith('npm', ['install', '-D', 'vitest', '@vitest/ui'])
    })

    it('should install production packages with bun', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('bun')
      
      await addPackages(['react', 'react-dom'])
      
      expect(execa).toHaveBeenCalledWith('bun', ['add', 'react', 'react-dom'])
    })

    it('should install dev packages with bun', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('bun')
      
      await addPackages(['vitest', '@vitest/ui'], true)
      
      expect(execa).toHaveBeenCalledWith('bun', ['add', '-D', 'vitest', '@vitest/ui'])
    })

    it('should install packages with yarn', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('yarn@berry')
      
      await addPackages(['react'], false)
      
      expect(execa).toHaveBeenCalledWith('yarn', ['add', 'react'])
    })

    it('should install packages with pnpm', async () => {
      vi.mocked(antfuNi.detect).mockResolvedValue('pnpm@6')
      
      await addPackages(['react'], false)
      
      expect(execa).toHaveBeenCalledWith('pnpm', ['add', 'react'])
    })
  })

  describe('jsClean', () => {
    it('should remove non-alphanumeric characters except dashes', () => {
      expect(jsClean('hello-world!')).toBe('helloWorld')
      expect(jsClean('my@package#name')).toBe('mypackagename')
    })

    it('should capitalize letters after dashes', () => {
      expect(jsClean('hello-world')).toBe('helloWorld')
      expect(jsClean('my-cool-package')).toBe('myCoolPackage')
    })

    it('should handle multiple consecutive dashes', () => {
      expect(jsClean('hello--world')).toBe('helloWorld')
    })

    it('should handle leading and trailing dashes', () => {
      // jsClean capitalizes after dashes but doesn't lowercase first char
      expect(jsClean('-hello-world-')).toBe('HelloWorld')
    })

    it('should handle strings without dashes', () => {
      expect(jsClean('hello')).toBe('hello')
      expect(jsClean('WORLD')).toBe('WORLD')
    })

    it('should handle special characters', () => {
      expect(jsClean('test@123#abc')).toBe('test123abc')
      expect(jsClean('@repo/ui-base')).toBe('repouiBase')
    })

    it('should preserve numbers', () => {
      expect(jsClean('v8-engine')).toBe('v8Engine')
      expect(jsClean('test123-abc')).toBe('test123Abc')
    })

    it('should handle empty string', () => {
      expect(jsClean('')).toBe('')
    })
  })

  describe('upperFirst', () => {
    it('should capitalize first letter', () => {
      expect(upperFirst('hello')).toBe('Hello')
      expect(upperFirst('world')).toBe('World')
    })

    it('should handle already capitalized strings', () => {
      expect(upperFirst('Hello')).toBe('Hello')
      expect(upperFirst('WORLD')).toBe('WORLD')
    })

    it('should handle single character', () => {
      expect(upperFirst('a')).toBe('A')
      expect(upperFirst('Z')).toBe('Z')
    })

    it('should handle empty string', () => {
      expect(upperFirst('')).toBe('')
    })

    it('should preserve rest of string', () => {
      expect(upperFirst('helloWorld')).toBe('HelloWorld')
      expect(upperFirst('camelCase')).toBe('CamelCase')
    })
  })

  describe('getDiffContent', () => {
    it('should detect added lines', () => {
      const input = 'line1\nline2'
      const output = 'line1\nline2\nline3'
      
      const result = getDiffContent(input, output)
      
      expect(result).toBeTruthy()
      expect(result).toContain('line3')
    })

    it('should detect removed lines', () => {
      const input = 'line1\nline2\nline3'
      const output = 'line1\nline3'
      
      const result = getDiffContent(input, output)
      
      expect(result).toBeTruthy()
      expect(result).toContain('line2')
    })

    it('should return null for identical content', () => {
      const input = 'line1\nline2\nline3'
      const output = 'line1\nline2\nline3'
      
      const result = getDiffContent(input, output)
      
      expect(result).toBe('')
    })

    it('should handle empty strings', () => {
      const result1 = getDiffContent('', '')
      const result2 = getDiffContent('line1', '')
      const result3 = getDiffContent('', 'line1')
      
      expect(result1).toBe('')
      expect(result2).toBeTruthy()
      expect(result3).toBeTruthy()
    })

    it('should handle multiple changes', () => {
      const input = 'line1\nline2\nline3\nline4'
      const output = 'line1\nline2-modified\nline3\nline5'
      
      const result = getDiffContent(input, output)
      
      expect(result).toBeTruthy()
    })
  })

  describe('showDiff', () => {
    it('should display diff in a box', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      showDiff('Test diff content')
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle empty report', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      showDiff('')
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle multi-line report', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      showDiff('Line 1\nLine 2\nLine 3')
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })
})
