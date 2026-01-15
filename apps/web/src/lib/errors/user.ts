/**
 * @fileoverview User Domain Error Handling
 * 
 * Handles errors specific to user operations (profile updates, password changes, etc.)
 * Provides user-friendly error messages and consistent error handling patterns.
 */

import { AppError, handleError, getErrorMessage } from './base'

/**
 * User-specific error codes
 */
export const USER_ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const

/**
 * User-friendly error messages for user operations
 */
const USER_ERROR_MESSAGES: Record<string, string> = {
  [USER_ERROR_CODES.USER_NOT_FOUND]: 'User not found. Please check and try again.',
  [USER_ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'This email address is already in use.',
  [USER_ERROR_CODES.INVALID_PASSWORD]: 'The current password is incorrect.',
  [USER_ERROR_CODES.WEAK_PASSWORD]:
    'Password must be at least 8 characters and include uppercase, lowercase, and numbers.',
  [USER_ERROR_CODES.PROFILE_UPDATE_FAILED]: 'Failed to update profile. Please try again.',
  [USER_ERROR_CODES.ACCOUNT_DISABLED]: 'This account has been disabled. Please contact support.',
}

/**
 * Handle user-specific errors with domain context
 * 
 * @param error - Error to handle
 * @param action - User action being performed
 * @returns User-friendly error message
 * 
 * @example
 * ```tsx
 * try {
 *   await updateUserProfile(userId, data)
 * } catch (error) {
 *   const message = handleUserError(error, 'update_profile')
 *   toast.error(message)
 * }
 * ```
 */
export function handleUserError(
  error: unknown,
  action: 'fetch' | 'create' | 'update' | 'delete' | 'update_profile' | 'change_password'
): string {
  return handleError(error, {
    feature: 'UserManagement',
    action,
    domain: 'user',
  })
}

/**
 * Get user-friendly message for user errors
 * Checks for known user error codes and returns appropriate messages
 */
export function getUserErrorMessage(error: unknown): string {
  const code = getUserErrorCode(error)
  
  if (code && code in USER_ERROR_MESSAGES) {
    return USER_ERROR_MESSAGES[code] ?? getErrorMessage(error)
  }
  
  return getErrorMessage(error)
}

/**
 * Extract error code from user errors
 */
function getUserErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return undefined
}

/**
 * Create user-specific error
 */
export function createUserError(
  code: keyof typeof USER_ERROR_CODES,
  metadata?: Record<string, unknown>
): AppError {
  const message = USER_ERROR_MESSAGES[code] ?? 'A user error occurred'
  return new AppError(message, code, 400, metadata)
}
