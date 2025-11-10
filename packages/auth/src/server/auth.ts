import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import { openAPI } from "better-auth/plugins";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { IEnvService } from "../types";
import { masterTokenPlugin } from "./plugins/masterTokenAuth";
import { loginAsPlugin } from "./plugins/loginAs";
import { useAdmin } from "../permissions/index";

export const betterAuthFactory = <TSchema extends Record<string, unknown> = Record<string, never>>(
    database: NodePgDatabase<TSchema>,
    envService: IEnvService
) => {
    const dbInstance = database;

    const devAuthKey = envService.get("DEV_AUTH_KEY");

    return {
        auth: betterAuth({
            database: drizzleAdapter(dbInstance, {
                provider: "pg",
            }),
            emailAndPassword: {
                enabled: true,
            },
            session: {
                cookieCache: {
                    enabled: true,
                    maxAge: 5 * 60, // Cache duration in seconds
                },
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
                openAPI(),
            ],
        }),
    };
};
