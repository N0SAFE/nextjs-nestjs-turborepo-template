import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { BetterAuthPlugin } from "better-auth";
import { devTokenAuth } from "./plugins/devTokenAuth";
import { EnvService } from "../env/env.service";

export const betterAuthFactory = (...args: unknown[]) => {
  const [database, envService] = args as [unknown, EnvService];
  const dbInstance = database as NodePgDatabase<any>;

  const plugins = [
    passkey({
      rpID: envService.get("PASSKEY_RPID"),
      rpName: envService.get("PASSKEY_RPNAME"),
      origin: envService.get("PASSKEY_ORIGIN"),
    }),
    admin(),
  ] satisfies BetterAuthPlugin[];

  // Only add dev token auth in development mode AND if DEV_AUTH_KEY is set
  if (envService.get("NODE_ENV") === "development") {
    if (envService.get("DEV_AUTH_KEY")) {
      (plugins as BetterAuthPlugin[]).push(
        devTokenAuth({
          database: dbInstance,
          envService,
        })
      );
    }
  }

  return {
    auth: betterAuth({
      database: drizzleAdapter(dbInstance, {
        provider: "pg",
      }),
      emailAndPassword: {
        enabled: true,
      },
      plugins: plugins,
    }),
  };
};
