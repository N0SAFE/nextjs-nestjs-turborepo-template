/**
 * Context-Aware Better Auth Plugin Utilities
 * 
 * These utilities provide type-safe wrappers around Better Auth plugin methods
 * with automatic header injection from the request context.
 * 
 * This eliminates the need to manually pass headers to every plugin method call.
 */

import type { Auth } from "@/auth";

/**
 * Context-aware wrapper for Better Auth admin plugin
 * 
 * Provides admin-level operations with automatic header injection:
 * - User management (create, update, delete, ban)
 * - Role management
 * - Access control checks
 * 
 * @example
 * ```typescript
 * // In ORPC handler
 * const auth = assertAuthenticated(context.auth);
 * const user = await auth.admin.createUser({
 *   email: 'user@example.com',
 *   password: 'secure123',
 *   name: 'John Doe',
 *   role: 'user'
 * });
 * ```
 */
export class AdminPluginUtils {
  constructor(
    private readonly auth: Auth,
    private readonly headers: Headers
  ) {}
  
  /**
   * Check if the current user has admin access
   * 
   * @returns true if user is authenticated and has admin role
   * 
   * @example
   * ```typescript
   * const hasAccess = await context.auth.admin.hasAccess();
   * if (!hasAccess) {
   *   throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
   * }
   * ```
   */
  async hasAccess(): Promise<boolean> {
    try {
      const session = await this.auth.api.getSession({
        headers: this.headers,
      });
      
      if (!session?.user) return false;
      
      // Check if user has admin role
      const user = session.user as { role?: string };
      return user.role === 'admin' || user.role === 'superAdmin';
    } catch (error) {
      console.error('AdminPluginUtils.hasAccess error:', error);
      return false;
    }
  }
  
  /**
   * Create a new user (admin-only operation)
   * Headers are automatically injected from context
   * 
   * @param data - User creation data
   * @returns Created user object
   * 
   * @example
   * ```typescript
   * const user = await context.auth.admin.createUser({
   *   email: 'newuser@example.com',
   *   password: 'secure123',
   *   name: 'Jane Doe',
   *   role: 'user'
   * });
   * ```
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    return await this.auth.api.createUser({
      headers: this.headers,
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        data: {
          role: data.role ?? 'user',
          emailVerified: false,
        },
      },
    });
  }
  
  /**
   * Update an existing user (admin-only operation)
   * 
   * @param userId - ID of user to update
   * @param data - Fields to update
   * @returns Updated user object
   * 
   * @example
   * ```typescript
   * const updatedUser = await context.auth.admin.updateUser('user-123', {
   *   name: 'Updated Name',
   *   email: 'newemail@example.com'
   * });
   * ```
   */
  async updateUser(
    userId: string,
    data: { name?: string; email?: string }
  ) {
    return await this.auth.api.updateUser({
      headers: this.headers,
      body: {
        userId,
        ...data,
      },
    });
  }
  
  /**
   * Set or update a user's role (admin-only operation)
   * 
   * @param userId - ID of user
   * @param role - Role to assign
   * @returns Updated user object
   * 
   * @example
   * ```typescript
   * await context.auth.admin.setRole('user-123', 'admin');
   * ```
   */
  async setRole(userId: string, role: string) {
    return await this.auth.api.setRole({
      headers: this.headers,
      body: { userId, role },
    });
  }
  
  /**
   * Delete a user (admin-only operation)
   * 
   * @param userId - ID of user to delete
   * 
   * @example
   * ```typescript
   * await context.auth.admin.deleteUser('user-123');
   * ```
   */
  async deleteUser(userId: string) {
    return await this.auth.api.deleteUser({
      headers: this.headers,
      body: { userId },
    });
  }
  
  /**
   * Ban a user (admin-only operation)
   * 
   * @param userId - ID of user to ban
   * @param reason - Optional reason for ban
   * 
   * @example
   * ```typescript
   * await context.auth.admin.banUser('user-123', 'Violated terms of service');
   * ```
   */
  async banUser(userId: string, reason?: string) {
    return await this.auth.api.banUser({
      headers: this.headers,
      body: { userId, reason },
    });
  }
  
  /**
   * Unban a previously banned user (admin-only operation)
   * 
   * @param userId - ID of user to unban
   * 
   * @example
   * ```typescript
   * await context.auth.admin.unbanUser('user-123');
   * ```
   */
  async unbanUser(userId: string) {
    return await this.auth.api.unbanUser({
      headers: this.headers,
      body: { userId },
    });
  }
  
  /**
   * List all users (admin-only operation)
   * 
   * @param options - Query options (pagination, filtering)
   * @returns Array of users
   * 
   * @example
   * ```typescript
   * const users = await context.auth.admin.listUsers({
   *   limit: 50,
   *   offset: 0
   * });
   * ```
   */
  async listUsers(options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return await this.auth.api.listUsers({
      headers: this.headers,
      query: options ?? {},
    });
  }
}

/**
 * Context-aware wrapper for Better Auth organization plugin
 * 
 * Provides organization-level operations with automatic header injection:
 * - Organization CRUD operations
 * - Member management
 * - Role management within organizations
 * - Team management
 * 
 * @example
 * ```typescript
 * // In ORPC handler
 * const auth = assertAuthenticated(context.auth);
 * const org = await auth.org.createOrganization({
 *   name: 'My Company',
 *   slug: 'my-company',
 *   userId: auth.user.id
 * });
 * ```
 */
export class OrganizationPluginUtils {
  constructor(
    private readonly auth: Auth,
    private readonly headers: Headers
  ) {}
  
  /**
   * Check if the current user has access to a specific organization
   * 
   * @param organizationId - ID of organization to check
   * @returns true if user is a member of the organization
   * 
   * @example
   * ```typescript
   * const hasAccess = await context.auth.org.hasAccess('org-123');
   * if (!hasAccess) {
   *   throw new ORPCError("FORBIDDEN", {
   *     message: "You don't have access to this organization"
   *   });
   * }
   * ```
   */
  async hasAccess(organizationId: string): Promise<boolean> {
    try {
      const session = await this.auth.api.getSession({
        headers: this.headers,
      });
      
      if (!session?.user) return false;
      
      // Try to get member record
      const result = await this.auth.api.getMember({
        headers: this.headers,
        query: {
          organizationId,
          userId: session.user.id,
        },
      });
      
      return !!result;
    } catch (error) {
      console.error('OrganizationPluginUtils.hasAccess error:', error);
      return false;
    }
  }
  
  /**
   * Create a new organization
   * 
   * @param data - Organization creation data
   * @returns Created organization object
   * 
   * @example
   * ```typescript
   * const org = await context.auth.org.createOrganization({
   *   name: 'Acme Corp',
   *   slug: 'acme-corp',
   *   userId: auth.user.id
   * });
   * ```
   */
  async createOrganization(data: {
    name: string;
    slug: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }) {
    return await this.auth.api.createOrganization({
      headers: this.headers,
      body: data,
    });
  }
  
  /**
   * Update an existing organization
   * 
   * @param organizationId - ID of organization to update
   * @param data - Fields to update
   * @returns Updated organization object
   * 
   * @example
   * ```typescript
   * const updated = await context.auth.org.updateOrganization('org-123', {
   *   name: 'Acme Corporation',
   *   slug: 'acme-corporation'
   * });
   * ```
   */
  async updateOrganization(
    organizationId: string,
    data: {
      name?: string;
      slug?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return await this.auth.api.updateOrganization({
      headers: this.headers,
      body: { organizationId, ...data },
    });
  }
  
  /**
   * Delete an organization
   * 
   * @param organizationId - ID of organization to delete
   * 
   * @example
   * ```typescript
   * await context.auth.org.deleteOrganization('org-123');
   * ```
   */
  async deleteOrganization(organizationId: string) {
    return await this.auth.api.deleteOrganization({
      headers: this.headers,
      body: { organizationId },
    });
  }
  
  /**
   * Get organization details by ID
   * 
   * @param organizationId - ID of organization
   * @returns Organization object
   * 
   * @example
   * ```typescript
   * const org = await context.auth.org.getOrganization('org-123');
   * ```
   */
  async getOrganization(organizationId: string) {
    return await this.auth.api.getOrganization({
      headers: this.headers,
      query: { organizationId },
    });
  }
  
  /**
   * List all organizations for the current user
   * 
   * @returns Array of organizations
   * 
   * @example
   * ```typescript
   * const orgs = await context.auth.org.listOrganizations();
   * ```
   */
  async listOrganizations() {
    return await this.auth.api.listOrganizations({
      headers: this.headers,
    });
  }
  
  /**
   * Add a member to an organization
   * 
   * @param data - Member addition data
   * @returns Created member object
   * 
   * @example
   * ```typescript
   * const member = await context.auth.org.addMember({
   *   organizationId: 'org-123',
   *   userId: 'user-456',
   *   role: 'member'
   * });
   * ```
   */
  async addMember(data: {
    organizationId: string;
    userId: string;
    role: string;
  }) {
    return await this.auth.api.addMember({
      headers: this.headers,
      body: data,
    });
  }
  
  /**
   * Remove a member from an organization
   * 
   * @param data - Member removal data
   * 
   * @example
   * ```typescript
   * await context.auth.org.removeMember({
   *   organizationId: 'org-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  async removeMember(data: {
    organizationId: string;
    userId: string;
  }) {
    return await this.auth.api.removeMember({
      headers: this.headers,
      body: data,
    });
  }
  
  /**
   * Update a member's role within an organization
   * 
   * @param data - Role update data
   * @returns Updated member object
   * 
   * @example
   * ```typescript
   * const updated = await context.auth.org.updateMemberRole({
   *   organizationId: 'org-123',
   *   userId: 'user-456',
   *   role: 'admin'
   * });
   * ```
   */
  async updateMemberRole(data: {
    organizationId: string;
    userId: string;
    role: string;
  }) {
    return await this.auth.api.updateMemberRole({
      headers: this.headers,
      body: data,
    });
  }
  
  /**
   * List all members of an organization
   * 
   * @param organizationId - ID of organization
   * @returns Array of members
   * 
   * @example
   * ```typescript
   * const members = await context.auth.org.listMembers('org-123');
   * ```
   */
  async listMembers(organizationId: string) {
    return await this.auth.api.listMembers({
      headers: this.headers,
      query: { organizationId },
    });
  }
  
  /**
   * Get a specific member by organization and user ID
   * 
   * @param data - Query parameters
   * @returns Member object
   * 
   * @example
   * ```typescript
   * const member = await context.auth.org.getMember({
   *   organizationId: 'org-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  async getMember(data: {
    organizationId: string;
    userId: string;
  }) {
    return await this.auth.api.getMember({
      headers: this.headers,
      query: data,
    });
  }
  
  /**
   * Invite a user to join an organization
   * 
   * @param data - Invitation data
   * @returns Invitation object
   * 
   * @example
   * ```typescript
   * const invitation = await context.auth.org.inviteMember({
   *   organizationId: 'org-123',
   *   email: 'newmember@example.com',
   *   role: 'member'
   * });
   * ```
   */
  async inviteMember(data: {
    organizationId: string;
    email: string;
    role: string;
  }) {
    return await this.auth.api.inviteMember({
      headers: this.headers,
      body: data,
    });
  }
  
  /**
   * Accept an organization invitation
   * 
   * @param invitationId - ID of invitation to accept
   * @returns Member object
   * 
   * @example
   * ```typescript
   * const member = await context.auth.org.acceptInvitation('invite-123');
   * ```
   */
  async acceptInvitation(invitationId: string) {
    return await this.auth.api.acceptInvitation({
      headers: this.headers,
      body: { invitationId },
    });
  }
  
  /**
   * Reject an organization invitation
   * 
   * @param invitationId - ID of invitation to reject
   * 
   * @example
   * ```typescript
   * await context.auth.org.rejectInvitation('invite-123');
   * ```
   */
  async rejectInvitation(invitationId: string) {
    return await this.auth.api.rejectInvitation({
      headers: this.headers,
      body: { invitationId },
    });
  }
  
  /**
   * List pending invitations for the current user
   * 
   * @returns Array of invitations
   * 
   * @example
   * ```typescript
   * const invitations = await context.auth.org.listInvitations();
   * ```
   */
  async listInvitations() {
    return await this.auth.api.listInvitations({
      headers: this.headers,
    });
  }
}
