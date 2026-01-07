/**
 * Test Controller - Auth & Authorization Patterns Demo
 * 
 * This controller demonstrates the RECOMMENDED patterns for authentication and authorization
 * using the AuthService as the SINGLE SOURCE OF TRUTH.
 * 
 * ## AuthService API:
 * 
 * ### NestJS Guards (`authService.guards.*`)
 * - `guards.admin.hasRole(['admin', 'superAdmin'])` - Check admin roles
 * - `guards.admin.hasPermission({ user: ['read'] })` - Check admin permissions
 * - `guards.admin.requireAdminRole()` - Require admin role
 * - `guards.org.isMemberOf(orgIdResolver)` - Check organization membership
 * - `guards.org.hasOrganizationRole(orgIdResolver, ['owner', 'admin'])` - Check org role
 * - `guards.org.isOrganizationOwner(orgIdResolver)` - Check organization ownership
 * - `guards.admin.composite([checks])` - Combine multiple checks
 * 
 * ### ORPC Middlewares (`authService.middleware.*`)
 * 
 * **Two usage patterns available on EVERY middleware:**
 * 
 * 1. **Static values** - Direct call with values:
 *    ```typescript
 *    .use(middleware.org.isMemberOf('org-123'))
 *    .use(middleware.admin.hasPermission({ user: ['list'] }))
 *    ```
 * 
 * 2. **Dynamic with `.forInput()`** (RECOMMENDED) - Uses ORPC's mapInput for auto-typed input:
 *    ```typescript
 *    .use(middleware.org.isMemberOf.forInput(), input => input.organizationId)
 *    .use(middleware.admin.hasPermission.forInput(), input => ({ [input.resource]: [input.action] }))
 *    ```
 *    The `.forInput()` method is available on ALL middlewares and returns a middleware
 *    that expects the first parameter's type as input via ORPC's mapInput callback.
 * 
 * **Available middlewares:**
 * - `middleware.admin.hasPermission(permissions)` / `.forInput()` → extracts permissions type
 * - `middleware.admin.hasRole(roles)` / `.forInput()` → extracts roles type
 * - `middleware.admin.requireAdminRole()` - Static only (no input needed)
 * - `middleware.admin.hasPermissionByRole(role, permissions)` / `.forInput()` → extracts role type
 * - `middleware.org.isMemberOf(organizationId)` / `.forInput()` → extracts organizationId type
 * - `middleware.org.hasOrganizationRole(organizationId, roles)` / `.forInput()` → extracts organizationId type
 * - `middleware.org.isOrganizationOwner(organizationId)` / `.forInput()` → extracts organizationId type
 * - `middleware.org.hasOrganizationPermission(permissions)` / `.forInput()` → extracts permissions type
 * 
 * ### Raw Checks (`authService.checks.*`)
 * - Used for advanced composition with `guards.admin.composite()` or `middleware.admin.composite()`
 * 
 * ## Usage Patterns:
 * 
 * ### Pattern 1: Static values (simple cases)
 * ```typescript
 * .use(middleware.admin.hasPermission({ user: ['list'] }))
 * ```
 * 
 * ### Pattern 2: Dynamic with .forInput() + mapInput (RECOMMENDED)
 * ```typescript
 * .use(
 *   middleware.org.isMemberOf.forInput(),  // Middleware expects string input
 *   input => input.organizationId          // ORPC auto-types input from schema
 * )
 * ```
 * 
 * ### Pattern 3: Generic resolver (for multi-param methods)
 * ```typescript
 * .use(middleware.org.hasOrganizationRole<Input>(
 *   ctx => ctx.input.organizationId,
 *   ['owner', 'admin']  // Static second param
 * ))
 * ```
 */

import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { oc } from "@orpc/contract";
import { implement, Implement } from "@orpc/nest";
import * as z from "zod/v4";

// Auth Service (single source of truth)
import { AuthService } from "@/core/modules/auth/services/auth.service";

// NestJS Guards
import { AuthGuard } from "@/core/modules/auth/guards/auth.guard";

// NestJS Decorators
import {
    AllowAnonymous,
    OptionalAuth,
    Session,
    AuthenticatedUser,
} from "@/core/modules/auth/decorators/decorators";

// ORPC Middlewares
import { requireAuth, publicAccess } from "@/core/modules/auth/orpc/middlewares";
import { assertAuthenticated } from "@/core/modules/auth/orpc/types";

// Types
import type { RoleName } from "@repo/auth/permissions";
import type { UserSession } from "@/core/modules/auth/utils/auth-utils";

// =============================================================================
// ORPC CONTRACTS
// =============================================================================

const testContracts = oc.prefix("/test/orpc").router({
    // =========================================================================
    // Public Access
    // =========================================================================
    
    /** Public endpoint - no auth required */
    publicEndpoint: oc.route({
        method: "GET",
        path: "/public",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            authenticated: z.boolean(),
        })
    ),
    
    // =========================================================================
    // Basic Authentication
    // =========================================================================
    
    /** Requires authentication - any logged-in user */
    authenticatedEndpoint: oc.route({
        method: "GET",
        path: "/authenticated",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            userId: z.string(),
            userEmail: z.string().optional(),
        })
    ),
    
    /** Optional auth - works with or without authentication */
    optionalAuthEndpoint: oc.route({
        method: "GET",
        path: "/optional-auth",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            isAuthenticated: z.boolean(),
            userId: z.string().nullable(),
        })
    ),
    
    // =========================================================================
    // Admin Role-Based Access Control
    // =========================================================================
    
    /** Requires ANY of specified admin roles */
    adminRoleEndpoint: oc.route({
        method: "GET",
        path: "/admin/role",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            userRole: z.string(),
        })
    ),
    
    /** Requires specific admin permission */
    adminPermissionEndpoint: oc.route({
        method: "GET",
        path: "/admin/permission",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            userId: z.string(),
            userRole: z.string(),
        })
    ),
    
    /** Dynamic admin permission from input */
    adminDynamicPermissionEndpoint: oc.route({
        method: "POST",
        path: "/admin/dynamic-permission",
    }).input(z.object({
        resource: z.enum(["user", "organization", "invitation", "session", "member"]),
        action: z.enum(["create", "read", "update", "delete"]),
    })).output(
        z.object({
            message: z.string(),
            resource: z.string(),
            action: z.string(),
            userId: z.string(),
        })
    ),
    
    // =========================================================================
    // Organization Access Control
    // =========================================================================
    
    /** Requires organization membership (static org ID) */
    orgMembershipStaticEndpoint: oc.route({
        method: "GET",
        path: "/org/membership/static",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            userId: z.string(),
        })
    ),
    
    /** Requires organization membership (dynamic org ID from input) */
    orgMembershipDynamicEndpoint: oc.route({
        method: "GET",
        path: "/org/{organizationId}/membership",
    }).input(z.object({
        organizationId: z.string(),
    })).output(
        z.object({
            message: z.string(),
            organizationId: z.string(),
            userId: z.string(),
        })
    ),
    
    /** Requires specific organization role */
    orgRoleEndpoint: oc.route({
        method: "GET",
        path: "/org/{organizationId}/role",
    }).input(z.object({
        organizationId: z.string(),
    })).output(
        z.object({
            message: z.string(),
            organizationId: z.string(),
            userId: z.string(),
        })
    ),
    
    /** Requires organization ownership */
    orgOwnerEndpoint: oc.route({
        method: "GET",
        path: "/org/{organizationId}/owner",
    }).input(z.object({
        organizationId: z.string(),
    })).output(
        z.object({
            message: z.string(),
            organizationId: z.string(),
            userId: z.string(),
        })
    ),
    
    /** Requires organization permission */
    orgPermissionEndpoint: oc.route({
        method: "GET",
        path: "/org/permission",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            userId: z.string(),
        })
    ),
    
    // =========================================================================
    // Composite Patterns
    // =========================================================================
    
    /** Combined: Admin role + permission (using composite) */
    compositeAdminEndpoint: oc.route({
        method: "GET",
        path: "/composite/admin",
    }).input(z.object({})).output(
        z.object({
            message: z.string(),
            userId: z.string(),
            userRole: z.string(),
        })
    ),
    
    // =========================================================================
    // Type-Safe Context Examples
    // =========================================================================
    
    /** Demonstrates type-safe context access from previous middlewares */
    contextAccessEndpoint: oc.route({
        method: "GET",
        path: "/context-access/{organizationId}",
    }).input(z.object({
        organizationId: z.string(),
    })).output(
        z.object({
            message: z.string(),
            organizationId: z.string(),
            userId: z.string(),
            userRole: z.string(),
        })
    ),
});

// =============================================================================
// CONTROLLER
// =============================================================================

@ApiTags("Test - Auth Patterns")
@Controller()
export class TestController {
    constructor(private readonly authService: AuthService) {}

    // =========================================================================
    // NESTJS GUARD-BASED PATTERNS
    // =========================================================================
    
    // -------------------------------------------------------------------------
    // Public Access
    // -------------------------------------------------------------------------
    
    @Get("test/public")
    @AllowAnonymous()
    @ApiOperation({ summary: "Public endpoint (no auth)" })
    @ApiResponse({ status: 200, description: "Public data accessible to everyone" })
    publicNestJS() {
        return {
            message: "Public endpoint - no authentication required",
            approach: "NestJS @AllowAnonymous() decorator",
        };
    }
    
    // -------------------------------------------------------------------------
    // Basic Authentication
    // -------------------------------------------------------------------------
    
    @Get("test/authenticated")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Requires authentication" })
    @ApiResponse({ status: 200, description: "Authenticated user data" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    authenticatedNestJS(@Session() session: UserSession) {
        return {
            message: "Authenticated endpoint - requires valid session",
            approach: "NestJS @UseGuards(AuthGuard)",
            userId: session.user.id,
            userEmail: session.user.email,
        };
    }
    
    @Get("test/optional-auth")
    @UseGuards(AuthGuard)
    @OptionalAuth()
    @ApiOperation({ summary: "Optional authentication" })
    @ApiResponse({ status: 200, description: "Works with or without auth" })
    optionalAuthNestJS(@Session() session: UserSession | null) {
        return {
            message: "Optional auth endpoint - session may be null",
            approach: "NestJS @UseGuards(AuthGuard) + @OptionalAuth()",
            isAuthenticated: session !== null,
            userId: session?.user.id ?? null,
        };
    }
    
    // -------------------------------------------------------------------------
    // Admin Role-Based Access Control (using AuthService guards)
    // 
    // NOTE: For NestJS guards from AuthService, you need to instantiate them
    // in a module provider or use them dynamically. See ORPC patterns below
    // for the cleanest dynamic usage with AuthService.
    // -------------------------------------------------------------------------
    
    @Get("test/admin/role")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Requires admin role via AuthService" })
    @ApiResponse({ status: 200, description: "User has admin role" })
    @ApiResponse({ status: 403, description: "Forbidden - missing role" })
    adminRoleNestJS(@Session() session: UserSession) {
        // NOTE: In a real implementation, you'd use:
        // @UseGuards(AuthGuard, this.authService.guards.admin.hasRole(['admin', 'superAdmin']))
        // But decorators need class-level guard references.
        // See ORPC patterns below for dynamic usage.
        return {
            message: "Admin role access (see ORPC patterns for AuthService usage)",
            approach: "authService.guards.admin.hasRole(['admin', 'superAdmin'])",
            userRole: session.user.role,
        };
    }
    
    @Get("test/admin/permission")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Requires admin permission via AuthService" })
    @ApiResponse({ status: 200, description: "User has required permission" })
    @ApiResponse({ status: 403, description: "Forbidden - missing permission" })
    adminPermissionNestJS(@Session() session: UserSession) {
        return {
            message: "Admin permission access (see ORPC patterns for AuthService usage)",
            approach: "authService.guards.admin.hasPermission({ user: ['read'] })",
            userId: session.user.id,
            userRole: session.user.role ?? "unknown",
        };
    }
    
    // -------------------------------------------------------------------------
    // Organization Access Control (using AuthService guards)
    // -------------------------------------------------------------------------
    
    @Get("test/org/:organizationId")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: "organizationId", description: "Organization ID to check access for" })
    @ApiOperation({ summary: "Requires Organization membership via AuthService" })
    @ApiResponse({ status: 200, description: "Organization access granted" })
    @ApiResponse({ status: 403, description: "Forbidden - no organization access" })
    organizationAccessNestJS(
        @Session() session: UserSession,
        @Param("organizationId") organizationId: string
    ) {
        // NOTE: For dynamic guards with route params:
        // authService.guards.org.isMemberOf(ctx => ctx.params?.organizationId ?? '')
        return {
            message: "Organization access (see ORPC patterns for AuthService usage)",
            approach: "authService.guards.org.isMemberOf(ctx => ctx.params?.organizationId)",
            userId: session.user.id,
            organizationId,
        };
    }
    
    @Get("test/org/:organizationId/owner")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiParam({ name: "organizationId", description: "Organization ID" })
    @ApiOperation({ summary: "Requires Organization ownership via AuthService" })
    @ApiResponse({ status: 200, description: "Organization owner access granted" })
    @ApiResponse({ status: 403, description: "Forbidden - not organization owner" })
    organizationOwnerNestJS(
        @Session() session: UserSession,
        @Param("organizationId") organizationId: string
    ) {
        return {
            message: "Organization owner access (see ORPC patterns for AuthService usage)",
            approach: "authService.guards.org.isOrganizationOwner(ctx => ctx.params?.organizationId)",
            userId: session.user.id,
            organizationId,
        };
    }
    
    // -------------------------------------------------------------------------
    // Combined Patterns (using AuthService composite guards)
    // -------------------------------------------------------------------------
    
    @Get("test/composite/admin")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Composite guard - multiple checks combined" })
    @ApiResponse({ status: 200, description: "All checks passed" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    compositeAdminNestJS(
        @Session() session: UserSession,
        @AuthenticatedUser() user: { id: string; role: string; roles: RoleName[] }
    ) {
        // For composite guards:
        // const checks = [
        //   authService.checks.admin.requireSession(),
        //   authService.checks.admin.hasRole(['admin']),
        //   authService.checks.admin.hasPermission({ user: ['read'] }),
        // ];
        // const CompositeGuard = authService.guards.admin.composite(checks);
        return {
            message: "Composite admin access (see ORPC patterns for AuthService usage)",
            approach: "authService.guards.admin.composite([checks])",
            userId: user.id,
            userRole: user.role,
            allRoles: user.roles,
        };
    }
    
    // =========================================================================
    // ORPC MIDDLEWARE-BASED PATTERNS (using AuthService.middleware)
    // =========================================================================
    
    // -------------------------------------------------------------------------
    // Public Access
    // -------------------------------------------------------------------------
    
    @Implement(testContracts.publicEndpoint)
    publicOrpc() {
        return implement(testContracts.publicEndpoint)
            .use(publicAccess())
            .handler(({ context }) => {
                return {
                    message: "Public ORPC endpoint - no authentication required",
                    authenticated: context.auth.isLoggedIn,
                };
            });
    }
    
    // -------------------------------------------------------------------------
    // Basic Authentication
    // -------------------------------------------------------------------------
    
    @Implement(testContracts.authenticatedEndpoint)
    authenticatedOrpc() {
        return implement(testContracts.authenticatedEndpoint)
            .use(requireAuth())
            .handler(({ context }) => {
                const { auth } = context;
                return {
                    message: "Authenticated ORPC endpoint - requires valid session",
                    userId: auth.user.id,
                    userEmail: auth.user.email,
                };
            });
    }
    
    @Implement(testContracts.optionalAuthEndpoint)
    optionalAuthOrpc() {
        return implement(testContracts.optionalAuthEndpoint)
            .use(publicAccess())
            .handler(({ context }) => {
                return {
                    message: "Optional auth ORPC endpoint - session may be null",
                    isAuthenticated: context.auth.isLoggedIn,
                    userId: context.auth.user?.id ?? null,
                };
            });
    }
    
    // -------------------------------------------------------------------------
    // Admin Role-Based Access Control (using AuthService.middleware)
    // -------------------------------------------------------------------------
    
    @Implement(testContracts.adminRoleEndpoint)
    adminRoleOrpc() {
        return implement(testContracts.adminRoleEndpoint)
            .use(requireAuth())
            // Static role check - no generic needed
            .use(this.authService.middleware.admin.hasRole(['admin', 'superAdmin']))
            .handler(({ context }) => {
                const auth = assertAuthenticated(context.auth);
                
                return {
                    message: "Admin role access granted via authService.middleware.admin.hasRole()",
                    userRole: auth.user.role ?? "unknown",
                };
            });
    }
    
    @Implement(testContracts.adminPermissionEndpoint)
    adminPermissionOrpc() {
        return implement(testContracts.adminPermissionEndpoint)
            .use(requireAuth())
            // Static permission check - accepts relaxed PermissionObject type
            .use(this.authService.middleware.admin.hasPermission({ user: ['list'] }))
            .handler(({ context }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Admin permission access granted via authService.middleware.admin.hasPermission()",
                    userId: auth.user.id,
                    userRole: auth.user.role ?? "unknown",
                };
            });
    }
    
    @Implement(testContracts.adminDynamicPermissionEndpoint)
    adminDynamicPermissionOrpc() {
        return implement(testContracts.adminDynamicPermissionEndpoint)
            .use(requireAuth())
            // Dynamic permission from input - uses .forInput() + mapInput for auto-typed input
            .use(
                this.authService.middleware.admin.hasPermission.forInput(),
                input => ({ [input.resource]: [input.action] })
            )
            .handler(({ context, input }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Dynamic admin permission granted via authService.middleware.admin.hasPermission(resolver)",
                    resource: input.resource,
                    action: input.action,
                    userId: auth.user.id,
                };
            });
    }
    
    // -------------------------------------------------------------------------
    // Organization Access Control (using AuthService.middleware)
    // -------------------------------------------------------------------------
    
    @Implement(testContracts.orgMembershipStaticEndpoint)
    orgMembershipStaticOrpc() {
        return implement(testContracts.orgMembershipStaticEndpoint)
            .use(requireAuth())
            // Static org ID - no generic needed
            .use(this.authService.middleware.org.isMemberOf('org_static_123'))
            .handler(({ context }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Organization membership granted via authService.middleware.org.isMemberOf('static')",
                    userId: auth.user.id,
                };
            });
    }
    
    @Implement(testContracts.orgMembershipDynamicEndpoint)
    orgMembershipDynamicOrpc() {
        return implement(testContracts.orgMembershipDynamicEndpoint)
            .use(requireAuth())
            // Dynamic org ID from input - uses .forInput() + mapInput for auto-typed input
            .use(
                this.authService.middleware.org.isMemberOf.forInput(),
                input => input.organizationId
            )
            .handler(({ context, input }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Organization membership granted via authService.middleware.org.isMemberOf(input => input.organizationId)",
                    organizationId: input.organizationId,
                    userId: auth.user.id,
                };
            });
    }
    
    @Implement(testContracts.orgRoleEndpoint)
    orgRoleOrpc() {
        // Input type for type-safe resolver
        interface Input { organizationId: string }
        
        return implement(testContracts.orgRoleEndpoint)
            .use(requireAuth())
            // Dynamic org ID with static roles - multi-param method uses generic resolver
            .use(this.authService.middleware.org.hasOrganizationRole<Input>(
                ctx => ctx.input.organizationId,
                ['owner', 'admin', 'member'] as const  // Static roles
            ))
            .handler(({ context, input }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Organization role access granted via authService.middleware.org.hasOrganizationRole()",
                    organizationId: input.organizationId,
                    userId: auth.user.id,
                };
            });
    }
    
    @Implement(testContracts.orgOwnerEndpoint)
    orgOwnerOrpc() {
        return implement(testContracts.orgOwnerEndpoint)
            .use(requireAuth())
            // Dynamic org ID - uses .forInput() + mapInput for auto-typed input
            .use(
                this.authService.middleware.org.isOrganizationOwner.forInput(),
                input => input.organizationId
            )
            .handler(({ context, input }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Organization owner access granted via authService.middleware.org.isOrganizationOwner.forInput()",
                    organizationId: input.organizationId,
                    userId: auth.user.id,
                };
            });
    }
    
    @Implement(testContracts.orgPermissionEndpoint)
    orgPermissionOrpc() {
        return implement(testContracts.orgPermissionEndpoint)
            .use(requireAuth())
            // Static organization permission check - accepts relaxed PermissionObject type
            .use(this.authService.middleware.org.hasOrganizationPermission({ orgMember: ['list'] }))
            .handler(({ context }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Organization permission granted via authService.middleware.org.hasOrganizationPermission()",
                    userId: auth.user.id,
                };
            });
    }
    
    // -------------------------------------------------------------------------
    // Composite Patterns (using AuthService.middleware.composite)
    // -------------------------------------------------------------------------
    
    @Implement(testContracts.compositeAdminEndpoint)
    compositeAdminOrpc() {
        // Get raw checks from authService.checks
        const checks = [
            this.authService.checks.admin.requireSession(),
            this.authService.checks.admin.hasRole(['admin', 'superAdmin'] as const),
            this.authService.checks.admin.hasPermission({ user: ['list'] }),
        ];
        
        return implement(testContracts.compositeAdminEndpoint)
            .use(requireAuth())
            // Composite middleware from multiple checks
            .use(this.authService.middleware.admin.composite(checks))
            .handler(({ context }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Composite admin access granted via authService.middleware.admin.composite()",
                    userId: auth.user.id,
                    userRole: auth.user.role ?? "unknown",
                };
            });
    }
    
    // -------------------------------------------------------------------------
    // Type-Safe Context Examples (using TContext generic)
    // -------------------------------------------------------------------------
    
    @Implement(testContracts.contextAccessEndpoint)
    contextAccessOrpc() {
        // Input type for type-safe resolver
        interface Input { organizationId: string }
        
        return implement(testContracts.contextAccessEndpoint)
            .use(requireAuth())
            // Use TInput for type-safe input access
            .use(this.authService.middleware.org.isMemberOf<Input>(
                // Type-safe access to input with context.auth 
                // properly typed
                ctx => {
                    // ctx.input.organizationId - from TInput
                    // ctx.context.auth.user.id - properly typed from ORPCContextWithAuthOnly<true>
                    console.log('User ID from context:', ctx.context.auth.user.id);
                    return ctx.input.organizationId;
                }
            ))
            .handler(({ context, input }) => {
                const auth = assertAuthenticated(context.auth);
                return {
                    message: "Type-safe context access demonstrated via <TInput, TContext> generics",
                    organizationId: input.organizationId,
                    userId: auth.user.id,
                    userRole: auth.user.role ?? "unknown",
                };
            });
    }
}
