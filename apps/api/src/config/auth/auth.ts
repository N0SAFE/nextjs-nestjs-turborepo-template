import { betterAuthFactory } from "@repo/auth/server";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { EnvService } from "../env/env.service";

export const createBetterAuth = <TSchema extends Record<string, unknown>>(
    database: NodePgDatabase<TSchema> | null,
    envService: EnvService | Parameters<typeof betterAuthFactory>[1]
) => {
    return betterAuthFactory(database, 'get' in envService ? {
        DEV_AUTH_KEY: envService.get('DEV_AUTH_KEY'),
        NODE_ENV: envService.get('NODE_ENV'),
        BETTER_AUTH_SECRET: envService.get('BETTER_AUTH_SECRET'),
        BASE_URL: envService.get('NEXT_PUBLIC_API_URL'),
        TRUSTED_ORIGINS: envService.get('TRUSTED_ORIGINS'),
        NEXT_PUBLIC_APP_URL: envService.get('NEXT_PUBLIC_APP_URL'),
        APP_URL: envService.get('APP_URL'),
    }: envService);
};
