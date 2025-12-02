import { schemas } from "./config";
import type { BetterAuthPlugin } from 'better-auth';

/**
 * Creates a common permission helper function that wraps Better Auth plugins with permission checks
 * @returns A function that takes a plugin and permission check function and returns a wrapped plugin
 */
export function createCommonPermissionHelper() {
  return function<Session>(
    plugin: BetterAuthPlugin,
    checkPermission: (session: Session | null | undefined) => boolean | Promise<boolean>
  ): BetterAuthPlugin {
    // Clone the plugin to avoid mutating the original
    const wrappedPlugin: BetterAuthPlugin = { ...plugin };

    // If plugin has endpoints, wrap each endpoint's handler with permission check
    if (plugin.endpoints) {
      wrappedPlugin.endpoints = Object.entries(plugin.endpoints).reduce((acc, [key, endpoint]) => {
        acc[key] = {
          ...endpoint,
          handler: async (ctx: any) => {
            // Extract session from context
            const session = ctx.session;
            
            // Check permission
            const hasPermission = await Promise.resolve(checkPermission(session));
            
            if (!hasPermission) {
              throw new Error('Permission denied');
            }
            
            // Call original handler if permission check passes
            return endpoint.handler(ctx);
          },
        };
        return acc;
      }, {} as any);
    }

    return wrappedPlugin;
  };
}

/**
 * Common permission definitions that can be reused across the application
 */
export const commonPermissions = {
    // Resource-specific read-only permissions
    capsuleReadOnly: {
        capsule: ["list", "read"] as const,
    },

    // Resource-specific full access
    capsuleFullAccess: {
        capsule: ["list", "read", "create", "update", "delete"] as const,
    },

    // Write operations (create, update, delete)
    capsuleWriteAccess: {
        capsule: ["create", "update", "delete"] as const,
    },

    // List-only access
    capsuleListOnly: {
        capsule: ["list"] as const,
    },
} as const;

/**
 * Common schema definitions for permission validation
 */
export const commonSchemas = {
    // Schema for read-only actions across all resources
    readOnlyActions: schemas.actions.only("list", "read"),

    // Schema for write actions (create, update, delete)
    writeActions: schemas.actions.filter((action): action is "create" | "update" | "delete" => new RegExp(/create|update|delete/).exec(action) !== null),

    // Schema for capsule-specific actions
    capsuleActions: schemas.actions.forResource("capsule"),

    // Schema for dangerous/destructive actions
    destructiveActions: schemas.actions.only("delete"),

    // Schema for safe actions (excluding delete)
    safeActions: schemas.actions.excluding("delete"),

    // Custom permission schemas
    readOnlyPermission: schemas.actions.customPermission({
        capsule: ["list", "read"] as const,
    }),

    writeOnlyPermission: schemas.actions.customPermission({
        capsule: ["create", "update", "delete"] as const,
    }),

    // Schema for admin permissions on capsule
    adminCapsulePermission: schemas.actions.forRoleOnResource("admin", "capsule"),

    // Schema for all admin actions
    adminAllActions: schemas.actions.forRole("admin"),

    // Schema for Sarah's actions
    sarahAllActions: schemas.actions.forRole("sarah"),
} as const;

export type CommonPermissionKeys = keyof typeof commonPermissions;

export type CommonPermission<T extends CommonPermissionKeys> = (typeof commonPermissions)[T];
