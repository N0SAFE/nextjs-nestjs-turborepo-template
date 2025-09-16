import { BetterAuthPlugin, Session, User } from "better-auth";
import { createAuthMiddleware } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { user as userTable } from "../../drizzle/schema/auth";
import { EnvService } from "../../env/env.service";

export interface DevTokenAuthOptions {
  /**
   * Database instance for finding the admin user
   */
  database: NodePgDatabase<any>;
  /**
   * Environment service for accessing environment variables
   */
  envService: EnvService;
  /**
   * Admin user email to authenticate
   */
  adminEmail?: string;
  /**
   * Token prefix (default: "Bearer ")
   */
  tokenPrefix?: string;
}

export const devTokenAuth = (
  options: DevTokenAuthOptions
): BetterAuthPlugin => {
  const {
    database,
    envService,
    adminEmail = "admin@admin.com",
    tokenPrefix = "Bearer ",
  } = options;

  // Get the dev auth key from environment service
  const devAuthKey = envService.get("DEV_AUTH_KEY");

  const getAdminUser = async (): Promise<User | null> => {
    try {
      const result = await database
        .select()
        .from(userTable)
        .where(eq(userTable.email, adminEmail))
        .limit(1);

      return result[0] || null;
    } catch {
      return null;
    }
  };

  return {
    id: "dev-token-auth",
    hooks: {
      before: [
        {
          matcher: (_context) => {
            // Only apply in development mode
            return envService.get("NODE_ENV") === "development";
          },
          handler: createAuthMiddleware(async (ctx) => {
            let authHeader: string | undefined;

            if (ctx.request?.headers) {
              authHeader =
                ctx.request.headers.get("authorization") ||
                ctx.request.headers.get("Authorization") ||
                undefined;
            } else if (ctx.headers) {
              // ctx.headers is a Headers object, use .get() method
              authHeader =
                (ctx.headers as any).get("authorization") ||
                (ctx.headers as any).get("Authorization");
            }

            if (!authHeader || !devAuthKey) {
              return ctx;
            }

            // Extract token from Authorization header
            const token = authHeader.startsWith(tokenPrefix)
              ? authHeader.slice(tokenPrefix.length)
              : authHeader;

            // Check if token matches the dev key
            if (token !== devAuthKey) {
              return ctx;
            }

            // Get admin user
            const adminUser = await getAdminUser();

            if (!adminUser) {
              return ctx;
            }

            // Create a dev session
            const session: Session = {
              id: `dev-session-${adminUser.id}-${Date.now()}`,
              userId: adminUser.id,
              token: token,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              ipAddress:
                ctx.request?.headers.get("x-forwarded-for") ||
                ctx.request?.headers.get("x-real-ip") ||
                "dev",
              userAgent: ctx.request?.headers.get("user-agent") || "dev-client",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            ctx.context.session = { user: adminUser, session };

            return {
              context: ctx
            };
          }),
        },
      ],
    },
  };
};