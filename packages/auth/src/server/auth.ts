import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import { openAPI } from "better-auth/plugins";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { masterTokenPlugin } from "./plugins/masterTokenAuth";
import { loginAsPlugin } from "./plugins/loginAs";
import { useAdmin } from "../permissions/index";

export const betterAuthFactory = <TSchema extends Record<string, unknown> = Record<string, never>>(
    database: unknown,
    env: {
        DEV_AUTH_KEY: string | undefined;
        PASSKEY_RPID: string;
        PASSKEY_RPNAME: string;
        PASSKEY_ORIGIN: string;
        NODE_ENV: string;
    }
) => {
    const dbInstance = database as NodePgDatabase<TSchema>;

    const {
        DEV_AUTH_KEY,
        PASSKEY_RPID,
        PASSKEY_RPNAME,
        PASSKEY_ORIGIN,
        NODE_ENV,
    } = env

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
                    rpID: PASSKEY_RPID,
                    rpName: PASSKEY_RPNAME,
                    origin: PASSKEY_ORIGIN,
                }),
                useAdmin(),
                masterTokenPlugin({
                    devAuthKey: DEV_AUTH_KEY ?? "",
                    enabled: NODE_ENV === "development" && !!DEV_AUTH_KEY,
                }),
                loginAsPlugin({
                    enabled: NODE_ENV === "development" && !!DEV_AUTH_KEY,
                    devAuthKey: DEV_AUTH_KEY ?? "",
                }),
                openAPI(),
            ],
        }),
    };
};
