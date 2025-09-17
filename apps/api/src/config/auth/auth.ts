import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { EnvService } from "../env/env.service";
import { masterTokenPlugin } from "./plugins/masterTokenAuth";
import { useAdmin } from "./permissions/index";

export const betterAuthFactory = (...args: unknown[]) => {
  const [database, envService] = args as [unknown, EnvService];
  const dbInstance = database as NodePgDatabase<any>;

  const devAuthKey = envService.get("DEV_AUTH_KEY");

  return {
    auth: betterAuth({
      database: drizzleAdapter(dbInstance, {
        provider: "pg",
      }),
      emailAndPassword: {
        enabled: true,
      },
      plugins: [
        passkey({
          rpID: envService.get("PASSKEY_RPID"),
          rpName: envService.get("PASSKEY_RPNAME"),
          origin: envService.get("PASSKEY_ORIGIN"),
        }),
        useAdmin(),
        masterTokenPlugin({
          masterToken: devAuthKey || "",
          enabled: envService.get("NODE_ENV") === "development" && !!devAuthKey,
        }),
      ],
    }),
  };
};