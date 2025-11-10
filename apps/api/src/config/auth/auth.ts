import { betterAuthFactory } from "@repo/auth/server";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { EnvService } from "../env/env.service";

export const createBetterAuth = <TSchema extends Record<string, unknown>>(
    database: NodePgDatabase<TSchema>,
    envService: EnvService
) => {
    return betterAuthFactory(database, {
        DEV_AUTH_KEY: envService.get('DEV_AUTH_KEY'),
        NODE_ENV: envService.get('NODE_ENV'),
        PASSKEY_ORIGIN: envService.get('PASSKEY_ORIGIN'),
        PASSKEY_RPID: envService.get('PASSKEY_RPID'),
        PASSKEY_RPNAME: envService.get('PASSKEY_RPNAME')
    });
};
