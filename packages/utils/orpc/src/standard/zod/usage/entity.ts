/**
 * @fileoverview User Entity Schema
 * 
 * This file defines the base Zod schema for the User entity.
 * The entity schema is the foundation for all CRUD operations and validates:
 * - Data structure and types
 * - Field constraints (min/max length, regex patterns)
 * - Nullable and optional fields
 * 
 * @example
 * ```typescript
 * import { userSchema, UserRole } from './entity';
 * 
 * // Validate user data
 * const user = userSchema.parse(rawData);
 * 
 * // Use the type
 * type User = z.infer<typeof userSchema>;
 * ```
 */

import { z } from 'zod/v4';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * User roles with their hierarchy
 * Higher value = more permissions
 */
export const USER_ROLES = ['user', 'moderator', 'admin', 'superadmin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * User account status
 */
export const USER_STATUS = ['active', 'inactive', 'pending', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

// ============================================================================
// BASE SCHEMA
// ============================================================================

/**
 * Core user schema with all fields and validations
 * 
 * This schema is used by:
 * - Standard operations (list, read, create, update, delete)
 * - Custom operations (check email, update profile, etc.)
 * - Hook generation (type inference for inputs/outputs)
 */
export const userSchema = z.object({
  // -------------------------------------------------------------------------
  // Identity Fields
  // -------------------------------------------------------------------------
  
  /** Unique user identifier (UUID v4) */
  id: z.uuid(),
  
  /** User's email address - unique constraint in database */
  email: z.email(),
  
  /** Display name (2-100 characters) */
  name: z.string().min(2).max(100),
  
  /** Optional username for public profile (3-30 chars, alphanumeric + underscore) */
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).nullable(),
  
  // -------------------------------------------------------------------------
  // Profile Fields
  // -------------------------------------------------------------------------
  
  /** Profile picture URL */
  avatar: z.url().nullable(),
  
  /** Short bio (max 500 characters) */
  bio: z.string().max(500).nullable(),
  
  /** User's location/timezone */
  location: z.string().max(100).nullable(),
  
  /** User's website/portfolio URL */
  website: z.url().nullable(),
  
  // -------------------------------------------------------------------------
  // Account Status
  // -------------------------------------------------------------------------
  
  /** User role for permissions */
  role: z.enum(USER_ROLES).default('user'),
  
  /** Account status */
  status: z.enum(USER_STATUS).default('pending'),
  
  /** Whether email has been verified */
  emailVerified: z.boolean().default(false),
  
  /** Timestamp when email was verified */
  emailVerifiedAt: z.iso.datetime().nullable(),
  
  /** Whether account is banned */
  banned: z.boolean().default(false),
  
  /** Reason for ban (if applicable) */
  banReason: z.string().nullable(),
  
  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------
  
  /** Last login timestamp */
  lastLoginAt: z.iso.datetime().nullable(),
  
  /** Number of login attempts (for rate limiting) */
  loginAttempts: z.number().int().min(0).default(0),
  
  /** Custom metadata/preferences (JSON) */
  metadata: z.record(z.string(), z.unknown()).optional(),
  
  // -------------------------------------------------------------------------
  // Timestamps
  // -------------------------------------------------------------------------
  
  /** Account creation timestamp */
  createdAt: z.iso.datetime(),
  
  /** Last update timestamp */
  updatedAt: z.iso.datetime(),
  
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: z.iso.datetime().nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Full user type inferred from schema */
export type User = z.infer<typeof userSchema>;

/** User input type (for creation) */
export type UserInput = z.input<typeof userSchema>;

/** User output type (after validation) */
export type UserOutput = z.output<typeof userSchema>;

// ============================================================================
// PARTIAL SCHEMAS (for specific operations)
// ============================================================================

/**
 * Schema for user creation - excludes auto-generated fields
 */
export const userCreateSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  emailVerified: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  loginAttempts: true,
});

export type UserCreate = z.infer<typeof userCreateSchema>;

/**
 * Schema for user updates - all fields optional except id
 */
export const userUpdateSchema = userSchema.partial().required({ id: true });

export type UserUpdate = z.infer<typeof userUpdateSchema>;

/**
 * Schema for public profile (no sensitive data)
 */
export const userPublicSchema = userSchema.pick({
  id: true,
  name: true,
  username: true,
  avatar: true,
  bio: true,
  location: true,
  website: true,
  createdAt: true,
});

export type UserPublic = z.infer<typeof userPublicSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a value is a valid user role
 */
export function isValidRole(role: unknown): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

/**
 * Check if a role has higher or equal permissions
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return USER_ROLES.indexOf(userRole) >= USER_ROLES.indexOf(requiredRole);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    user: 'User',
    moderator: 'Moderator',
    admin: 'Administrator',
    superadmin: 'Super Administrator',
  };
  return displayNames[role];
}
