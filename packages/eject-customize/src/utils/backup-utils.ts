/**
 * Backup and recovery utilities
 */

import path from 'path'
import { createDirectory, listFiles, copyFile, removeDirectory } from './fs-utils.js'
import { getGitHead } from './git-utils.js'

export interface BackupInfo {
  timestamp: string
  projectRoot: string
  backupPath: string
  gitHead: string
  filesCount: number
}

export class BackupError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Backup Error: ${message}`)
    this.name = 'BackupError'
    if (cause) this.cause = cause
  }
}

export async function createBackup(projectRoot: string, backupDir: string): Promise<BackupInfo> {
  try {
    const timestamp = new Date().toISOString()
    const gitHead = getGitHead(projectRoot)

    // Create backup directory with timestamp
    const backupPath = path.join(backupDir, `backup-${Date.now()}`)
    await createDirectory(backupPath)

    // List and copy all files
    const files = await listFiles(projectRoot, true)
    let filesCount = 0

    for (const file of files) {
      // Skip common exclusions
      if (
        file.includes('node_modules') ||
        file.includes('.git') ||
        file.includes('dist') ||
        file.includes('build')
      ) {
        continue
      }

      const relativePath = path.relative(projectRoot, file)
      const backupFilePath = path.join(backupPath, relativePath)
      await copyFile(file, backupFilePath)
      filesCount++
    }

    return {
      timestamp,
      projectRoot,
      backupPath,
      gitHead,
      filesCount,
    }
  } catch (error) {
    throw new BackupError('Failed to create backup', error as Error)
  }
}

export async function restoreBackup(backupPath: string, projectRoot: string): Promise<void> {
  try {
    const files = await listFiles(backupPath, true)

    for (const file of files) {
      const relativePath = path.relative(backupPath, file)
      const targetPath = path.join(projectRoot, relativePath)
      await copyFile(file, targetPath)
    }
  } catch (error) {
    throw new BackupError('Failed to restore backup', error as Error)
  }
}

export async function deleteBackup(backupPath: string): Promise<void> {
  try {
    await removeDirectory(backupPath)
  } catch (error) {
    throw new BackupError('Failed to delete backup', error as Error)
  }
}
