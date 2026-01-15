/**
 * @fileoverview Organization Domain Error Handling
 * 
 * Handles errors specific to organization operations (create, update, member management, etc.)
 * Provides organization-friendly error messages and consistent error handling patterns.
 */

import { AppError, handleError, getErrorMessage } from './base'

/**
 * Organization-specific error codes
 */
export const ORGANIZATION_ERROR_CODES = {
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_NAME_EXISTS: 'ORG_NAME_EXISTS',
  ORG_SLUG_EXISTS: 'ORG_SLUG_EXISTS',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  MEMBER_ALREADY_EXISTS: 'MEMBER_ALREADY_EXISTS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CANNOT_REMOVE_OWNER: 'CANNOT_REMOVE_OWNER',
  CANNOT_LEAVE_ONLY_ORG: 'CANNOT_LEAVE_ONLY_ORG',
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  INVITATION_INVALID: 'INVITATION_INVALID',
} as const

/**
 * User-friendly error messages for organization operations
 */
const ORGANIZATION_ERROR_MESSAGES: Record<string, string> = {
  [ORGANIZATION_ERROR_CODES.ORG_NOT_FOUND]: 'Organization not found.',
  [ORGANIZATION_ERROR_CODES.ORG_NAME_EXISTS]: 'An organization with this name already exists.',
  [ORGANIZATION_ERROR_CODES.ORG_SLUG_EXISTS]: 'This organization URL is already taken.',
  [ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND]: 'Member not found in this organization.',
  [ORGANIZATION_ERROR_CODES.MEMBER_ALREADY_EXISTS]: 'This user is already a member.',
  [ORGANIZATION_ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
    'You do not have permission to perform this action in this organization.',
  [ORGANIZATION_ERROR_CODES.CANNOT_REMOVE_OWNER]:
    'Cannot remove the organization owner. Transfer ownership first.',
  [ORGANIZATION_ERROR_CODES.CANNOT_LEAVE_ONLY_ORG]:
    'You must be a member of at least one organization.',
  [ORGANIZATION_ERROR_CODES.INVITATION_EXPIRED]: 'This invitation has expired.',
  [ORGANIZATION_ERROR_CODES.INVITATION_INVALID]: 'This invitation is invalid or has been revoked.',
}

/**
 * Handle organization-specific errors with domain context
 * 
 * @param error - Error to handle
 * @param action - Organization action being performed
 * @param organizationId - Optional organization ID for context
 * @returns User-friendly error message
 * 
 * @example
 * ```tsx
 * try {
 *   await addMemberToOrganization(orgId, userId)
 * } catch (error) {
 *   const message = handleOrganizationError(error, 'add_member', orgId)
 *   toast.error(message)
 * }
 * ```
 */
export function handleOrganizationError(
  error: unknown,
  action:
    | 'fetch'
    | 'create'
    | 'update'
    | 'delete'
    | 'add_member'
    | 'remove_member'
    | 'update_member_role'
    | 'accept_invitation'
    | 'send_invitation'
    | 'revoke_invitation',
  organizationId?: string
): string {
  return handleError(error, {
    feature: 'OrganizationManagement',
    action,
    domain: 'organization',
    organizationId,
  })
}

/**
 * Get user-friendly message for organization errors
 * Checks for known organization error codes and returns appropriate messages
 */
export function getOrganizationErrorMessage(error: unknown): string {
  const code = getOrganizationErrorCode(error)
  
  if (code && code in ORGANIZATION_ERROR_MESSAGES) {
    return ORGANIZATION_ERROR_MESSAGES[code] ?? getErrorMessage(error)
  }
  
  return getErrorMessage(error)
}

/**
 * Extract error code from organization errors
 */
function getOrganizationErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return undefined
}

/**
 * Create organization-specific error
 */
export function createOrganizationError(
  code: keyof typeof ORGANIZATION_ERROR_CODES,
  metadata?: Record<string, unknown>
): AppError {
  const message = ORGANIZATION_ERROR_MESSAGES[code] ?? 'An organization error occurred'
  return new AppError(message, code, 400, metadata)
}
