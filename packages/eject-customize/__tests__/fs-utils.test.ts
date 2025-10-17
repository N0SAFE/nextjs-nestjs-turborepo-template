import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import path from 'path'
import {
  readFile,
  writeFile,
  deleteFile,
  copyFile,
  fileExists,
  isDirectory,
  listFiles,
  createDirectory,
  removeDirectory,
  FileSystemError,
} from '../src/utils/fs-utils'

const testDir = path.join(__dirname, 'fixtures')

describe('File System Utilities', () => {
  beforeEach(async () => {
    await createDirectory(testDir)
  })

  afterEach(async () => {
    try {
      await removeDirectory(testDir)
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('readFile', () => {
    it('should read file contents', async () => {
      const filePath = path.join(testDir, 'test.txt')
      const content = 'Hello, World!'
      await writeFile(filePath, content)

      const result = await readFile(filePath)
      expect(result).toBe(content)
    })

    it('should throw FileSystemError when file does not exist', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt')

      await expect(readFile(filePath)).rejects.toThrow(FileSystemError)
    })

    it('should throw FileSystemError with operation details', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt')

      try {
        await readFile(filePath)
      } catch (error) {
        expect(error).toBeInstanceOf(FileSystemError)
        expect((error as FileSystemError).operation.type).toBe('read')
        expect((error as FileSystemError).operation.source).toBe(filePath)
      }
    })
  })

  describe('writeFile', () => {
    it('should write file contents', async () => {
      const filePath = path.join(testDir, 'output.txt')
      const content = 'Test content'

      await writeFile(filePath, content)

      const result = await fs.promises.readFile(filePath, 'utf-8')
      expect(result).toBe(content)
    })

    it('should create missing directories', async () => {
      const filePath = path.join(testDir, 'nested', 'dir', 'file.txt')
      const content = 'Nested content'

      await writeFile(filePath, content)

      const exists = await fileExists(filePath)
      expect(exists).toBe(true)
    })

    it('should overwrite existing files', async () => {
      const filePath = path.join(testDir, 'overwrite.txt')
      await writeFile(filePath, 'Original')
      await writeFile(filePath, 'Updated')

      const result = await readFile(filePath)
      expect(result).toBe('Updated')
    })

    it('should throw FileSystemError on write failure', async () => {
      const filePath = '/invalid/path/file.txt'

      await expect(writeFile(filePath, 'content')).rejects.toThrow(
        FileSystemError
      )
    })
  })

  describe('deleteFile', () => {
    it('should delete existing files', async () => {
      const filePath = path.join(testDir, 'delete-me.txt')
      await writeFile(filePath, 'To delete')

      await deleteFile(filePath)

      const exists = await fileExists(filePath)
      expect(exists).toBe(false)
    })

    it('should throw FileSystemError when file does not exist', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt')

      await expect(deleteFile(filePath)).rejects.toThrow(FileSystemError)
    })
  })

  describe('copyFile', () => {
    it('should copy files with new destination', async () => {
      const source = path.join(testDir, 'source.txt')
      const destination = path.join(testDir, 'destination.txt')
      const content = 'Source content'

      await writeFile(source, content)
      await copyFile(source, destination)

      const result = await readFile(destination)
      expect(result).toBe(content)
    })

    it('should create destination directories', async () => {
      const source = path.join(testDir, 'source.txt')
      const destination = path.join(testDir, 'nested', 'dest', 'file.txt')
      const content = 'Copy with nested dirs'

      await writeFile(source, content)
      await copyFile(source, destination)

      const exists = await fileExists(destination)
      expect(exists).toBe(true)
    })

    it('should throw FileSystemError on failure', async () => {
      const source = path.join(testDir, 'nonexistent.txt')
      const destination = path.join(testDir, 'dest.txt')

      await expect(copyFile(source, destination)).rejects.toThrow(
        FileSystemError
      )
    })
  })

  describe('fileExists', () => {
    it('should return true for existing files', async () => {
      const filePath = path.join(testDir, 'exists.txt')
      await writeFile(filePath, 'content')

      const result = await fileExists(filePath)
      expect(result).toBe(true)
    })

    it('should return false for non-existing files', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt')

      const result = await fileExists(filePath)
      expect(result).toBe(false)
    })

    it('should return true for existing directories', async () => {
      const dirPath = path.join(testDir, 'subdir')
      await createDirectory(dirPath)

      const result = await fileExists(dirPath)
      expect(result).toBe(true)
    })
  })

  describe('isDirectory', () => {
    it('should return true for directories', async () => {
      const dirPath = path.join(testDir, 'isdir')
      await createDirectory(dirPath)

      const result = await isDirectory(dirPath)
      expect(result).toBe(true)
    })

    it('should return false for files', async () => {
      const filePath = path.join(testDir, 'file.txt')
      await writeFile(filePath, 'content')

      const result = await isDirectory(filePath)
      expect(result).toBe(false)
    })

    it('should return false for non-existing paths', async () => {
      const filePath = path.join(testDir, 'nonexistent')

      const result = await isDirectory(filePath)
      expect(result).toBe(false)
    })
  })

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content')
      await writeFile(path.join(testDir, 'file2.txt'), 'content')
      await writeFile(path.join(testDir, 'file3.txt'), 'content')

      const files = await listFiles(testDir, false)

      expect(files.length).toBe(3)
      expect(files.every(f => f.startsWith(testDir))).toBe(true)
    })

    it('should list files recursively', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content')
      await writeFile(path.join(testDir, 'subdir', 'file2.txt'), 'content')
      await writeFile(path.join(testDir, 'subdir', 'nested', 'file3.txt'), 'content')

      const files = await listFiles(testDir, true)

      expect(files.length).toBe(3)
    })

    it('should not recurse when recursive is false', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content')
      await writeFile(path.join(testDir, 'subdir', 'file2.txt'), 'content')

      const files = await listFiles(testDir, false)

      expect(files.length).toBe(1)
    })

    it('should return empty array for empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty')
      await createDirectory(emptyDir)

      const files = await listFiles(emptyDir, false)

      expect(files).toEqual([])
    })
  })

  describe('createDirectory', () => {
    it('should create single directory', async () => {
      const dirPath = path.join(testDir, 'newdir')

      await createDirectory(dirPath)

      const exists = await fileExists(dirPath)
      expect(exists).toBe(true)
    })

    it('should create nested directories', async () => {
      const dirPath = path.join(testDir, 'a', 'b', 'c')

      await createDirectory(dirPath)

      const exists = await fileExists(dirPath)
      expect(exists).toBe(true)
    })

    it('should not throw when directory exists', async () => {
      const dirPath = path.join(testDir, 'existing')
      await createDirectory(dirPath)

      await expect(createDirectory(dirPath)).resolves.not.toThrow()
    })
  })

  describe('removeDirectory', () => {
    it('should remove empty directory', async () => {
      const dirPath = path.join(testDir, 'removeme')
      await createDirectory(dirPath)

      await removeDirectory(dirPath)

      const exists = await fileExists(dirPath)
      expect(exists).toBe(false)
    })

    it('should remove directory with contents', async () => {
      const dirPath = path.join(testDir, 'withfiles')
      await createDirectory(dirPath)
      await writeFile(path.join(dirPath, 'file.txt'), 'content')

      await removeDirectory(dirPath)

      const exists = await fileExists(dirPath)
      expect(exists).toBe(false)
    })

    it('should remove nested directories', async () => {
      const dirPath = path.join(testDir, 'nested', 'deep', 'dir')
      await createDirectory(dirPath)

      await removeDirectory(path.join(testDir, 'nested'))

      const exists = await fileExists(path.join(testDir, 'nested'))
      expect(exists).toBe(false)
    })
  })

  describe('FileSystemError', () => {
    it('should include operation details', () => {
      const error = new FileSystemError('Test error', {
        type: 'read',
        source: '/path/to/file',
      })

      expect(error.message).toContain('Test error')
      expect(error.operation.source).toBe('/path/to/file')
    })

    it('should preserve cause error', () => {
      const cause = new Error('Original error')
      const error = new FileSystemError('Wrapped error', { type: 'write', source: '/file' }, cause)

      expect(error.cause).toBe(cause)
    })
  })
})
