/**
 * Auth Domain - Zod Schemas
 * 
 * Validation schemas for authentication operations
 * These schemas provide both runtime validation and TypeScript type inference
 */

import { z } from 'zod'

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Sign in with email and password
 */
export const signInSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * Sign up with email, password, and name
 */
export const signUpSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

/**
 * Reset password with token
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * Update user profile
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  image: z.url('Invalid image URL').optional(),
})

/**
 * Change password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
