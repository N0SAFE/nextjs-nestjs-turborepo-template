import type { BetterAuthClientPlugin } from "better-auth/client";
import type { invitePlugin } from "../../server/plugins/invite";

/**
 * Client plugin for the invitation system
 * 
 * Provides type-safe methods for:
 * - Creating invitations with email and role
 * - Checking invitation token validity
 * - Validating invitation and creating user account
 * 
 * @example
 * ```typescript
 * import { inviteClient } from '@repo/auth/client/plugins/invite'
 * 
 * const authClient = createAuthClient({
 *   plugins: [inviteClient()]
 * })
 * 
 * // Create an invite
 * const { data, error } = await authClient.invite.create({
 *   email: 'user@example.com',
 *   role: 'user'
 * })
 * 
 * // Check an invite
 * const check = await authClient.invite.check({ token: 'abc123...' })
 * 
 * // Validate and create user
 * await authClient.invite.validate({ 
 *   token: 'abc123...', 
 *   password: 'password123',
 *   name: 'John Doe'
 * })
 * ```
 */
export const inviteClient = () => {
  return {
    id: "invite",
    $InferServerPlugin: {} as ReturnType<typeof invitePlugin>,
  } satisfies BetterAuthClientPlugin;
};

export type InviteClientPlugin = ReturnType<typeof inviteClient>;
