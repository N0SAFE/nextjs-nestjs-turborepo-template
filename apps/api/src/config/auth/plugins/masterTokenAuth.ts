// plugins/master-token/index.ts
import type { BetterAuthPlugin } from "better-auth";

interface MasterTokenOptions {
  masterToken: string;
  enabled?: boolean;
  masterUser?: {
    id?: string;
    email?: string;
    name?: string;
  };
}

export const masterTokenPlugin = (
  options: MasterTokenOptions
): BetterAuthPlugin => {
  const {
    masterToken,
    enabled = true,
    masterUser = {
      id: "master-token-user",
      email: "master@system.local",
      name: "Master Token User",
    },
  } = options;

  return {
    id: "masterToken",

    hooks: {
      after: [
        {
          matcher: (context) => {
            // Hook into all API calls
            return (
              context.path === "/get-session" ||
              context.path === "/session" ||
              context.path.includes("/session")
            );
          },
          handler: async (ctx) => {
            if (!enabled) return;

            // Check for master token
            const authHeader = ctx.headers?.get("authorization");

            if (authHeader?.startsWith("Bearer ")) {
              const token = authHeader.substring(7);

              if (token === masterToken) {
                // If the response is null/empty (no session found), inject our master session
                if (
                  !ctx.body ||
                  (ctx.body && Object.keys(ctx.body).length === 0)
                ) {
                  const masterSession = {
                    session: {
                      id: `master-session-${Date.now()}`,
                      userId: masterUser.id!,
                      expiresAt: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                      ).toISOString(),
                      userAgent: ctx.headers?.get("user-agent") || "unknown",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                    user: {
                      id: masterUser.id!,
                      email: masterUser.email!,
                      emailVerified: true,
                      name: masterUser.name!,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                  };

                  return {
                    response: Response.json(masterSession),
                  };
                }
              }
            }
            return ctx;
          },
        },
      ],
      before: [
        {
          matcher: (context) => {
            // For non-session endpoints that need authentication
            const publicRoutes = [
              "/sign-up",
              "/sign-in",
              "/forgot-password",
              "/verify-email",
            ];
            return !publicRoutes.some((route) =>
              context.path.startsWith(route)
            );
          },
          handler: async (ctx) => {
            if (!enabled) return;

            const authHeader = ctx.headers?.get("authorization");

            if (authHeader?.startsWith("Bearer ")) {
              const token = authHeader.substring(7);

              if (token === masterToken) {
                // Inject session data into context
                const session = {
                  id: `master-session-${Date.now()}`,
                  userId: masterUser.id!,
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  userAgent: ctx.headers?.get("user-agent") || "unknown",
                };

                const user = {
                  id: masterUser.id!,
                  email: masterUser.email!,
                  emailVerified: true,
                  name: masterUser.name!,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                // Modify the context to include session
                return {
                  context: {
                    ...ctx,
                    session,
                    user,
                  },
                };
              }
            }
          },
        },
      ],
    },
  };
};
