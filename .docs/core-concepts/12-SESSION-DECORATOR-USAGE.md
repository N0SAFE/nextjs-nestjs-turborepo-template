# Session Decorator Usage Guide

## Overview

The `@Session()` decorator in this application returns the complete session object from Better Auth, which includes both session metadata and user information in a nested structure.

## Return Type Structure

When authenticated, `@Session()` returns an object with the following structure:

```typescript
{
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    // ... plus any additional session fields from plugins
  };
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    // ... plus any additional user fields from plugins
  };
}
```

When **not authenticated** (with `@OptionalAuth()`), it returns `null`.

## Basic Usage

### 1. Authenticated Route (Default)

```typescript
import { Controller, Get } from '@nestjs/common';
import { Session } from '@/core/modules/auth/decorators/decorators';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@Session() sessionData: any) {
    // Access session properties
    const sessionId = sessionData.session.id;
    const expiresAt = sessionData.session.expiresAt;
    
    // Access user properties
    const userId = sessionData.user.id;
    const userEmail = sessionData.user.email;
    const userName = sessionData.user.name;
    
    return {
      userId,
      userEmail,
      userName,
      sessionId,
      expiresAt,
    };
  }
}
```

### 2. Optional Authentication

Use `@OptionalAuth()` when you want to allow both authenticated and anonymous access:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Session, OptionalAuth } from '@/core/modules/auth/decorators/decorators';

@Controller('public-content')
export class PublicContentController {
  @Get()
  @OptionalAuth()
  getContent(@Session() sessionData: any) {
    if (sessionData) {
      // User is authenticated
      return {
        message: `Welcome back, ${sessionData.user.name}!`,
        userId: sessionData.user.id,
        isAuthenticated: true,
      };
    } else {
      // User is not authenticated
      return {
        message: 'Welcome, guest!',
        isAuthenticated: false,
      };
    }
  }
}
```

### 3. Anonymous Access

Use `@AllowAnonymous()` when you don't need authentication at all (session will still be set if available):

```typescript
import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@/core/modules/auth/decorators/decorators';

@Controller('public')
export class PublicController {
  @Get()
  @AllowAnonymous()
  getPublicData() {
    return { message: 'This is public data' };
  }
}
```

## Type-Safe Usage

For better type safety, create a type definition:

```typescript
// types/session.ts
import type { Session as BetterAuthSession } from 'better-auth';

export interface SessionData {
  session: BetterAuthSession['session'];
  user: BetterAuthSession['user'];
}

// In your controller
import type { SessionData } from '@/types/session';

@Get()
getProfile(@Session() sessionData: SessionData) {
  // Now you have full type safety
  const userEmail: string = sessionData.user.email;
  const sessionId: string = sessionData.session.id;
}
```

## Common Patterns

### Extracting User ID

```typescript
@Get('my-data')
getMyData(@Session() sessionData: any) {
  const userId = sessionData.user.id;
  return this.myService.getDataForUser(userId);
}
```

### Checking Session Validity

```typescript
@Get('session-info')
@OptionalAuth()
getSessionInfo(@Session() sessionData: any) {
  if (!sessionData) {
    return { authenticated: false };
  }
  
  const now = new Date();
  const expiresAt = new Date(sessionData.session.expiresAt);
  const isExpired = now > expiresAt;
  
  return {
    authenticated: true,
    isExpired,
    expiresIn: expiresAt.getTime() - now.getTime(), // milliseconds
    user: {
      id: sessionData.user.id,
      email: sessionData.user.email,
    },
  };
}
```

### Using with Other Decorators

You can combine `@Session()` with custom decorators like `@AuthenticatedUser()` which provides a simplified interface:

```typescript
import { AuthenticatedUser } from '@/core/modules/auth/decorators/decorators';

@Get('profile')
getProfile(@AuthenticatedUser() user: any) {
  // AuthenticatedUser extracts and enhances user data
  // Includes: id, email, name, role, roles (parsed array)
  return {
    userId: user.id,
    userEmail: user.email,
    userRoles: user.roles, // Already parsed as array
  };
}
```

## Important Notes

1. **Nested Structure**: Remember that session data is nested. You must access `sessionData.session` for session properties and `sessionData.user` for user properties.

2. **Null Handling**: With `@OptionalAuth()`, always check if `sessionData` is null before accessing properties.

3. **Global Auth Guard**: By default, all routes require authentication. Use `@AllowAnonymous()` or `@OptionalAuth()` to change this behavior.

4. **Type Safety**: Use TypeScript types to ensure you're accessing the correct properties and avoiding runtime errors.

5. **Plugin Extensions**: If you're using Better Auth plugins that extend the session or user objects, those additional fields will also be available in the returned object.

## Comparison with @thallesp/nestjs-better-auth

This implementation matches the behavior of the `@thallesp/nestjs-better-auth` package. The `@Session()` decorator returns the complete object structure as described above, providing access to both session and user data in a single parameter.

## Troubleshooting

### Session is Always Null

1. **Check Authentication**: Ensure you're sending authentication cookies/headers with your request.
2. **Check Guard Configuration**: Verify the global auth guard is enabled and configured correctly.
3. **Check Better Auth Setup**: Ensure Better Auth is properly configured with the correct database connection and secret.

### Cannot Access User Properties

```typescript
// ❌ Wrong - trying to access user directly
const email = sessionData.email; // undefined!

// ✅ Correct - access through nested structure
const email = sessionData.user.email;
```

### Type Errors

```typescript
// ❌ Wrong - assuming flat structure
type MySession = { id: string; email: string };

// ✅ Correct - nested structure
type MySession = {
  session: { id: string; /* ... */ };
  user: { email: string; /* ... */ };
};
```

## Related Documentation

- [Authentication System](../features/AUTHENTICATION.md)
- [Better Auth Integration](../features/BETTER-AUTH-INTEGRATION.md)
- [Authorization and Permissions](./10-AUTHORIZATION-PERMISSIONS.md)
