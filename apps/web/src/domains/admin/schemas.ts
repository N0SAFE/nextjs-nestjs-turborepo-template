/**
 * Admin Domain - Zod Schemas
 *
 * Validation schemas for admin operations matching Better Auth admin SDK signatures
 */

import { z } from "zod";
import { platformSchemas } from "@repo/auth";

/**
 * List users schema - wraps query parameters
 */
export const listUsersSchema = z.object({
  query: z.object({
    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
    sortBy: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
  }),
});

/**
 * Ban user schema - Better Auth expects flat object
 */
export const banUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  banReason: z.string().optional(),
  banExpiresIn: z.number().int().positive().optional(),
});

/**
 * Unban user schema
 */
export const unbanUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Set role schema
 */
export const setRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.union([
    platformSchemas.roleNames,
    z.array(platformSchemas.roleNames),
  ]),
});

/**
 * Create user schema
 */
export const createUserSchema = z.object({
  email: z.string().transform((val) => {
    const result = z.email().safeParse(val);
    if (!result.success) throw new Error("Invalid email address");
    return val;
  }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z
    .union([platformSchemas.roleNames, z.array(platformSchemas.roleNames)])
    .optional(),
  data: z.record(z.string(), z.any()).optional(),
});

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  data: z.record(z.string(), z.any()),
});

/**
 * Remove user schema
 */
export const removeUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Has permission schema
 */
export const hasPermissionSchema = z.object({
  permissions: z.record(z.string(), z.array(z.string())),
});
