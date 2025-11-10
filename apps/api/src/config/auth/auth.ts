import { betterAuthFactory } from "@repo/auth/server";
import type { IEnvService } from "@repo/auth";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { EnvService } from "../env/env.service";

// Adapter to make our EnvService compatible with IEnvService
class EnvServiceAdapter implements IEnvService {
    constructor(private envService: EnvService) {}
    
    get(key: string): string | undefined;
    get<T = string>(key: string, defaultValue: T): T;
    get<T = string>(key: string, defaultValue?: T): string | T | undefined {
        if (defaultValue !== undefined) {
            return this.envService.get(key) ?? defaultValue;
        }
        return this.envService.get(key);
    }
}

export const createBetterAuth = <TSchema extends Record<string, unknown>>(
    database: NodePgDatabase<TSchema>,
    envService: EnvService
) => {
    const adapter = new EnvServiceAdapter(envService);
    return betterAuthFactory(database, adapter);
};
