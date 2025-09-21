import { betterAuthFactory } from "./config/auth/auth";

export type Auth = ReturnType<typeof betterAuthFactory>["auth"];

// Create a minimal config service for standalone auth instance
class SimpleEnvService {
  private env = process.env;

  get<K extends keyof typeof this.env>(key: K) {
    return this.env[key];
  }
}

// Export an auth instance using the factory with config service but no database
const simpleEnvService = new SimpleEnvService();
export const auth = betterAuthFactory(null, simpleEnvService).auth;
