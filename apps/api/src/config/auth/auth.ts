import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { EnvService } from "../env/env.service";
import { masterTokenPlugin } from "./plugins/masterTokenAuth";
import { loginAsPlugin } from "./plugins/loginAs";
import { useAdmin } from "./permissions/index";
import { openAPI } from "better-auth/plugins";

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
          devAuthKey: devAuthKey ?? "",
          enabled: envService.get("NODE_ENV") === "development" && !!devAuthKey,
        }),
        loginAsPlugin({
          enabled: envService.get("NODE_ENV") === "development" && !!devAuthKey,
          devAuthKey: devAuthKey ?? "",
        }),
        openAPI()
      ],
    }),
  };
};