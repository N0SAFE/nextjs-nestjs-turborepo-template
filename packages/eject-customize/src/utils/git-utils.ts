/**
 * Git utilities for eject-customize operations
 */

import { execSync } from 'child_process'

export class GitError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Git Error: ${message}`)
    this.name = 'GitError'
    if (cause) this.cause = cause
  }
}

export function isGitRepository(projectRoot: string): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function isGitClean(projectRoot: string): boolean {
  try {
    const status = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf-8' })
    return status.trim() === ''
  } catch (error) {
    throw new GitError('Failed to check git status', error as Error)
  }
}

export function getGitHead(projectRoot: string): string {
  try {
    return execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim()
  } catch (error) {
    throw new GitError('Failed to get git HEAD', error as Error)
  }
}

export function createGitBranch(projectRoot: string, branchName: string): void {
  try {
    execSync(`git checkout -b ${branchName}`, { cwd: projectRoot })
  } catch (error) {
    throw new GitError(`Failed to create branch ${branchName}`, error as Error)
  }
}

export function getCurrentBranch(projectRoot: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim()
  } catch (error) {
    throw new GitError('Failed to get current branch', error as Error)
  }
}

export function stageChanges(projectRoot: string, files: string[]): void {
  try {
    execSync(`git add ${files.map(f => `"${f}"`).join(' ')}`, { cwd: projectRoot })
  } catch (error) {
    throw new GitError(`Failed to stage changes`, error as Error)
  }
}

export function commitChanges(projectRoot: string, message: string): void {
  try {
    execSync(`git commit -m "${message}"`, { cwd: projectRoot })
  } catch (error) {
    throw new GitError(`Failed to commit changes`, error as Error)
  }
}

export function getGitDiff(projectRoot: string, path?: string): string {
  try {
    const cmd = path ? `git diff ${path}` : 'git diff'
    return execSync(cmd, { cwd: projectRoot, encoding: 'utf-8' })
  } catch (error) {
    throw new GitError('Failed to get git diff', error as Error)
  }
}
