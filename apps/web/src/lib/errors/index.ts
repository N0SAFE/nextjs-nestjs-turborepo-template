/**
 * @fileoverview Error Handling System - Barrel Export
 * 
 * Central export point for all error handling utilities.
 * Provides domain-specific error handlers and base utilities.
 * 
 * @example Basic usage
 * ```tsx
 * import { handleUserError, getUserErrorMessage } from '@/lib/errors'
 * 
 * try {
 *   await updateUserProfile(userId, data)
 * } catch (error) {
 *   const message = handleUserError(error, 'update_profile')
 *   toast.error(message)
 * }
 * ```
 * 
 * @example Creating custom errors
 * ```tsx
 * import { createUserError, USER_ERROR_CODES } from '@/lib/errors'
 * 
 * throw createUserError(USER_ERROR_CODES.EMAIL_ALREADY_EXISTS, {
 *   email: userEmail
 * })
 * ```
 */

// Base error utilities
export {
  AppError,
  ERROR_MESSAGES,
  getErrorMessage,
  handleError,
  getErrorCode,
  isAppError,
  hasStatusCode,
  hasErrorCode,
} from './base'

// User domain errors
export {
  USER_ERROR_CODES,
  handleUserError,
  getUserErrorMessage,
  createUserError,
} from './user'

// Organization domain errors
export {
  ORGANIZATION_ERROR_CODES,
  handleOrganizationError,
  getOrganizationErrorMessage,
  createOrganizationError,
} from './organization'

// Admin domain errors
export {
  ADMIN_ERROR_CODES,
  handleAdminError,
  getAdminErrorMessage,
  createAdminError,
} from './admin'
