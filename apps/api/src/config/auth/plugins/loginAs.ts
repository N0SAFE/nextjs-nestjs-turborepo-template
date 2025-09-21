import type { BetterAuthPlugin, User } from "better-auth";
import { createAuthEndpoint } from "better-auth/plugins";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

interface LoginAsOptions {
  enabled?: boolean;
  devAuthKey: string;
}

export const loginAsPlugin = (options: LoginAsOptions) => {
  const { enabled = process.env.NODE_ENV === "development", devAuthKey } =
    options;

  return {
    id: "login-as",
    endpoints: {
      loginAs: createAuthEndpoint(
        "/login-as",
        {
          method: "POST",
          body: z.object({
            userId: z.string().min(1, "User ID is required"),
          }),
        },
        async (ctx) => {
          // Check if plugin is enabled
          if (!enabled) {
            return ctx.json({ error: "Login-as is disabled" }, { status: 403 });
          }

          if (!ctx.request) {
            return ctx.json(
              { error: "Invalid request context" },
              { status: 400 }
            );
          }

          if (
            ctx.request.headers.get("authorization") !== `Bearer ${devAuthKey}`
          ) {
            return ctx.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { userId } = ctx.body;

          try {
            // Get user from database
            const user = await ctx.context.adapter.findOne<User>({
              model: "user",
              where: [{ field: "id", value: userId, operator: "eq" }],
            });

            if (!user) {
              return ctx.json({ error: "User not found" }, { status: 404 });
            }

            // Create session for the user
            const session = await ctx.context.internalAdapter.createSession(
              user.id,
              ctx
            );

            if (!session) {
              return ctx.json(
                { error: "Failed to create session" },
                { status: 500 }
              );
            }

            await setSessionCookie(ctx, {
              session,
              user,
            });

            return ctx.json({
              success: true,
            });
          } catch (error) {
            console.error("Login-as error:", error);
            return ctx.json(
              {
                error:
                  process.env.NODE_ENV === "development"
                    ? JSON.stringify(error)
                    : "Internal server error",
              },
              { status: 500 }
            );
          }
        }
      ),
    },
  } satisfies BetterAuthPlugin;
};
