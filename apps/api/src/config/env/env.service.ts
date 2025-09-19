import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "./env";

@Injectable()
export class EnvService {
  private readonly logger = new Logger(EnvService.name);

  constructor(
    @Optional() private readonly configService: ConfigService
  ) {
    this.logger.log(`EnvService constructor called. ConfigService available: ${!!this.configService}`);
    if (this.configService) {
      this.logger.log('ConfigService is properly injected');
    } else {
      this.logger.warn('ConfigService is NOT injected - will use process.env fallback');
    }
  }

  get<T extends keyof Env>(key: T): Env[T] {
    if (!this.configService) {
      // Fallback to process.env if ConfigService is not available
      const value = process.env[key as string];
      if (value === undefined) {
        throw new Error(`Environment variable ${String(key)} is not set and ConfigService is not available.`);
      }
      return value as Env[T];
    }
    return this.configService.get(key as string) as Env[T];
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
