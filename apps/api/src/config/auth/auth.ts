import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../app.config";
import type { BetterAuthPlugin } from "better-auth";
import { devTokenAuth } from "./plugins/devTokenAuth";

export const betterAuthFactory = (...args: unknown[]) => {
  const [database, configService] = args as [unknown, ConfigService<AppConfig>];
  const dbInstance = database as NodePgDatabase<any>;

  const plugins = [
    passkey({
      rpID: configService.get("passkeyRpId", { infer: true }),
      rpName: configService.get("passkeyRpName", { infer: true }),
      origin: configService.get("passkeyOrigin", { infer: true }),
    }),
    admin(),
  ] satisfies BetterAuthPlugin[];

  // Only add dev token auth in development mode AND if DEV_AUTH_KEY is set
  if (configService.get("nodeEnv", { infer: true }) === "development") {
    if (configService.get("devAuthKey", { infer: true })) {
      (plugins as BetterAuthPlugin[]).push(
        devTokenAuth({
          database: dbInstance,
          configService,
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
