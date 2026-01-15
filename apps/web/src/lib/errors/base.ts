/**
 * @fileoverview Base Error Handling Utilities
 * 
 * Provides foundational error classes and utilities for domain-specific error handling.
 * These utilities are used across all domain error handlers to ensure consistent
 * error handling, logging, and user feedback throughout the application.
 */

import { logger } from '@repo/logger'

/**
 * User-facing error messages
 * Maps error codes to user-friendly messages
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Authentication errors
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_INPUT: 'The provided data is invalid.',
  
  // Server errors
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'This action conflicts with existing data.',
  
  // Default fallback
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const

/**
 * Base application error class
 * Extends Error with additional metadata for better error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    
    // Maintain proper stack trace for where error was thrown
    Error.captureStackTrace(this, AppError)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
    }
  }
}

/**
 * Extract user-friendly error message from any error type
 * 
 * @param error - Error to extract message from
 * @returns Human-readable error message
 * 
 * @example
 * ```typescript
 * try {
 *   await fetchData()
 * } catch (error) {
 *   const message = getErrorMessage(error)
 *   toast.error(message)
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'An unexpected error occurred'
}

/**
 * Handle error with logging and user-friendly message extraction
 * 
 * @param error - Error to handle
 * @param context - Additional context for logging
 * @returns User-friendly error message
 * 
 * @example
 * ```tsx
 * try {
 *   await deleteUser(userId)
 * } catch (error) {
 *   handleError(error, { feature: 'UserManagement', action: 'delete' })
 * }
 * ```
 */
export function handleError(
  error: unknown,
  context?: {
    feature?: string
    action?: string
    userId?: string
    [key: string]: unknown
  }
): string {
  const errorMessage = getErrorMessage(error)
  
  // Log the error with context using our logger
  logger.error('Application error occurred', {
    error: error instanceof Error ? error : new Error(String(error)),
    context: context ?? {},
  })

  return errorMessage
}

/**
 * Extract error code from various error types
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AppError) {
    return error.code
  }
  
  if (error && typeof error === 'object') {
    // Axios errors
    if ('code' in error && typeof error.code === 'string') {
      return error.code
    }
    // HTTP status codes
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return String(error.statusCode)
    }
    if ('status' in error && typeof error.status === 'number') {
      return String(error.status)
    }
  }
  
  return undefined
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard for checking if error has a status code
 */
export function hasStatusCode(error: unknown): error is { statusCode: number } {
  return typeof error === 'object' && error !== null && 'statusCode' in error
}

/**
 * Type guard for checking if error has a code property
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}
