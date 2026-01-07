# Better Auth Permission API Reference

This document provides a comprehensive guide to the Better Auth permission checking APIs for both the **Admin Plugin** and **Organization Plugin**. This is the foundation for our permission wrapper system.

## Table of Contents

1. [Overview](#overview)
2. [Access Control Setup](#access-control-setup)
3. [Admin Plugin Permission API](#admin-plugin-permission-api)
4. [Organization Plugin Permission API](#organization-plugin-permission-api)
5. [Key Differences](#key-differences)
6. [Our Wrapper Implementation](#our-wrapper-implementation)

---

## Overview

Better Auth provides two main plugins for permission management:

| Plugin | Purpose | Scope |
|--------|---------|-------|
| **Admin Plugin** | Global user role management | Application-wide permissions |
| **Organization Plugin** | Multi-tenant organization management | Organization-scoped permissions |

Both plugins share a similar permission-checking API but operate in different contexts.

---

## Access Control Setup

### Creating an Access Controller

Both plugins use the same `createAccessControl` function to define permissions:

```typescript
import { createAccessControl } from "better-auth/plugins/access";

// Define your permission statements
const statement = {
    project: ["create", "share", "update", "delete"],
    user: ["create", "read", "update", "delete", "ban"],
    session: ["revoke", "list"]
} as const;  // ⚠️ IMPORTANT: Use `as const` for TypeScript inference

const ac = createAccessControl(statement);
```

### Defining Roles

```typescript
// Create roles using the access controller
export const user = ac.newRole({
    project: ["create", "read"]
});

export const admin = ac.newRole({
    project: ["create", "read", "update", "delete"],
    user: ["read", "update", "ban"]
});

export const superadmin = ac.newRole({
    project: ["create", "read", "update", "delete"],
    user: ["create", "read", "update", "delete", "ban"],
    session: ["revoke", "list"]
});
```

### Extending Default Permissions

```typescript
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
    ...defaultStatements,  // Include default admin statements
    project: ["create", "share", "update", "delete"]
} as const;

const ac = createAccessControl(statement);

// Extend existing role with custom permissions
const admin = ac.newRole({
    project: ["create", "update"],
    ...adminAc.statements  // Include default admin permissions
});
```

---

## Admin Plugin Permission API

### Plugin Setup

```typescript
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { ac, admin, user } from "@/auth/permissions";

export const auth = betterAuth({
    plugins: [
        adminPlugin({
            ac,                    // Access controller
            roles: {               // Role definitions
                admin,
                user,
            },
            defaultRole: "user",   // Default role for new users
            adminRoles: ["admin", "superadmin"]  // Roles considered "admin"
        })
    ]
});
```

### Permission Checking Methods

#### 1. `hasPermission` (Client-Side - Async)

Checks if the **current logged-in user** has specific permissions. Makes a server request.

```typescript
// Client-side usage
const canCreateProject = await authClient.admin.hasPermission({
    permissions: {
        project: ["create"],
    },
});

// Check multiple permissions
const canManageUsers = await authClient.admin.hasPermission({
    permissions: {
        user: ["create", "delete"],
        session: ["revoke"]
    },
});
```

#### 2. `checkRolePermission` (Client-Side - Sync)

Checks if a **specific role** has permissions. Runs synchronously without server contact.

```typescript
// Synchronous - no await needed
const adminCanDeleteUser = authClient.admin.checkRolePermission({
    permissions: {
        user: ["delete"],
    },
    role: "admin",
});

// Check multiple permissions for a role
const roleCanManage = authClient.admin.checkRolePermission({
    permissions: {
        user: ["delete"],
        session: ["revoke"]
    },
    role: "admin",
});
```

**⚠️ Note:** `checkRolePermission` does NOT check dynamic roles - use `hasPermission` for dynamic role checks.

#### 3. `userHasPermission` (Server-Side)

Server-side API to check permissions for any user or role.

```typescript
import { auth } from "@/auth";

// Check by user ID
await auth.api.userHasPermission({
    body: {
        userId: 'user-id-here',
        permissions: {
            project: ["create"],
        },
    },
});

// Check by role directly
await auth.api.userHasPermission({
    body: {
        role: "admin",
        permissions: {
            project: ["create"],
            user: ["delete"]
        },
    },
});
```

#### 4. REST API Endpoint

```http
POST /admin/has-permission
Content-Type: application/json

{
    "userId": "user-id",        // Optional - check by user
    "role": "admin",            // Optional - check by role
    "permissions": {            // Required
        "project": ["create"],
        "user": ["delete"]
    }
}

Response: true | false
```

---

## Organization Plugin Permission API

### Plugin Setup

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { ac, owner, admin, member } from "@/auth/permissions";

export const auth = betterAuth({
    plugins: [
        organization({
            ac,
            roles: {
                owner,
                admin,
                member,
            },
            // Optional: Enable dynamic role creation
            dynamicAccessControl: {
                enabled: true,
            },
        }),
    ],
});
```

### Default Organization Roles

| Role | organization | member | invitation |
|------|:------------:|:------:|:----------:|
| **Owner** | update, delete | create, update, delete | create, cancel |
| **Admin** | update | create, update, delete | create, cancel |
| **Member** | - | - | - |

### Permission Checking Methods

#### 1. `hasPermission` (Client-Side - Async)

Checks permissions for the current user **within their active organization**.

```typescript
// Client-side usage
const canCreateProject = await authClient.organization.hasPermission({
    permissions: {
        project: ["create"],
    },
});

// Check multiple permissions
const canManageOrg = await authClient.organization.hasPermission({
    permissions: {
        organization: ["update", "delete"],
        member: ["create", "delete"],
    },
});
```

#### 2. `checkRolePermission` (Client-Side - Sync)

Synchronous role permission check (no dynamic roles).

```typescript
const adminCanDelete = authClient.organization.checkRolePermission({
    permissions: {
        organization: ["delete"],
    },
    role: "admin",
});

// Multiple resources
const canManage = authClient.organization.checkRolePermission({
    permissions: {
        organization: ["delete"],
        member: ["delete"],
    },
    role: "owner",
});
```

#### 3. `hasPermission` (Server-Side API)

Server-side permission check within organization context.

```typescript
import { auth } from "@/auth";
import { headers } from "next/headers";

await auth.api.hasPermission({
    headers: await headers(),  // ⚠️ Requires headers for session context
    body: {
        permissions: {
            project: ["create"],
        },
    },
});
```

---

## Key Differences

| Feature | Admin Plugin | Organization Plugin |
|---------|-------------|---------------------|
| **Scope** | Application-wide | Organization-scoped |
| **Context** | User role in app | User role in organization |
| **Server API** | `auth.api.userHasPermission()` | `auth.api.hasPermission()` |
| **Can check any user** | ✅ Yes (by userId) | ❌ No (current user only) |
| **Dynamic roles** | Via database | Via `dynamicAccessControl` |
| **Default roles** | `user`, `admin` | `owner`, `admin`, `member` |
| **Headers required** | No (for userHasPermission) | Yes (for hasPermission) |

---

## Our Wrapper Implementation

Our permission plugin wrapper maps these Better Auth APIs to provide a unified interface.

### AdminPermissionsPlugin Methods

| Our Method | Better Auth API | Description |
|-----------|-----------------|-------------|
| `checkPermission(permissions)` | `auth.api.userHasPermission({ userId, permissions })` | Check current user's permissions |
| `checkRolePermission(role, permissions)` | `auth.api.userHasPermission({ role, permissions })` | Check if a role has permissions (static) |

### OrganizationsPermissionsPlugin Methods

| Our Method | Better Auth API | Description |
|-----------|-----------------|-------------|
| `checkPermission(permissions)` | `auth.api.hasPermission({ headers, body })` | Check permissions in active org |

### Usage Examples

```typescript
// Direct permission checking
const hasPermission = await adminPlugin.checkPermission({ user: ['create', 'delete'] });
const roleHasPermission = await adminPlugin.checkRolePermission('admin', { user: ['delete'] });
const orgHasPermission = await orgPlugin.checkPermission({ project: ['create'] });

// For NestJS decorators and ORPC middlewares, use the plugin-factory utilities:
// See: apps/api/src/core/modules/auth/plugin-utils/plugin-factory.ts
```

---

## References

- [Better Auth Admin Plugin Docs](https://better-auth.com/docs/plugins/admin)
- [Better Auth Organization Plugin Docs](https://better-auth.com/docs/plugins/organization)
- [Better Auth Access Control](https://better-auth.com/docs/plugins/access)
