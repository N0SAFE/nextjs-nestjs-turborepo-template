/**
 * Example: Organization Operations using Context-Aware Plugin Utilities
 * 
 * This file demonstrates how to use the organization plugin utilities
 * with automatic header injection in ORPC handlers.
 */

import { ORPCError } from '@orpc/client';
import { assertAuthenticated } from '../../orpc/types';
import type { ORPCContextWithAuth } from '../../orpc/middlewares';

/**
 * Example 1: Create a new organization
 * 
 * This demonstrates:
 * - Using context.auth.org.createOrganization() with auto-injected headers
 * - Creating an organization with the current user as owner
 */
export const createOrganizationHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    name: string;
    slug: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Create organization with current user as owner
  // ✅ Headers are automatically injected from context
  const org = await auth.org.createOrganization({
    name: input.name,
    slug: input.slug,
    userId: auth.user.id,
  });

  return {
    id: org.organization.id,
    name: org.organization.name,
    slug: org.organization.slug,
  };
};

/**
 * Example 2: Add a member to an organization
 * 
 * This demonstrates:
 * - Checking organization access with hasAccess()
 * - Using context.auth.org.addMember() with auto-injected headers
 */
export const addMemberHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    organizationId: string;
    userId: string;
    role: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Check if current user has access to this organization
  // ✅ No need to pass headers manually
  const hasAccess = await auth.org.hasAccess(input.organizationId);
  if (!hasAccess) {
    throw new ORPCError('FORBIDDEN', {
      message: "You don't have access to this organization",
    });
  }

  // Add the member
  // ✅ Headers auto-injected
  const member = await auth.org.addMember({
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
  });

  return {
    id: member.member.id,
    userId: member.member.userId,
    organizationId: member.member.organizationId,
    role: member.member.role,
  };
};

/**
 * Example 3: List organization members
 * 
 * This demonstrates:
 * - Using context.auth.org.listMembers() with auto-injected headers
 * - Fetching all members of an organization
 */
export const listMembersHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    organizationId: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Verify access to organization
  if (!(await auth.org.hasAccess(input.organizationId))) {
    throw new ORPCError('FORBIDDEN', {
      message: "You don't have access to this organization",
    });
  }

  // List all members
  // ✅ Headers auto-injected
  const result = await auth.org.listMembers(input.organizationId);

  return result.members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.createdAt,
  }));
};

/**
 * Example 4: Update member role
 * 
 * This demonstrates:
 * - Using context.auth.org.updateMemberRole()
 * - Role management within organizations
 */
export const updateMemberRoleHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    organizationId: string;
    userId: string;
    role: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Verify access
  if (!(await auth.org.hasAccess(input.organizationId))) {
    throw new ORPCError('FORBIDDEN', {
      message: "You don't have access to this organization",
    });
  }

  // Prevent changing own role
  if (input.userId === auth.user.id) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Cannot change your own role',
    });
  }

  // Update the role
  // ✅ No manual header passing
  const result = await auth.org.updateMemberRole({
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
  });

  return {
    id: result.member.id,
    userId: result.member.userId,
    role: result.member.role,
  };
};

/**
 * Example 5: Remove member from organization
 * 
 * This demonstrates:
 * - Using context.auth.org.removeMember()
 * - Member removal
 */
export const removeMemberHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    organizationId: string;
    userId: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Verify access
  if (!(await auth.org.hasAccess(input.organizationId))) {
    throw new ORPCError('FORBIDDEN', {
      message: "You don't have access to this organization",
    });
  }

  // Prevent removing self
  if (input.userId === auth.user.id) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Cannot remove yourself from organization',
    });
  }

  // Remove the member
  // ✅ Headers auto-injected
  await auth.org.removeMember({
    organizationId: input.organizationId,
    userId: input.userId,
  });

  return { success: true };
};

/**
 * Example 6: Get organization details
 * 
 * This demonstrates:
 * - Using context.auth.org.getOrganization()
 * - Fetching organization information
 */
export const getOrganizationHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    organizationId: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Verify access
  if (!(await auth.org.hasAccess(input.organizationId))) {
    throw new ORPCError('FORBIDDEN', {
      message: "You don't have access to this organization",
    });
  }

  // Get organization details
  // ✅ Headers auto-injected
  const org = await auth.org.getOrganization(input.organizationId);

  return {
    id: org.organization.id,
    name: org.organization.name,
    slug: org.organization.slug,
    createdAt: org.organization.createdAt,
  };
};

/**
 * Example 7: List user's organizations
 * 
 * This demonstrates:
 * - Using context.auth.org.listOrganizations()
 * - Fetching all organizations for current user
 */
export const listUserOrganizationsHandler = async ({
  context,
}: {
  context: ORPCContextWithAuth;
}) => {
  const auth = assertAuthenticated(context.auth);

  // List all organizations for current user
  // ✅ No manual header passing needed
  const result = await auth.org.listOrganizations();

  return result.organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: org.role, // User's role in this organization
  }));
};

/**
 * Example 8: Send organization invitation
 * 
 * This demonstrates:
 * - Using context.auth.org.inviteMember()
 * - Inviting users to join an organization
 */
export const inviteMemberHandler = async ({
  context,
  input,
}: {
  context: ORPCContextWithAuth;
  input: {
    organizationId: string;
    email: string;
    role: string;
  };
}) => {
  const auth = assertAuthenticated(context.auth);

  // Verify access
  if (!(await auth.org.hasAccess(input.organizationId))) {
    throw new ORPCError('FORBIDDEN', {
      message: "You don't have access to this organization",
    });
  }

  // Send invitation
  // ✅ Headers auto-injected
  const invitation = await auth.org.inviteMember({
    organizationId: input.organizationId,
    email: input.email,
    role: input.role,
  });

  return {
    id: invitation.invitation.id,
    email: invitation.invitation.email,
    organizationId: invitation.invitation.organizationId,
    expiresAt: invitation.invitation.expiresAt,
  };
};

/**
 * Comparison: Before and After
 * 
 * BEFORE (Manual header passing):
 * ```typescript
 * const member = await auth.api.organization.addMember({
 *   headers: {
 *     authorization: context.request.headers.get('authorization') ?? '',
 *     cookie: context.request.headers.get('cookie') ?? '',
 *   },
 *   body: {
 *     organizationId: input.organizationId,
 *     userId: input.userId,
 *     role: input.role
 *   }
 * });
 * ```
 * 
 * AFTER (Auto-injected headers):
 * ```typescript
 * const member = await auth.org.addMember({
 *   organizationId: input.organizationId,
 *   userId: input.userId,
 *   role: input.role
 * });
 * ```
 * 
 * Benefits:
 * - 50% less code
 * - Cleaner parameter structure
 * - No header extraction boilerplate
 * - Better readability
 * - Type-safe API
 */
