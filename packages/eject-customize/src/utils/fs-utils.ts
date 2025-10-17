/**
 * File system utilities for eject-customize operations
 */

import { promises as fs } from 'fs'
import path from 'path'

export interface FileOperation {
  type: 'read' | 'write' | 'delete' | 'copy'
  source: string
  destination?: string
  content?: string
}

export class FileSystemError extends Error {
  constructor(message: string, public operation: FileOperation, cause?: Error) {
    super(`FileSystem Error: ${message}`)
    this.name = 'FileSystemError'
    if (cause) this.cause = cause
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    throw new FileSystemError(
      `Failed to read file: ${filePath}`,
      { type: 'read', source: filePath },
      error as Error
    )
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  } catch (error) {
    throw new FileSystemError(
      `Failed to write file: ${filePath}`,
      { type: 'write', source: filePath, content },
      error as Error
    )
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    throw new FileSystemError(
      `Failed to delete file: ${filePath}`,
      { type: 'delete', source: filePath },
      error as Error
    )
  }
}

export async function copyFile(source: string, destination: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(source, destination)
  } catch (error) {
    throw new FileSystemError(
      `Failed to copy file from ${source} to ${destination}`,
      { type: 'copy', source, destination },
      error as Error
    )
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

export async function listFiles(dirPath: string, recursive = false): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    let files: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory() && recursive) {
        files = files.concat(await listFiles(fullPath, recursive))
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }

    return files
  } catch (error) {
    throw new FileSystemError(
      `Failed to list files in directory: ${dirPath}`,
      { type: 'read', source: dirPath },
      error as Error
    )
  }
}

export async function createDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    throw new FileSystemError(
      `Failed to create directory: ${dirPath}`,
      { type: 'write', source: dirPath },
      error as Error
    )
  }
}

export async function removeDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  } catch (error) {
    throw new FileSystemError(
      `Failed to remove directory: ${dirPath}`,
      { type: 'delete', source: dirPath },
      error as Error
    )
  }
}
