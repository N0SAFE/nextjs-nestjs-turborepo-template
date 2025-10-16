📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Better Auth Integration Pattern

# Better Auth Integration Pattern

> **Type**: Core Concept - Authentication  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

**⚠️ ALL auth-related operations MUST use AuthService.api**

This project uses Better Auth with extensive plugin support. **NEVER** perform direct database operations for auth-related entities.

## Auth-Related Entities

These entities MUST use `AuthService.api`:

- **Users**: User creation, authentication, password management
- **Organizations**: Organization creation, membership management
- **Roles**: Role assignment, permission management
- **API Keys**: API key generation and validation
- **Sessions**: Session creation, validation, termination
- **Invitations**: Organization invitations
- **Teams**: Team creation, membership (when organization teams enabled)

## ✅ CORRECT: Using AuthService.api

```typescript
import { AuthService } from '@/core/modules/auth/services/auth.service';

@Injectable()
export class SetupService {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async createInitialUser(data: { email: string; password: string; name: string }) {
    // ✅ Use authService.api for user creation
    const userResult = await this.authService.api.createUser({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        data: {
          role: 'superAdmin',
          emailVerified: true,
        },
      },
    });

    return userResult.user;
  }

  async createOrganization(data: { name: string; userId: string }) {
    // ✅ Use authService.api for organization creation
    const orgResult = await this.authService.api.createOrganization({
      body: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        userId: data.userId,
      },
    });

    return orgResult.organization;
  }

  async addMemberToOrganization(data: { organizationId: string; userId: string; role: string }) {
    // ✅ Use authService.api for adding members
    const memberResult = await this.authService.api.addMember({
      body: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
      },
    });

    return memberResult.member;
  }
}
```

## ❌ WRONG: Direct Database Operations

```typescript
// ❌ NEVER do this for auth entities
await this.database.db.insert(user).values({ ... });
await this.database.db.insert(organization).values({ ... });
await this.database.db.insert(member).values({ ... });
await this.database.db.insert(apiKey).values({ ... });
```

## Available AuthService.api Methods

Common methods available through `authService.api`:

- `createUser()` - Create new user with password
- `updateUser()` - Update user information
- `deleteUser()` - Delete user account
- `createOrganization()` - Create organization
- `updateOrganization()` - Update organization
- `deleteOrganization()` - Delete organization
- `addMember()` - Add member to organization
- `removeMember()` - Remove member from organization
- `updateMemberRole()` - Update member role
- `createApiKey()` - Generate API key
- `revokeApiKey()` - Revoke API key
- `signIn()` - Authenticate user
- `signOut()` - End session
- `getSession()` - Validate and retrieve session

**Note**: Better Auth's plugin system extends these methods. Check `apps/api/src/config/auth/auth.ts` for available plugins.

## When to Use Direct Database Access

Direct database operations are ONLY allowed for:

- **Non-auth domain entities**: Projects, deployments, environments, services, logs
- **Queries that join auth + domain data**: Use repositories to join `user`/`organization` with domain tables
- **Read-only auth queries**: Fetching user/org data for display purposes

### ✅ Valid Auth Data Query

```typescript
// ✅ CORRECT - Reading auth data for domain logic
async findProjectsByUser(userId: string) {
  return this.database.db
    .select({
      project: projects,
      owner: user, // Join with user table for display
    })
    .from(projects)
    .leftJoin(user, eq(projects.userId, user.id))
    .where(eq(projects.userId, userId));
}
```

## Enforcement

This pattern is **MANDATORY** for all auth-related operations. Direct database access for auth entities will break plugin functionality and violate security constraints.

## Related Core Concepts

- [Repository Ownership Rule](./03-REPOSITORY-OWNERSHIP-RULE.md)
- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md)
