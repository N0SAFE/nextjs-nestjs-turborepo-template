/**
 * Tests for FeatureRemover
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tmpdir } from 'os'
import path from 'path'
import { FeatureRemover } from '../src/eject/remover.js'
import { removeDirectory, writeFile, createDirectory, fileExists } from '../src/utils/fs-utils.js'

describe('FeatureRemover', () => {
  let testDir: string
  let projectRoot: string
  const remover = new FeatureRemover()

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `remover-test-${Date.now()}`)
    projectRoot = testDir

    // Create test files
    await createDirectory(path.join(projectRoot, 'src'))
    await writeFile(path.join(projectRoot, 'src', 'file1.ts'), 'content1')
    await writeFile(path.join(projectRoot, 'src', 'file2.ts'), 'content2')

    await createDirectory(path.join(projectRoot, 'src', 'subdir'))
    await writeFile(path.join(projectRoot, 'src', 'subdir', 'file3.ts'), 'content3')
  })

  afterEach(async () => {
    if (testDir) {
      try {
        await removeDirectory(testDir)
      } catch {
        // ignore
      }
    }
  })

  describe('removeFiles', () => {
    it('should remove specific files', async () => {
      const result = await remover.removeFiles(
        ['src/file1.ts', 'src/file2.ts'],
        projectRoot
      )

      expect(result.filesRemoved).toHaveLength(2)
      expect(result.changes).toHaveLength(2)
      expect(result.filesRemoved).toContain('src/file1.ts')
      expect(result.filesRemoved).toContain('src/file2.ts')

      const exists = await fileExists(path.join(projectRoot, 'src', 'file1.ts'))
      expect(exists).toBe(false)
    })

    it('should support dry run', async () => {
      const result = await remover.removeFiles(
        ['src/file1.ts'],
        projectRoot,
        { dryRun: true }
      )

      expect(result.filesRemoved).toHaveLength(1)

      // File should still exist in dry run mode
      const exists = await fileExists(path.join(projectRoot, 'src', 'file1.ts'))
      expect(exists).toBe(true)
    })

    it('should report errors for nonexistent files', async () => {
      const result = await remover.removeFiles(
        ['src/nonexistent.ts'],
        projectRoot
      )

      expect(result.errors).toHaveLength(1)
    })

    it('should handle absolute paths', async () => {
      const result = await remover.removeFiles(
        [path.join(projectRoot, 'src', 'file1.ts')],
        projectRoot
      )

      expect(result.filesRemoved).toHaveLength(1)
    })
  })

  describe('removeDirectoryTree', () => {
    it('should remove directory and all files', async () => {
      const result = await remover.removeDirectoryTree('src', projectRoot)

      expect(result.dirsRemoved).toHaveLength(1)
      expect(result.filesRemoved.length).toBeGreaterThan(0)

      const exists = await fileExists(path.join(projectRoot, 'src'))
      expect(exists).toBe(false)
    })

    it('should support dry run', async () => {
      const result = await remover.removeDirectoryTree('src', projectRoot, {
        dryRun: true,
      })

      expect(result.filesRemoved.length).toBeGreaterThan(0)

      // Directory should still exist
      const exists = await fileExists(path.join(projectRoot, 'src'))
      expect(exists).toBe(true)
    })

    it('should report error for nonexistent directory', async () => {
      const result = await remover.removeDirectoryTree(
        'nonexistent',
        projectRoot
      )

      expect(result.errors).toHaveLength(1)
    })
  })

  describe('removePattern', () => {
    it('should remove files matching pattern', async () => {
      const result = await remover.removePattern('src/**/*.ts', projectRoot)

      expect(result.filesRemoved.length).toBeGreaterThan(0)
    })

    it('should support wildcard patterns', async () => {
      const result = await remover.removePattern('src/file*.ts', projectRoot)

      expect(result.filesRemoved).toContain('src/file1.ts')
      expect(result.filesRemoved).toContain('src/file2.ts')
    })

    it('should support dry run', async () => {
      const result = await remover.removePattern('src/**/*.ts', projectRoot, {
        dryRun: true,
      })

      expect(result.filesRemoved.length).toBeGreaterThan(0)

      // Files should still exist
      const exists = await fileExists(path.join(projectRoot, 'src', 'file1.ts'))
      expect(exists).toBe(true)
    })

    it('should create change entries', async () => {
      const result = await remover.removePattern('src/file1.ts', projectRoot)

      expect(result.changes).toHaveLength(1)
      expect(result.changes[0]?.type).toBe('removed')
    })
  })

  describe('removeDependencies', () => {
    it('should record dependency removals', async () => {
      const result = await remover.removeDependencies(
        ['tailwindcss', 'postcss'],
        'package.json'
      )

      expect(result.changes).toHaveLength(2)
      expect(result.changes[0]?.description).toContain('tailwindcss')
    })

    it('should create changes with reversible flag', async () => {
      const result = await remover.removeDependencies(['dep1'], 'package.json')

      expect(result.changes[0]?.reversible).toBe(true)
    })
  })
})
