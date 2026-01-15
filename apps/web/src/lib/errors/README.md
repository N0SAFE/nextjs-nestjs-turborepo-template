# Error Handling System

Comprehensive error handling system with domain-specific error handlers and user-friendly messages.

## Overview

This error handling system provides:
- **Base error utilities** - Core error classes and helpers
- **Domain-specific handlers** - User, Organization, and Admin error handling
- **Type-safe error codes** - Predefined error codes with TypeScript enums
- **User-friendly messages** - Clear, actionable error messages
- **Logger integration** - Automatic error logging with context

## Architecture

```
lib/errors/
├── base.ts           # Core error utilities (AppError, handleError, getErrorMessage)
├── user.ts           # User domain errors (profile, password, etc.)
├── organization.ts   # Organization errors (members, invitations, etc.)
├── admin.ts          # Admin errors (user management, permissions, etc.)
└── index.ts          # Barrel export
```

## Usage

### Basic Error Handling

```tsx
import { handleError, getErrorMessage } from '@/lib/errors'

try {
  await someOperation()
} catch (error) {
  // Option 1: Handle with logging and context
  const message = handleError(error, {
    feature: 'Dashboard',
    action: 'fetch_data',
  })
  toast.error(message)
  
  // Option 2: Just get the message
  const simpleMessage = getErrorMessage(error)
  toast.error(simpleMessage)
}
```

### Domain-Specific Error Handling

#### User Domain

```tsx
import { handleUserError, getUserErrorMessage } from '@/lib/errors'

try {
  await updateUserProfile(userId, data)
} catch (error) {
  // Automatically logs with user domain context
  const message = handleUserError(error, 'update_profile')
  toast.error(message)
}
```

#### Organization Domain

```tsx
import { handleOrganizationError } from '@/lib/errors'

try {
  await addMemberToOrg(orgId, userId)
} catch (error) {
  const message = handleOrganizationError(error, 'add_member', orgId)
  toast.error(message)
}
```

#### Admin Domain

```tsx
import { handleAdminError } from '@/lib/errors'

try {
  await adminBanUser(userId)
} catch (error) {
  const message = handleAdminError(error, 'ban_user', userId)
  toast.error(message)
}
```

### Creating Custom Errors

```tsx
import { createUserError, USER_ERROR_CODES } from '@/lib/errors'

// In your validation logic
if (await emailExists(email)) {
  throw createUserError(USER_ERROR_CODES.EMAIL_ALREADY_EXISTS, {
    email,
    attemptedAt: new Date().toISOString(),
  })
}
```

### Type Guards

```tsx
import { isAppError, hasStatusCode, hasErrorCode } from '@/lib/errors'

try {
  await someOperation()
} catch (error) {
  if (isAppError(error)) {
    // error is AppError with .code, .statusCode, .metadata
    console.log('Error code:', error.code)
  }
  
  if (hasStatusCode(error)) {
    // error has .statusCode property
    if (error.statusCode === 404) {
      // Handle not found
    }
  }
  
  if (hasErrorCode(error)) {
    // error has .code property
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Handle unauthorized
        break
    }
  }
}
```

## Error Codes

### User Domain (`USER_ERROR_CODES`)

- `USER_NOT_FOUND` - User not found
- `EMAIL_ALREADY_EXISTS` - Email already in use
- `INVALID_PASSWORD` - Incorrect password
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `PROFILE_UPDATE_FAILED` - Profile update failed
- `ACCOUNT_DISABLED` - Account has been disabled

### Organization Domain (`ORGANIZATION_ERROR_CODES`)

- `ORG_NOT_FOUND` - Organization not found
- `ORG_NAME_EXISTS` - Organization name already exists
- `ORG_SLUG_EXISTS` - Organization URL already taken
- `MEMBER_NOT_FOUND` - Member not found
- `MEMBER_ALREADY_EXISTS` - User already a member
- `INSUFFICIENT_PERMISSIONS` - Insufficient permissions
- `CANNOT_REMOVE_OWNER` - Cannot remove owner
- `CANNOT_LEAVE_ONLY_ORG` - Must remain in at least one org
- `INVITATION_EXPIRED` - Invitation has expired
- `INVITATION_INVALID` - Invalid invitation

### Admin Domain (`ADMIN_ERROR_CODES`)

- `ADMIN_PERMISSION_REQUIRED` - Admin permissions required
- `USER_NOT_FOUND` - User not found
- `CANNOT_BAN_ADMIN` - Cannot ban administrator
- `CANNOT_DELETE_SELF` - Cannot delete own account
- `ROLE_NOT_FOUND` - Role not found
- `INVALID_ROLE` - Invalid role assignment
- `SYSTEM_SETTING_INVALID` - Invalid system setting
- `PERMISSION_DENIED` - Permission denied
- `AUDIT_LOG_ERROR` - Audit log error

## Integration with Mutation Hooks

Use domain error handlers in your mutation hooks for consistent error handling:

```tsx
import { useMutation } from '@tanstack/react-query'
import { handleUserError } from '@/lib/errors'

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: ProfileData) => updateProfile(data),
    onError: (error) => {
      const message = handleUserError(error, 'update_profile')
      toast.error(message)
    },
  })
}
```

## Integration with Error Boundaries

Error boundaries automatically use the logger. Domain handlers provide additional context:

```tsx
import { FeatureErrorBoundary } from '@/components/error'
import { handleUserError } from '@/lib/errors'

export function UserProfile() {
  return (
    <FeatureErrorBoundary
      feature="UserProfile"
      onError={(error, errorInfo) => {
        // Already logged by error boundary, but you can add domain-specific handling
        handleUserError(error, 'fetch')
      }}
    >
      <ProfileContent />
    </FeatureErrorBoundary>
  )
}
```

## Best Practices

1. **Use domain handlers** - Always use domain-specific handlers (`handleUserError`, `handleOrganizationError`, `handleAdminError`) instead of generic `handleError` when possible

2. **Provide context** - Include relevant IDs and context when handling errors:
   ```tsx
   handleOrganizationError(error, 'add_member', organizationId)
   ```

3. **Create typed errors** - Use `createXError` functions for predictable error handling:
   ```tsx
   throw createUserError(USER_ERROR_CODES.EMAIL_ALREADY_EXISTS, { email })
   ```

4. **Let errors bubble** - Let error boundaries catch unhandled errors at the layout level

5. **Log with context** - The `handleError` functions automatically log with feature/action context

6. **User-friendly messages** - All error codes map to clear, actionable user messages

## Error Flow

```
1. Error occurs in API call or operation
                ↓
2. Domain handler catches and logs (handleUserError, etc.)
                ↓
3. Extract user-friendly message
                ↓
4. Display to user (toast, inline error, etc.)
                ↓
5. Error boundary catches any unhandled errors
                ↓
6. Fallback UI shown with retry option
```

## Extending the System

To add a new domain:

1. Create `lib/errors/your-domain.ts`:
   ```tsx
   export const YOUR_DOMAIN_ERROR_CODES = { ... }
   const YOUR_DOMAIN_ERROR_MESSAGES = { ... }
   export function handleYourDomainError(error, action) { ... }
   ```

2. Export from `lib/errors/index.ts`:
   ```tsx
   export { handleYourDomainError, ... } from './your-domain'
   ```

3. Use in your features:
   ```tsx
   import { handleYourDomainError } from '@/lib/errors'
   ```
