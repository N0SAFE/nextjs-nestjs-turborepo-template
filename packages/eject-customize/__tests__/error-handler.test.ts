import { describe, it, expect, beforeEach } from 'vitest'
import {
  EjectCustomizeError,
  createError,
  isRecoverable,
  isFatal,
  type ErrorContext,
} from '../src/utils/error-handler.js'
import type { ErrorCode } from '../src/index'

describe('Error Handler', () => {
  describe('EjectCustomizeError', () => {
    it('should create error with context', () => {
      const context = {
        code: 'EJECT_VALIDATION_FAILED' as const,
        message: 'Something went wrong',
      } satisfies ErrorContext
      const error = new EjectCustomizeError(context)

      expect(error).toBeInstanceOf(Error)
      expect(error.context.code).toBe('EJECT_VALIDATION_FAILED')
      expect(error.context.message).toBe('Something went wrong')
    })

    it('should include context details', () => {
      const error = new EjectCustomizeError({
        code: 'EJECT_VALIDATION_FAILED',
        message: 'Failed operation',
        details: {
          operation: 'eject',
          feature: 'auth',
        },
      })

      expect(error.context.details).toEqual({
        operation: 'eject',
        feature: 'auth',
      })
    })

    it('should preserve cause chain', () => {
      const cause = new Error('Original error')
      const error = new EjectCustomizeError({
        code: 'EJECT_VALIDATION_FAILED',
        message: 'Wrapped error',
        cause,
      })

      expect(error.cause).toBe(cause)
    })

    it('should have proper name format', () => {
      const error = new EjectCustomizeError({
        code: 'EJECT_VALIDATION_FAILED',
        message: 'Test',
      })

      expect(error.name).toContain('EjectCustomizeError')
      expect(error.name).toContain('EJECT_VALIDATION_FAILED')
    })

    it('should serialize to JSON', () => {
      const error = new EjectCustomizeError({
        code: 'EJECT_VALIDATION_FAILED',
        message: 'Test error',
        stage: 'validation',
        details: { feature: 'auth' },
      })

      const json = error.toJSON()
      expect(json.code).toBe('EJECT_VALIDATION_FAILED')
      expect(json.message).toBe('Test error')
      expect(json.stage).toBe('validation')
    })
  })

  describe('createError', () => {
    it('should create EjectCustomizeError', () => {
      const error = createError('EJECT_VALIDATION_FAILED', 'Eject operation failed')

      expect(error).toBeInstanceOf(EjectCustomizeError)
      expect(error.context.code).toBe('EJECT_VALIDATION_FAILED')
    })

    it('should include context details', () => {
      const error = createError('EJECT_VALIDATION_FAILED', 'Failed', {
        feature: 'auth',
      })

      expect(error.context.details).toEqual({ feature: 'auth' })
    })

    it('should preserve cause chain', () => {
      const cause = new Error('Root cause')
      const error = createError('EJECT_VALIDATION_FAILED', 'Failed', {}, cause)

      expect(error.cause).toBe(cause)
    })

    it('should accept message and optional details', () => {
      const error = createError('EJECT_VALIDATION_FAILED', 'Simple error')

      expect(error.context.message).toBe('Simple error')
      expect(error.context.details).toBeUndefined()
    })
  })

  describe('isRecoverable', () => {
    it('should identify EJECT_VALIDATION_FAILED as recoverable', () => {
      const error = createError('EJECT_VALIDATION_FAILED', 'Validation failed')

      expect(isRecoverable(error)).toBe(true)
    })

    it('should identify CUSTOMIZE_CONFLICTS as recoverable', () => {
      const error = createError('CUSTOMIZE_CONFLICTS', 'Conflicts detected')

      expect(isRecoverable(error)).toBe(true)
    })

    it('should identify GIT_DIRTY as recoverable', () => {
      const error = createError('GIT_DIRTY', 'Repository has changes')

      expect(isRecoverable(error)).toBe(true)
    })

    it('should identify EJECT_RECOVERY_FAILED as non-recoverable', () => {
      const error = createError('EJECT_RECOVERY_FAILED', 'Recovery failed')

      expect(isRecoverable(error)).toBe(false)
    })

    it('should return false for non-EjectCustomizeError', () => {
      const error = new Error('Generic error')

      expect(isRecoverable(error)).toBe(false)
    })

    it('should handle unknown error codes', () => {
      const error = createError('INVALID_PROJECT', 'Invalid project')

      expect(isRecoverable(error)).toBe(false)
    })
  })

  describe('isFatal', () => {
    it('should identify EJECT_RECOVERY_FAILED as fatal', () => {
      const error = createError('EJECT_RECOVERY_FAILED', 'Fatal error')

      expect(isFatal(error)).toBe(true)
    })

    it('should identify BACKUP_FAILED as fatal', () => {
      const error = createError('BACKUP_FAILED', 'Backup critical error')

      expect(isFatal(error)).toBe(true)
    })

    it('should identify INVALID_PROJECT as fatal', () => {
      const error = createError('INVALID_PROJECT', 'Invalid project')

      expect(isFatal(error)).toBe(true)
    })

    it('should identify EJECT_VALIDATION_FAILED as non-fatal', () => {
      const error = createError('EJECT_VALIDATION_FAILED', 'Validation failed')

      expect(isFatal(error)).toBe(false)
    })

    it('should return true for non-EjectCustomizeError', () => {
      const error = new Error('Generic error')

      expect(isFatal(error)).toBe(true)
    })
  })

  describe('Error codes', () => {
    const errorCodes = [
      'EJECT_VALIDATION_FAILED',
      'CUSTOMIZE_CONFLICTS',
      'GIT_DIRTY',
      'EJECT_VALIDATION_FAILED',
      'CUSTOMIZE_CONFLICTS',
      'EJECT_RECOVERY_FAILED',
      'BACKUP_FAILED',
      'INVALID_PROJECT',
      'UNKNOWN_ERROR',
    ] as const satisfies ErrorCode[]

    errorCodes.forEach(code => {
      it(`should handle error code: ${code}`, () => {
        const error = createError(code, `Error with code ${code}`)

        expect(error.context.code).toBe(code)
        expect(error).toBeInstanceOf(EjectCustomizeError)
      })
    })
  })

  describe('Error context with stage', () => {
    it('should include stage information', () => {
      const error = new EjectCustomizeError({
        code: 'EJECT_VALIDATION_FAILED',
        message: 'Failed at stage',
        stage: 'manifest-creation',
        details: { file: 'manifest.json' },
      })

      expect(error.context.stage).toBe('manifest-creation')
    })

    it('should serialize stage in JSON output', () => {
      const error = new EjectCustomizeError({
        code: 'CUSTOMIZE_CONFLICTS',
        message: 'Customize stage failed',
        stage: 'feature-installation',
      })

      const json = error.toJSON()
      expect(json.stage).toBe('feature-installation')
    })
  })

  describe('Error cause chain', () => {
    it('should preserve complete cause chain', () => {
      const originalError = new Error('File system error')
      const wrappedError = createError('EJECT_VALIDATION_FAILED', 'Could not eject', {}, originalError)

      expect(wrappedError.cause).toBe(originalError)
      expect(wrappedError.context.message).toBe('Could not eject')
    })

    it('should handle missing cause', () => {
      const error = createError('EJECT_VALIDATION_FAILED', 'Failed without cause')

      expect(error.cause).toBeUndefined()
      expect(error.context.cause).toBeUndefined()
    })

    it('should serialize cause message in JSON', () => {
      const cause = new Error('Root cause message')
      const error = createError('EJECT_VALIDATION_FAILED', 'Wrapped', {}, cause)

      const json = error.toJSON()
      expect(json.cause).toBe('Root cause message')
    })
  })
})

