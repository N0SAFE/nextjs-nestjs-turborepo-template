/**
 * Feature remover for deleting files and dependencies
 */

import { deleteFile, removeDirectory, listFiles, fileExists, isDirectory } from '../utils/fs-utils.js'
import { EjectChange } from './types.js'
import path from 'path'

export class RemoverError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Remover Error: ${message}`)
    this.name = 'RemoverError'
    if (cause) this.cause = cause
  }
}

export interface RemoveOptions {
  dryRun?: boolean
  removeEmptyDirs?: boolean
}

export interface RemoveResult {
  filesRemoved: string[]
  dirsRemoved: string[]
  changes: EjectChange[]
  errors: Error[]
}

export class FeatureRemover {
  async removeFiles(
    filePaths: string[],
    projectRoot: string,
    options: RemoveOptions = {}
  ): Promise<RemoveResult> {
    const result: RemoveResult = {
      filesRemoved: [],
      dirsRemoved: [],
      changes: [],
      errors: [],
    }

    const { dryRun = false, removeEmptyDirs = true } = options

    for (const filePath of filePaths) {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath)
        const exists = await fileExists(fullPath)

        if (!exists) {
          result.errors.push(new RemoverError(`File not found: ${filePath}`))
          continue
        }

        const isDir = await isDirectory(fullPath)

        if (isDir) {
          if (!dryRun) {
            await removeDirectory(fullPath)
          }
          result.dirsRemoved.push(filePath)
          result.changes.push({
            type: 'removed',
            path: filePath,
            description: `Directory removed: ${filePath}`,
            reversible: true,
          })
        } else {
          if (!dryRun) {
            await deleteFile(fullPath)
          }
          result.filesRemoved.push(filePath)
          result.changes.push({
            type: 'removed',
            path: filePath,
            description: `File removed: ${filePath}`,
            reversible: true,
          })
        }
      } catch (error) {
        result.errors.push(new RemoverError(`Failed to remove ${filePath}`, error as Error))
      }
    }

    return result
  }

  async removeDirectoryTree(
    dirPath: string,
    projectRoot: string,
    options: RemoveOptions = {}
  ): Promise<RemoveResult> {
    const result: RemoveResult = {
      filesRemoved: [],
      dirsRemoved: [],
      changes: [],
      errors: [],
    }

    const { dryRun = false } = options

    try {
      const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(projectRoot, dirPath)
      const exists = await fileExists(fullPath)

      if (!exists) {
        result.errors.push(new RemoverError(`Directory not found: ${dirPath}`))
        return result
      }

      // List all files in the directory tree
      const files = await listFiles(fullPath, true)

      for (const file of files) {
        const relativePath = path.relative(projectRoot, file)
        result.filesRemoved.push(relativePath)
        result.changes.push({
          type: 'removed',
          path: relativePath,
          description: `File removed: ${relativePath}`,
          reversible: true,
        })
      }

      if (!dryRun) {
        await removeDirectory(fullPath)
      }

      result.dirsRemoved.push(dirPath)
      result.changes.push({
        type: 'removed',
        path: dirPath,
        description: `Directory tree removed: ${dirPath}`,
        reversible: true,
      })
    } catch (error) {
      result.errors.push(new RemoverError(`Failed to remove directory tree ${dirPath}`, error as Error))
    }

    return result
  }

  async removeDependencies(
    dependencies: string[],
    packageJsonPath: string,
    options: RemoveOptions = {}
  ): Promise<RemoveResult> {
    const result: RemoveResult = {
      filesRemoved: [],
      dirsRemoved: [],
      changes: [],
      errors: [],
    }

    // This is a placeholder for dependency removal
    // In a real implementation, this would:
    // 1. Parse package.json
    // 2. Remove specified dependencies
    // 3. Remove node_modules if needed
    // 4. Optionally run npm/yarn/bun to clean up

    for (const dep of dependencies) {
      result.changes.push({
        type: 'modified',
        path: packageJsonPath,
        description: `Dependency removed: ${dep}`,
        reversible: true,
      })
    }

    return result
  }

  async removePattern(
    pattern: string,
    projectRoot: string,
    options: RemoveOptions = {}
  ): Promise<RemoveResult> {
    const result: RemoveResult = {
      filesRemoved: [],
      dirsRemoved: [],
      changes: [],
      errors: [],
    }

    const { dryRun = false } = options

    try {
      // Convert glob-like pattern to regex
      const regexPattern = patternToRegex(pattern)

      // List all files and match against pattern
      const files = await listFiles(projectRoot, true)

      for (const file of files) {
        const relativePath = path.relative(projectRoot, file)

        if (regexPattern.test(relativePath)) {
          try {
            if (!dryRun) {
              await deleteFile(file)
            }
            result.filesRemoved.push(relativePath)
            result.changes.push({
              type: 'removed',
              path: relativePath,
              description: `File removed (pattern: ${pattern}): ${relativePath}`,
              reversible: true,
            })
          } catch (error) {
            result.errors.push(
              new RemoverError(`Failed to remove ${relativePath}`, error as Error)
            )
          }
        }
      }
    } catch (error) {
      result.errors.push(new RemoverError(`Failed to remove files matching pattern ${pattern}`, error as Error))
    }

    return result
  }
}

function patternToRegex(pattern: string): RegExp {
  // Convert simple glob patterns to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/\*/g, '.*') // * matches anything
    .replace(/\?/g, '.') // ? matches single char

  return new RegExp(`^${escaped}$`)
}
