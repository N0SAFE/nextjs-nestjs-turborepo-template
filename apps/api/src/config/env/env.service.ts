import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { envSchema, type Env } from "./env";
import type { z } from "zod";

@Injectable()
export class EnvService<TSchema extends Record<string, unknown> = Env> {
  private readonly logger = new Logger(EnvService.name);
  private schema: z.ZodType;

  constructor(
    @Optional() private readonly configService?: ConfigService
  ) {
    this.schema = envSchema;
    this.logger.log(`EnvService constructor called. ConfigService available: ${String(!!this.configService)}`);
    if (this.configService) {
      this.logger.log('ConfigService is properly injected');
    } else {
      this.logger.warn('ConfigService is NOT injected - will use process.env fallback');
    }
  }

  /**
   * Set a custom schema for this EnvService instance
   * @param schema - Zod schema to validate environment variables against
   */
  private setSchema(schema: z.ZodType): void {
    this.schema = schema;
  }

  get<T extends keyof TSchema>(key: T): TSchema[T] {
    if (!this.configService) {
      // Fallback to process.env if ConfigService is not available
      // Parse with schema to ensure validation
      const parsed = this.schema.parse(process.env) as TSchema;
      return parsed[key as string] as TSchema[T];
    }
    const ret = this.configService.get<TSchema[T]>(key as string) as unknown as TSchema[T];
    return ret
  }

  /**
   * Create a new EnvService instance with a different environment schema
   * @param schema - Zod schema to validate environment variables against
   * @returns New EnvService instance with the provided schema
   * 
   * @example
   * ```typescript
   * import { webEnvSchema, type WebEnv } from '@repo/env';
   * 
   * const webEnv = this.envService.use<WebEnv>(webEnvSchema);
   * const apiUrl = webEnv.get('API_URL');
   * ```
   */
  use<TNewSchema extends Record<string, unknown>>(schema: z.ZodType<TNewSchema>): EnvService<TNewSchema> {
    const instance = new EnvService<TNewSchema>(this.configService);
    instance.setSchema(schema);
    return instance;
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
