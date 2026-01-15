/**
 * @fileoverview Admin Domain Error Handling
 * 
 * Handles errors specific to admin operations (user management, permissions, system settings, etc.)
 * Provides admin-friendly error messages and consistent error handling patterns.
 */

import { AppError, handleError, getErrorMessage } from './base'

/**
 * Admin-specific error codes
 */
export const ADMIN_ERROR_CODES = {
  ADMIN_PERMISSION_REQUIRED: 'ADMIN_PERMISSION_REQUIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CANNOT_BAN_ADMIN: 'CANNOT_BAN_ADMIN',
  CANNOT_DELETE_SELF: 'CANNOT_DELETE_SELF',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  INVALID_ROLE: 'INVALID_ROLE',
  SYSTEM_SETTING_INVALID: 'SYSTEM_SETTING_INVALID',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  AUDIT_LOG_ERROR: 'AUDIT_LOG_ERROR',
} as const

/**
 * User-friendly error messages for admin operations
 */
const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  [ADMIN_ERROR_CODES.ADMIN_PERMISSION_REQUIRED]:
    'Admin permissions are required to perform this action.',
  [ADMIN_ERROR_CODES.USER_NOT_FOUND]: 'User not found.',
  [ADMIN_ERROR_CODES.CANNOT_BAN_ADMIN]: 'Cannot ban an administrator.',
  [ADMIN_ERROR_CODES.CANNOT_DELETE_SELF]: 'You cannot delete your own account.',
  [ADMIN_ERROR_CODES.ROLE_NOT_FOUND]: 'Role not found.',
  [ADMIN_ERROR_CODES.INVALID_ROLE]: 'Invalid role assignment.',
  [ADMIN_ERROR_CODES.SYSTEM_SETTING_INVALID]: 'Invalid system setting value.',
  [ADMIN_ERROR_CODES.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  [ADMIN_ERROR_CODES.AUDIT_LOG_ERROR]: 'Failed to record audit log.',
}

/**
 * Handle admin-specific errors with domain context
 * 
 * @param error - Error to handle
 * @param action - Admin action being performed
 * @param targetUserId - Optional target user ID for user management operations
 * @returns User-friendly error message
 * 
 * @example
 * ```tsx
 * try {
 *   await adminBanUser(userId)
 * } catch (error) {
 *   const message = handleAdminError(error, 'ban_user', userId)
 *   toast.error(message)
 * }
 * ```
 */
export function handleAdminError(
  error: unknown,
  action:
    | 'list_users'
    | 'ban_user'
    | 'unban_user'
    | 'delete_user'
    | 'update_user_role'
    | 'view_audit_logs'
    | 'update_system_settings'
    | 'manage_permissions',
  targetUserId?: string
): string {
  return handleError(error, {
    feature: 'AdminPanel',
    action,
    domain: 'admin',
    targetUserId,
  })
}

/**
 * Get user-friendly message for admin errors
 * Checks for known admin error codes and returns appropriate messages
 */
export function getAdminErrorMessage(error: unknown): string {
  const code = getAdminErrorCode(error)
  
  if (code && code in ADMIN_ERROR_MESSAGES) {
    return ADMIN_ERROR_MESSAGES[code] ?? getErrorMessage(error)
  }
  
  return getErrorMessage(error)
}

/**
 * Extract error code from admin errors
 */
function getAdminErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return undefined
}

/**
 * Create admin-specific error
 */
export function createAdminError(
  code: keyof typeof ADMIN_ERROR_CODES,
  metadata?: Record<string, unknown>
): AppError {
  const message = ADMIN_ERROR_MESSAGES[code] ?? 'An admin error occurred'
  return new AppError(message, code, 403, metadata)
}
