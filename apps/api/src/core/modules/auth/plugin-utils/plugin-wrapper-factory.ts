/**
 * Plugin Wrapper Factory for Better Auth
 * 
 * This module provides a factory class system that creates type-safe wrapper classes
 * for Better Auth plugins. Each plugin gets its own wrapper class with methods that
 * automatically inject headers and provide convenient access to plugin functionality.
 * 
 * Architecture:
 * - Factory class receives Auth instance
 * - Factory creates plugin-specific wrapper classes
 * - Wrapper classes encapsulate all plugin methods with automatic header injection
 * - Full type inference from Better Auth configuration
 */

import type { Auth } from "@/auth";

/**
 * Base interface for plugin wrapper classes
 * All plugin wrappers should implement this interface
 */
export interface PluginWrapper {
  /**
   * Check if the current user has access to this plugin
   * Each plugin implements its own access logic
   */
  hasAccess(...args: any[]): Promise<boolean>;
}

/**
 * Options for creating a plugin wrapper
 */
export interface PluginWrapperOptions {
  /** Auth instance from Better Auth */
  auth: Auth;
  /** Headers to inject into API calls */
  headers: Headers;
}

/**
 * Factory function type for creating plugin wrappers
 * Takes options and returns a plugin wrapper instance
 */
export type PluginWrapperFactory<T extends PluginWrapper> = (
  options: PluginWrapperOptions
) => T;

/**
 * Registry of plugin wrapper factories
 * Maps plugin names to their factory functions
 */
export class PluginWrapperRegistry {
  private factories = new Map<string, PluginWrapperFactory<any>>();

  /**
   * Register a plugin wrapper factory
   * 
   * @param pluginName - Name of the plugin (e.g., 'admin', 'organization')
   * @param factory - Factory function that creates the wrapper
   * 
   * @example
   * ```typescript
   * registry.register('admin', (options) => new AdminPluginWrapper(options));
   * ```
   */
  register<T extends PluginWrapper>(
    pluginName: string,
    factory: PluginWrapperFactory<T>
  ): void {
    this.factories.set(pluginName, factory);
  }

  /**
   * Create a plugin wrapper instance
   * 
   * @param pluginName - Name of the plugin
   * @param options - Options for creating the wrapper
   * @returns Plugin wrapper instance
   * 
   * @example
   * ```typescript
   * const adminWrapper = registry.create('admin', { auth, headers });
   * ```
   */
  create<T extends PluginWrapper>(
    pluginName: string,
    options: PluginWrapperOptions
  ): T {
    const factory = this.factories.get(pluginName);
    if (!factory) {
      throw new Error(`Plugin wrapper factory not found for: ${pluginName}`);
    }
    return factory(options);
  }

  /**
   * Check if a plugin wrapper is registered
   */
  has(pluginName: string): boolean {
    return this.factories.has(pluginName);
  }

  /**
   * Get all registered plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.factories.keys());
  }
}

/**
 * Global plugin wrapper registry
 * Used to register and create plugin wrappers
 */
export const pluginWrapperRegistry = new PluginWrapperRegistry();

/**
 * Admin Plugin Wrapper
 * Wraps Better Auth admin plugin methods with automatic header injection
 */
export class AdminPluginWrapper implements PluginWrapper {
  constructor(private readonly options: PluginWrapperOptions) {}

  /**
   * Check if the current user has admin access
   */
  async hasAccess(): Promise<boolean> {
    try {
      const session = await this.options.auth.api.getSession({
        headers: this.options.headers,
      });
      
      if (!session || !session.user) return false;
      
      // Check if user has admin role
      const user = session.user as { role?: string };
      return user.role === 'admin' || user.role === 'superAdmin';
    } catch (error) {
      console.error('AdminPluginWrapper.hasAccess error:', error);
      return false;
    }
  }

  /**
   * Create a new user (admin-only operation)
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    return await this.options.auth.api.createUser({
      headers: this.options.headers,
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
   * Update an existing user
   */
  async updateUser(
    userId: string,
    data: { name?: string; email?: string }
  ) {
    return await this.options.auth.api.updateUser({
      headers: this.options.headers,
      body: { userId, ...data },
    });
  }

  /**
   * Set or update a user's role
   */
  async setRole(userId: string, role: string) {
    return await this.options.auth.api.setRole({
      headers: this.options.headers,
      body: { userId, role },
    });
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string) {
    return await this.options.auth.api.deleteUser({
      headers: this.options.headers,
      body: { userId },
    });
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, reason?: string) {
    return await this.options.auth.api.banUser({
      headers: this.options.headers,
      body: { userId, reason },
    });
  }

  /**
   * Unban a previously banned user
   */
  async unbanUser(userId: string) {
    return await this.options.auth.api.unbanUser({
      headers: this.options.headers,
      body: { userId },
    });
  }

  /**
   * List all users
   */
  async listUsers(options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return await this.options.auth.api.listUsers({
      headers: this.options.headers,
      query: options ?? {},
    });
  }
}

/**
 * Organization Plugin Wrapper
 * Wraps Better Auth organization plugin methods with automatic header injection
 */
export class OrganizationPluginWrapper implements PluginWrapper {
  constructor(private readonly options: PluginWrapperOptions) {}

  /**
   * Check if the current user has access to a specific organization
   */
  async hasAccess(organizationId?: string): Promise<boolean> {
    try {
      const session = await this.options.auth.api.getSession({
        headers: this.options.headers,
      });
      
      if (!session || !session.user) return false;
      
      // If no organizationId provided, check if user is member of any organization
      if (!organizationId) {
        // This is a simplified check - in practice might want to list organizations
        return true;
      }
      
      // Try to get member record for specific organization
      const result = await this.options.auth.api.getMember({
        headers: this.options.headers,
        query: {
          organizationId,
          userId: session.user.id,
        },
      });
      
      return !!result;
    } catch (error) {
      console.error('OrganizationPluginWrapper.hasAccess error:', error);
      return false;
    }
  }

  /**
   * Create a new organization
   */
  async createOrganization(data: {
    name: string;
    slug: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }) {
    return await this.options.auth.api.createOrganization({
      headers: this.options.headers,
      body: data,
    });
  }

  /**
   * Update an existing organization
   */
  async updateOrganization(
    organizationId: string,
    data: {
      name?: string;
      slug?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return await this.options.auth.api.updateOrganization({
      headers: this.options.headers,
      body: { organizationId, ...data },
    });
  }

  /**
   * Delete an organization
   */
  async deleteOrganization(organizationId: string) {
    return await this.options.auth.api.deleteOrganization({
      headers: this.options.headers,
      body: { organizationId },
    });
  }

  /**
   * Get organization details by ID
   */
  async getOrganization(organizationId: string) {
    return await this.options.auth.api.getFullOrganization({
      headers: this.options.headers,
      query: { organizationId },
    });
  }

  /**
   * List all organizations for the current user
   */
  async listOrganizations() {
    return await this.options.auth.api.listOrganizations({
      headers: this.options.headers,
    });
  }

  /**
   * Add a member to an organization
   */
  async addMember(data: {
    organizationId: string;
    userId: string;
    role: string;
  }) {
    return await this.options.auth.api.addMember({
      headers: this.options.headers,
      body: data,
    });
  }

  /**
   * Remove a member from an organization
   */
  async removeMember(data: {
    organizationId: string;
    userId: string;
  }) {
    return await this.options.auth.api.removeMember({
      headers: this.options.headers,
      body: data,
    });
  }

  /**
   * Update a member's role within an organization
   */
  async updateMemberRole(data: {
    organizationId: string;
    userId: string;
    role: string;
  }) {
    return await this.options.auth.api.updateMemberRole({
      headers: this.options.headers,
      body: data,
    });
  }

  /**
   * List all members of an organization
   */
  async listMembers(organizationId: string) {
    return await this.options.auth.api.listMembers({
      headers: this.options.headers,
      query: { organizationId },
    });
  }

  /**
   * Get a specific member by organization and user ID
   */
  async getMember(data: {
    organizationId: string;
    userId: string;
  }) {
    return await this.options.auth.api.getMember({
      headers: this.options.headers,
      query: data,
    });
  }

  /**
   * Invite a user to join an organization
   */
  async inviteMember(data: {
    organizationId: string;
    email: string;
    role: string;
  }) {
    return await this.options.auth.api.inviteMember({
      headers: this.options.headers,
      body: data,
    });
  }

  /**
   * Accept an organization invitation
   */
  async acceptInvitation(invitationId: string) {
    return await this.options.auth.api.acceptInvitation({
      headers: this.options.headers,
      body: { invitationId },
    });
  }

  /**
   * Reject an organization invitation
   */
  async rejectInvitation(invitationId: string) {
    return await this.options.auth.api.rejectInvitation({
      headers: this.options.headers,
      body: { invitationId },
    });
  }

  /**
   * List pending invitations for the current user
   */
  async listInvitations() {
    return await this.options.auth.api.listInvitations({
      headers: this.options.headers,
    });
  }
}

// ============================================================================
// Register Default Plugin Wrappers
// ============================================================================

// Register admin plugin wrapper
pluginWrapperRegistry.register('admin', (options) => new AdminPluginWrapper(options));

// Register organization plugin wrapper
pluginWrapperRegistry.register('organization', (options) => new OrganizationPluginWrapper(options));

// Export type aliases for convenience
export type AdminPlugin = AdminPluginWrapper;
export type OrganizationPlugin = OrganizationPluginWrapper;
