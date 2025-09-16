import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Env } from "./env";

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService<Env, true>) {}

  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true });
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return this.get("NODE_ENV") === "development";
  }

  /**
   * Check if we're in production mode
   */
  isProduction(): boolean {
    return this.get("NODE_ENV") === "production";
  }

  /**
   * Check if we're in test mode
   */
  isTest(): boolean {
    return this.get("NODE_ENV") === "test";
  }
}
