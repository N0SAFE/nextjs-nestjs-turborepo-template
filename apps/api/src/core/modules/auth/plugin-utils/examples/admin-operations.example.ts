/**
 * Example: Admin Operations using Context-Aware Plugin Utilities
 * 
 * This file demonstrates how to use the admin plugin utilities
 * with automatic header injection in ORPC handlers.
 */

import { ORPCError } from '@orpc/client';
import { assertAuthenticated } from '../../orpc/types';
import type { ORPCContextWithAuth } from '../../orpc/middlewares';

/**
 * Example 1: Create a new user (admin-only operation)
 * 
 * This demonstrates:
 * - Checking admin access
 * - Using context.auth.admin.createUser() with auto-injected headers
 * - Error handling
 */
export const createUserHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    email: string;
    password: string;
    name: string;
    role?: string;
  };
}) => {
  // Get authenticated context (ensures user is logged in)
  const auth = assertAuthenticated(context.auth);

  // Check if user has admin access
  // ✅ No need to pass headers manually - they're auto-injected!
  const hasAccess = await auth.admin.hasAccess();
  if (!hasAccess) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Only administrators can create users',
    });
  }

  // Create the user
  // ✅ Headers are automatically injected from context
  const result = await auth.admin.createUser({
    email: input.email,
    password: input.password,
    name: input.name,
    role: input.role ?? 'user',
  });

  return {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role ?? 'user',
  };
};

/**
 * Example 2: Ban a user (admin-only operation)
 * 
 * This demonstrates:
 * - Using context.auth.admin.banUser() with auto-injected headers
 * - Simplified error handling with hasAccess()
 */
export const banUserHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    userId: string;
    reason?: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Check admin access
  if (!(await auth.admin.hasAccess())) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Admin access required to ban users',
    });
  }

  // Ban the user
  // ✅ No manual header passing needed
  await auth.admin.banUser(input.userId, input.reason);

  return { success: true };
};

/**
 * Example 3: List all users with pagination
 * 
 * This demonstrates:
 * - Using context.auth.admin.listUsers() with query options
 * - Pagination support
 */
export const listUsersHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    limit?: number;
    offset?: number;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Verify admin access
  if (!(await auth.admin.hasAccess())) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Admin access required to list users',
    });
  }

  // List users with pagination
  // ✅ Headers auto-injected
  const result = await auth.admin.listUsers({
    limit: input.limit ?? 50,
    offset: input.offset ?? 0,
  });

  return result.users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? 'user',
  }));
};

/**
 * Example 4: Update user role
 * 
 * This demonstrates:
 * - Using context.auth.admin.setRole()
 * - Role assignment
 */
export const updateUserRoleHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    userId: string;
    role: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Check admin access
  if (!(await auth.admin.hasAccess())) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Admin access required to update user roles',
    });
  }

  // Update the role
  // ✅ Headers automatically injected
  const result = await auth.admin.setRole(input.userId, input.role);

  return {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role ?? 'user',
  };
};

/**
 * Example 5: Delete a user
 * 
 * This demonstrates:
 * - Using context.auth.admin.deleteUser()
 * - Handling user deletion
 */
export const deleteUserHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    userId: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Check admin access
  if (!(await auth.admin.hasAccess())) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Admin access required to delete users',
    });
  }

  // Prevent self-deletion
  if (input.userId === auth.user.id) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Cannot delete your own account',
    });
  }

  // Delete the user
  // ✅ No manual header passing
  await auth.admin.deleteUser(input.userId);

  return { success: true };
};

/**
 * Comparison: Before and After
 * 
 * BEFORE (Manual header passing):
 * ```typescript
 * const result = await auth.api.createUser({
 *   headers: {
 *     authorization: context.request.headers.get('authorization') ?? '',
 *     cookie: context.request.headers.get('cookie') ?? '',
 *   },
 *   body: {
 *     email: input.email,
 *     password: input.password,
 *     name: input.name,
 *     data: { role: input.role ?? 'user' }
 *   }
 * });
 * ```
 * 
 * AFTER (Auto-injected headers):
 * ```typescript
 * const result = await auth.admin.createUser({
 *   email: input.email,
 *   password: input.password,
 *   name: input.name,
 *   role: input.role ?? 'user'
 * });
 * ```
 * 
 * Benefits:
 * - 60% less code
 * - No manual header extraction
 * - Type-safe parameter structure
 * - Cleaner, more readable code
 * - Consistent API across all plugin methods
 */
