# Better Auth Plugin Utilities - Examples

This directory contains practical examples demonstrating how to use the context-aware Better Auth plugin utilities in your ORPC handlers.

## Overview

The plugin utilities eliminate the need to manually pass headers to Better Auth plugin methods by automatically injecting them from the ORPC context. This results in:

- **60% less code** compared to manual header passing
- **Type-safe APIs** with full TypeScript support
- **Cleaner, more readable** handler implementations
- **Consistent patterns** across all plugin operations

## Examples

### Admin Operations (`admin-operations.example.ts`)

Demonstrates admin plugin utilities for platform-level user management:

1. **createUserHandler** - Create new users with role assignment
2. **banUserHandler** - Ban users with optional reason
3. **listUsersHandler** - List all users with pagination
4. **updateUserRoleHandler** - Update user roles
5. **deleteUserHandler** - Delete users with safety checks

**Key Features:**
- `auth.admin.hasAccess()` - Check if user is an admin
- `auth.admin.createUser()` - Create users with auto-injected headers
- `auth.admin.banUser()` - Ban/unban users
- `auth.admin.listUsers()` - Paginated user listing
- `auth.admin.setRole()` - Role management
- `auth.admin.deleteUser()` - User deletion

### Organization Operations (`organization-operations.example.ts`)

Demonstrates organization plugin utilities for multi-tenant organization management:

1. **createOrganizationHandler** - Create new organizations
2. **addMemberHandler** - Add members to organizations
3. **listMembersHandler** - List organization members
4. **updateMemberRoleHandler** - Update member roles within organizations
5. **removeMemberHandler** - Remove members from organizations
6. **getOrganizationHandler** - Fetch organization details
7. **listUserOrganizationsHandler** - List user's organizations
8. **inviteMemberHandler** - Send organization invitations

**Key Features:**
- `auth.org.hasAccess()` - Check if user can access an organization
- `auth.org.createOrganization()` - Create organizations with auto-injected headers
- `auth.org.addMember()` - Add members with role assignment
- `auth.org.updateMemberRole()` - Update member roles
- `auth.org.listMembers()` - List all members
- `auth.org.inviteMember()` - Send invitations

## Usage Pattern

All examples follow this consistent pattern:

```typescript
export const handler = async ({ context, input }) => {
  // 1. Get authenticated context
  const auth = assertAuthenticated(context.auth);
  
  // 2. Check access (if needed)
  const hasAccess = await auth.admin.hasAccess();
  // or
  const hasAccess = await auth.org.hasAccess(organizationId);
  
  if (!hasAccess) {
    throw new ORPCError('FORBIDDEN', { message: 'Access denied' });
  }
  
  // 3. Call plugin utility (headers auto-injected)
  const result = await auth.admin.someMethod(params);
  // or
  const result = await auth.org.someMethod(params);
  
  // 4. Return response
  return result;
};
```

## Before vs After

### Manual Header Passing (Before)

```typescript
const result = await auth.api.organization.addMember({
  headers: {
    authorization: context.request.headers.get('authorization') ?? '',
    cookie: context.request.headers.get('cookie') ?? '',
  },
  body: {
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role
  }
});
```

### Auto-Injected Headers (After)

```typescript
const result = await auth.org.addMember({
  organizationId: input.organizationId,
  userId: input.userId,
  role: input.role
});
```

**Benefits:**
- 60% reduction in code
- No header extraction boilerplate
- Cleaner parameter structure
- Better type safety
- More maintainable code

## Integration with Existing Code

These examples can be easily integrated into your existing ORPC routers:

```typescript
import { implement } from '@orpc/server';
import { adminContract } from '@repo/contracts/api/modules/admin';
import { 
  createUserHandler, 
  banUserHandler, 
  listUsersHandler 
} from './examples/admin-operations.example';

export const adminRouter = implement(adminContract, {
  createUser: {
    handler: createUserHandler,
  },
  banUser: {
    handler: banUserHandler,
  },
  listUsers: {
    handler: listUsersHandler,
  },
});
```

## Testing

Mock the plugin utilities for testing:

```typescript
const mockAuth = {
  isLoggedIn: true,
  user: { id: 'user-123', email: 'test@example.com' },
  admin: {
    hasAccess: vi.fn().mockResolvedValue(true),
    createUser: vi.fn().mockResolvedValue({ user: { id: 'new-user' } }),
  },
  org: {
    hasAccess: vi.fn().mockResolvedValue(true),
    addMember: vi.fn().mockResolvedValue({ member: { id: 'member-123' } }),
  },
};
```

## Related Documentation

- [Better Auth Plugin Utilities](./../../../../../.docs/features/BETTER-AUTH-PLUGIN-UTILITIES.md) - Complete documentation
- [Better Auth Integration Pattern](./../../../../../.docs/core-concepts/07-BETTER-AUTH-INTEGRATION.md) - Core auth concepts
- [ORPC Implementation Pattern](./../../../../../.docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) - ORPC best practices

## Notes

- All examples use `assertAuthenticated()` to ensure the user is logged in
- Access checks (`hasAccess()`) should be performed before sensitive operations
- Headers are automatically extracted from the ORPC context and injected into plugin methods
- All plugin utilities are fully type-safe with TypeScript
- Error handling uses ORPC's `ORPCError` for consistent error responses
