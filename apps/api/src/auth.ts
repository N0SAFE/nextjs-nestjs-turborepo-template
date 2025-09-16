import { betterAuthFactory } from "./config/auth/auth";
import type { AppConfig } from "./config/app.config";
import { configuration } from "./config/app.config";

export type Auth = ReturnType<typeof betterAuthFactory>["auth"];

// Create a minimal config service for standalone auth instance
class SimpleConfigService {
  private config: AppConfig;

  constructor() {
    this.config = configuration();
  }

  get<K extends keyof AppConfig>(
    key: K,
    _options?: { infer: true }
  ): AppConfig[K] {
    return this.config[key];
  }
}

// Export an auth instance using the factory with config service but no database
const simpleConfigService = new SimpleConfigService();
export const auth = betterAuthFactory(null, simpleConfigService as any).auth;
