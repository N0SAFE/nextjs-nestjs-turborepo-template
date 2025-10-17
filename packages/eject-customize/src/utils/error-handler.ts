/**
 * Error handling utilities
 */

import { ErrorCode } from '../types/index.js'

export interface ErrorContext {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  cause?: Error
  stage?: string
}

export class EjectCustomizeError extends Error {
  constructor(public context: ErrorContext) {
    super(context.message)
    this.name = `EjectCustomizeError[${context.code}]`
    if (context.cause) this.cause = context.cause
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.context.code,
      stage: this.context.stage,
      details: this.context.details,
      cause: this.context.cause?.message,
    }
  }
}

export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): EjectCustomizeError {
  return new EjectCustomizeError({
    code,
    message,
    details,
    cause,
  })
}

export function isRecoverable(error: unknown): boolean {
  if (!(error instanceof EjectCustomizeError)) return false

  const recoverableCodes: ErrorCode[] = [
    'EJECT_VALIDATION_FAILED',
    'CUSTOMIZE_CONFLICTS',
    'GIT_DIRTY',
  ]

  return recoverableCodes.includes(error.context.code)
}

export function isFatal(error: unknown): boolean {
  if (!(error instanceof EjectCustomizeError)) return true

  const fatalCodes: ErrorCode[] = [
    'EJECT_RECOVERY_FAILED',
    'BACKUP_FAILED',
    'INVALID_PROJECT',
  ]

  return fatalCodes.includes(error.context.code)
}
