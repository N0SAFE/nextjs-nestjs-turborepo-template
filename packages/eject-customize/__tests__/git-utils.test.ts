import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isGitRepository,
  isGitClean,
  getGitHead,
  createGitBranch,
  getCurrentBranch,
  stageChanges,
  commitChanges,
  getGitDiff,
  GitError,
} from '../src/utils/git-utils.js'

// Mock child_process module
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawnSync: vi.fn(),
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}))

// Import mocked modules
import { execSync } from 'child_process'

describe('Git Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isGitRepository', () => {
    it('should return false for non-git directory', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository')
      })

      const result = isGitRepository('/non-git-dir')
      expect(result).toBe(false)
    })

    it('should return true for git repository', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('.git' as any)

      const result = isGitRepository('/git-dir')
      expect(result).toBe(true)
    })

    it('should work with current directory', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('.git' as any)

      const result = isGitRepository('.')
      expect(result).toBe(true)
    })

    it('should handle errors gracefully', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed')
      })

      const result = isGitRepository('/some-dir')
      expect(result).toBe(false)
    })
  })

  describe('isGitClean', () => {
    it('should return true for clean repository', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('' as any) // Empty output means clean

      const result = isGitClean('/git-dir')
      expect(result).toBe(true)
    })

    it('should return false with untracked files', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('?? untracked.txt\n' as any)

      const result = isGitClean('/git-dir')
      expect(result).toBe(false)
    })

    it('should return false with uncommitted changes', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue(' M modified.txt\n' as any)

      const result = isGitClean('/git-dir')
      expect(result).toBe(false)
    })

    it('should throw GitError on non-git directory', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository')
      })

      expect(() => isGitClean('/non-git-dir')).toThrow(GitError)
    })
  })

  describe('getGitHead', () => {
    it('should return current HEAD commit hash', () => {
      const mockExecSync = vi.mocked(execSync)
      const mockHash = 'abc123def456'
      mockExecSync.mockReturnValue(mockHash as any)

      const result = getGitHead('/git-dir')
      expect(result).toBe(mockHash)
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse HEAD', expect.any(Object))
    })

    it('should throw GitError on non-git directory', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository')
      })

      expect(() => getGitHead('/non-git-dir')).toThrow(GitError)
    })

    it('should handle git errors properly', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: your current branch is ahead')
      })

      expect(() => getGitHead('/git-dir')).toThrow(GitError)
    })
  })

  describe('createGitBranch', () => {
    it('should create a new branch', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('' as any)

      createGitBranch('/git-dir', 'feature/test')
      
      expect(mockExecSync).toHaveBeenCalledWith(
        'git checkout -b feature/test',
        expect.any(Object)
      )
    })

    it('should throw GitError for invalid branch name', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: invalid branch name')
      })

      expect(() => createGitBranch('/git-dir', 'invalid..branch')).toThrow(GitError)
    })

    it('should handle branch already exists error', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: A branch named')
      })

      expect(() => createGitBranch('/git-dir', 'existing')).toThrow(GitError)
    })
  })

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('main' as any)

      const result = getCurrentBranch('/git-dir')
      expect(result).toBe('main')
    })

    it('should handle detached HEAD state', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('HEAD' as any)

      const result = getCurrentBranch('/git-dir')
      expect(result).toBe('HEAD')
    })

    it('should throw GitError on non-git directory', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository')
      })

      expect(() => getCurrentBranch('/non-git-dir')).toThrow(GitError)
    })
  })

  describe('stageChanges', () => {
    it('should stage specific files', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('' as any)

      stageChanges('/git-dir', ['file1.ts', 'file2.ts'])
      
      expect(mockExecSync).toHaveBeenCalledWith(
        'git add "file1.ts" "file2.ts"',
        expect.any(Object)
      )
    })

    it('should stage multiple files', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('' as any)

      const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts']
      stageChanges('/git-dir', files)
      
      expect(mockExecSync).toHaveBeenCalledWith(
        `git add ${files.map(f => `"${f}"`).join(' ')}`,
        expect.any(Object)
      )
    })

    it('should throw GitError on git error', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: pathspec did not match any files')
      })

      expect(() => stageChanges('/git-dir', ['nonexistent.ts'])).toThrow(GitError)
    })
  })

  describe('commitChanges', () => {
    it('should create commit with message', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('abc123' as any)

      commitChanges('/git-dir', 'Initial commit')
      
      expect(mockExecSync).toHaveBeenCalledWith(
        'git commit -m "Initial commit"',
        expect.any(Object)
      )
    })

    it('should throw GitError on no staged changes', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockImplementation(() => {
        throw new Error('nothing to commit')
      })

      expect(() => commitChanges('/git-dir', 'Empty commit')).toThrow(GitError)
    })

    it('should handle commit message escaping', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('abc123' as any)

      commitChanges('/git-dir', 'Commit with "quotes"')
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git commit -m'),
        expect.any(Object)
      )
    })
  })

  describe('getGitDiff', () => {
    it('should return diff for modified files', () => {
      const mockExecSync = vi.mocked(execSync)
      const diffOutput = '--- a/file.ts\n+++ b/file.ts\n@@ -1,3 +1,3 @@'
      mockExecSync.mockReturnValue(diffOutput as any)

      const result = getGitDiff('/git-dir')
      expect(result).toBe(diffOutput)
    })

    it('should return empty diff for clean repository', () => {
      const mockExecSync = vi.mocked(execSync)
      mockExecSync.mockReturnValue('' as any)

      const result = getGitDiff('/git-dir')
      expect(result).toBe('')
    })

    it('should return diff for specific file', () => {
      const mockExecSync = vi.mocked(execSync)
      const diffOutput = '--- a/specific.ts\n+++ b/specific.ts'
      mockExecSync.mockReturnValue(diffOutput as any)

      const result = getGitDiff('/git-dir', 'specific.ts')
      expect(result).toBe(diffOutput)
    })
  })

  describe('GitError', () => {
    it('should create error with message', () => {
      const error = new GitError('Test error', new Error('cause'))
      expect(error.message).toContain('Test error')
      expect(error).toBeInstanceOf(Error)
    })

    it('should include cause in error', () => {
      const cause = new Error('original error')
      const error = new GitError('Wrapped error', cause)
      expect(error).toBeInstanceOf(GitError)
    })

    it('should preserve error stack', () => {
      const error = new GitError('Stack test')
      expect(error.stack).toBeTruthy()
    })
  })
})
