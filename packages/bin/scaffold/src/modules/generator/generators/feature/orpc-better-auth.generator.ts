/**
 * ORPC Better Auth Integration Generator
 *
 * Generates integration between ORPC and Better Auth for
 * protected procedures, auth context, and session handling.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class OrpcBetterAuthGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "orpc-better-auth",
    priority: 28,
    version: "1.0.0",
    description: "ORPC and Better Auth integration for protected procedures",
    dependencies: ["orpc", "better-auth"],
    contributesTo: ["apps/api", "apps/web", "packages/contracts/api"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Auth schemas for contracts
    files.push(
      this.file("packages/contracts/api/src/schemas/auth.ts", this.getAuthSchemas()),
    );

    // Auth contract definitions
    files.push(
      this.file("packages/contracts/api/src/domains/auth.contract.ts", this.getAuthContract()),
    );

    // API auth integration
    if (this.hasPlugin(context, "nestjs")) {
      files.push(
        this.file("apps/api/src/lib/orpc/auth/index.ts", this.getApiAuthIndex()),
        this.file("apps/api/src/lib/orpc/auth/context.ts", this.getAuthContext()),
        this.file("apps/api/src/lib/orpc/auth/middleware.ts", this.getAuthMiddleware()),
        this.file("apps/api/src/lib/orpc/auth/procedures.ts", this.getProtectedProcedures()),
        this.file("apps/api/src/lib/orpc/auth/permissions.ts", this.getPermissions()),
        this.file("apps/api/src/lib/orpc/auth/types.ts", this.getApiAuthTypes()),
      );
    }

    // Web auth integration
    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file("apps/web/src/lib/orpc/auth/index.ts", this.getWebAuthIndex()),
        this.file("apps/web/src/lib/orpc/auth/use-auth-client.ts", this.getUseAuthClient()),
        this.file("apps/web/src/lib/orpc/auth/protected-query.ts", this.getProtectedQuery()),
        this.file("apps/web/src/lib/orpc/auth/auth-provider.tsx", this.getAuthProvider()),
        this.file("apps/web/src/lib/orpc/auth/types.ts", this.getWebAuthTypes()),
      );
    }

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // Better Auth is already a dependency from better-auth generator
    return [];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [];
  }

  private getAuthSchemas(): string {
    return `import { z } from "zod";

/**
 * Auth Schemas
 *
 * Type definitions for authentication and authorization
 */

/**
 * User schema
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable().optional(),
  emailVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

/**
 * Session schema
 */
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Session = z.infer<typeof sessionSchema>;

/**
 * Auth context schema (user + session)
 */
export const authContextSchema = z.object({
  user: userSchema,
  session: sessionSchema,
});

export type AuthContext = z.infer<typeof authContextSchema>;

/**
 * Role schema
 */
export const roleSchema = z.enum([
  "user",
  "admin",
  "moderator",
  "guest",
]);

export type Role = z.infer<typeof roleSchema>;

/**
 * Permission schema
 */
export const permissionSchema = z.string();

export type Permission = z.infer<typeof permissionSchema>;

/**
 * User with roles schema
 */
export const userWithRolesSchema = userSchema.extend({
  roles: z.array(roleSchema).default(["user"]),
});

export type UserWithRoles = z.infer<typeof userWithRolesSchema>;

/**
 * Login credentials schema
 */
export const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

/**
 * Register credentials schema
 */
export const registerCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterCredentials = z.infer<typeof registerCredentialsSchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePassword = z.infer<typeof changePasswordSchema>;

/**
 * Reset password request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPassword = z.infer<typeof resetPasswordSchema>;

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().optional(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

/**
 * Auth response schema
 */
export const authResponseSchema = z.object({
  user: userSchema,
  session: sessionSchema.optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Auth error codes
 */
export const authErrorCodeSchema = z.enum([
  "INVALID_CREDENTIALS",
  "USER_NOT_FOUND",
  "EMAIL_ALREADY_EXISTS",
  "SESSION_EXPIRED",
  "INVALID_TOKEN",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "RATE_LIMITED",
  "VERIFICATION_REQUIRED",
]);

export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;
`;
  }

  private getAuthContract(): string {
    return `import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  userSchema,
  sessionSchema,
  authContextSchema,
  loginCredentialsSchema,
  registerCredentialsSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  updateProfileSchema,
  authResponseSchema,
} from "../schemas/auth";

/**
 * Auth Contract
 *
 * Type-safe authentication API contract
 */
export const authContract = oc.router({
  /**
   * Get current user (if authenticated)
   */
  me: oc
    .route({
      method: "GET",
      path: "/auth/me",
      summary: "Get current user",
      description: "Returns the currently authenticated user or null",
    })
    .output(
      z.object({
        user: userSchema.nullable(),
        session: sessionSchema.nullable(),
      })
    ),

  /**
   * Get current session
   */
  session: oc
    .route({
      method: "GET",
      path: "/auth/session",
      summary: "Get current session",
      description: "Returns the current session if authenticated",
    })
    .output(
      z.object({
        session: sessionSchema.nullable(),
      })
    ),

  /**
   * Sign in with email and password
   */
  signIn: oc
    .route({
      method: "POST",
      path: "/auth/sign-in",
      summary: "Sign in",
      description: "Authenticate with email and password",
    })
    .input(loginCredentialsSchema)
    .output(authResponseSchema),

  /**
   * Sign up (register new user)
   */
  signUp: oc
    .route({
      method: "POST",
      path: "/auth/sign-up",
      summary: "Sign up",
      description: "Register a new user account",
    })
    .input(registerCredentialsSchema)
    .output(authResponseSchema),

  /**
   * Sign out
   */
  signOut: oc
    .route({
      method: "POST",
      path: "/auth/sign-out",
      summary: "Sign out",
      description: "End the current session",
    })
    .output(
      z.object({
        success: z.boolean(),
      })
    ),

  /**
   * Change password
   */
  changePassword: oc
    .route({
      method: "POST",
      path: "/auth/change-password",
      summary: "Change password",
      description: "Change the current user's password",
    })
    .input(changePasswordSchema)
    .output(
      z.object({
        success: z.boolean(),
      })
    ),

  /**
   * Request password reset
   */
  requestPasswordReset: oc
    .route({
      method: "POST",
      path: "/auth/forgot-password",
      summary: "Request password reset",
      description: "Send a password reset email",
    })
    .input(resetPasswordRequestSchema)
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    ),

  /**
   * Reset password with token
   */
  resetPassword: oc
    .route({
      method: "POST",
      path: "/auth/reset-password",
      summary: "Reset password",
      description: "Reset password using a reset token",
    })
    .input(resetPasswordSchema)
    .output(
      z.object({
        success: z.boolean(),
      })
    ),

  /**
   * Update user profile
   */
  updateProfile: oc
    .route({
      method: "PATCH",
      path: "/auth/profile",
      summary: "Update profile",
      description: "Update the current user's profile",
    })
    .input(updateProfileSchema)
    .output(
      z.object({
        user: userSchema,
      })
    ),

  /**
   * Verify email
   */
  verifyEmail: oc
    .route({
      method: "POST",
      path: "/auth/verify-email",
      summary: "Verify email",
      description: "Verify email with verification token",
    })
    .input(
      z.object({
        token: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    ),

  /**
   * Resend verification email
   */
  resendVerification: oc
    .route({
      method: "POST",
      path: "/auth/resend-verification",
      summary: "Resend verification",
      description: "Resend email verification link",
    })
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    ),

  /**
   * List active sessions
   */
  listSessions: oc
    .route({
      method: "GET",
      path: "/auth/sessions",
      summary: "List sessions",
      description: "List all active sessions for the current user",
    })
    .output(
      z.object({
        sessions: z.array(sessionSchema),
      })
    ),

  /**
   * Revoke a session
   */
  revokeSession: oc
    .route({
      method: "DELETE",
      path: "/auth/sessions/{sessionId}",
      summary: "Revoke session",
      description: "Revoke a specific session",
    })
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    ),

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: oc
    .route({
      method: "DELETE",
      path: "/auth/sessions",
      summary: "Revoke all sessions",
      description: "Revoke all sessions except the current one",
    })
    .output(
      z.object({
        success: z.boolean(),
        revokedCount: z.number(),
      })
    ),
});

export type AuthContract = typeof authContract;
`;
  }

  private getApiAuthIndex(): string {
    return `/**
 * API Auth Module
 *
 * ORPC + Better Auth integration for the API
 */
export * from "./context";
export * from "./middleware";
export * from "./procedures";
export * from "./permissions";
export * from "./types";
`;
  }

  private getAuthContext(): string {
    return `import type { Context } from "hono";
import { auth } from "@/auth";
import type { AuthContext, User, Session } from "./types";

/**
 * Create auth context from request
 *
 * This extracts the user and session from the request
 * using Better Auth's session handling.
 */
export async function createAuthContext(c: Context): Promise<AuthContext> {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isAuthenticated: !!session?.user,
    headers: c.req.raw.headers,
  };
}

/**
 * Create a context factory for ORPC
 */
export function createContextFactory() {
  return async (c: Context) => {
    return createAuthContext(c);
  };
}

/**
 * Get user from context (throws if not authenticated)
 */
export function requireUser(ctx: AuthContext): User {
  if (!ctx.user) {
    throw new Error("UNAUTHORIZED");
  }
  return ctx.user;
}

/**
 * Get session from context (throws if not authenticated)
 */
export function requireSession(ctx: AuthContext): Session {
  if (!ctx.session) {
    throw new Error("UNAUTHORIZED");
  }
  return ctx.session;
}

/**
 * Check if context is authenticated
 */
export function isAuthenticated(ctx: AuthContext): boolean {
  return !!ctx.user && !!ctx.session;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(ctx: AuthContext): boolean {
  if (!ctx.session) return true;
  return new Date(ctx.session.expiresAt) < new Date();
}
`;
  }

  private getAuthMiddleware(): string {
    return `import { os } from "@orpc/server";
import type { AuthContext, Role, Permission } from "./types";
import { requireUser } from "./context";

/**
 * Auth Middleware
 *
 * Middleware factories for protecting ORPC procedures
 */

/**
 * Create base ORPC instance with auth context
 */
export const orpcAuth = os.context<AuthContext>();

/**
 * Public procedure (no auth required)
 */
export const publicProcedure = orpcAuth;

/**
 * Protected procedure (requires authentication)
 */
export const protectedProcedure = orpcAuth.use(async ({ ctx, next }) => {
  const user = requireUser(ctx);
  
  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

/**
 * Verified procedure (requires email verification)
 */
export const verifiedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  
  return next({ ctx });
});

/**
 * Role-based procedure factory
 */
export function withRoles(...roles: Role[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    // Assuming user has roles property
    const userRoles = (ctx.user as any).roles ?? ["user"];
    const hasRole = roles.some((role) => userRoles.includes(role));
    
    if (!hasRole) {
      throw new Error("FORBIDDEN");
    }
    
    return next({ ctx });
  });
}

/**
 * Admin procedure
 */
export const adminProcedure = withRoles("admin");

/**
 * Moderator procedure
 */
export const moderatorProcedure = withRoles("admin", "moderator");

/**
 * Permission-based procedure factory
 */
export function withPermissions(...permissions: Permission[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    // Implement your permission checking logic
    const userPermissions = await getUserPermissions(ctx.user.id);
    const hasPermission = permissions.every((p) => userPermissions.includes(p));
    
    if (!hasPermission) {
      throw new Error("FORBIDDEN");
    }
    
    return next({ ctx });
  });
}

/**
 * Get user permissions (implement based on your permission system)
 */
async function getUserPermissions(userId: string): Promise<Permission[]> {
  // TODO: Implement your permission fetching logic
  // This could query a database, cache, or permission service
  return [];
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(options: {
  maxRequests: number;
  windowMs: number;
}) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return orpcAuth.use(async ({ ctx, next }) => {
    const key = ctx.user?.id ?? ctx.headers.get("x-forwarded-for") ?? "anonymous";
    const now = Date.now();
    
    const record = requests.get(key);
    
    if (!record || record.resetAt < now) {
      requests.set(key, { count: 1, resetAt: now + options.windowMs });
    } else if (record.count >= options.maxRequests) {
      throw new Error("RATE_LIMITED");
    } else {
      record.count++;
    }
    
    return next({ ctx });
  });
}

/**
 * Audit logging middleware
 */
export function withAuditLog(action: string) {
  return protectedProcedure.use(async ({ ctx, next, input }) => {
    const result = await next({ ctx });
    
    // Log the action (implement your logging)
    console.log({
      action,
      userId: ctx.user.id,
      input,
      timestamp: new Date().toISOString(),
    });
    
    return result;
  });
}
`;
  }

  private getProtectedProcedures(): string {
    return `import { os } from "@orpc/server";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  withRoles,
  withPermissions,
} from "./middleware";

/**
 * Protected Procedures
 *
 * Pre-configured procedure builders for common auth patterns
 */

/**
 * Procedure requiring ownership (user can only access their own resources)
 */
export function createOwnerProcedure<TResource extends { userId: string }>(
  getResource: (id: string) => Promise<TResource | null>
) {
  return protectedProcedure.use(async ({ ctx, input, next }) => {
    const resourceId = (input as any)?.id ?? (input as any)?.resourceId;
    
    if (!resourceId) {
      throw new Error("RESOURCE_ID_REQUIRED");
    }
    
    const resource = await getResource(resourceId);
    
    if (!resource) {
      throw new Error("NOT_FOUND");
    }
    
    if (resource.userId !== ctx.user.id) {
      throw new Error("FORBIDDEN");
    }
    
    return next({
      ctx: {
        ...ctx,
        resource,
      },
    });
  });
}

/**
 * Procedure with organization context
 */
export function createOrgProcedure<TOrg extends { id: string }>(
  getOrgMembership: (userId: string, orgId: string) => Promise<{ role: string } | null>
) {
  return protectedProcedure.use(async ({ ctx, input, next }) => {
    const orgId = (input as any)?.orgId ?? (input as any)?.organizationId;
    
    if (!orgId) {
      throw new Error("ORG_ID_REQUIRED");
    }
    
    const membership = await getOrgMembership(ctx.user.id, orgId);
    
    if (!membership) {
      throw new Error("NOT_ORG_MEMBER");
    }
    
    return next({
      ctx: {
        ...ctx,
        orgId,
        orgRole: membership.role,
      },
    });
  });
}

/**
 * Procedure with team context
 */
export function createTeamProcedure(
  getTeamMembership: (userId: string, teamId: string) => Promise<{ role: string } | null>
) {
  return protectedProcedure.use(async ({ ctx, input, next }) => {
    const teamId = (input as any)?.teamId;
    
    if (!teamId) {
      throw new Error("TEAM_ID_REQUIRED");
    }
    
    const membership = await getTeamMembership(ctx.user.id, teamId);
    
    if (!membership) {
      throw new Error("NOT_TEAM_MEMBER");
    }
    
    return next({
      ctx: {
        ...ctx,
        teamId,
        teamRole: membership.role,
      },
    });
  });
}

/**
 * Procedure that allows both owner and admin access
 */
export function createOwnerOrAdminProcedure<TResource extends { userId: string }>(
  getResource: (id: string) => Promise<TResource | null>,
  isAdmin: (userId: string) => Promise<boolean>
) {
  return protectedProcedure.use(async ({ ctx, input, next }) => {
    const resourceId = (input as any)?.id ?? (input as any)?.resourceId;
    
    if (!resourceId) {
      throw new Error("RESOURCE_ID_REQUIRED");
    }
    
    const resource = await getResource(resourceId);
    
    if (!resource) {
      throw new Error("NOT_FOUND");
    }
    
    const isOwner = resource.userId === ctx.user.id;
    const userIsAdmin = await isAdmin(ctx.user.id);
    
    if (!isOwner && !userIsAdmin) {
      throw new Error("FORBIDDEN");
    }
    
    return next({
      ctx: {
        ...ctx,
        resource,
        isOwner,
        isAdmin: userIsAdmin,
      },
    });
  });
}

/**
 * Export procedure types
 */
export type PublicProcedure = typeof publicProcedure;
export type ProtectedProcedure = typeof protectedProcedure;
export type AdminProcedure = typeof adminProcedure;
`;
  }

  private getPermissions(): string {
    return `/**
 * Permissions System
 *
 * Define and manage permissions for role-based access control
 */

/**
 * Permission definitions
 */
export const Permissions = {
  // User permissions
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  USER_DELETE: "user:delete",
  USER_ADMIN: "user:admin",

  // Content permissions
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",
  CONTENT_DELETE: "content:delete",
  CONTENT_PUBLISH: "content:publish",

  // Admin permissions
  ADMIN_ACCESS: "admin:access",
  ADMIN_USERS: "admin:users",
  ADMIN_SETTINGS: "admin:settings",
  ADMIN_BILLING: "admin:billing",

  // Team permissions
  TEAM_READ: "team:read",
  TEAM_WRITE: "team:write",
  TEAM_ADMIN: "team:admin",
  TEAM_INVITE: "team:invite",

  // API permissions
  API_READ: "api:read",
  API_WRITE: "api:write",
  API_ADMIN: "api:admin",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

/**
 * Role-based permission mapping
 */
export const RolePermissions: Record<string, Permission[]> = {
  guest: [
    Permissions.USER_READ,
    Permissions.CONTENT_READ,
  ],

  user: [
    Permissions.USER_READ,
    Permissions.USER_WRITE,
    Permissions.CONTENT_READ,
    Permissions.CONTENT_WRITE,
    Permissions.TEAM_READ,
  ],

  moderator: [
    Permissions.USER_READ,
    Permissions.USER_WRITE,
    Permissions.CONTENT_READ,
    Permissions.CONTENT_WRITE,
    Permissions.CONTENT_DELETE,
    Permissions.CONTENT_PUBLISH,
    Permissions.TEAM_READ,
    Permissions.TEAM_WRITE,
  ],

  admin: [
    // All permissions
    ...Object.values(Permissions),
  ],
};

/**
 * Check if a role has a permission
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return RolePermissions[role] ?? [];
}

/**
 * Get all permissions for multiple roles
 */
export function getPermissionsForRoles(roles: string[]): Permission[] {
  const allPermissions = new Set<Permission>();
  
  for (const role of roles) {
    const rolePerms = RolePermissions[role] ?? [];
    for (const perm of rolePerms) {
      allPermissions.add(perm);
    }
  }
  
  return Array.from(allPermissions);
}

/**
 * Permission check helper
 */
export function createPermissionChecker(userPermissions: Permission[]) {
  const permSet = new Set(userPermissions);
  
  return {
    has: (permission: Permission) => permSet.has(permission),
    hasAll: (permissions: Permission[]) => permissions.every((p) => permSet.has(p)),
    hasAny: (permissions: Permission[]) => permissions.some((p) => permSet.has(p)),
  };
}

/**
 * Permission guard type
 */
export type PermissionGuard = {
  require: Permission | Permission[];
  mode?: "all" | "any";
};

/**
 * Create permission requirement
 */
export function requirePermission(permission: Permission): PermissionGuard {
  return { require: permission, mode: "all" };
}

/**
 * Create multiple permission requirements (all required)
 */
export function requireAllPermissions(...permissions: Permission[]): PermissionGuard {
  return { require: permissions, mode: "all" };
}

/**
 * Create multiple permission requirements (any required)
 */
export function requireAnyPermission(...permissions: Permission[]): PermissionGuard {
  return { require: permissions, mode: "any" };
}
`;
  }

  private getApiAuthTypes(): string {
    return `/**
 * API Auth Types
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  headers: Headers;
}

export type Role = "user" | "admin" | "moderator" | "guest";

export type Permission = string;
`;
  }

  private getWebAuthIndex(): string {
    return `/**
 * Web Auth Module
 *
 * ORPC + Better Auth integration for the web client
 */
export * from "./use-auth-client";
export * from "./protected-query";
export * from "./auth-provider";
export * from "./types";
`;
  }

  private getUseAuthClient(): string {
    return `"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import type { User, Session, AuthState } from "./types";

/**
 * Auth Client Hook
 *
 * Provides auth state and methods using Better Auth client
 */
export function useAuthClient() {
  const queryClient = useQueryClient();

  // Session query
  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authClient.signIn.email(credentials);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const result = await authClient.signUp.email(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.clear();
    },
  });

  // Derived state
  const user = sessionQuery.data?.user ?? null;
  const session = sessionQuery.data?.session ?? null;
  const isAuthenticated = !!user;
  const isLoading = sessionQuery.isLoading;

  // Auth methods
  const signIn = useCallback(
    async (credentials: { email: string; password: string }) => {
      return signInMutation.mutateAsync(credentials);
    },
    [signInMutation]
  );

  const signUp = useCallback(
    async (data: { email: string; password: string; name: string }) => {
      return signUpMutation.mutateAsync(data);
    },
    [signUpMutation]
  );

  const signOut = useCallback(async () => {
    return signOutMutation.mutateAsync();
  }, [signOutMutation]);

  const refresh = useCallback(async () => {
    return sessionQuery.refetch();
  }, [sessionQuery]);

  // Computed auth state
  const authState: AuthState = useMemo(
    () => ({
      user,
      session,
      isAuthenticated,
      isLoading,
    }),
    [user, session, isAuthenticated, isLoading]
  );

  return {
    // State
    ...authState,

    // Query state
    error: sessionQuery.error,
    isRefetching: sessionQuery.isRefetching,

    // Mutations
    signIn,
    signUp,
    signOut,
    refresh,

    // Mutation states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
    signOutError: signOutMutation.error,
  };
}

/**
 * Hook for getting just the user
 */
export function useUser() {
  const { user, isLoading, isAuthenticated } = useAuthClient();
  return { user, isLoading, isAuthenticated };
}

/**
 * Hook for getting just the session
 */
export function useSession() {
  const { session, isLoading, isAuthenticated } = useAuthClient();
  return { session, isLoading, isAuthenticated };
}

/**
 * Hook that requires authentication (throws if not authenticated)
 */
export function useRequireAuth() {
  const auth = useAuthClient();

  if (!auth.isLoading && !auth.isAuthenticated) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    ...auth,
    user: auth.user!,
    session: auth.session!,
  };
}
`;
  }

  private getProtectedQuery(): string {
    return `"use client";

import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { useAuthClient } from "./use-auth-client";

/**
 * Protected Query
 *
 * Wrapper hooks that only execute when authenticated
 */

/**
 * Create a query that only runs when authenticated
 */
export function useProtectedQuery<TData, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, "enabled"> & {
    requireAuth?: boolean;
  }
) {
  const { isAuthenticated, isLoading: authLoading } = useAuthClient();
  const requireAuth = options.requireAuth ?? true;

  return useQuery<TData, TError>({
    ...options,
    enabled: requireAuth ? isAuthenticated && !authLoading : true,
  });
}

/**
 * Create a mutation that validates auth before executing
 */
export function useProtectedMutation<TData, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    requireAuth?: boolean;
  }
) {
  const { isAuthenticated } = useAuthClient();
  const requireAuth = options.requireAuth ?? true;

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    mutationFn: async (variables) => {
      if (requireAuth && !isAuthenticated) {
        throw new Error("UNAUTHORIZED");
      }
      return options.mutationFn!(variables);
    },
  });
}

/**
 * Query key factory with auth namespace
 */
export function createAuthQueryKey(key: string | readonly unknown[]) {
  const baseKey = typeof key === "string" ? [key] : [...key];
  return ["auth", ...baseKey] as const;
}

/**
 * Helper to create protected query options
 */
export function createProtectedQueryOptions<TData, TError = Error>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>
): UseQueryOptions<TData, TError> {
  return {
    queryKey,
    queryFn,
  };
}
`;
  }

  private getAuthProvider(): string {
    return `"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useAuthClient } from "./use-auth-client";
import type { User, Session, AuthState } from "./types";

/**
 * Auth Context
 */
interface AuthContextValue extends AuthState {
  signIn: (credentials: { email: string; password: string }) => Promise<unknown>;
  signUp: (data: { email: string; password: string; name: string }) => Promise<unknown>;
  signOut: () => Promise<void>;
  refresh: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
  onAuthStateChange?: (state: AuthState) => void;
}

/**
 * Auth Provider
 *
 * Provides auth context to the application
 */
export function AuthProvider({ children, onAuthStateChange }: AuthProviderProps) {
  const auth = useAuthClient();

  // Notify on auth state changes
  useEffect(() => {
    if (onAuthStateChange && !auth.isLoading) {
      onAuthStateChange({
        user: auth.user,
        session: auth.session,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
      });
    }
  }, [auth.user, auth.session, auth.isAuthenticated, auth.isLoading, onAuthStateChange]);

  const value: AuthContextValue = {
    user: auth.user,
    session: auth.session,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    refresh: auth.refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Use auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

/**
 * Auth guard component
 */
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, fallback, redirectTo }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    if (redirectTo && typeof window !== "undefined") {
      window.location.href = redirectTo;
      return null;
    }
    return fallback ?? null;
  }

  return <>{children}</>;
}

/**
 * Guest guard component (only shows content for unauthenticated users)
 */
interface GuestGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function GuestGuard({ children, redirectTo }: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    if (redirectTo && typeof window !== "undefined") {
      window.location.href = redirectTo;
      return null;
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Role guard component
 */
interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback ?? null;
  }

  // Check roles (assuming user has roles property)
  const userRoles = (user as any)?.roles ?? ["user"];
  const hasRole = roles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
`;
  }

  private getWebAuthTypes(): string {
    return `/**
 * Web Auth Types
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type Role = "user" | "admin" | "moderator" | "guest";
`;
  }
}
