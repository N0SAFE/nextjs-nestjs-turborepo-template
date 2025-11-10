import { createBetterAuth } from "./config/auth/auth";
import type { IEnvService } from "@repo/auth";

export type Auth = ReturnType<typeof createBetterAuth>["auth"];

// Create a minimal env service for standalone auth instance
class SimpleEnvService implements IEnvService {
  private env = process.env;

  get(key: string): string | undefined;
  get<T = string>(key: string, defaultValue: T): T;
  get<T = string>(key: string, defaultValue?: T): string | T | undefined {
    const value = this.env[key as keyof typeof this.env];
    if (value !== undefined) {
      return value;
    }
    return defaultValue as T;
  }
}

// Export an auth instance using the factory with config service but no database
const simpleEnvService = new SimpleEnvService();
export const auth = createBetterAuth(null as any, simpleEnvService as any).auth;
