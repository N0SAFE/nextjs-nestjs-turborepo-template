# Better Auth Invite Plugin

A comprehensive invitation system for Better Auth with full role management and type safety.

## Features

- 🎯 **Type-safe role management** - Fully typed roles integrated with your access control system
- 🔗 **Shareable invite links** - No need to know invitee's email upfront
- 🎭 **Flexible role assignment** - Different roles per invitation
- 🔒 **Configurable permissions** - Control who can create invites
- ⏱️ **Customizable expiration** - Set invite duration per your needs
- 📊 **Usage tracking** - Track who created and used invites
- 🔄 **Multiple uses** - Support single-use or multi-use invites
- 🎨 **Guest mode support** - Users can sign up without invites (e.g., for waitlists)

## Installation

The invite plugin is already included in the `@repo/auth` package.

## Setup

### 1. Server-Side Configuration

```typescript
import { betterAuth } from "better-auth";
import { useAdmin, useInvite } from "@repo/auth/server/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [
    // Configure admin plugin with default role
    useAdmin({
      defaultRole: "sarah", // Users without invite get this role
    }),
    
    // Configure invite plugin with type-safe roles
    useInvite({
      inviteDurationSeconds: 3600, // Invites valid for 1 hour
      roleForSignupWithoutInvite: "sarah", // Must match defaultRole above
      
      // Optional: Custom invite code generation
      generateCode: () => generateRandomString(8),
      
      // Optional: Control who can create invites
      canCreateInvite: (user) => user.role === "admin",
      
      // Optional: For testing
      getDate: () => new Date(),
    }),
  ],
});
```

### 2. Client-Side Configuration

```typescript
import { createAuthClient } from "better-auth/react";
import { useInviteClient } from "@repo/auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [
    useInviteClient(),
    // ... other plugins
  ],
});
```

### 3. Run Database Migrations

The plugin automatically creates these tables:
- `invite` - Stores invitation codes and metadata
- `invite_use` - Tracks invitation usage

Ensure migrations are run when the server starts.

## Usage

### Creating Invitations

Only authorized users can create invitations. Authorization is determined by:
1. Custom `canCreateInvite` function (if provided)
2. Default: users with `roleForSignupWithoutInvite` cannot create invites

```typescript
import { authClient } from "@/lib/auth-client";

// Create a single-use invite for "admin" role
const { data, error } = await authClient.invite.create({
  role: "admin", // Type-safe! Must be one of your defined roles
});

if (data) {
  const inviteLink = `${window.location.origin}/invite/${data.code}`;
  // Share this link with the invitee
  console.log("Invite created:", inviteLink);
}

// Create a multi-use invite
const { data: multiUse } = await authClient.invite.create({
  role: "sarah",
  maxUses: 10, // Can be used 10 times
});
```

### Activating Invitations

When a user receives an invite link, they need to activate it before signing up:

```typescript
// In your invite page component (e.g., app/invite/[code]/page.tsx)
import { authClient } from "@/lib/auth-client";

async function activateInvite(code: string) {
  const { error } = await authClient.invite.activate({ code });

  if (error) {
    // Handle errors: invalid code, expired, already used, etc.
    console.error("Failed to activate invite:", error);
    return false;
  }

  // Success! Cookie is set, redirect to sign-up
  window.location.href = "/sign-up";
  return true;
}
```

The `activate` method:
- Validates the invite code
- Checks expiration and usage limits
- Stores the invite code in a secure, http-only cookie
- The cookie is automatically included in subsequent sign-up requests

### Signing Up with an Invite

After activating an invite, users sign up normally. The plugin automatically:
1. Detects the invite cookie
2. Validates the invite
3. Assigns the role specified in the invite
4. Records the usage
5. Clears the invite cookie

```typescript
// Standard sign-up - the invite system works automatically
const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "securePassword",
  name: "New User",
});

if (data) {
  // User is created with the role from the invite
  console.log("User role:", data.user.role); // e.g., "admin"
}
```

### Signing Up without an Invite

Users can also sign up without an invite (useful for waitlists):

```typescript
const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "securePassword",
  name: "Guest User",
});

if (data) {
  // User gets the roleForSignupWithoutInvite
  console.log("User role:", data.user.role); // e.g., "sarah"
}
```

## Complete Example Flow

### 1. Admin Creates Invite

```typescript
// Admin dashboard
async function createUserInvite() {
  const { data, error } = await authClient.invite.create({
    role: "admin",
  });

  if (error) {
    toast.error("Failed to create invite");
    return;
  }

  const inviteUrl = `${window.location.origin}/invite/${data.code}`;
  
  // Copy to clipboard or send via email/SMS
  navigator.clipboard.writeText(inviteUrl);
  toast.success("Invite link copied!");
}
```

### 2. New User Receives and Activates Invite

```typescript
// app/invite/[code]/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function InvitePage({ params }: { params: { code: string } }) {
  const router = useRouter();

  useEffect(() => {
    activateInvite();
  }, []);

  async function activateInvite() {
    const { error } = await authClient.invite.activate({
      code: params.code,
    });

    if (error) {
      toast.error("Invalid or expired invite");
      router.push("/");
      return;
    }

    toast.success("Invite activated! Please sign up.");
    router.push("/sign-up");
  }

  return <div>Activating invite...</div>;
}
```

### 3. New User Signs Up

```typescript
// app/sign-up/page.tsx
"use client";

import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { data, error } = await authClient.signUp.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
    });

    if (error) {
      toast.error("Sign-up failed");
      return;
    }

    // User is created with invite role (if invite was activated)
    toast.success(`Welcome! You are now an ${data.user.role}`);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSignUp}>
      {/* Form fields */}
    </form>
  );
}
```

## Database Schema

### `invite` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | string | Primary key |
| `code` | string (unique) | The invite code |
| `role` | string | Role to assign when used |
| `createdByUserId` | string | ID of user who created invite |
| `createdAt` | date | When invite was created |
| `expiresAt` | date | When invite expires |
| `maxUses` | number | Maximum times invite can be used |

### `invite_use` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | string | Primary key |
| `inviteId` | string | Reference to invite |
| `usedByUserId` | string | ID of user who used invite |
| `usedAt` | date | When invite was used |

## Type Safety

The plugin provides full type safety for roles:

```typescript
import type { AllRoleNames } from "@repo/auth/permissions";

// Roles are typed based on your permission configuration
type Role = AllRoleNames; // "admin" | "sarah" | ...

// Creating an invite with invalid role will error
authClient.invite.create({
  role: "invalid", // ❌ TypeScript error
});

authClient.invite.create({
  role: "admin", // ✅ Valid role
});
```

## Error Codes

The plugin provides descriptive error codes:

- `USER_NOT_LOGGED_IN` - User must be authenticated to create invites
- `INSUFFICIENT_PERMISSIONS` - User lacks permission to create invites
- `NO_SUCH_USER` - User not found
- `NO_USES_LEFT_FOR_INVITE_CODE` - Invite has reached max uses
- `INVALID_OR_EXPIRED_INVITE` - Invite code is invalid or expired

## Security Considerations

1. **Invite Codes**: Generated using cryptographically secure random strings
2. **Http-Only Cookies**: Invite codes stored in secure, http-only cookies
3. **Expiration**: All invites have configurable expiration times
4. **Usage Limits**: Control how many times an invite can be used
5. **Permission Control**: Restrict who can create invites

## Testing

```typescript
import { invitePlugin } from "@repo/auth/server";
import { vi } from "vitest";

// Mock date for testing expiration
const getDate = vi.fn().mockReturnValue(new Date("2025-01-01T10:00:00Z"));

const auth = betterAuth({
  plugins: [
    invitePlugin({
      inviteDurationSeconds: 3600,
      roleForSignupWithoutInvite: "guest",
      getDate, // Use mocked date
      generateCode: () => "test-code-123", // Predictable codes
    }),
  ],
});
```

## Comparison with Database-Based Invitation

The new Better Auth plugin approach differs from the previous database-integrated solution:

### Old Approach (Database Repository)
- ❌ Tightly coupled to database schema
- ❌ Requires manual integration with auth flow
- ❌ No automatic role upgrade
- ❌ Manual cookie management
- ❌ Separate from auth system

### New Approach (Better Auth Plugin)
- ✅ Plugin-based architecture
- ✅ Automatic integration with Better Auth
- ✅ Automatic role upgrades during sign-up
- ✅ Built-in cookie management
- ✅ Seamless auth flow integration
- ✅ Type-safe role definitions
- ✅ Consistent with Better Auth patterns

## Migration Guide

To migrate from the old database-based invitation system:

1. Remove the old invitation module from your API
2. Configure the new invite plugin in your Better Auth setup
3. Update client code to use the new `authClient.invite` methods
4. Run database migrations to create the new tables
5. Update your invite UI components to use the new flow

See the examples above for the new usage patterns.

## Advanced Configuration

### Custom Invite Creation Logic

```typescript
useInvite({
  inviteDurationSeconds: 3600,
  roleForSignupWithoutInvite: "sarah",
  
  // Only admins and managers can create invites
  canCreateInvite: (user) => {
    return user.role === "admin" || user.role === "manager";
  },
  
  // Custom code generation (e.g., readable codes)
  generateCode: () => {
    const words = ["alpha", "bravo", "charlie"];
    return words[Math.floor(Math.random() * words.length)] +
           Math.floor(Math.random() * 1000);
  },
});
```

### Integration with Email Service

```typescript
async function sendInviteEmail(email: string, role: string) {
  // Create invite
  const { data } = await authClient.invite.create({ role });
  
  if (!data) return;
  
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.code}`;
  
  // Send email with invite link
  await emailService.send({
    to: email,
    subject: "You're invited!",
    html: `
      <h1>You've been invited</h1>
      <p>Click the link below to join as ${role}:</p>
      <a href="${inviteUrl}">${inviteUrl}</a>
    `,
  });
}
```

## Support

For issues or questions:
- Check the Better Auth documentation: https://better-auth.com
- Review the plugin source code in `packages/auth/src/server/plugins/invite.ts`
- Reference implementation: https://github.com/bard/better-auth-invite
