import type { BetterAuthPlugin } from "better-auth";
import {
  createAuthEndpoint,
  sessionMiddleware,
} from "better-auth/api";
import { generateRandomString } from "better-auth/crypto";
import type { UserWithRole } from "better-auth/plugins";
import { z } from "zod";

/**
 * Role schema type that accepts any valid role schema output from createSchemas
 * Can be ZodNever (0 roles), ZodLiteral (1 role), or ZodUnion (2+ roles)
 */
export type RoleSchemaType<TRoles extends string = string> =
  | z.ZodNever
  | z.ZodLiteral<TRoles>
  | z.ZodUnion<[z.ZodLiteral<TRoles>, ...z.ZodLiteral<TRoles>[]]>;

/**
 * Invitation options with type-safe role configuration
 */
export interface InvitePluginOptions<TRoles extends string = string> {
  /**
   * Duration in days for which an invite token is valid
   * @example 7 // 7 days
   * @default 7
   */
  inviteDurationDays?: number;

  /**
   * Zod schema for role validation
   * Use the roleNames schema from your permission builder schemas
   * Accepts ZodNever (0 roles), ZodLiteral (1 role), or ZodUnion (2+ roles)
   */
  roleSchema: RoleSchemaType<TRoles>;

  /**
   * Optional function to generate custom invite tokens
   * @default () => generateRandomString(32, "a-z", "A-Z", "0-9")
   */
  generateToken?: () => string;

  /**
   * Optional function to determine if a user can create invites
   * If not provided, any authenticated user can create invites
   */
  canCreateInvite?: (user: UserWithRole) => boolean;

  /**
   * Optional function for getting the current date (useful for testing)
   * @default () => new Date()
   */
  getDate?: () => Date;
}

interface Invite {
  id: string;
  token: string;
  email?: string;
  expiresAt: Date;
  role: string;
  usedAt?: Date;
};

const ERROR_CODES = {
  USER_NOT_LOGGED_IN: "User must be logged in to create an invite",
  INSUFFICIENT_PERMISSIONS:
    "User does not have sufficient permissions to create invite",
  NO_SUCH_USER: "No such user",
  INVALID_OR_EXPIRED_INVITE: "Invalid or expired invite token",
} as const;

/**
 * Better Auth plugin for invitation-based user registration with role management
 * 
 * @example
 * ```typescript
 * import { invitePlugin } from '@repo/auth/server/plugins/invite'
 * import { ac, roles } from '@repo/auth/permissions'
 * 
 * betterAuth({
 *   plugins: [
 *     admin({ ac, roles, defaultRole: 'guest' }),
 *     invitePlugin({
 *       inviteDurationDays: 7,
 *       roleSchema: roleNames,
 *     })
 *   ]
 * })
 * ```
 */
export const invitePlugin = <TRoles extends string>(
  options: InvitePluginOptions<TRoles>
) => {
  const opts = {
    generateToken:
      options.generateToken ?? (() => generateRandomString(32, "a-z", "A-Z", "0-9")),
    getDate: options.getDate ?? (() => new Date()),
    ...options,
  };

  return {
    id: "invite",
    endpoints: {
      /**
       * Create a new invite with email and role
       */
      create: createAuthEndpoint(
        "/invite/create",
        {
          body: z.object({
            email: z.email(),
            role: options.roleSchema,
          }),
          method: "POST",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const userId = ctx.context.session.user.id;
          if (!userId) {
            throw ctx.error("BAD_REQUEST", {
              message: ERROR_CODES.USER_NOT_LOGGED_IN,
            });
          }

          const user = await ctx.context.internalAdapter.findUserById(userId);

          if (!user) {
            throw ctx.error("BAD_REQUEST", {
              message: ERROR_CODES.NO_SUCH_USER,
            });
          }

          // Check if user can create invites
          if (options.canCreateInvite !== undefined) {
            const canCreateInvite = options.canCreateInvite(user);
            if (!canCreateInvite) {
              throw ctx.error("BAD_REQUEST", {
                message: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
              });
            }
          }

          const token = opts.generateToken();
          const now = opts.getDate();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + (options.inviteDurationDays ?? 7));

          await ctx.context.adapter.create({
            model: "invite",
            data: {
              token,
              email: ctx.body.email,
              createdByUserId: user.id,
              createdAt: now,
              expiresAt,
              role: ctx.body.role, // Store the role with the invite
            },
          });

          return ctx.json({ token, email: ctx.body.email, role: ctx.body.role, expiresAt: expiresAt.toISOString() }, { status: 201 });
        }
      ),

      /**
       * Check if an invite token is valid
       */
      check: createAuthEndpoint(
        "/invite/check",
        {
          method: "POST",
          body: z.object({
            token: z.string(),
          }),
        },
        async (ctx) => {
          const token = ctx.body.token;

          const invite = await ctx.context.adapter.findOne<Invite>({
            model: "invite",
            where: [{ field: "token", value: token }],
          });

          if (!invite?.email) {
            return ctx.json({ valid: false, message: "Invitation not found" });
          }

          // Check if already used
          if (invite.usedAt) {
            return ctx.json({ valid: false, message: "Invitation has already been used" });
          }

          // Check if expired
          if (opts.getDate() > invite.expiresAt) {
            return ctx.json({ valid: false, message: "Invitation has expired" });
          }

          return ctx.json({ valid: true, email: invite.email, role: invite.role });
        }
      ),
      /**
       * Validate invitation and create user account
       */
      validate: createAuthEndpoint(
        "/invite/validate",
        {
          method: "POST",
          body: z.object({
            token: z.string(),
            password: z.string().min(8),
            name: z.string().min(1),
          }),
        },
        async (ctx) => {
          const { token, password, name } = ctx.body;

          const invite = await ctx.context.adapter.findOne<Invite>({
            model: "invite",
            where: [{ field: "token", value: token }],
          });

          if (!invite?.email) {
            throw ctx.error("BAD_REQUEST", {
              message: "Invitation not found",
            });
          }

          // Check if already used
          if (invite.usedAt) {
            throw ctx.error("BAD_REQUEST", {
              message: "Invitation has already been used",
            });
          }

          // Check if expired
          if (opts.getDate() > invite.expiresAt) {
            throw ctx.error("BAD_REQUEST", {
              message: ERROR_CODES.INVALID_OR_EXPIRED_INVITE,
            });
          }

          // Check if user with this email already exists
          const existingUser = await ctx.context.adapter.findOne({
            model: "user",
            where: [{ field: "email", value: invite.email }],
          });

          if (existingUser) {
            throw ctx.error("BAD_REQUEST", {
              message: "User with this email already exists",
            });
          }

          // Create user with email from invitation
          const user = await ctx.context.internalAdapter.createUser({
            email: invite.email,
            name,
            emailVerified: true,
            role: invite.role,
          });

          if (!user.id) {
            throw ctx.error("INTERNAL_SERVER_ERROR", {
              message: "Failed to create user",
            });
          }

          // Create account with password
          await ctx.context.adapter.create({
            model: "account",
            data: {
              userId: user.id,
              accountId: user.id,
              providerId: "credential",
              password: await ctx.context.password.hash(password),
            },
          });

          // Mark invitation as used
          await ctx.context.adapter.update({
            model: "invite",
            where: [{ field: "token", value: token }],
            update: { usedAt: opts.getDate() },
          });

          return ctx.json({ userId: user.id }, { status: 201 });
        }
      ),
    },
    $ERROR_CODES: ERROR_CODES,
    schema: {
      invite: {
        fields: {
          token: { type: "string", unique: true, required: true },
          email: { type: "string", required: true },
          role: { type: "string", required: true },
          createdAt: { type: "date", defaultValue: () => new Date() },
          expiresAt: { type: "date", required: true },
          usedAt: { type: "date", required: false },
          createdByUserId: {
            type: "string",
            required: false,
            references: { model: "user", field: "id", onDelete: "set null" },
          },
        },
      },
    },
  } satisfies BetterAuthPlugin;
};
